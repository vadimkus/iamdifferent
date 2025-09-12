export default function HowToLiveDifferently() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation back to home */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-10">
        <a 
          href="/"
          className="text-black text-base md:text-lg font-semibold hover:text-gray-600 transition-colors duration-200 cursor-pointer"
        >
          Home
        </a>
      </div>
      
      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg md:text-2xl lg:text-3xl text-black leading-relaxed font-light">
            Это жизнь — создана для удовольствия и наслаждения! Каждый день — это шанс кайфовать по полной, ведь у вас всего одна жизнь. Погрузитесь в моменты счастья, будь то работа или хобби. Кайфуйте по полной!
          </p>
        </div>
      </div>
    </main>
  )
}
