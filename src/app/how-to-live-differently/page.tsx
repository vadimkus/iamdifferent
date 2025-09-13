export default function HowToLiveDifferently() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation back to home */}
      <div className="absolute top-6 md:top-8 left-1/2 transform -translate-x-1/2 z-10">
        <a 
          href="/"
          className="text-black text-sm md:text-lg font-semibold hover:text-gray-600 transition-colors duration-200 cursor-pointer"
        >
          Home
        </a>
      </div>
      
      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center px-3 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm md:text-2xl lg:text-3xl text-black leading-tight md:leading-relaxed font-light">
            Page cleared
          </p>
        </div>
      </div>
    </main>
  )
}
