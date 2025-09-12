import personalData from '@/data/personal.json'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            {personalData.name}
          </h1>
          <p className="text-2xl text-gray-600 mb-4">
            {personalData.title}
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            {personalData.bio}
          </p>
          <div className="text-xl font-semibold text-blue-600 mb-12">
            {personalData.tagline}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          What Makes Me Different
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {personalData.highlights.map((highlight, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {highlight.title}
              </h3>
              <p className="text-gray-600">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Skills & Expertise
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {personalData.skills.map((skill, index) => (
            <span 
              key={index}
              className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-blue-600 transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Let's Connect
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Ready to work together? I'd love to hear from you.
          </p>
          <div className="flex justify-center space-x-6">
            <a 
              href={`mailto:${personalData.contact.email}`}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Get In Touch
            </a>
            <a 
              href={personalData.contact.github}
              className="bg-gray-800 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-900 transition-colors"
            >
              View My Work
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg">
            © 2024 {personalData.name}. All rights reserved.
          </p>
          <p className="text-gray-400 mt-2">
            Built with Next.js, React, and a lot of creativity.
          </p>
        </div>
      </footer>
    </main>
  )
}
