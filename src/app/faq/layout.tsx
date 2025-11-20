import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Частые вопросы о занятиях йогой',
  description: 'Ответы на наиболее часто задаваемые вопросы о занятиях йогой с Ниной Смирновой. Узнайте всё о занятиях, записи, необходимом оборудовании и многом другом.',
  keywords: [
    'вопросы о йоге',
    'FAQ йога',
    'как начать заниматься йогой',
    'йога для начинающих вопросы',
    'занятия йогой',
    'Нина Смирнова FAQ',
  ],
  openGraph: {
    title: 'Частые вопросы о занятиях йогой | Нина Смирнова',
    description: 'Ответы на наиболее часто задаваемые вопросы о занятиях йогой.',
    url: 'https://iamdifferent.ru/faq',
    siteName: 'Нина Смирнова - Йога Тренер',
    locale: 'ru_RU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://iamdifferent.ru/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

