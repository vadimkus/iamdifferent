import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all bookings
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error reading bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, date, timeSlot, notes } = body

    // Validation
    if (!name || !email || !phone || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      )
    }

    // Check if time slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date,
        timeSlot,
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Это время уже занято. Пожалуйста, выберите другое время.' },
        { status: 409 }
      )
    }

    // Create new booking
    const newBooking = await prisma.booking.create({
      data: {
        name,
        email,
        phone,
        date,
        timeSlot,
        notes: notes || null,
      },
    })

    // Send confirmation email (async, don't wait for it)
    sendConfirmationEmail(newBooking).catch((error) => {
      console.error('Error sending confirmation email:', error)
    })

    return NextResponse.json(
      { message: 'Запись успешно создана', booking: newBooking },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании записи' },
      { status: 500 }
    )
  }
}

// Send confirmation email
async function sendConfirmationEmail(booking: { name: string; email: string; date: string; timeSlot: string; notes?: string | null }) {
  try {
    // Option 1: Using Resend (Recommended - free tier: 3000 emails/month)
    // Uncomment and add RESEND_API_KEY to .env.local
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@iamdifferent.ru',
          to: [booking.email, process.env.INSTRUCTOR_EMAIL || 'Healthy.smirnova@gmail.com'],
          subject: 'Подтверждение записи на занятие йогой',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Здравствуйте, ${booking.name}!</h2>
              <p>Ваша запись на занятие подтверждена.</p>
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Дата:</strong> ${booking.date}</p>
                <p><strong>Время:</strong> ${booking.timeSlot}</p>
                ${booking.notes ? `<p><strong>Дополнительная информация:</strong> ${booking.notes}</p>` : ''}
              </div>
              <p>Мы свяжемся с вами для подтверждения деталей.</p>
              <p>С уважением,<br><strong>Нина Смирнова</strong><br>Фитнес и Йога Тренер</p>
            </div>
          `,
        }),
      })

      if (response.ok) {
        console.log('Confirmation email sent successfully')
        return
      }
    }

    // Option 2: Using Nodemailer with SMTP
    // Uncomment and configure SMTP settings in .env.local
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@iamdifferent.ru',
        to: [booking.email, process.env.INSTRUCTOR_EMAIL || 'Healthy.smirnova@gmail.com'],
        subject: 'Подтверждение записи на занятие йогой',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Здравствуйте, ${booking.name}!</h2>
            <p>Ваша запись на занятие подтверждена.</p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Дата:</strong> ${booking.date}</p>
              <p><strong>Время:</strong> ${booking.timeSlot}</p>
              ${booking.notes ? `<p><strong>Дополнительная информация:</strong> ${booking.notes}</p>` : ''}
            </div>
            <p>Мы свяжемся с вами для подтверждения деталей.</p>
            <p>С уважением,<br><strong>Нина Смирнова</strong><br>Фитнес и Йога Тренер</p>
          </div>
        `,
      })

      console.log('Confirmation email sent via SMTP')
      return
    }

    // Fallback: Log email data if no email service is configured
    console.log('Email service not configured. Email data:', {
      to: booking.email,
      subject: 'Подтверждение записи на занятие йогой',
      booking: booking,
    })
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    // Don't throw error - booking is still created even if email fails
  }
}

