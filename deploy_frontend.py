#!/usr/bin/env python3
"""Deploy PayTrack frontend to Hostinger"""
import paramiko
import os

HOST = '82.198.228.133'
PORT = 65002
USER = 'u166382491'
PASS = os.environ.get('HOSTINGER_SSH_PASS')
if not PASS:
    raise ValueError('HOSTINGER_SSH_PASS environment variable required')
REMOTE_BASE = '/home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html'

LOCAL_DIST = r'C:\Users\RYZEN  5\paytrack\frontend\dist'

def upload_dir(sftp, local_dir, remote_dir):
    """Recursively upload directory"""
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'

        if os.path.isfile(local_path):
            print(f'  {item}')
            sftp.put(local_path, remote_path)
        elif os.path.isdir(local_path):
            try:
                sftp.mkdir(remote_path)
            except IOError:
                pass  # Already exists
            upload_dir(sftp, local_path, remote_path)

def main():
    print('Connecting to Hostinger...')
    ssh = paramiko.SSHClient()
    known_hosts = os.path.expanduser('~/.ssh/known_hosts')
    if os.path.exists(known_hosts):
        ssh.load_host_keys(known_hosts)
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS)
    sftp = ssh.open_sftp()
    print('Connected!')

    print('\nUploading frontend dist...')

    # Upload index.html to root
    sftp.put(os.path.join(LOCAL_DIST, 'index.html'), f'{REMOTE_BASE}/index.html')
    print('  index.html')

    # Create/update assets folder
    try:
        sftp.mkdir(f'{REMOTE_BASE}/assets')
    except IOError:
        pass

    # Upload assets
    upload_dir(sftp, os.path.join(LOCAL_DIST, 'assets'), f'{REMOTE_BASE}/assets')

    sftp.close()
    ssh.close()
    print('\nFrontend deployed!')

if __name__ == '__main__':
    main()
