import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Бесплатные видео по йоге',
  description: 'Бесплатные видео-практики по йоге для всех уровней подготовки. Йога для начинающих, утренняя практика, вечерняя релаксация, виньяса флоу и многое другое.',
  keywords: [
    'бесплатные видео йога',
    'йога онлайн',
    'йога для начинающих видео',
    'утренняя йога',
    'вечерняя йога',
    'виньяса флоу',
    'йога практика',
    'Нина Смирнова видео',
  ],
  openGraph: {
    title: 'Бесплатные видео по йоге | Нина Смирнова',
    description: 'Бесплатные видео-практики по йоге для всех уровней подготовки.',
    url: 'https://iamdifferent.ru/videos',
    siteName: 'Нина Смирнова - Йога Тренер',
    locale: 'ru_RU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://iamdifferent.ru/videos',
  },
}

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

