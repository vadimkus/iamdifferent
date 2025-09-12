export default function HowToLiveDifferently() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation back to home */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <a 
          href="/"
          className="text-black text-lg font-semibold hover:text-gray-600 transition-colors duration-200 cursor-pointer"
        >
          Home
        </a>
      </div>
      
      {/* Page content */}
      <div className="pt-36 px-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Main Title */}
          <div className="text-center">
            <h1 className="text-5xl font-bold text-black mb-4">
              Life Strategy: Invest in bitcoin
            </h1>
          </div>

          {/* Introduction */}
          <div className="text-lg text-gray-700 leading-relaxed">
            <p className="mb-6">
              Bitcoin (BTC) stands as the rarest asset on Earth, capped at just 21 million coins—a digital gold with unmatched scarcity. Adopting a disciplined life strategy can turn this rarity into your wealth-building cornerstone.
            </p>
          </div>

          {/* The Strategy Section */}
          <div>
            <h3 className="text-3xl font-bold text-black mb-6">The Strategy</h3>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold text-black mb-3">1. Start Early</h4>
                <p className="text-gray-700">
                  Begin at age 18, working regular hours in a stable job to build a steady income.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold text-black mb-3">2. Invest Consistently</h4>
                <p className="text-gray-700">
                  Channel every spare dollar into BTC, leveraging its limited supply to grow your portfolio over time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold text-black mb-3">3. Hold Long-Term</h4>
                <p className="text-gray-700">
                  Commit to holding as long as possible, riding out volatility to maximize returns as adoption and value soar.
                </p>
              </div>
            </div>
          </div>


          {/* Call to Action */}
          <div className="text-center bg-orange-50 p-8 rounded-lg border-2 border-orange-200">
            <h3 className="text-2xl font-bold text-black mb-4">Take Action Today</h3>
            <p className="text-lg text-gray-700">
              Start your journey now—every BTC you acquire today is a step toward financial independence. Work hard, invest smart, and hold strong.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
