import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Нина Смирнова - Фитнес и Йога Тренер | Владивосток',
  description: 'Профессиональный фитнес и йога тренер во Владивостоке. Индивидуальные занятия, групповые практики, онлайн-курсы по йоге. Запишитесь на занятие прямо сейчас!',
  keywords: [
    'йога тренер Владивосток',
    'фитнес тренер Владивосток',
    'йога занятия',
    'йога для начинающих',
    'виньяса йога',
    'онлайн йога',
    'индивидуальные занятия йогой',
    'Нина Смирнова',
    'йога Владивосток',
  ],
  openGraph: {
    title: 'Нина Смирнова - Фитнес и Йога Тренер | Владивосток',
    description: 'Профессиональный фитнес и йога тренер во Владивостоке. Индивидуальные занятия, групповые практики, онлайн-курсы.',
    url: 'https://iamdifferent.ru/smirnova',
    siteName: 'Нина Смирнова - Йога Тренер',
    images: [
      {
        url: '/smirnova/logo/logo3.png',
        width: 1200,
        height: 630,
        alt: 'Нина Смирнова - Йога Тренер',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Нина Смирнова - Фитнес и Йога Тренер',
    description: 'Профессиональный фитнес и йога тренер во Владивостоке. Запишитесь на занятие!',
    images: ['/smirnova/logo/logo3.png'],
  },
  alternates: {
    canonical: 'https://iamdifferent.ru/smirnova',
  },
}

export default function SmirnovaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

