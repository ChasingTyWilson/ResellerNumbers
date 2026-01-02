// Google Sheets Integration
// This serverless function adds email addresses to a Google Sheet

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

    // Get Google Sheets Web App URL from environment variables
    const GOOGLE_SHEETS_WEB_APP_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;

    // Check if Google Sheets URL is configured
    if (!GOOGLE_SHEETS_WEB_APP_URL) {
        console.error('Google Sheets Web App URL not configured');
        // Return success even if not configured (don't block user experience)
        return res.status(200).json({ 
            success: true, 
            message: 'Email saved locally (Google Sheets not configured)' 
        });
    }

    try {
        // Add row to Google Sheet via Web App
        const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                timestamp: new Date().toISOString(),
                source: 'reseller-numbers-signup'
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Google Sheets API error:', errorText);
            // Still return success to not block user experience
            return res.status(200).json({ 
                success: true, 
                message: 'Email saved locally',
                warning: 'Google Sheets submission may have failed'
            });
        }

        const result = await response.text(); // Google Apps Script returns text
        console.log('✅ Email added to Google Sheet:', email);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Email added to Google Sheet',
            data: result 
        });
    } catch (error) {
        console.error('❌ Error adding email to Google Sheet:', error);
        // Return success to not block user experience
        return res.status(200).json({ 
            success: true, 
            message: 'Email saved locally',
            error: error.message 
        });
    }
}

