# Google Calendar Integration Setup

## Overview
The calendar system now integrates with Google Calendar. When you create an event and click "Send to All", the system automatically sends calendar invitations to all active employees via email.

Additionally, you can display an embedded Google Calendar on the calendar page.

---

## Setup Steps

### 1. Embedded Google Calendar Display (Optional)

To show a real embedded Google Calendar on the calendar page:

#### Option A: Use Organization's Google Calendar
1. Go to your organization's Google Calendar (calendar.google.com)
2. Get your Calendar ID:
   - Click **Settings** (gear icon) → **Settings**
   - Go to **Integrate calendar** tab
   - Find your **Calendar ID** (looks like: `abc123def456@group.calendar.google.com`)

3. Add to `.env` file in the `/admin` folder:
```env
VITE_GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

4. Restart your dev server:
```bash
cd admin
npm run dev
```

#### Option B: Use a Public Google Calendar
- Create a public calendar in Google Calendar
- Share it publicly (Settings → Share with others → Make public)
- Use its Calendar ID in the .env file

---

### 2. Send Calendar Events to All Employees (Automatic)

When you create or view a calendar event in the app:

1. **Event shows "Send to All" button** (HR only)
2. Click it and confirm
3. System automatically:
   - ✅ Gets all active employees' email addresses
   - ✅ Creates event invitation email with details
   - ✅ Sends to all employees

#### Employees receive:
- Email with event title, date, and description
- Can add to their own calendars manually
- "Add to Google Calendar" button in the app (opens pre-filled Google Calendar form)

---

## Features

### Calendar Page Now Has:

| Feature | Description |
|---------|-------------|
| **Embedded Google Calendar** | Shows organization's real Google Calendar (if configured) |
| **"Google Cal" Button** | Each event has a quick "Add to personal Google Calendar" button |
| **"Send to All" Button** | HR can send invites to all active employees with one click |
| **Email Invitations** | Employees get email notifications with full event details |

---

## Email Configuration

Make sure your backend email service is configured in `.env` (server folder):

```env
# Email Configuration (already in your setup)
EMAIL_FROM=noreply@yourcompany.com
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
```

---

## API Endpoints

### Send Event Invites to All Employees
```
POST /api/calendar/:eventId/send-invites

Response:
{
  "message": "Event invitation sent to 45 employee(s)"
}
```

**Who can use this:** HR, Manager, CEO
**What it does:** 
- Fetches all active employees with emails
- Sends invitation email to each
- Returns count of emails sent

---

## Important Notes

⚠️ **Security:**
- Do NOT expose your Google Calendar ID if it's private
- Keep your API keys secure (not in public repos)
- Only HR/Manager/CEO can send event invites

✅ **Best Practices:**
- Set up email service first
- Test with a small group before production
- Verify employee emails are populated in the system
- Use organization's shared calendar for visibility

---

## Troubleshooting

**Problem:** "Google Calendar Not Configured" message
- **Solution:** Add `VITE_GOOGLE_CALENDAR_ID` to `.env.local` in admin folder

**Problem:** Emails not sending to employees
- **Solution:** Check that email service is configured in server `.env`
- Verify employees have email addresses in the system
- Check server logs for email errors

**Problem:** Embedded calendar shows "Calendar not found"
- **Solution:** Verify Calendar ID is correct and calendar is public or shared with the app's account

---

## Next Steps

1. ✅ Get your Google Calendar ID from calendar.google.com
2. ✅ Add it to admin/.env as `VITE_GOOGLE_CALENDAR_ID`
3. ✅ Restart admin dev server
4. ✅ Test by creating an event and clicking "Send to All"
5. ✅ Verify employees receive email invitations
