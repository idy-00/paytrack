#!/usr/bin/env python3
"""Deploy PayTrack backend fixes to Hostinger"""
import paramiko
import os

# SSH config - credentials from environment variables
HOST = os.environ.get('HOSTINGER_SSH_HOST', '82.198.228.133')
PORT = int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))
USER = os.environ.get('HOSTINGER_SSH_USER', 'u166382491')
PASS = os.environ.get('HOSTINGER_SSH_PASS')
if not PASS:
    raise ValueError('HOSTINGER_SSH_PASS environment variable required')
REMOTE_BASE = '/home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html/backend'

# Files to upload
FILES = [
    ('backend/app/Http/Controllers/Api/PaymentController.php', 'app/Http/Controllers/Api/PaymentController.php'),
]

LOCAL_BASE = r'C:\Users\RYZEN  5\paytrack'

def main():
    print('Connecting to Hostinger...')
    ssh = paramiko.SSHClient()
    # Load known hosts for host key verification
    known_hosts = os.path.expanduser('~/.ssh/known_hosts')
    if os.path.exists(known_hosts):
        ssh.load_host_keys(known_hosts)
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())  # Add on first connect, then verify
    ssh.connect(HOST, port=PORT, username=USER, password=PASS)
    sftp = ssh.open_sftp()
    print('Connected!')

    for local_rel, remote_rel in FILES:
        local_path = os.path.join(LOCAL_BASE, local_rel)
        remote_path = f'{REMOTE_BASE}/{remote_rel}'
        print(f'Uploading {local_rel}...')
        sftp.put(local_path, remote_path)
        print(f'  -> {remote_path}')

    sftp.close()
    ssh.close()
    print('\nDone! Email receipt will be sent after each payment.')

if __name__ == '__main__':
    main()
