# Booking System Setup Guide

## Overview
The booking system is now fully integrated with:
- ✅ Calendar view with available time slots
- ✅ Online booking form with validation
- ✅ Real-time availability checking
- ✅ Email confirmation functionality

## Email Configuration

To enable email confirmations, you need to configure one of the following options:

### Option 1: Resend (Recommended)
1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
INSTRUCTOR_EMAIL=Healthy.smirnova@gmail.com
```

### Option 2: SMTP (Nodemailer)
1. Get SMTP credentials from your email provider (Gmail, Outlook, etc.)
2. Add to `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
INSTRUCTOR_EMAIL=Healthy.smirnova@gmail.com
```

**Note:** If no email service is configured, bookings will still be saved but emails won't be sent (logged to console instead).

## Database Storage

Bookings are currently stored in `data/bookings.json`. For production, consider migrating to:
- PostgreSQL (via Supabase, Vercel Postgres)
- MongoDB (via MongoDB Atlas)
- Firebase Firestore

## Features

### Calendar Integration
- Full calendar view (month, week, day)
- Visual indication of booked slots
- Click to select date
- Russian locale support

### Time Slot Selection
- Available slots: 9:00 AM - 8:00 PM
- 60-minute duration per slot
- Real-time availability checking
- Prevents double bookings

### Booking Form
- Name, email, phone validation
- Date and time selection
- Optional notes field
- Form validation with error messages

### Email Confirmations
- Automatic email to client
- Copy sent to instructor
- HTML formatted emails
- Error handling (booking still saved if email fails)

## Usage

1. Navigate to `/booking`
2. Click on a date in the calendar
3. Select an available time slot
4. Fill in the booking form
5. Submit - booking is created and confirmation email is sent

## API Endpoints

- `GET /api/bookings` - Fetch all bookings
- `POST /api/bookings` - Create a new booking

## Future Enhancements

- [ ] Cancellation functionality
- [ ] Rescheduling bookings
- [ ] Reminder emails (24h before)
- [ ] Admin dashboard to view/manage bookings
- [ ] Integration with Google Calendar
- [ ] Recurring bookings support
- [ ] Payment integration

