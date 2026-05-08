from rest_framework import serializers
from ..models import Network, Device, DataTransfer, FirewallLog, VPNServer, VPNStatus, FirewallRule, UserDevice

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
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = DataTransfer
        fields = ['id', 'created_by', 'created_by_name', 'sender_device', 'receiver_device', 'sender_ip', 'receiver_ip', 'bandwidth', 'latency', 'throughput', 'packet_loss', 'status', 'timestamp']

class FirewallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirewallLog
        fields = '__all__'

class VPNServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VPNServer
        fields = '__all__'

class VPNStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = VPNStatus
        fields = ['is_active', 'selected_country', 'simulated_ip', 'updated_at']

class FirewallRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirewallRule
        fields = '__all__'

class UserDeviceSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = UserDevice
        fields = '__all__'
