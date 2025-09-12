import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IAMDIFFERENT - Home',
  description: 'Creative Developer & Innovator',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <video 
        className="absolute inset-0 w-full h-full object-cover scale-75 md:scale-50 -mt-32 md:-mt-52"
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/video/Sand2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Button text overlay */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-8">
        <span className="text-black text-base md:text-lg font-normal">
          Как жить по-другому?
        </span>
      </div>
      
      {/* Text under video */}
      <div className="absolute bottom-20 md:bottom-60 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-4xl px-4 md:px-8">
        <p className="text-center text-sm md:text-lg lg:text-xl text-black leading-relaxed font-light">
          Это жизнь — создана для удовольствия и наслаждения! Каждый день — это шанс кайфовать по полной, ведь у вас всего одна жизнь. Погрузитесь в моменты счастья, будь то работа или хобби. Кайфуйте по полной!
        </p>
      </div>
    </main>
  )
}
