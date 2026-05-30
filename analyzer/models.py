from django.db import models
from django.conf import settings

class Network(models.Model):
    name = models.CharField(max_length=255)
    range_cidr = models.CharField(max_length=50, help_text="e.g. 192.168.1.0/24")
    firewall_enabled = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.range_cidr})"


class FirewallLog(models.Model):
    ACTION_CHOICES = (
        ('ALLOW', 'Allow'),
        ('BLOCK', 'Block'),
        ('ATTACK_DETECTED', 'Attack Detected'),
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    source_ip = models.GenericIPAddressField()
    destination_ip = models.GenericIPAddressField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    latency_impact = models.FloatField(default=0.0)
    throughput_impact = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action}: {self.source_ip} at {self.timestamp}"

class FirewallRule(models.Model):
    TYPE_CHOICES = (
        ('ALLOW', 'Allow'),
        ('DENY', 'Deny'),
    )
    PROTOCOL_CHOICES = (
        ('TCP', 'TCP'),
        ('UDP', 'UDP'),
        ('ICMP', 'ICMP'),
        ('ALL', 'All Protocols'),
    )
    name = models.CharField(max_length=255)
    rule_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='DENY')
    ip_address = models.CharField(max_length=100, null=True, blank=True, help_text="Specific IP or Subnet")
    mac_address = models.CharField(max_length=100, null=True, blank=True)
    port = models.IntegerField(null=True, blank=True)
    protocol = models.CharField(max_length=10, choices=PROTOCOL_CHOICES, default='ALL')
    is_active = models.BooleanField(default=True)
    hits = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rule_type}: {self.name}"


class VPNStatus(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vpn_status')
    is_active = models.BooleanField(default=False)
    selected_country = models.CharField(max_length=100, null=True, blank=True)
    simulated_ip = models.GenericIPAddressField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"VPN for {self.user.email}: {'ON' if self.is_active else 'OFF'}"

class UserDevice(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_devices')
    device_id = models.CharField(max_length=255) # Browser fingerprint or similar
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    original_ip = models.GenericIPAddressField(null=True, blank=True)  # IP at first registration — used for VPN detection
    country = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    browser_info = models.TextField(null=True, blank=True)
    vpn_status = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'device_id')

    def __str__(self):
        return f"{self.user.email} - {self.device_name} ({self.ip_address})"


class ImageTransfer(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_images', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='images/')
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='COMPLETED')

    def __str__(self):
        return f"Image from {self.sender.email} to {self.receiver.email}"