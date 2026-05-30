from rest_framework import serializers
from ..models import Network, FirewallLog, VPNStatus, FirewallRule, UserDevice, ImageTransfer

class NetworkSerializer(serializers.ModelSerializer):
    device_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Network
        fields = '__all__'



class FirewallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirewallLog
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
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    class Meta:
        model = UserDevice
        fields = '__all__'

class ImageTransferSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)

    class Meta:
        model = ImageTransfer
        fields = ['id', 'sender', 'sender_email', 'receiver', 'receiver_email', 'image', 'timestamp', 'status']
        read_only_fields = ['sender', 'status', 'timestamp']