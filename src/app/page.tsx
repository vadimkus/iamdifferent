export default function Home() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <video 
        className="absolute inset-0 w-full h-full object-cover scale-50 -mt-48"
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/video/sand2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Button text overlay */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-8">
        <a 
          href="/how-to-live-differently"
          className="text-black text-lg font-semibold hover:text-gray-600 transition-colors duration-200 cursor-pointer"
        >
          How to Live Differently
        </a>
      </div>
    </main>
  )
}
