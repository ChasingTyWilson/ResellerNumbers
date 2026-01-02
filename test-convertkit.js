// Test script to verify ConvertKit integration
// This will test the API endpoint

const testEmail = 'test@example.com'; // Change this to your email for testing

async function testConvertKit() {
    console.log('🧪 Testing ConvertKit Integration...\n');
    
    // Try to detect the Vercel URL
    const possibleUrls = [
        'https://resellernumbers.com',
        'https://resellernumbers.vercel.app',
        'https://www.resellernumbers.com'
    ];
    
    console.log('Please enter your live site URL (or press Enter to try common URLs):');
    console.log('Examples: https://resellernumbers.com or https://your-site.vercel.app\n');
    
    // For now, let's try the most likely URL
    const baseUrl = 'https://resellernumbers.com';
    
    console.log(`Testing endpoint: ${baseUrl}/api/convertkit/subscribe\n`);
    
    try {
        const response = await fetch(`${baseUrl}/api/convertkit/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: testEmail }),
        });

        const result = await response.json();
        
        console.log('📊 Response Status:', response.status);
        console.log('📦 Response Body:', JSON.stringify(result, null, 2));
        
        if (response.ok && result.success) {
            console.log('\n✅ SUCCESS! ConvertKit integration is working!');
            console.log('   The email was successfully added to ConvertKit.');
        } else if (response.status === 200 && result.message) {
            console.log('\n⚠️  WARNING:', result.message);
            if (result.message.includes('not configured')) {
                console.log('   The environment variables may not be set correctly.');
            }
        } else {
            console.log('\n❌ ERROR: The integration may not be working correctly.');
            console.log('   Check the response above for details.');
        }
        
    } catch (error) {
        console.error('\n❌ Error testing endpoint:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Your site is deployed and live');
        console.log('   2. The environment variables are set in Vercel');
        console.log('   3. You\'ve redeployed after adding the env vars');
    }
}

// Run the test
testConvertKit();

