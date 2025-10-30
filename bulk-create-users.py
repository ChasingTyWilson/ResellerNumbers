#!/usr/bin/env python3
"""
Bulk User Creation Script for eBay Analytics Platform (Python Version)

This script creates multiple user accounts with a default password.

Usage:
    python3 bulk-create-users.py emails.txt
    
    OR
    
    SUPABASE_URL=https://xxx SUPABASE_SERVICE_ROLE_KEY=xxx python3 bulk-create-users.py emails.txt

Requirements:
    - Python 3.6+
    - requests library
    - Supabase Admin API key
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    print("❌ Error: 'requests' library not installed")
    print("📦 Install it with: pip install requests")
    sys.exit(1)

# ============================================
# CONFIGURATION
# ============================================
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://yknvgrydvxnkzycpjblv.supabase.co')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'YOUR_SERVICE_ROLE_KEY')
DEFAULT_PASSWORD = 'Recharge'

# ============================================
# VALIDATION
# ============================================
def validate_email(email):
    """Validate email format"""
    email = email.strip()
    if '@' not in email or '.' not in email:
        return False
    return True

def validate_config():
    """Validate configuration"""
    if 'YOUR_' in SUPABASE_URL or 'YOUR_' in SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Error: Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        print("\nYou can set them as environment variables:")
        print("  export SUPABASE_URL=https://your-project.supabase.co")
        print("  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        print("\nOr run with one-line command:")
        print("  SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx python3 bulk-create-users.py emails.txt")
        print("\nGet your service role key from:")
        print("  https://app.supabase.com/project/yknvgrydvxnkzycpjblv/settings/api")
        return False
    return True

# ============================================
# SUPABASE API FUNCTIONS
# ============================================

def create_auth_user(email, password):
    """Create user in Supabase Auth"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'email': email,
        'password': password,
        'email_confirm': True,
        'auto_confirm_user': True
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code in [200, 201]:
            return {'success': True, 'user': response.json()}
        else:
            error_msg = response.text
            if 'already registered' in error_msg or 'already exists' in error_msg or 'duplicate' in error_msg.lower():
                return {'success': False, 'error': 'User already registered'}
            return {'success': False, 'error': error_msg[:200]}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def create_profile(user_id, email):
    """Create profile in profiles table"""
    url = f"{SUPABASE_URL}/rest/v1/profiles"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    # Calculate 14 days from now
    trial_end = (datetime.now() + timedelta(days=14)).isoformat()
    
    data = {
        'id': user_id,
        'email': email,
        'full_name': email.split('@')[0].title(),  # Use email prefix as name
        'status': 'pending',
        'subscription_status': 'trial',
        'subscription_plan': 'free',
        'trial_ends_at': trial_end,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code in [200, 201]:
            return {'success': True, 'profile': response.json()}
        else:
            return {'success': False, 'error': response.text[:200]}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def create_user(email):
    """Create complete user account"""
    # Validate email
    if not validate_email(email):
        return {'success': False, 'error': 'Invalid email format'}
    
    # Create auth user
    auth_result = create_auth_user(email, DEFAULT_PASSWORD)
    if not auth_result['success']:
        return auth_result
    
    user_id = auth_result['user']['id']
    
    # Create profile
    profile_result = create_profile(user_id, email)
    if not profile_result['success']:
        # Auth user created but profile failed
        print(f"   ⚠️  Warning: Profile creation failed for {email}, but user was created")
        return {'success': True, 'user_id': user_id, 'profile_warning': True}
    
    return {'success': True, 'user_id': user_id, 'profile': profile_result['profile']}

# ============================================
# MAIN EXECUTION
# ============================================

def main():
    print("🚀 eBay Analytics - Bulk User Creation")
    print("=" * 60)
    
    # Validate configuration
    if not validate_config():
        sys.exit(1)
    
    # Get email list
    email_list = []
    if len(sys.argv) > 1:
        # Read from file
        filename = sys.argv[1]
        try:
            with open(filename, 'r') as f:
                email_list = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        except FileNotFoundError:
            print(f"❌ Error: File '{filename}' not found")
            sys.exit(1)
    else:
        print("\nPlease enter email addresses (one per line, or comma-separated).")
        print("Type 'done' when finished:\n")
        while True:
            try:
                line = input().strip()
                if line.lower() == 'done':
                    break
                emails = [e.strip() for e in line.split(',')]
                email_list.extend(emails)
            except EOFError:
                break
    
    if not email_list:
        print("❌ No email addresses provided")
        sys.exit(1)
    
    # Remove duplicates
    email_list = list(dict.fromkeys(email_list))
    
    print(f"\n🚀 Starting bulk user creation for {len(email_list)} email(s)...\n")
    
    # Process emails
    successful = []
    failed = []
    
    for i, email in enumerate(email_list, 1):
        print(f"📧 [{i}/{len(email_list)}] Creating account for: {email}...", end=' ')
        sys.stdout.flush()
        
        result = create_user(email)
        
        if result['success']:
            user_id = result.get('user_id', 'unknown')
            profile_warning = result.get('profile_warning', False)
            status = "✅ Success" if not profile_warning else "⚠️  Partial"
            print(f"{status}: {email} (User ID: {user_id[:8]}...)")
            successful.append({'email': email, 'user_id': user_id, 'warning': profile_warning})
        else:
            error = result.get('error', 'Unknown error')
            print(f"❌ Failed: {email} - {error}")
            failed.append({'email': email, 'error': error})
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 BULK USER CREATION SUMMARY")
    print("=" * 60)
    print(f"Total emails: {len(email_list)}")
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    print()
    
    if successful:
        print("✅ SUCCESSFUL CREATIONS:")
        for item in successful:
            warning_text = " (profile warning)" if item['warning'] else ""
            print(f"   - {item['email']}{warning_text}")
        print()
    
    if failed:
        print("❌ FAILED CREATIONS:")
        for item in failed:
            print(f"   - {item['email']}: {item['error']}")
        print()
    
    print("=" * 60)
    print()
    print(f"📝 Default password for all accounts: \"{DEFAULT_PASSWORD}\"")
    print("📝 Note: Users are created with status \"pending\" and need approval.")
    print()

if __name__ == '__main__':
    main()

