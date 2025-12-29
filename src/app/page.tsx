'use client'

import { useState } from 'react'

const translations = {
  en: {
    intro: "Here is the famous formula Albert Einstein gave when asked about the secret to success:",
    variables: "The Variables:",
    varA: "is Success.",
    varX: "is Work.",
    varY: "is Play.",
    varZ: "is Keeping your mouth shut.",
    why: "Why it matters:",
    explanation: "Einstein believed that hard work (X) and leisure/curiosity (Y) were vital, but he added Z to emphasize humility and focus—listening more than you speak.",
  },
  ru: {
    intro: "Вот знаменитая формула Альберта Эйнштейна на вопрос о секрете успеха:",
    variables: "Переменные:",
    varA: "— это Успех.",
    varX: "— это Работа.",
    varY: "— это Отдых.",
    varZ: "— это Умение молчать.",
    why: "Почему это важно:",
    explanation: "Эйнштейн считал, что упорный труд (X) и отдых/любопытство (Y) жизненно важны, но он добавил Z, чтобы подчеркнуть скромность и сосредоточенность — слушать больше, чем говорить.",
  },
  ar: {
    intro: "هذه هي الصيغة الشهيرة التي قدمها ألبرت أينشتاين عندما سُئل عن سر النجاح:",
    variables: "المتغيرات:",
    varA: "هو النجاح.",
    varX: "هو العمل.",
    varY: "هو اللعب.",
    varZ: "هو إبقاء فمك مغلقًا.",
    why: "لماذا هذا مهم:",
    explanation: "اعتقد أينشتاين أن العمل الجاد (X) والترفيه/الفضول (Y) كانا حيويين، لكنه أضاف Z للتأكيد على التواضع والتركيز—الاستماع أكثر من التحدث.",
  },
}

export default function Home() {
  const [lang, setLang] = useState<'en' | 'ru' | 'ar'>('en')
  const [isOpen, setIsOpen] = useState(false)
  const t = translations[lang]

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
          aria-label="Фон видео"
        >
          <source src="/video/Sand2.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Einstein Quote Section */}
      <div className="absolute bottom-4 sm:bottom-8 md:bottom-16 left-0 right-0 z-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-lg relative">
          {/* Language Selector */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {lang.toUpperCase()}
              </button>
              
              {isOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-30 min-w-[50px]">
                  <button
                    onClick={() => { setLang('en'); setIsOpen(false) }}
                    className="block w-full px-3 py-1.5 text-xs sm:text-sm text-left hover:bg-gray-100 text-black"
                  >
                    EN
                  </button>
                  <button
                    onClick={() => { setLang('ru'); setIsOpen(false) }}
                    className="block w-full px-3 py-1.5 text-xs sm:text-sm text-left hover:bg-gray-100 text-black"
                  >
                    RU
                  </button>
                  <button
                    onClick={() => { setLang('ar'); setIsOpen(false) }}
                    className="block w-full px-3 py-1.5 text-xs sm:text-sm text-left hover:bg-gray-100 text-black"
                  >
                    AR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content with padding to avoid overlap */}
          <div className="pr-12 sm:pr-16">
            <p className={`text-black text-xs sm:text-sm md:text-base leading-relaxed mb-3 sm:mb-4 ${lang === 'ar' ? 'text-right' : 'text-center'}`}>
              {t.intro}
            </p>
          </div>
          
          <div className="text-black text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4">
            A = X + Y + Z
          </div>

          <div className={`text-black text-xs sm:text-sm md:text-base space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="font-semibold">{t.variables}</p>
            <p><span className="font-medium">A</span> {t.varA}</p>
            <p><span className="font-medium">X</span> {t.varX}</p>
            <p><span className="font-medium">Y</span> {t.varY}</p>
            <p><span className="font-medium">Z</span> {t.varZ}</p>
          </div>

          <div className={`text-black text-xs sm:text-sm md:text-base ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="font-semibold mb-1.5 sm:mb-2">{t.why}</p>
            <p className="leading-relaxed">
              {t.explanation}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
