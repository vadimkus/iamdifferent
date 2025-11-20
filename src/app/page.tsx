import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Главная',
  description: 'Добро пожаловать на сайт Нины Смирновой - профессионального фитнес и йога тренера во Владивостоке.',
  alternates: {
    canonical: 'https://iamdifferent.ru',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Navigation */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-10">
        <Link
          href="/smirnova"
          className="text-black text-base md:text-lg font-semibold hover:text-gray-600 transition-colors duration-200 cursor-pointer"
        >
          Главная
        </Link>
      </div>

      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-50 -mt-38"
          aria-label="Фон видео"
        >
          <source src="/video/Sand2.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Top Text */}
      <div className="absolute top-6 md:top-20 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <span className="text-sm md:text-lg text-black font-normal">
          Как жить по-другому?
        </span>
      </div>
    </main>
  )
}
