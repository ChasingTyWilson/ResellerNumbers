#!/usr/bin/env node

/**
 * Bulk User Creation Script for eBay Analytics Platform
 * 
 * This script creates multiple user accounts with a default password.
 * 
 * Usage:
 *   node bulk-create-users.js emails.txt
 *   OR
 *   node bulk-create-users.js (will prompt for emails)
 * 
 * Requirements:
 *   - Node.js
 *   - Supabase Admin API key
 *   - npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const DEFAULT_PASSWORD = 'Recharge';
const DEFAULT_FULL_NAME = 'User'; // Can be customized per user if needed

// ============================================
// INITIALIZE SUPABASE CLIENT (Admin)
// ============================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function createUser(email, fullName = DEFAULT_FULL_NAME) {
    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName
            }
        });

        if (authError) {
            return {
                success: false,
                email: email,
                error: authError.message
            };
        }

        // Create profile with trial period
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                status: 'pending', // Users start as pending (need approval)
                subscription_status: 'trial',
                subscription_plan: 'free',
                trial_ends_at: trialEndsAt.toISOString()
            });

        if (profileError) {
            console.error(`⚠️ Profile creation failed for ${email}:`, profileError.message);
            // User was created but profile failed - might need manual fix
            return {
                success: false,
                email: email,
                error: `Profile creation failed: ${profileError.message}`
            };
        }

        return {
            success: true,
            email: email,
            userId: authData.user.id
        };
    } catch (error) {
        return {
            success: false,
            email: email,
            error: error.message
        };
    }
}

async function processEmails(emails) {
    const results = {
        total: emails.length,
        successful: [],
        failed: []
    };

    console.log(`\n🚀 Starting bulk user creation for ${emails.length} email(s)...\n`);

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i].trim();
        
        if (!email) continue;
        
        if (!validateEmail(email)) {
            console.log(`❌ [${i + 1}/${emails.length}] Invalid email format: ${email}`);
            results.failed.push({ email, error: 'Invalid email format' });
            continue;
        }

        console.log(`📧 [${i + 1}/${emails.length}] Creating account for: ${email}...`);
        
        const result = await createUser(email);
        
        if (result.success) {
            console.log(`✅ Success: ${email} (User ID: ${result.userId})`);
            results.successful.push(result);
        } else {
            console.log(`❌ Failed: ${email} - ${result.error}`);
            results.failed.push(result);
        }

        // Small delay to avoid rate limiting
        if (i < emails.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results;
}

function printSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK USER CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total emails: ${results.total}`);
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.successful.length > 0) {
        console.log('\n✅ SUCCESSFUL CREATIONS:');
        results.successful.forEach(result => {
            console.log(`   - ${result.email}`);
        });
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ FAILED CREATIONS:');
        results.failed.forEach(result => {
            console.log(`   - ${result.email}: ${result.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📝 Default password for all accounts: "${DEFAULT_PASSWORD}"`);
    console.log(`📝 Note: Users are created with status "pending" and need approval.\n`);
}

// ============================================
// MAIN SCRIPT
// ============================================

async function main() {
    let emails = [];

    // Check if email file is provided as argument
    if (process.argv[2]) {
        const filePath = process.argv[2];
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            emails = fileContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            console.log(`📄 Loaded ${emails.length} email(s) from ${filePath}`);
        } catch (error) {
            console.error(`❌ Error reading file ${filePath}:`, error.message);
            process.exit(1);
        }
    } else {
        // Interactive mode - prompt for emails
        console.log('📧 Bulk User Creation Tool');
        console.log('Enter email addresses (one per line, or comma-separated):');
        console.log('Press Ctrl+D (Mac/Linux) or Ctrl+Z (Windows) when done, or enter "done"\n');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const lines = [];
        rl.on('line', (line) => {
            if (line.trim().toLowerCase() === 'done') {
                rl.close();
            } else {
                lines.push(line);
            }
        });

        rl.on('close', async () => {
            // Parse emails (support both line-by-line and comma-separated)
            emails = lines
                .join('\n')
                .split(/[,\n]/)
                .map(email => email.trim())
                .filter(email => email.length > 0);
            
            if (emails.length === 0) {
                console.log('❌ No emails provided. Exiting.');
                process.exit(1);
            }

            // Validate configuration
            if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
                console.error('\n❌ ERROR: Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
                console.error('   Set them as environment variables or edit this script.\n');
                process.exit(1);
            }

            const results = await processEmails(emails);
            printSummary(results);
            process.exit(results.failed.length > 0 ? 1 : 0);
        });

        return;
    }

    // Validate configuration
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
        console.error('\n❌ ERROR: Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        console.error('   Set them as environment variables or edit this script.');
        console.error('   Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node bulk-create-users.js emails.txt\n');
        process.exit(1);
    }

    if (emails.length === 0) {
        console.error('❌ No valid emails found. Exiting.');
        process.exit(1);
    }

    const results = await processEmails(emails);
    printSummary(results);
    process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

