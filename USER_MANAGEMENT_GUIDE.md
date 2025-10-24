# User Management Guide - Reseller Numbers

## 🔧 **Current User Management Setup**

### **1. User Signup Flow**
- **Frontend**: `script.js` - `handleSignup()` method
- **Backend**: `supabase-service.js` - `signUp()` method
- **Database**: Supabase handles authentication and user profiles

### **2. User Management Dashboard**
- **File**: `user-management.html` - Complete admin dashboard
- **Features**: User approval, status management, email notifications

## 🚀 **User Management Features**

### **User Statuses**
- **Pending**: New users waiting for approval
- **Active**: Approved users with full access
- **Trial**: Users in 14-day free trial
- **Suspended**: Users temporarily or permanently suspended

### **Subscription Types**
- **Trial**: 14-day free trial
- **Pro**: Paid professional subscription
- **Enterprise**: Enterprise-level subscription

## 📧 **Email Management Options**

### **Option 1: Manual Email Management**
- Use the "Email" button in the user management dashboard
- Opens your default email client with pre-filled recipient

### **Option 2: Automated Email Service Integration**
You can integrate with these services:

#### **SendGrid Integration**
```javascript
// Add to supabase-service.js
async sendWelcomeEmail(userId) {
    const response = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    return response.json();
}
```

#### **Mailgun Integration**
```javascript
// Add to supabase-service.js
async sendWelcomeEmail(userId) {
    const response = await fetch('/api/send-mailgun-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    return response.json();
}
```

#### **Resend Integration**
```javascript
// Add to supabase-service.js
async sendWelcomeEmail(userId) {
    const response = await fetch('/api/send-resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    return response.json();
}
```

## 🔐 **User Approval Process**

### **Current Setup**
1. User signs up through the main app
2. User is created with "pending" status
3. Admin reviews and approves users through the management dashboard
4. Approved users receive welcome email and gain access

### **Approval Workflow**
1. **New User Signs Up** → Status: "pending"
2. **Admin Reviews** → User Management Dashboard
3. **Admin Approves** → Status: "active" + Welcome Email
4. **User Gains Access** → Full app functionality

## 📊 **User Management Dashboard Features**

### **Statistics**
- Total Users
- Active Users
- Trial Users
- Pending Approvals

### **User Actions**
- **Approve**: Change status from "pending" to "active"
- **Suspend**: Temporarily disable user access
- **Email**: Send direct email to user
- **View Details**: See user profile and activity

### **Filtering & Search**
- Filter by status (Active, Trial, Pending, Suspended)
- Filter by subscription type
- Search by name or email

## 🛠 **Setup Instructions**

### **1. Access User Management Dashboard**
- Navigate to `user-management.html` in your browser
- Use your Supabase admin credentials

### **2. Configure Email Service (Optional)**
Choose one of these options:

#### **Option A: Manual Email Management**
- Use the built-in email buttons
- No additional setup required

#### **Option B: Automated Email Service**
1. Sign up for an email service (SendGrid, Mailgun, Resend)
2. Get API credentials
3. Create serverless functions for email sending
4. Update the `sendWelcomeEmail` method

### **3. Customize User Approval Process**
- Modify the signup flow in `script.js`
- Update user statuses in `supabase-service.js`
- Customize the management dashboard

## 📝 **Email Templates**

### **Welcome Email Template**
```
Subject: Welcome to Reseller Numbers - Your Account is Approved!

Hi [User Name],

Welcome to Reseller Numbers! Your account has been approved and you now have full access to our professional analytics platform.

Your 14-day free trial has started. During this time, you can:
- Upload and analyze your eBay data
- Generate comprehensive business reports
- Access all premium features

To get started:
1. Log in to your account
2. Upload your eBay data
3. Explore your analytics dashboard

If you have any questions, please don't hesitate to contact us.

Best regards,
The Reseller Numbers Team
```

### **Account Suspension Email Template**
```
Subject: Account Suspension Notice - Reseller Numbers

Hi [User Name],

Your Reseller Numbers account has been temporarily suspended. This may be due to:
- Terms of service violation
- Payment issues
- Account security concerns

To resolve this issue, please contact our support team.

Best regards,
The Reseller Numbers Team
```

## 🔧 **Customization Options**

### **1. User Approval Requirements**
- Modify signup validation in `handleSignup()`
- Add additional fields to user profiles
- Implement custom approval workflows

### **2. Email Automation**
- Set up automated welcome emails
- Create email sequences for new users
- Add email templates for different user actions

### **3. User Management Features**
- Add user activity tracking
- Implement user role management
- Create custom user dashboards

## 📞 **Support & Maintenance**

### **Regular Tasks**
1. **Review Pending Users**: Check for new signups daily
2. **Monitor User Activity**: Track active vs inactive users
3. **Handle Support Requests**: Respond to user emails
4. **Update User Statuses**: Manage subscriptions and access

### **Troubleshooting**
- **Users can't sign up**: Check Supabase configuration
- **Emails not sending**: Verify email service setup
- **Approval not working**: Check database permissions
- **Dashboard not loading**: Verify Supabase connection

## 🎯 **Next Steps**

1. **Set up the User Management Dashboard**
2. **Configure your preferred email service**
3. **Test the user approval workflow**
4. **Customize email templates**
5. **Train your team on user management**

This system gives you complete control over user signup, approval, and management while maintaining a professional user experience.
