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
  title: 'IAMDIFFERENT - Creative Developer & Innovator',
  description: 'A unique personal website showcasing creativity, innovation, and cutting-edge development. Where creativity meets innovation.',
  keywords: ['developer', 'creative', 'innovation', 'react', 'nextjs', 'typescript', 'ui/ux'],
  authors: [{ name: 'IAMDIFFERENT' }],
  creator: 'IAMDIFFERENT',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://iamdifferent.com',
    title: 'IAMDIFFERENT - Creative Developer & Innovator',
    description: 'A unique personal website showcasing creativity, innovation, and cutting-edge development.',
    siteName: 'IAMDIFFERENT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IAMDIFFERENT - Creative Developer & Innovator',
    description: 'A unique personal website showcasing creativity, innovation, and cutting-edge development.',
    creator: '@iamdifferent',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
