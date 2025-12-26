// ConvertKit API Integration
// This serverless function adds email addresses to your ConvertKit list

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get email from request body
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Get ConvertKit credentials from environment variables
    const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET;
    const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

    // Check if credentials are configured
    if (!CONVERTKIT_API_SECRET || !CONVERTKIT_FORM_ID) {
        console.error('ConvertKit credentials not configured');
        // Return success even if not configured (don't block user experience)
        return res.status(200).json({ 
            success: true, 
            message: 'Email saved locally (ConvertKit not configured)' 
        });
    }

    try {
        // Add subscriber to ConvertKit form
        const response = await fetch(
            `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_secret: CONVERTKIT_API_SECRET,
                    email: email,
                    // Optional: Add tags or custom fields
                    // tags: ['reseller-numbers'],
                    // fields: {
                    //     source: 'website-signup'
                    // }
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Email added to ConvertKit:', email);
            return res.status(200).json({ 
                success: true, 
                message: 'Email added to ConvertKit',
                data: data 
            });
        } else {
            console.error('❌ ConvertKit API error:', data);
            // Still return success to not block user experience
            // The email is already saved in localStorage
            return res.status(200).json({ 
                success: true, 
                message: 'Email saved locally',
                warning: 'ConvertKit subscription may have failed'
            });
        }
    } catch (error) {
        console.error('❌ Error adding email to ConvertKit:', error);
        // Return success to not block user experience
        return res.status(200).json({ 
            success: true, 
            message: 'Email saved locally',
            error: error.message 
        });
    }
}

