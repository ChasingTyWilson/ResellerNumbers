// ============================================
// EMAIL SERVICE FOR USER MANAGEMENT
// Using Resend API for email automation
// ============================================

class EmailService {
    constructor() {
        // Replace with your actual Resend API key
        this.apiKey = 'YOUR_RESEND_API_KEY_HERE';
        this.fromEmail = 'Reseller Numbers <noreply@resellernumbers.com>';
        this.baseUrl = 'https://api.resend.com';
    }

    // Send welcome email when user is approved
    async sendWelcomeEmail(userEmail, userName) {
        try {
            const response = await fetch(`${this.baseUrl}/emails`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [userEmail],
                    subject: 'Welcome to Reseller Numbers! 🎉',
                    html: this.getWelcomeEmailTemplate(userName)
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('Welcome email sent successfully:', result);
                return { success: true, data: result };
            } else {
                console.error('Failed to send welcome email:', result);
                return { success: false, error: result };
            }
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send email confirmation for new signups
    async sendConfirmationEmail(userEmail, userName, confirmationLink) {
        try {
            const response = await fetch(`${this.baseUrl}/emails`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [userEmail],
                    subject: 'Confirm your Reseller Numbers account',
                    html: this.getConfirmationEmailTemplate(userName, confirmationLink)
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('Confirmation email sent successfully:', result);
                return { success: true, data: result };
            } else {
                console.error('Failed to send confirmation email:', result);
                return { success: false, error: result };
            }
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send notification email to admin
    async sendAdminNotification(subject, message) {
        try {
            const response = await fetch(`${this.baseUrl}/emails`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: ['admin@resellernumbers.com'], // Replace with your admin email
                    subject: `Reseller Numbers Admin: ${subject}`,
                    html: this.getAdminNotificationTemplate(subject, message)
                })
            });

            const result = await response.json();
            return { success: response.ok, data: result };
        } catch (error) {
            console.error('Error sending admin notification:', error);
            return { success: false, error: error.message };
        }
    }

    // Welcome email template
    getWelcomeEmailTemplate(userName) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Reseller Numbers</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Reseller Numbers!</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #667eea; margin-top: 0;">Hi ${userName},</h2>
                    
                    <p>Great news! Your Reseller Numbers account has been approved and you're ready to start analyzing your eBay sales data.</p>
                    
                    <h3 style="color: #667eea;">What's next:</h3>
                    <ol>
                        <li><strong>Log in</strong> to your account at <a href="https://www.resellernumbers.com" style="color: #667eea;">www.resellernumbers.com</a></li>
                        <li><strong>Upload your eBay data</strong> (Orders and Current Listings)</li>
                        <li><strong>Start getting insights</strong> about your sales performance</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.resellernumbers.com" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Get Started Now</a>
                    </div>
                </div>
                
                <div style="background: #e9ecef; padding: 20px; border-radius: 10px; text-align: center;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                        Need help? Reply to this email or visit our support center.<br>
                        <strong>Reseller Numbers Team</strong>
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    // Confirmation email template
    getConfirmationEmailTemplate(userName, confirmationLink) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirm Your Account</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px;">📧 Confirm Your Email</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #667eea; margin-top: 0;">Hi ${userName},</h2>
                    
                    <p>Please confirm your email address to complete your Reseller Numbers registration.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmationLink}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Confirm Email Address</a>
                    </div>
                    
                    <p style="color: #6c757d; font-size: 14px;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${confirmationLink}" style="color: #667eea;">${confirmationLink}</a>
                    </p>
                </div>
                
                <div style="background: #e9ecef; padding: 20px; border-radius: 10px; text-align: center;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                        If you didn't create this account, please ignore this email.<br>
                        <strong>Reseller Numbers Team</strong>
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    // Admin notification template
    getAdminNotificationTemplate(subject, message) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #dc3545; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0;">🔔 Admin Notification</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #dc3545; margin-top: 0;">${subject}</h2>
                    <p>${message}</p>
                </div>
            </body>
            </html>
        `;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
}
