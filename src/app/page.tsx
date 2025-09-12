export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-4">IAMDIFFERENT</h1>
        <p className="text-xl text-gray-600 mb-8">Creative Developer & Innovator</p>
        <a 
          href="/how-to-live-differently"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          How to Live Differently
        </a>
      </div>
    </div>
  )
}
