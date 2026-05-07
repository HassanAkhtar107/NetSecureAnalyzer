from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count
from ..models import Network, Device, DataTransfer, FirewallLog, VPNServer, VPNStatus, FirewallRule
from .serializers import (
    NetworkSerializer,
    DeviceSerializer,
    DataTransferSerializer,
    FirewallLogSerializer,
    VPNServerSerializer,
    VPNStatusSerializer,
    FirewallRuleSerializer
)
from ..utils import block_ip, unblock_ip, get_network_stats, simulate_transfer_stats

class NetworkViewSet(viewsets.ModelViewSet):
    queryset = Network.objects.all()
    serializer_class = NetworkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'ADMIN':
            return Network.objects.annotate(device_count=Count('devices'))
        return Network.objects.filter(id=user.assigned_network_id).annotate(device_count=Count('devices'))

    @action(detail=False, methods=['get'])
    def global_stats(self, request):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        stats = get_network_stats()
        # Add firewall status
        stats['firewall_enabled'] = True # This would normally come from a setting
        return Response(stats)

    @action(detail=False, methods=['get'])
    def my_network_stats(self, request):
        user = request.user
        if not user.assigned_network:
            return Response({"error": "No network assigned"}, status=status.HTTP_404_NOT_FOUND)
        
        # Filter stats for specific network
        stats = get_network_stats(network_id=user.assigned_network.id)
        stats['firewall_enabled'] = user.assigned_network.firewall_enabled
        return Response(stats)

    @action(detail=False, methods=['post'])
    def toggle_firewall(self, request):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        enabled = request.data.get('enabled', True)
        # Update all networks for this simulation
        Network.objects.all().update(firewall_enabled=enabled)
        # Log the change
        FirewallLog.objects.create(
            action='ALLOW' if enabled else 'BLOCK',
            source_ip='SYSTEM',
            reason=f"Global Firewall {'Enabled' if enabled else 'Disabled'} by Admin"
        )
        return Response({"status": "success", "firewall_enabled": enabled})

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'ADMIN':
            return Device.objects.all()
        if user.assigned_network:
            return Device.objects.filter(network=user.assigned_network)
        return Device.objects.none()

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Only admins can block devices"}, status=status.HTTP_403_FORBIDDEN)
        device = self.get_object()
        device.status = 'BLOCKED'
        device.save()
        
        # Windows Firewall Integration
        block_ip(device.ip_address)
        
        FirewallLog.objects.create(
            action='BLOCK',
            source_ip=device.ip_address,
            reason="Blocked by admin"
        )
        return Response({"status": "Device blocked"})

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Only admins can unblock devices"}, status=status.HTTP_403_FORBIDDEN)
        device = self.get_object()
        device.status = 'ACTIVE'
        device.save()
        
        # Windows Firewall Integration
        unblock_ip(device.ip_address)
        
        FirewallLog.objects.create(
            action='ALLOW',
            source_ip=device.ip_address,
            reason="Unblocked by admin"
        )
        return Response({"status": "Device unblocked"})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Only admins can approve devices"}, status=status.HTTP_403_FORBIDDEN)
        device = self.get_object()
        device.status = 'ACTIVE'
        device.is_approved = True
        device.save()
        
        FirewallLog.objects.create(
            action='ALLOW',
            source_ip=device.ip_address,
            reason="Device join request approved"
        )
        return Response({"status": "Device approved"})

    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Only admins can deny devices"}, status=status.HTTP_403_FORBIDDEN)
        device = self.get_object()
        device.status = 'BLOCKED'
        device.is_approved = False
        device.save()
        
        # Also block IP in firewall as per SRS (Denying a join request blocks future attempts)
        block_ip(device.ip_address)
        
        FirewallLog.objects.create(
            action='BLOCK',
            source_ip=device.ip_address,
            reason="Device join request denied"
        )
        return Response({"status": "Device denied"})

class DataTransferViewSet(viewsets.ModelViewSet):
    queryset = DataTransfer.objects.all()
    serializer_class = DataTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'ADMIN':
            return DataTransfer.objects.all().order_by('-timestamp')
        return DataTransfer.objects.filter(created_by=user).order_by('-timestamp')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        sender_id = request.data.get('sender_device')
        receiver_id = request.data.get('receiver_device')
        
        try:
            sender = Device.objects.get(id=sender_id)
            receiver = Device.objects.get(id=receiver_id)
        except Device.DoesNotExist:
            return Response({"error": "Device not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if they are in the same network
        if sender.network != receiver.network:
            return Response({"error": "Transfer only allowed within the same network"}, status=status.HTTP_403_FORBIDDEN)

        # Security Check: Firewall must be ON for BOTH networks to allow transfers
        # (Assuming 'firewall_enabled' means 'Allowed to operate'. If false, network is 'Blocked')
        if not sender.network.firewall_enabled or not receiver.network.firewall_enabled:
             return Response({"error": "Firewall Policy Violation: One or both networks are restricted by the Firewall."}, status=status.HTTP_403_FORBIDDEN)

        # Check if any device is blocked
        if sender.status == 'BLOCKED' or receiver.status == 'BLOCKED':
            return Response({"error": "Cannot transfer. One or both devices are blocked"}, status=status.HTTP_403_FORBIDDEN)

        # Inject simulated stats for realism if requested
        if 'simulate' in request.data:
            sim_stats = simulate_transfer_stats()
            for key, val in sim_stats.items():
                if key != 'eta':
                    request.data[key] = val

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class FirewallLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FirewallLog.objects.all().order_by('-timestamp')
    serializer_class = FirewallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'ADMIN':
            return FirewallLog.objects.all().order_by('-timestamp')
        return FirewallLog.objects.none()

class FirewallRuleViewSet(viewsets.ModelViewSet):
    queryset = FirewallRule.objects.all().order_by('-created_at')
    serializer_class = FirewallRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'ADMIN':
            return FirewallRule.objects.none()
        return super().get_queryset()

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        return Response({"status": "success", "is_active": rule.is_active})

class VPNServerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VPNServer.objects.all()
    serializer_class = VPNServerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'ADMIN':
            return VPNServer.objects.all()
        return VPNServer.objects.filter(is_active=True, is_private=False)

class VPNStatusViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_simulated_ip(self, country):
        mapping = {
            'USA': '192.168.1.1',
            'Germany': '185.10.10.1',
            'UK': '51.20.20.1',
            'Singapore': '103.30.30.1'
        }
        return mapping.get(country, '172.16.0.50')

    @action(detail=False, methods=['get'])
    def status(self, request):
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        serializer = VPNStatusSerializer(status_obj)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def connect(self, request):
        country = request.data.get('country')
        
        # If no country selected, pick the "best" (lowest latency) active public server
        if not country:
            best_server = VPNServer.objects.filter(is_active=True, is_private=False).order_by('latency').first()
            if best_server:
                country = best_server.country
            else:
                country = 'USA' # Default fallback
        
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        status_obj.is_active = True
        status_obj.selected_country = country
        status_obj.simulated_ip = self._get_simulated_ip(country)
        status_obj.save()

        # Requirement: "change its network"
        # We simulate this by assigning them to a "VPN Tunnel" network if it exists
        try:
            vpn_net = Network.objects.get(name__icontains="VPN")
            request.user.assigned_network = vpn_net
            request.user.save()
        except:
            pass # No VPN network defined, keep current
        
        return Response(VPNStatusSerializer(status_obj).data)

    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        status_obj.is_active = False
        status_obj.simulated_ip = None
        status_obj.save()
        
        # Optionally revert network here if needed
        
        return Response(VPNStatusSerializer(status_obj).data)

    @action(detail=False, methods=['post'])
    def select_country(self, request):
        country = request.data.get('country')
        if not country:
            return Response({"error": "Country is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        status_obj.selected_country = country
        if status_obj.is_active:
            status_obj.simulated_ip = self._get_simulated_ip(country)
        status_obj.save()
        
        return Response(VPNStatusSerializer(status_obj).data)


