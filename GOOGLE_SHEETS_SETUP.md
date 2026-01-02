# Google Sheets Email List Setup

## 🎯 Overview

This replaces ConvertKit with a simple Google Sheets integration. All email addresses will be added to a Google Sheet that you can monitor.

## 📋 Setup Steps

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Reseller Numbers Signups"
4. In the first row, add headers:
   - Column A: `Email`
   - Column B: `Timestamp`
   - Column C: `Source`

### Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code and paste this:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const email = data.email;
    const timestamp = data.timestamp || new Date().toISOString();
    const source = data.source || 'reseller-numbers-signup';
    
    // Add the row to the sheet
    sheet.appendRow([email, timestamp, source]);
    
    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Save** (💾 icon)
4. Give it a name like "Email Webhook"

### Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Set:
   - **Description**: "Email signup webhook"
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)
7. Click **Authorize access** and allow permissions

### Step 4: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **ResellerNumbers** project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Key**: `GOOGLE_SHEETS_WEB_APP_URL`
   - **Value**: (paste the Web App URL from Step 3)
   - **Environments**: Production, Preview, Development
5. Click **Save**

### Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**

## ✅ Testing

1. Visit your live site
2. Enter an email address
3. Check your Google Sheet - the email should appear within seconds!

## 📊 Monitoring

- All emails will appear in your Google Sheet
- You can sort, filter, and analyze the data
- Timestamps are automatically added
- You can export to CSV or use Google Sheets formulas

## 🔒 Security

- The Web App URL is stored securely in Vercel
- Only your serverless function can access it
- The sheet is private (only you can see it)

---

**That's it!** Your email list will now be in Google Sheets. 🎉

