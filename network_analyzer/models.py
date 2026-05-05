from django.db import models
from django.utils import timezone

class Device(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Blocked', 'Blocked'),
        ('Pending', 'Pending'),
    )
    ip_address = models.GenericIPAddressField(unique=True)
    mac_address = models.CharField(max_length=17, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name or 'Unknown'} ({self.ip_address})"

class FirewallRule(models.Model):
    ACTION_CHOICES = (
        ('allow', 'Allow'),
        ('block', 'Block'),
    )
    DIRECTION_CHOICES = (
        ('in', 'Inbound'),
        ('out', 'Outbound'),
    )
    name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='in')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.action} {self.ip_address}"

class FirewallEvent(models.Model):
    event_type = models.CharField(max_length=50) # 'Blocked', 'Allowed'
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)

class TransferHistory(models.Model):
    source_device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, related_name='transfers_out')
    dest_device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, related_name='transfers_in')
    data_size_bytes = models.BigIntegerField()
    duration_seconds = models.FloatField()
    status = models.CharField(max_length=50) # 'Completed', 'Stopped', 'Blocked'
    timestamp = models.DateTimeField(default=timezone.now)
