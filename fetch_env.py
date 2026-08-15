#!/usr/bin/env python3
"""Fetch .env from Hostinger"""
import paramiko
import os

HOST = os.environ.get('HOSTINGER_SSH_HOST', '82.198.228.133')
PORT = int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))
USER = os.environ.get('HOSTINGER_SSH_USER', 'u166382491')
PASS = os.environ.get('HOSTINGER_SSH_PASS')
if not PASS:
    raise ValueError('HOSTINGER_SSH_PASS required')

REMOTE_ENV = '/home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html/backend/.env'
LOCAL_ENV = r'C:\Users\RYZEN  5\paytrack\backend\.env.hostinger'

ssh = paramiko.SSHClient()
known_hosts = os.path.expanduser('~/.ssh/known_hosts')
if os.path.exists(known_hosts):
    ssh.load_host_keys(known_hosts)
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASS)
sftp = ssh.open_sftp()
sftp.get(REMOTE_ENV, LOCAL_ENV)
sftp.close()
ssh.close()
print(f'Downloaded to {LOCAL_ENV}')
