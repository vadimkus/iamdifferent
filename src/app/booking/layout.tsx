import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Запись на занятие йогой',
  description: 'Запишитесь на индивидуальное или групповое занятие йогой с Ниной Смирновой во Владивостоке. Выберите удобную дату и время онлайн.',
  keywords: [
    'запись на йогу',
    'записаться на занятие йогой',
    'йога Владивосток запись',
    'индивидуальные занятия йогой',
    'онлайн запись йога',
    'Нина Смирнова запись',
  ],
  openGraph: {
    title: 'Запись на занятие йогой | Нина Смирнова',
    description: 'Запишитесь на занятие йогой онлайн. Выберите удобную дату и время.',
    url: 'https://iamdifferent.ru/booking',
    siteName: 'Нина Смирнова - Йога Тренер',
    locale: 'ru_RU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://iamdifferent.ru/booking',
  },
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

