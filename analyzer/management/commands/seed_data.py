from django.core.management.base import BaseCommand
from analyzer.models import Network, Device, VPNServer, FirewallLog
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial data for Net Secure Analyzer'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        # 1. Create Admin & User
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            email='admin@netsecure.io',
            defaults={'user_type': 'ADMIN', 'is_staff': True, 'is_superuser': True}
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # 2. Create Networks
        net1, _ = Network.objects.get_or_create(name='Admin Network', range_cidr='192.168.1.0/24')
        net2, _ = Network.objects.get_or_create(name='User Network A', range_cidr='192.168.2.0/24')
        net3, _ = Network.objects.get_or_create(name='IoT Network', range_cidr='10.0.0.0/24')

        # 3. Create Devices
        devices_data = [
            {'ip': '192.168.1.10', 'name': 'Admin Workstation', 'net': net1, 'status': 'ACTIVE', 'approved': True},
            {'ip': '192.168.1.11', 'name': 'Primary Server', 'net': net1, 'status': 'ACTIVE', 'approved': True},
            {'ip': '192.168.2.15', 'name': 'User PC 01', 'net': net2, 'status': 'ACTIVE', 'approved': True},
            {'ip': '192.168.2.20', 'name': 'User PC 02', 'net': net2, 'status': 'PENDING', 'approved': False},
            {'ip': '10.0.0.5', 'name': 'Smart Camera', 'net': net3, 'status': 'BLOCKED', 'approved': False},
            {'ip': '10.0.0.8', 'name': 'IoT Gateway', 'net': net3, 'status': 'ACTIVE', 'approved': True},
        ]
        
        for d in devices_data:
            Device.objects.get_or_create(
                ip_address=d['ip'],
                defaults={
                    'network': d['net'],
                    'status': d['status'],
                    'is_approved': d['approved'],
                    'data_usage': 1240.5 if d['approved'] else 0
                }
            )

        # 4. Create VPN Servers
        vpn_data = [
            {'name': 'New York City', 'country': 'USA', 'ip': '103.86.131.5', 'lat': 23},
            {'name': 'Frankfurt', 'country': 'Germany', 'ip': '185.2.14.3', 'lat': 48},
            {'name': 'Tokyo', 'country': 'Japan', 'ip': '103.86.135.1', 'lat': 55},
            {'name': 'London', 'country': 'UK', 'ip': '89.41.182.2', 'lat': 35},
            {'name': 'Singapore', 'country': 'Singapore', 'ip': '103.86.133.2', 'lat': 62},
        ]
        for v in vpn_data:
            VPNServer.objects.get_or_create(
                name=v['name'],
                defaults={'country': v['country'], 'ip_address': v['ip'], 'latency': v['lat']}
            )

        # 5. Create Firewall Logs
        log_data = [
            {'action': 'BLOCK', 'ip': '192.168.1.15', 'reason': 'Unauthorized access attempt'},
            {'action': 'ALLOW', 'ip': '192.168.1.5', 'reason': 'Standard connection established'},
            {'action': 'ATTACK_DETECTED', 'ip': '45.12.3.4', 'reason': 'DDoS signature detected from external IP'},
        ]
        for l in log_data:
            FirewallLog.objects.create(
                action=l['action'],
                source_ip=l['ip'],
                reason=l['reason'],
                latency_impact=12.5 if l['action'] == 'ATTACK_DETECTED' else 0,
                throughput_impact=-8.2 if l['action'] == 'ATTACK_DETECTED' else 0
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))
