# EmailJS Integration Setup Guide

## Overview
EmailJS has been integrated into both the **Web App** and **User App (Android)** contact forms to send emails without needing a backend server.

---

## 🔑 How to Get Your EmailJS Credentials

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Add Email Service
1. Go to **Email Services** in the dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, Yahoo, etc.)
4. Follow the connection steps for your provider
5. **Copy the Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Go to **Email Templates** in the dashboard
2. Click "Create New Template"
3. Use this template structure:

```
Subject: New Contact Form Submission - {{subject}}

From: {{from_name}} ({{from_email}})

Message:
{{message}}

---
This message was sent from the Quiz App contact form.
```

4. **Template variables to use:**
   - `{{from_name}}` - Sender's name
   - `{{from_email}}` - Sender's email
   - `{{subject}}` - Message subject
   - `{{message}}` - Message content
   - `{{to_name}}` - Recipient name

5. **Copy the Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to **Account** → **General**
2. Find your **Public Key** (e.g., `xxxxxxxxxxxxxxxxxxx`)
3. Copy this key

---

## 📝 Configuration Files to Update

### Web App Configuration

**File:** `/app/web_app/frontend/src/app/dashboard/contact/page.tsx`

**Lines 9-11:** Update these constants:
```typescript
const EMAILJS_SERVICE_ID = 'service_xxxxxxx'; // Replace with your Service ID
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxx'; // Replace with your Template ID
const EMAILJS_PUBLIC_KEY = 'xxxxxxxxxxxxxxxxxxx'; // Replace with your Public Key
```

### User App (Android) Configuration

**File:** `/app/user_app/frontend/app/(tabs)/contact.tsx`

**Lines 16-18:** Update these constants:
```typescript
const EMAILJS_SERVICE_ID = 'service_xxxxxxx'; // Replace with your Service ID
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxx'; // Replace with your Template ID
const EMAILJS_PUBLIC_KEY = 'xxxxxxxxxxxxxxxxxxx'; // Replace with your Public Key
```

---

## 🔧 Example Configuration

Here's a complete example:

```typescript
const EMAILJS_SERVICE_ID = 'service_8j2k3l4';
const EMAILJS_TEMPLATE_ID = 'template_9m5n6o7';
const EMAILJS_PUBLIC_KEY = 'ABC123DEF456GHI789JKL';
```

---

## ✅ Testing the Integration

### Web App Testing:
1. Navigate to the Contact Us page
2. Fill in all fields (Name, Email, Subject, Message)
3. Click "Send Message"
4. Check your email inbox for the message
5. Verify the toast notification appears

### User App Testing:
1. Open the app and go to Contact Us
2. Fill in all fields
3. Tap "Send Message"
4. Check your email inbox
5. Verify the success alert appears

---

## 🎯 Features Implemented

### Both Apps Support:
- ✅ Full form validation
- ✅ Email format validation
- ✅ Loading states during submission
- ✅ Success/error notifications
- ✅ Form reset after successful submission
- ✅ Graceful error handling
- ✅ Direct email fallback if EmailJS fails

### Web App Features:
- Toast notifications (react-hot-toast)
- Form field validation
- Disabled state during submission
- Professional UI with Tailwind CSS

### User App Features:
- Native alerts for feedback
- Email validation regex
- Activity indicator during submission
- Material Design UI

---

## 🚨 Important Notes

1. **Free Tier Limits:**
   - EmailJS free tier: 200 emails/month
   - For production, consider upgrading to a paid plan

2. **Security:**
   - Public key is safe to expose in frontend code
   - Private key should NEVER be included

3. **Email Delivery:**
   - Emails may take 1-2 minutes to arrive
   - Check spam folder if not received

4. **Rate Limiting:**
   - EmailJS has rate limiting per IP
   - Consider adding captcha for production

5. **Alternative Fallback:**
   - Both apps show the direct email address (`support@genuis.com`)
   - Users can email directly if form fails

---

## 🔍 Troubleshooting

### Email Not Sending:
1. Verify all three credentials are correct
2. Check EmailJS dashboard for error logs
3. Ensure email service is connected and verified
4. Check browser console for error messages

### Template Not Working:
1. Ensure template variable names match exactly
2. Test template in EmailJS dashboard
3. Check that all required fields are being sent

### Connection Errors:
1. Check internet connection
2. Verify EmailJS service status
3. Check for CORS issues (shouldn't happen with EmailJS)

---

## 📧 Contact Form Details

### Fields Collected:
- Name (required)
- Email (required, validated)
- Subject (required)
- Message (required, multiline)

### Email Sent To:
- Configure in EmailJS template
- Typically: `support@genuis.com` or your support email

### Email Format:
```
From: [User Name] ([User Email])
Subject: New Contact Form Submission - [Subject]

Message:
[User's message content]

---
Sent via Quiz App Contact Form
```

---

## 🎨 Customization Options

### Changing Email Recipient:
Update the EmailJS template to send to different email addresses

### Adding Auto-Reply:
1. Create a second template for auto-reply
2. Add a second `emailjs.send()` call in the code
3. Send confirmation email to user

### Adding Fields:
1. Add field to form UI
2. Add to `templateParams` object
3. Add corresponding variable to EmailJS template

---

## 📦 Dependencies

### Web App:
```json
{
  "@emailjs/browser": "^4.x.x"
}
```

### User App:
- No additional dependencies needed
- Uses native `fetch` API

---

## 🚀 Deployment Checklist

- [ ] Create EmailJS account
- [ ] Connect email service
- [ ] Create email template with correct variables
- [ ] Copy Service ID, Template ID, and Public Key
- [ ] Update web app contact page configuration
- [ ] Update user app contact page configuration
- [ ] Test email sending from both apps
- [ ] Verify emails arrive in inbox
- [ ] Test error handling (disconnect internet)
- [ ] Test form validation
- [ ] Update support email address in forms

---

## 📞 Support

If you encounter issues with EmailJS:
- Visit: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- Contact: EmailJS Support
- Check: EmailJS status page

For Quiz App related issues:
- Email: support@genuis.com
- Check: App documentation

---

**Last Updated:** Current Session  
**Status:** Integration Complete - Awaiting EmailJS Credentials
