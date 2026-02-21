#!/usr/bin/env python3
"""Google Indexing API - submit URLs for indexing"""
import json, sys, time
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY_FILE = '/home/openclaw/.config/secrets/gcp-indexing-key.json'
SCOPES = ['https://www.googleapis.com/auth/indexing']

def get_service():
    creds = service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)
    return build('indexing', 'v3', credentials=creds)

def submit_url(service, url, action='URL_UPDATED'):
    body = {'url': url, 'type': action}
    try:
        result = service.urlNotifications().publish(body=body).execute()
        print(f"  ✓ {url} → {result.get('urlNotificationMetadata', {}).get('latestUpdate', {}).get('type', 'OK')}")
        return True
    except Exception as e:
        print(f"  ✗ {url} → {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: google-indexing.py <url|file.txt> [--remove]")
        print("  Single URL or file with one URL per line")
        sys.exit(1)

    action = 'URL_DELETED' if '--remove' in sys.argv else 'URL_UPDATED'
    target = [a for a in sys.argv[1:] if a != '--remove'][0]

    service = get_service()

    # Single URL or file
    if target.startswith('http'):
        urls = [target]
    else:
        with open(target) as f:
            urls = [line.strip() for line in f if line.strip() and line.strip().startswith('http')]

    print(f"Submitting {len(urls)} URLs ({action})...")
    ok = 0
    for i, url in enumerate(urls):
        if submit_url(service, url, action):
            ok += 1
        if i < len(urls) - 1:
            time.sleep(0.5)  # Rate limit

    print(f"\nDone: {ok}/{len(urls)} successful")

if __name__ == '__main__':
    main()
