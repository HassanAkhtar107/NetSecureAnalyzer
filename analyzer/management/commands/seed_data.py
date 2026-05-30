from django.core.management.base import BaseCommand
from analyzer.models import Network, FirewallLog
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
