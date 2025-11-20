'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, startOfDay, addMinutes, isSameDay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Import moment for react-big-calendar
import moment from 'moment'
import 'moment/locale/ru'

moment.locale('ru')
const localizer = momentLocalizer(moment)

// Booking form schema
const bookingSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  date: z.string(),
  timeSlot: z.string(),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  date: string
  timeSlot: string
  notes?: string | null
  createdAt: Date | string
}

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  // Fetch bookings and generate available slots
  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate)
    }
  }, [selectedDate, bookings])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const generateTimeSlots = (date: Date) => {
    const slots: TimeSlot[] = []
    const startHour = 9 // 9 AM
    const endHour = 20 // 8 PM
    const slotDuration = 60 // 60 minutes

    const dateStart = startOfDay(date)

    for (let hour = startHour; hour < endHour; hour++) {
      const start = addMinutes(dateStart, hour * 60)
      const end = addMinutes(start, slotDuration)
      const timeSlotStr = `${format(start, 'HH:mm')}-${format(end, 'HH:mm')}`

      // Check if this slot is already booked
      const isBooked = bookings.some((booking) => {
        const bookingDate = typeof booking.date === 'string' ? parseISO(booking.date) : new Date(booking.date)
        if (!isSameDay(bookingDate, date)) return false
        return booking.timeSlot === timeSlotStr
      })

      slots.push({
        start,
        end,
        available: !isBooked,
      })
    }

    setAvailableSlots(slots)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
    setValue('date', format(date, 'yyyy-MM-dd'))
  }

  const handleSlotSelect = (slot: string) => {
    setSelectedTimeSlot(slot)
    setValue('timeSlot', slot)
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedDate || !selectedTimeSlot) {
      setSubmitError('Пожалуйста, выберите дату и время')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: format(selectedDate, 'yyyy-MM-dd'),
        }),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        reset()
        setSelectedDate(null)
        setSelectedTimeSlot(null)
        await fetchBookings()
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        const errorData = await response.json()
        setSubmitError(errorData.error || 'Ошибка при создании записи')
      }
    } catch (error) {
      setSubmitError('Произошла ошибка. Пожалуйста, попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convert bookings to calendar events
  const events = bookings.map((booking) => {
    const [startTime, endTime] = booking.timeSlot.split('-')
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const bookingDate = typeof booking.date === 'string' ? parseISO(booking.date) : new Date(booking.date)
    const start = addMinutes(startOfDay(bookingDate), startHour * 60 + startMin)
    const end = addMinutes(startOfDay(bookingDate), endHour * 60 + endMin)

    return {
      id: booking.id,
      title: `${booking.name} - ${booking.timeSlot}`,
      start,
      end,
    }
  })

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
        color: 'white',
        borderRadius: '4px',
        padding: '2px 4px',
      },
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <a href="/smirnova" aria-label="Главная страница">
                <img 
                  src="/smirnova/logo/logo3.png" 
                  alt="Логотип Нины Смирновой - Фитнес и Йога Тренер" 
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                  width="48"
                  height="48"
                />
              </a>
              <div>
                <h1 className="text-lg md:text-xl font-light text-gray-800">Нина Смирнова</h1>
                <p className="text-xs text-gray-500 font-light">Фитнес и Йога Тренер</p>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              <a href="/smirnova" className="text-gray-700 hover:text-emerald-600 font-light transition-colors">
                Главная
              </a>
              <a href="/smirnova#about" className="text-gray-700 hover:text-emerald-600 font-light transition-colors">
                О нас
              </a>
              <a href="/faq" className="text-gray-700 hover:text-emerald-600 font-light transition-colors">
                Частые вопросы
              </a>
              <a href="/videos" className="text-gray-700 hover:text-emerald-600 font-light transition-colors">
                Бесплатные видео
              </a>
              <a href="/booking" className="text-emerald-600 font-light">
                Запись
              </a>
              <a href="/smirnova#contact" className="text-gray-700 hover:text-emerald-600 font-light transition-colors">
                Контакты
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="/smirnova" 
                  className="text-gray-700 hover:text-emerald-600 font-light transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Главная
                </a>
                <a 
                  href="/smirnova#about" 
                  className="text-gray-700 hover:text-emerald-600 font-light transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  О нас
                </a>
                <a 
                  href="/faq" 
                  className="text-gray-700 hover:text-emerald-600 font-light transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Частые вопросы
                </a>
                <a 
                  href="/videos" 
                  className="text-gray-700 hover:text-emerald-600 font-light transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Бесплатные видео
                </a>
                <a 
                  href="/booking" 
                  className="text-emerald-600 font-light px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Запись
                </a>
                <a 
                  href="/smirnova#contact" 
                  className="text-gray-700 hover:text-emerald-600 font-light transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Контакты
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-800 mb-3 sm:mb-4">
              Запись на занятие
            </h1>
            <p className="text-base sm:text-lg text-gray-600 font-light px-2">
              Выберите удобную дату и время для занятия
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Calendar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 overflow-hidden">
              <div className="hidden sm:block">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  view={currentView}
                  onView={setCurrentView}
                  date={currentDate}
                  onNavigate={setCurrentDate}
                  onSelectSlot={({ start }) => handleDateSelect(start)}
                  selectable
                  eventPropGetter={eventStyleGetter}
                  messages={{
                    next: 'Следующий',
                    previous: 'Предыдущий',
                    today: 'Сегодня',
                    month: 'Месяц',
                    week: 'Неделя',
                    day: 'День',
                    agenda: 'Повестка дня',
                    date: 'Дата',
                    time: 'Время',
                    event: 'Событие',
                  }}
                />
              </div>
              {/* Mobile calendar - simpler view */}
              <div className="sm:hidden">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 350 }}
                  view="month"
                  date={currentDate}
                  onNavigate={setCurrentDate}
                  onSelectSlot={({ start }) => handleDateSelect(start)}
                  selectable
                  eventPropGetter={eventStyleGetter}
                  messages={{
                    next: 'Следующий',
                    previous: 'Предыдущий',
                    today: 'Сегодня',
                    month: 'Месяц',
                    week: 'Неделя',
                    day: 'День',
                    agenda: 'Повестка дня',
                    date: 'Дата',
                    time: 'Время',
                    event: 'Событие',
                  }}
                />
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-light text-gray-800 mb-4 sm:mb-6">
                Информация для записи
              </h2>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-emerald-700 font-light">
                    Запись успешно создана! Мы отправили подтверждение на ваш email.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-light">{submitError}</p>
                </div>
              )}

              {selectedDate && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm sm:text-base text-emerald-700 font-light">
                    Выбранная дата: <strong>{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</strong>
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">
                    Имя *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ваше имя"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="+7 (999) 123-45-67"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-light text-gray-700 mb-2">
                      Выберите время *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.map((slot, index) => {
                        const slotStr = `${format(slot.start, 'HH:mm')}-${format(slot.end, 'HH:mm')}`
                        const isSelected = selectedTimeSlot === slotStr
                        const isAvailable = slot.available

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => isAvailable && handleSlotSelect(slotStr)}
                            disabled={!isAvailable}
                            className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors font-light text-xs sm:text-sm ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isAvailable
                                ? 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:text-emerald-600'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {format(slot.start, 'HH:mm')}
                          </button>
                        )
                      })}
                    </div>
                    {errors.timeSlot && (
                      <p className="mt-1 text-sm text-red-600">{errors.timeSlot.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">
                    Дополнительная информация (необязательно)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Есть ли что-то, что мне нужно знать?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTimeSlot}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? 'Отправка...' : 'Записаться'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 md:py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-light mb-4">О нас</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/smirnova#about" className="hover:text-emerald-400 transition-colors">О Нине</a></li>
                <li><a href="/faq" className="hover:text-emerald-400 transition-colors">Частые вопросы</a></li>
                <li><a href="/smirnova#contact" className="hover:text-emerald-400 transition-colors">Контакты</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-light mb-4">Курсы</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/smirnova#courses" className="hover:text-emerald-400 transition-colors">Все курсы</a></li>
                <li><a href="/videos" className="hover:text-emerald-400 transition-colors">Бесплатные видео</a></li>
                <li><a href="/smirnova#courses" className="hover:text-emerald-400 transition-colors">Мастер-классы</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-light mb-4">Связь</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://www.instagram.com/nina.smirnovaa/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="mailto:Healthy.smirnova@gmail.com" className="hover:text-emerald-400 transition-colors">
                    Email
                  </a>
                </li>
                <li>
                  <a href="https://t.me/nina_smirnova" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-light mb-4">Запись</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/booking" className="hover:text-emerald-400 transition-colors">
                    Записаться на занятие
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} Нина Смирнова. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

