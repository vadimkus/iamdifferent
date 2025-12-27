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
    default: 'IAMDIFFERENT.RU',
    template: '%s | IAMDIFFERENT.RU',
  },
  description: 'IAMDIFFERENT.RU - Discover wisdom and inspiration. Einstein\'s success formula and more.',
  keywords: [
    'wisdom',
    'inspiration',
    'Einstein',
    'success formula',
    'personal development',
    'life philosophy',
    'iamdifferent',
  ],
  authors: [{ name: 'IAMDIFFERENT.RU', url: 'https://iamdifferent.ru' }],
  creator: 'IAMDIFFERENT.RU',
  publisher: 'IAMDIFFERENT.RU',
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
    locale: 'en_US',
    url: 'https://iamdifferent.ru',
    siteName: 'IAMDIFFERENT.RU',
    title: 'IAMDIFFERENT.RU',
    description: 'Discover wisdom and inspiration. Einstein\'s success formula and more.',
    images: [
      {
        url: '/smirnova/logo/logo3.png',
        width: 1200,
        height: 630,
        alt: 'IAMDIFFERENT.RU',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IAMDIFFERENT.RU',
    description: 'Discover wisdom and inspiration. Einstein\'s success formula and more.',
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
