import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://iamdifferent.ru'),
  title: {
    default: 'Нина Смирнова - Фитнес и Йога Тренер | Владивосток',
    template: '%s | Нина Смирнова - Йога Тренер',
  },
  description: 'Нина Смирнова - профессиональный фитнес и йога тренер во Владивостоке. Индивидуальные занятия, групповые практики, онлайн-курсы. Запишитесь на занятие прямо сейчас!',
  keywords: [
    'йога тренер',
    'фитнес тренер',
    'йога Владивосток',
    'йога занятия',
    'йога для начинающих',
    'виньяса йога',
    'онлайн йога',
    'индивидуальные занятия йогой',
    'Нина Смирнова',
    'yoga instructor',
    'fitness trainer',
    'Vladivostok yoga',
  ],
  authors: [{ name: 'Нина Смирнова', url: 'https://iamdifferent.ru/smirnova' }],
  creator: 'Нина Смирнова',
  publisher: 'Нина Смирнова',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://iamdifferent.ru',
    siteName: 'Нина Смирнова - Йога Тренер',
    title: 'Нина Смирнова - Фитнес и Йога Тренер | Владивосток',
    description: 'Профессиональный фитнес и йога тренер во Владивостоке. Индивидуальные занятия, групповые практики, онлайн-курсы.',
    images: [
      {
        url: '/smirnova/logo/logo3.png',
        width: 1200,
        height: 630,
        alt: 'Нина Смирнова - Йога Тренер',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Нина Смирнова - Фитнес и Йога Тренер',
    description: 'Профессиональный фитнес и йога тренер во Владивостоке. Запишитесь на занятие!',
    images: ['/smirnova/logo/logo3.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://iamdifferent.ru',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
