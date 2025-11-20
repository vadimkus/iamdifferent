export default function StructuredData() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://iamdifferent.ru/smirnova',
    name: 'Нина Смирнова - Фитнес и Йога Тренер',
    description: 'Профессиональный фитнес и йога тренер во Владивостоке. Индивидуальные занятия, групповые практики, онлайн-курсы по йоге.',
    image: 'https://iamdifferent.ru/smirnova/logo/logo3.png',
    url: 'https://iamdifferent.ru/smirnova',
    telephone: '+7 (999) 123-45-67',
    email: 'Healthy.smirnova@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Владивосток',
      addressCountry: 'RU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '43.1155',
      longitude: '131.8855',
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00',
      },
    ],
    sameAs: [
      'https://www.instagram.com/nina.smirnovaa/',
      'https://t.me/nina_smirnova',
    ],
    areaServed: {
      '@type': 'City',
      name: 'Владивосток',
    },
  }

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Нина Смирнова',
    jobTitle: 'Фитнес и Йога Тренер',
    description: 'Профессиональный инструктор по йоге и фитнесу с многолетним опытом работы во Владивостоке.',
    url: 'https://iamdifferent.ru/smirnova',
    image: 'https://iamdifferent.ru/smirnova/logo/logo3.png',
    email: 'Healthy.smirnova@gmail.com',
    telephone: '+7 (999) 123-45-67',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Владивосток',
      addressRegion: 'Приморский край',
      addressCountry: 'RU',
    },
    sameAs: [
      'https://www.instagram.com/nina.smirnovaa/',
      'https://t.me/nina_smirnova',
    ],
    knowsAbout: ['Йога', 'Фитнес', 'Виньяса', 'Хатха йога', 'Медитация'],
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Йога и Фитнес Тренировки',
    provider: {
      '@type': 'Person',
      name: 'Нина Смирнова',
    },
    areaServed: {
      '@type': 'City',
      name: 'Владивосток',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://iamdifferent.ru/booking',
      serviceType: 'Онлайн запись',
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      url: 'https://iamdifferent.ru/booking',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  )
}

