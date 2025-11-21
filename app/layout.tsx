import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '음성 AI 웹앱',
  description: '음성 인식 AI 웹 애플리케이션',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-black m-0 p-0">{children}</body>
    </html>
  )
}
