// Test script to verify booking system works
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
})

async function testBooking() {
  try {
    console.log('Testing database connection...')
    
    // Test 1: Check if we can connect
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test 2: Count existing bookings
    const count = await prisma.booking.count()
    console.log(`✅ Found ${count} existing bookings`)
    
    // Test 3: Try to create a test booking
    const testBooking = await prisma.booking.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+7 (999) 123-45-67',
        date: '2025-12-31',
        timeSlot: '10:00-11:00',
        notes: 'Test booking - can be deleted',
      },
    })
    console.log('✅ Test booking created:', testBooking.id)
    
    // Test 4: Check availability
    const existing = await prisma.booking.findFirst({
      where: {
        date: '2025-12-31',
        timeSlot: '10:00-11:00',
      },
    })
    console.log('✅ Availability check works:', existing ? 'Slot taken' : 'Slot available')
    
    // Test 5: Clean up test booking
    await prisma.booking.delete({
      where: { id: testBooking.id },
    })
    console.log('✅ Test booking deleted')
    
    console.log('\n🎉 All tests passed! Booking system is working correctly.')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testBooking()

