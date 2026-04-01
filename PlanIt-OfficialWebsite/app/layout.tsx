import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata: Metadata = {
  title: 'PlanIt - 规划时间，掌控生活',
  description: '高效任务管理工具，帮助学生和知识工作者更好地规划时间、保持专注、提升效率',
  icons: {
    icon: [
      {
        url: `${BASE_PATH}/icon-dark-32x32.svg`,
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${BASE_PATH}/icon-light-32x32.svg`,
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: `${BASE_PATH}/apple-icon.png`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
