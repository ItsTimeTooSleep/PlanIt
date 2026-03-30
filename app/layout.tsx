import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { StoreProvider } from '@/components/store-provider'
import { PlatformProvider } from '@/components/platform-provider'
import { NavBar } from '@/components/nav-bar'
import { TitleBar, DesktopManager } from '@/components/desktop'
import { PomodoroDialogProvider } from '@/lib/pomodoro-context'
import { PomodoroDialog } from '@/components/pomodoro/pomodoro-dialog'
import { DynamicTitle } from '@/components/dynamic-title'
import { DisableContextMenu } from '@/components/disable-context-menu'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlanIt',
  description: 'A personal time management web app for students. Plan your day, track completion, and review your time.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-light-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/icon-dark-32x32.svg', sizes: '32x32', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body className={`${geist.className} font-sans antialiased`}>
        <DisableContextMenu />
        <PlatformProvider>
          <StoreProvider>
            <PomodoroDialogProvider>
              <DynamicTitle />
              <TitleBar />
              <DesktopManager />
              <div className="flex flex-col h-screen pt-9">
                <NavBar />
                <main className="flex-1 overflow-hidden">
                  {children}
                </main>
              </div>
              <PomodoroDialog />
              <Toaster />
            </PomodoroDialogProvider>
          </StoreProvider>
        </PlatformProvider>
        <Analytics />
      </body>
    </html>
  )
}
