'use client'

import { useState, useEffect } from 'react'

export default function Videos() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [vladivostokColor, setVladivostokColor] = useState('text-gray-500')

  useEffect(() => {
    const interval = setInterval(() => {
      setVladivostokColor('text-black')
      setTimeout(() => {
        setVladivostokColor('text-gray-500')
      }, 1000) // Change back after 1 second
    }, 9000) // Every 9 seconds

    return () => clearInterval(interval)
  }, [])
  const videoCategories = [
    {
      title: 'Йога для начинающих',
      description: 'Простые и доступные практики для тех, кто только начинает свой путь в йоге',
      videos: [
        { title: 'Основы йоги для новичков', duration: '15 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Первые асаны', duration: '20 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Дыхание и расслабление', duration: '10 мин', thumbnail: '/smirnova/pics/meditation.png' },
      ]
    },
    {
      title: 'Утренняя практика',
      description: 'Энергичные утренние занятия для пробуждения тела и разума',
      videos: [
        { title: 'Утренний поток', duration: '25 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Пробуждение с йогой', duration: '20 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Энергия нового дня', duration: '30 мин', thumbnail: '/smirnova/pics/meditation.png' },
      ]
    },
    {
      title: 'Вечерняя релаксация',
      description: 'Спокойные практики для расслабления после долгого дня',
      videos: [
        { title: 'Йога перед сном', duration: '20 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Растяжка и расслабление', duration: '15 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Медитация и покой', duration: '10 мин', thumbnail: '/smirnova/pics/meditation.png' },
      ]
    },
    {
      title: 'Виньяса флоу',
      description: 'Динамичные последовательности для развития силы и гибкости',
      videos: [
        { title: 'Виньяса для всех уровней', duration: '30 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Силовой поток', duration: '35 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Гибкость и баланс', duration: '25 мин', thumbnail: '/smirnova/pics/meditation.png' },
      ]
    },
    {
      title: 'Йога для гибкости',
      description: 'Специальные практики для улучшения гибкости и подвижности',
      videos: [
        { title: 'Растяжка всего тела', duration: '20 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Глубокая растяжка', duration: '25 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Гибкость спины', duration: '15 мин', thumbnail: '/smirnova/pics/meditation.png' },
      ]
    },
    {
      title: 'Короткие практики',
      description: 'Быстрые занятия для тех, у кого мало времени',
      videos: [
        { title: 'Йога за 10 минут', duration: '10 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Быстрая разминка', duration: '5 мин', thumbnail: '/smirnova/pics/meditation.png' },
        { title: 'Мини-практика', duration: '15 мин', thumbnail: '/smirnova/pics/meditation.png' },
      ]
    }
  ]

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
                <p className={`text-xs font-light transition-colors duration-300 ${vladivostokColor}`}>Фитнес и Йога Тренер</p>
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
              <a href="/videos" className="text-emerald-600 font-light">
                Бесплатные видео
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
                  className="text-emerald-600 font-light px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Бесплатные видео
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-12 md:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-800 mb-3 md:mb-4">
              Бесплатные видео
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-light max-w-3xl mx-auto px-2">
              Исследуйте коллекцию бесплатных видео-практик по йоге для всех уровней подготовки
            </p>
          </div>
        </section>

        {/* Videos Section */}
        <section className="bg-white py-12 md:py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="space-y-12 md:space-y-16">
              {videoCategories.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-800 mb-2 md:mb-3">
                      {category.title}
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 font-light">
                      {category.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {category.videos.map((video, videoIndex) => (
                      <div
                        key={videoIndex}
                        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 cursor-pointer"
                      >
                        <div className="relative aspect-video bg-gradient-to-br from-emerald-100 to-teal-100">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 flex items-center justify-center">
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <div className="p-4 sm:p-5">
                          <h3 className="text-base sm:text-lg font-light text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 font-light">
                            {category.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white py-12 md:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 md:mb-6">
              Хотите больше практик?
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-light mb-6 md:mb-8 leading-relaxed opacity-95 px-2">
              Присоединяйтесь к нашему сообществу и получите доступ к расширенной библиотеке видео, 
              индивидуальным занятиям и эксклюзивным мастер-классам.
            </p>
            <a
              href="/smirnova#contact"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 transition-colors font-light text-base sm:text-lg"
            >
              Связаться со мной
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
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

