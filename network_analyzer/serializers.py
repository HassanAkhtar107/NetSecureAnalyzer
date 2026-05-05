from rest_framework import serializers
from .models import Device, FirewallRule, FirewallEvent, TransferHistory

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'

class FirewallRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirewallRule
        fields = '__all__'

class FirewallEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirewallEvent
        fields = '__all__'

class TransferHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferHistory
        fields = '__all__'
