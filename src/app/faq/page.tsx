'use client'

import { useState, useEffect } from 'react'

export default function FAQ() {
  const [vladivostokColor, setVladivostokColor] = useState('text-gray-500')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setVladivostokColor('text-black')
      setTimeout(() => {
        setVladivostokColor('text-gray-500')
      }, 1000) // Change back after 1 second
    }, 9000) // Every 9 seconds

    return () => clearInterval(interval)
  }, [])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Нужен ли опыт для занятий йогой?",
      answer: "Нет, опыт не требуется! Наши занятия подходят для всех уровней подготовки, включая абсолютных новичков. Я адаптирую практику под ваши индивидуальные потребности и возможности."
    },
    {
      question: "Что нужно взять с собой на занятие?",
      answer: "Вам понадобится только коврик для йоги и удобная одежда, которая не стесняет движений. Вода и полотенце также могут быть полезны. Всё остальное предоставляется."
    },
    {
      question: "Как часто нужно заниматься йогой?",
      answer: "Рекомендую заниматься 2-3 раза в неделю для начала. Регулярность важнее интенсивности. Даже 15-20 минут ежедневной практики могут принести значительную пользу."
    },
    {
      question: "Подходит ли йога для людей с ограниченными возможностями?",
      answer: "Да, абсолютно! Йога может быть адаптирована для людей с любыми физическими особенностями. Я работаю с индивидуальными потребностями и создаю безопасные практики для каждого."
    },
    {
      question: "Можно ли заниматься йогой во время беременности?",
      answer: "Да, йога очень полезна во время беременности, но важно заниматься под руководством опытного инструктора. Я провожу специальные занятия для беременных с учётом всех особенностей этого периода."
    },
    {
      question: "Как долго длится одно занятие?",
      answer: "Стандартное занятие длится 60-90 минут. Также предлагаю короткие практики на 30-45 минут для тех, у кого ограничено время."
    },
    {
      question: "Нужна ли предварительная запись?",
      answer: "Да, рекомендую записываться заранее, чтобы я могла подготовить индивидуальный подход к занятию. Вы можете связаться со мной через Instagram, Email или Telegram."
    },
    {
      question: "Что делать, если я пропустил занятие?",
      answer: "Если вы пропустили занятие по уважительной причине, мы можем обсудить возможность переноса или компенсации. Свяжитесь со мной заранее, если знаете, что не сможете прийти."
    },
    {
      question: "Проводятся ли онлайн-занятия?",
      answer: "Да, я провожу как очные, так и онлайн-занятия. Онлайн-формат удобен для тех, кто не может посещать студию или предпочитает заниматься дома."
    },
    {
      question: "Сколько стоят занятия?",
      answer: "Стоимость зависит от формата занятий (индивидуальные, групповые, онлайн). Пожалуйста, свяжитесь со мной для получения актуальной информации о ценах и доступных пакетах."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
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
              <a href="/faq" className="text-emerald-600 font-light">
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
                  className="text-emerald-600 font-light px-2 py-1"
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
                  className="text-gray-700 hover:text-emerald-600 font-light transition-colors px-2 py-1"
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

      <main className="flex-1">
        {/* FAQ Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-12 sm:py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-800 mb-3 sm:mb-4 text-center">
              Частые вопросы
            </h1>
            <p className="text-base sm:text-lg text-gray-700 font-light text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
              Здесь вы найдёте ответы на наиболее часто задаваемые вопросы о занятиях йогой
            </p>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between hover:bg-emerald-50 transition-colors"
                  >
                    <span className="text-lg font-light text-gray-800 pr-4">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-emerald-600 flex-shrink-0 transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-50 border-t border-emerald-100">
                      <p className="text-sm sm:text-base text-gray-700 font-light leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 font-light mb-4">
                Не нашли ответ на свой вопрос?
              </p>
              <a
                href="/smirnova#contact"
                className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light"
              >
                Свяжитесь со мной
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 md:py-16">
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

