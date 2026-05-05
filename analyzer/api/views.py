from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count
from ..models import Network, Device, DataTransfer, FirewallLog, VPNServer, AttackSimulation, VPNStatus
from .serializers import (
    NetworkSerializer,
    DeviceSerializer,
    DataTransferSerializer,
    FirewallLogSerializer,
    VPNServerSerializer,
    AttackSimulationSerializer,
    VPNStatusSerializer
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

    @action(detail=False, methods=['post'])
    def toggle_firewall(self, request):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        enabled = request.data.get('enabled', True)
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

class DataTransferViewSet(viewsets.ModelViewSet):
    queryset = DataTransfer.objects.all()
    serializer_class = DataTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'ADMIN':
            return DataTransfer.objects.all()
        if user.assigned_network:
            return DataTransfer.objects.filter(sender_device__network=user.assigned_network)
        return DataTransfer.objects.none()

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

        # Check if any device is blocked
        if sender.status == 'BLOCKED' or receiver.status == 'BLOCKED':
            return Response({"error": "Cannot transfer. One or both devices are blocked"}, status=status.HTTP_403_FORBIDDEN)

        # Inject simulated stats for realism if requested
        if 'simulate' in request.data:
            sim_stats = simulate_transfer_stats()
            for key, val in sim_stats.items():
                if key != 'eta':
                    request.data[key] = val

        return super().create(request, *args, **kwargs)

class FirewallLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FirewallLog.objects.all().order_by('-timestamp')
    serializer_class = FirewallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'ADMIN':
            return FirewallLog.objects.all().order_by('-timestamp')
        return FirewallLog.objects.none()

class VPNServerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VPNServer.objects.all()
    serializer_class = VPNServerSerializer
    permission_classes = [permissions.IsAuthenticated]

class VPNStatusViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_simulated_ip(self, country):
        mapping = {
            'USA': '192.168.1.1',
            'Germany': '185.10.10.1',
            'UK': '51.20.20.1',
            'Singapore': '103.30.30.1'
        }
        return mapping.get(country, '0.0.0.0')

    @action(detail=False, methods=['get'])
    def status(self, request):
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        serializer = VPNStatusSerializer(status_obj)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def connect(self, request):
        country = request.data.get('country')
        if not country:
            return Response({"error": "Country is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        status_obj.is_active = True
        status_obj.selected_country = country
        status_obj.simulated_ip = self._get_simulated_ip(country)
        status_obj.save()
        
        return Response(VPNStatusSerializer(status_obj).data)

    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        status_obj, created = VPNStatus.objects.get_or_create(user=request.user)
        status_obj.is_active = False
        status_obj.simulated_ip = None
        status_obj.save()
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

class AttackSimulationViewSet(viewsets.ModelViewSet):
    queryset = AttackSimulation.objects.all()
    serializer_class = AttackSimulationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def trigger(self, request):
        if request.user.user_type != 'ADMIN':
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        
        attack_type = request.data.get('type', 'DDOS')
        network_id = request.data.get('network_id')
        
        try:
            network = Network.objects.get(id=network_id)
        except Network.DoesNotExist:
            return Response({"error": "Network not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Log the "detected" attack in firewall logs
        FirewallLog.objects.create(
            action='ATTACK_DETECTED',
            source_ip="14.21.35.22", # Simulated attacker IP
            reason=f"High volume {attack_type} signature detected on {network.name}",
            latency_impact=25.5,
            throughput_impact=-15.2
        )

        return Response({"status": "Simulation started", "message": f"{attack_type} attack simulated on {network.name}"})
