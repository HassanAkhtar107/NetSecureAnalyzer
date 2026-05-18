from django.contrib import admin
from .models import Network, Device, DataTransfer, FirewallLog

@admin.register(Network)
class NetworkAdmin(admin.ModelAdmin):
    list_display = ('name', 'range_cidr', 'is_active', 'created_at')
    search_fields = ('name', 'range_cidr')

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('ip_address', 'network', 'status')
    list_filter = ('status', 'network')
    search_fields = ('ip_address',)

@admin.register(DataTransfer)
class DataTransferAdmin(admin.ModelAdmin):
    list_display = ('sender_device', 'receiver_device', 'status', 'timestamp')
    list_filter = ('status',)

@admin.register(FirewallLog)
class FirewallLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'source_ip', 'destination_ip', 'timestamp')
    list_filter = ('action',)
