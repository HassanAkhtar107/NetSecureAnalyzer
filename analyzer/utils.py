import subprocess
import psutil
import ipaddress
import time

def block_ip(ip_address):
    """
    Blocks an IP address using Windows Firewall (netsh).
    Requires Admin privileges.
    """
    rule_name = f"Block_{ip_address}"
    cmd = f'netsh advfirewall firewall add rule name="{rule_name}" dir=in action=block remoteip={ip_address}'
    try:
        subprocess.run(cmd, shell=True, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        return False

def unblock_ip(ip_address):
    """
    Removes the block rule for an IP address.
    """
    rule_name = f"Block_{ip_address}"
    cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
    try:
        subprocess.run(cmd, shell=True, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        return False

def get_network_stats():
    """
    Returns real-time network usage stats using psutil.
    """
    net_io = psutil.net_io_counters()
    return {
        "bytes_sent": net_io.bytes_sent,
        "bytes_recv": net_io.bytes_recv,
        "packets_sent": net_io.packets_sent,
        "packets_recv": net_io.packets_recv,
        "errin": net_io.errin,
        "errout": net_io.errout,
        "dropin": net_io.dropin,
        "dropout": net_io.dropout,
    }

def is_ip_in_network(ip, cidr):
    """
    Checks if an IP address belongs to a network defined by CIDR.
    """
    try:
        return ipaddress.ip_address(ip) in ipaddress.ip_network(cidr)
    except ValueError:
        return False

def simulate_transfer_stats():
    """
    Returns simulated transfer stats for the UI.
    """
    import random
    return {
        "bandwidth": round(random.uniform(10.0, 100.0), 2),
        "latency": round(random.uniform(5.0, 50.0), 2),
        "throughput": round(random.uniform(5.0, 95.0), 2),
        "packet_loss": round(random.uniform(0.0, 2.0), 2),
        "eta": random.randint(1, 60)
    }
