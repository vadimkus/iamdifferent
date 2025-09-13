import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IAMDIFFERENT - Home',
  description: 'Creative Developer & Innovator',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <video 
        className="absolute inset-0 w-full h-full object-cover scale-100 md:scale-50 -mt-38 md:-mt-52"
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/video/Sand2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      
    </main>
  )
}
