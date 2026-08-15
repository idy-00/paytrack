#!/usr/bin/env python3
"""
Deploy all pending changes to Hostinger.
Run: python deploy_all.py
Requires: pip install paramiko
"""

import paramiko
import os
import sys
from pathlib import Path

# Hostinger SSH config
HOST = "lightsalmon-eel-638395.hostingersite.com"
PORT = 65002
USER = "u166382491"

# Paths
LOCAL_BASE = Path(r"C:\Users\RYZEN  5\paytrack")
REMOTE_BASE = "/home/u166382491/public_html"

# Files to upload
BACKEND_FILES = [
    "backend/app/Http/Controllers/Api/ArticleController.php",
    "backend/app/Http/Controllers/Api/DashboardController.php",
    "backend/app/Http/Controllers/Api/PaymentController.php",
    "backend/app/Models/Article.php",
    "backend/app/Models/Shop.php",
    "backend/bootstrap/app.php",
    "backend/routes/api.php",
]

def upload_file(sftp, local_path, remote_path):
    """Upload a single file, creating directories if needed."""
    print(f"  {local_path.name} -> {remote_path}")

    # Ensure remote directory exists
    remote_dir = os.path.dirname(remote_path)
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        # Create directory recursively
        parts = remote_dir.split('/')
        current = ''
        for part in parts:
            if part:
                current += '/' + part
                try:
                    sftp.stat(current)
                except FileNotFoundError:
                    sftp.mkdir(current)

    sftp.put(str(local_path), remote_path)

def main():
    password = input("Hostinger SSH password: ")

    print(f"\nConnecting to {HOST}:{PORT}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(HOST, port=PORT, username=USER, password=password)
        print("Connected!\n")

        sftp = ssh.open_sftp()

        # Upload backend files
        print("=== Uploading backend files ===")
        for rel_path in BACKEND_FILES:
            local_path = LOCAL_BASE / rel_path
            remote_path = f"{REMOTE_BASE}/{rel_path}"

            if local_path.exists():
                upload_file(sftp, local_path, remote_path)
            else:
                print(f"  SKIP (not found): {rel_path}")

        # Clear Laravel cache
        print("\n=== Clearing Laravel cache ===")
        commands = [
            f"cd {REMOTE_BASE}/backend && php artisan config:clear",
            f"cd {REMOTE_BASE}/backend && php artisan cache:clear",
            f"cd {REMOTE_BASE}/backend && php artisan route:clear",
        ]
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            if out:
                print(f"  {out}")
            if err:
                print(f"  ERROR: {err}")

        # Check if frontend dist exists
        frontend_dist = LOCAL_BASE / "frontend" / "dist"
        if frontend_dist.exists():
            print("\n=== Uploading frontend ===")
            # Upload index.html
            upload_file(sftp, frontend_dist / "index.html", f"{REMOTE_BASE}/index.html")

            # Upload assets folder
            assets_local = frontend_dist / "assets"
            if assets_local.exists():
                for asset in assets_local.iterdir():
                    remote_asset = f"{REMOTE_BASE}/assets/{asset.name}"
                    upload_file(sftp, asset, remote_asset)
        else:
            print("\n=== Frontend dist not found ===")
            print("Run: cd frontend && npm run build")
            print("Then re-run this script")

        sftp.close()
        ssh.close()

        print("\n=== DONE ===")
        print("Test: https://lightsalmon-eel-638395.hostingersite.com/backend/public/api/auth/me")

    except paramiko.AuthenticationException:
        print("ERROR: Authentication failed. Check password.")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
