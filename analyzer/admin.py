from django.contrib import admin
from .models import Network, FirewallLog, FirewallRule

@admin.register(Network)
class NetworkAdmin(admin.ModelAdmin):
    list_display = ('name', 'range_cidr', 'is_active', 'created_at')
    search_fields = ('name', 'range_cidr')

@admin.register(FirewallLog)
class FirewallLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'protocol', 'source_ip', 'destination_ip', 'port', 'timestamp')
    list_filter = ('action', 'protocol')

@admin.register(FirewallRule)
class FirewallRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'rule_type', 'protocol', 'port', 'ip_address', 'is_active', 'hits', 'created_at')
    list_filter = ('rule_type', 'protocol', 'is_active')
    search_fields = ('name', 'ip_address')
