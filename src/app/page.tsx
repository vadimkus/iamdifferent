export default function Home() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Temporary: Remove video to test if it's causing the issue */}
      <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">IAMDIFFERENT</h1>
          <p className="text-lg text-gray-600">Testing deployment</p>
        </div>
      </div>
      
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
