'use client'

import { useState, useEffect } from 'react'

export default function Smirnova() {
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
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <img 
                src="/smirnova/logo/logo3.png" 
                alt="Нина Смирнова" 
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              <div>
                <h1 className="text-lg md:text-xl font-light text-gray-800">Нина Смирнова</h1>
                <p className={`text-xs font-light transition-colors duration-300 ${vladivostokColor}`}>Владивосток</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="/smirnova" className="text-emerald-600 font-light">
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
              <a href="/smirnova#contact" className="text-gray-700 hover:text-emerald-600 font-light transition-colors">
                Контакты
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button className="lg:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-20 md:py-32">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-gray-800 mb-6 leading-tight">
              Йога — это искусство пробуждения.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 font-light mb-4 leading-relaxed max-w-3xl mx-auto">
              Вернуться к настоящему себе. Это может быть так просто. Йога предлагает нам способ увидеть мир, который работает на вас, а не против вас.
            </p>
            <p className="text-lg md:text-xl text-gray-700 font-light mb-8 leading-relaxed max-w-3xl mx-auto">
              Йога напоминает мне, что всё взаимосвязано, поэтому мы должны жить, действовать и дышать осознанно. Процесс — это и есть награда.
            </p>
            <p className="text-xl md:text-2xl text-emerald-700 font-light italic">
              Наслаждайтесь!
            </p>
          </div>
        </section>

        {/* Subscribe Section */}
        <section className="bg-white py-12 md:py-16 border-y border-gray-200">
          <div className="max-w-2xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-4">
              Еженедельная рассылка
            </h2>
            <form className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Ваш email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light"
              >
                Подписаться
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              Мы уважаем вашу конфиденциальность.
            </p>
          </div>
        </section>

        {/* Community Theme Section */}
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-4">
              В этом месяце... Тема нашего сообщества — <span className="text-emerald-600 font-normal">РИТМ</span>
            </h2>
            <p className="text-lg text-gray-700 font-light max-w-2xl mx-auto">
              Присоединяйтесь к нашему сообществу, пока мы вместе исследуем ритм жизни, движения и дыхания.
            </p>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-6">
                  О Нине
                </h2>
                <p className="text-lg text-gray-700 font-light leading-relaxed mb-4">
                  Нина Смирнова — международный преподаватель йоги, посвятившая себя распространению преобразующей силы йоги среди студентов по всему миру. С миссией принести инструменты йоги в школы и дома, Нина создаёт доступные практики для людей всех возрастов, форм и размеров.
                </p>
                <p className="text-lg text-gray-700 font-light leading-relaxed mb-4">
                  Йога с Ниной предлагает высококачественные практики по йоге и осознанности, чтобы вдохновить на здоровье и внутренний покой по всему миру.
                </p>
                <a
                  href="#contact"
                  className="inline-block mt-6 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light"
                >
                  Узнать больше о Нине
                </a>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-8 md:p-12 flex items-center justify-center min-h-[300px]">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-12 text-center">
              Йога с Ниной
            </h2>
            <p className="text-lg text-gray-700 font-light text-center mb-12 max-w-3xl mx-auto">
              Откройте для себя широкий спектр инструментов, которые помогут вам быть аутентичными, любить себя и находить то, что приносит радость.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {['Основы йоги', 'Виньяса флоу', 'Йога для начинающих', 'Утренняя йога', 'Вечерняя релаксация', 'Йога для гибкости'].map((course, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-light text-gray-800 mb-3">{course}</h3>
                  <p className="text-gray-600 font-light text-sm mb-4">
                    Исследуйте эту практику и откройте для себя то, что работает для вашего тела и разума.
                  </p>
                  <a href="#contact" className="text-emerald-600 hover:text-emerald-700 font-light text-sm">
                    Узнать больше →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Find What Feels Good Section */}
        <section className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              Найди то, что приносит радость
            </h2>
            <p className="text-lg md:text-xl font-light mb-8 leading-relaxed opacity-95">
              Найдите творческие и экспериментальные возможности для изучения и исследования тела и того, что значит быть здоровым. Эти занятия и мастер-классы ведёт Нина, они разработаны, чтобы помочь вам соединиться с вашим подлинным «я».
            </p>
            <p className="text-lg md:text-xl font-light mb-10 leading-relaxed opacity-95">
              Исследуйте ежедневные практики, мастер-классы, углублённое обучение и возможность присоединиться к уникальному глобальному сообществу. Это ваш универсальный магазин для йоги, творчества, здоровья и всего, что приносит радость.
            </p>
            <a
              href="#contact"
              className="inline-block px-8 py-4 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 transition-colors font-light text-lg"
            >
              Присоединиться сегодня
            </a>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-12 text-center">
              Свяжитесь со мной
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Instagram Card */}
              <a
                href="https://www.instagram.com/nina.smirnovaa/"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 border border-emerald-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-light text-gray-800">Instagram</h3>
                </div>
                <p className="text-emerald-700 font-light">@nina.smirnovaa</p>
                <p className="text-gray-600 font-light text-sm mt-2">Следите за моим путём</p>
              </a>

              {/* Email Card */}
              <a
                href="mailto:Healthy.smirnova@gmail.com"
                className="group bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 border border-teal-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-light text-gray-800">Email</h3>
                </div>
                <p className="text-teal-700 font-light break-all">Healthy.smirnova@gmail.com</p>
                <p className="text-gray-600 font-light text-sm mt-2">Отправить сообщение</p>
              </a>

              {/* Telegram Card */}
              <a
                href="https://t.me/nina_smirnova"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 border border-blue-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-light text-gray-800">Telegram</h3>
                </div>
                <p className="text-blue-700 font-light">@nina_smirnova</p>
                <p className="text-gray-600 font-light text-sm mt-2">Написать в Telegram</p>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-light mb-4">О нас</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-emerald-400 transition-colors">О Нине</a></li>
                <li><a href="/faq" className="hover:text-emerald-400 transition-colors">Частые вопросы</a></li>
                <li><a href="#contact" className="hover:text-emerald-400 transition-colors">Контакты</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-light mb-4">Курсы</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#courses" className="hover:text-emerald-400 transition-colors">Все курсы</a></li>
                <li><a href="/videos" className="hover:text-emerald-400 transition-colors">Бесплатные видео</a></li>
                <li><a href="#courses" className="hover:text-emerald-400 transition-colors">Мастер-классы</a></li>
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