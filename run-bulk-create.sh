#!/bin/bash
# Helper script to run bulk user creation
# Usage: ./run-bulk-create.sh YOUR_SERVICE_ROLE_KEY

if [ -z "$1" ]; then
    echo "❌ Error: Service role key is required"
    echo ""
    echo "Usage: ./run-bulk-create.sh YOUR_SERVICE_ROLE_KEY"
    echo ""
    echo "Get your service role key from:"
    echo "https://app.supabase.com/project/yknvgrydvxnkzycpjblv/settings/api"
    exit 1
fi

export SUPABASE_URL="https://yknvgrydvxnkzycpjblv.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="$1"

echo "🚀 Starting bulk user creation..."
echo "📧 Reading emails from: emails.txt"
echo ""

python3 bulk-create-users.py emails.txt

