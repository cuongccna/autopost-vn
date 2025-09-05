import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { SessionProvider } from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'AutoPost VN - Tự động hóa đăng bài mạng xã hội',
  description: 'Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam',
  manifest: '/manifest.webmanifest',
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
        <meta name="theme-color" content="#1E40AF" />
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
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
