import React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'AutoPost VN - Tự động hóa đăng bài mạng xã hội',
  description: 'Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#1E40AF'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
