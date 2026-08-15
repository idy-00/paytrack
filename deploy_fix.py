#!/usr/bin/env python3
"""
Deploy ArticleController fix to Hostinger.
Run: python deploy_fix.py
Requires: pip install paramiko
"""

import paramiko
import os
import sys
import socket

# Hostinger config for PayTrack
# Note: Hostinger shared hosting IP varies. Use SSH hostname from hPanel.
# SSH access: hPanel -> Hosting -> Advanced -> SSH Access
HOST = "lightsalmon-eel-638395.hostingersite.com"  # or SSH hostname from hPanel
PORT = 65002
USER = "u166382491"
# Remote path on Hostinger (check via SSH or File Manager)
REMOTE_PATH = "/home/u166382491/public_html/backend"

# Local file to upload
LOCAL_FILE = os.path.join(os.path.dirname(__file__),
    "backend/app/Http/Controllers/Api/ArticleController.php")
REMOTE_FILE = f"{REMOTE_PATH}/app/Http/Controllers/Api/ArticleController.php"

def main():
    password = input("Hostinger SSH password: ")

    print(f"Connecting to {HOST}:{PORT}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(HOST, port=PORT, username=USER, password=password)
        print("Connected!")

        sftp = ssh.open_sftp()

        print(f"Uploading {LOCAL_FILE}...")
        sftp.put(LOCAL_FILE, REMOTE_FILE)
        print(f"Uploaded to {REMOTE_FILE}")

        # Clear Laravel cache
        print("Clearing Laravel cache...")
        stdin, stdout, stderr = ssh.exec_command(
            f"cd {REMOTE_PATH} && php artisan config:clear && php artisan cache:clear"
        )
        print(stdout.read().decode())

        sftp.close()
        ssh.close()
        print("Done!")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
