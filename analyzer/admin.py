from django.contrib import admin
from .models import Network, FirewallLog

@admin.register(Network)
class NetworkAdmin(admin.ModelAdmin):
    list_display = ('name', 'range_cidr', 'is_active', 'created_at')
    search_fields = ('name', 'range_cidr')

@admin.register(FirewallLog)
class FirewallLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'source_ip', 'destination_ip', 'timestamp')
    list_filter = ('action',)
