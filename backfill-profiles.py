#!/usr/bin/env python3
"""
Backfill Profiles for Created Users
Run this after fixing the INSERT policies to create profiles for all auth users that don't have them
"""

import os
import sys
import requests
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    print("❌ Error: 'requests' library not installed")
    print("📦 Install it with: pip install requests")
    sys.exit(1)

# Configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://yknvgrydvxnkzycpjblv.supabase.co')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'YOUR_SERVICE_ROLE_KEY')

def validate_config():
    if 'YOUR_' in SUPABASE_URL or 'YOUR_' in SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Error: Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return False
    return True

def get_all_users():
    """Get all auth users"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json().get('users', [])
        else:
            print(f"❌ Error getting users: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def get_all_profiles():
    """Get all existing profiles"""
    url = f"{SUPABASE_URL}/rest/v1/profiles?select=id"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            return [p['id'] for p in response.json()]
        else:
            print(f"⚠️  Could not get existing profiles: {response.text}")
            return []
    except Exception as e:
        print(f"⚠️  Could not get existing profiles: {e}")
        return []

def create_profile(user):
    """Create profile for a user"""
    url = f"{SUPABASE_URL}/rest/v1/profiles"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    trial_end = (datetime.now() + timedelta(days=14)).isoformat()
    
    data = {
        'id': user['id'],
        'email': user['email'],
        'full_name': user.get('user_metadata', {}).get('full_name', user['email'].split('@')[0].title()),
        'status': 'pending',
        'subscription_status': 'trial',
        'subscription_plan': 'free',
        'trial_ends_at': trial_end,
        'created_at': user['created_at'],
        'updated_at': datetime.now().isoformat()
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code in [200, 201]:
            return True
        else:
            print(f"   ❌ Profile creation failed: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("🔄 Profile Backfill Script")
    print("=" * 60)
    
    if not validate_config():
        sys.exit(1)
    
    print("\n📥 Fetching all users...")
    users = get_all_users()
    print(f"   Found {len(users)} users in auth")
    
    print("\n📥 Fetching existing profiles...")
    existing_profiles = get_all_profiles()
    print(f"   Found {len(existing_profiles)} existing profiles")
    
    # Find users without profiles
    users_needing_profiles = [u for u in users if u['id'] not in existing_profiles]
    
    if not users_needing_profiles:
        print("\n✅ All users already have profiles!")
        return
    
    print(f"\n🔧 Need to create {len(users_needing_profiles)} profiles...\n")
    
    success_count = 0
    fail_count = 0
    
    for i, user in enumerate(users_needing_profiles, 1):
        email = user.get('email', 'unknown')
        print(f"[{i}/{len(users_needing_profiles)}] Creating profile for: {email}...", end=' ')
        sys.stdout.flush()
        
        if create_profile(user):
            print("✅")
            success_count += 1
        else:
            fail_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print("=" * 60)

if __name__ == '__main__':
    main()

