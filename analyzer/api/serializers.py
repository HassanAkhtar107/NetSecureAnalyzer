from rest_framework import serializers
from ..models import Network, Device, DataTransfer, FirewallLog, VPNServer, AttackSimulation, VPNStatus

class NetworkSerializer(serializers.ModelSerializer):
    device_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Network
        fields = '__all__'

class DeviceSerializer(serializers.ModelSerializer):
    network_name = serializers.CharField(source='network.name', read_only=True)
    
    class Meta:
        model = Device
        fields = '__all__'

class DataTransferSerializer(serializers.ModelSerializer):
    sender_ip = serializers.CharField(source='sender_device.ip_address', read_only=True)
    receiver_ip = serializers.CharField(source='receiver_device.ip_address', read_only=True)
    
    class Meta:
        model = DataTransfer
        fields = '__all__'

class FirewallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirewallLog
        fields = '__all__'

class VPNServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VPNServer
        fields = '__all__'

class AttackSimulationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttackSimulation
        fields = '__all__'

class VPNStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = VPNStatus
        fields = ['is_active', 'selected_country', 'simulated_ip', 'updated_at']
