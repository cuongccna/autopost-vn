import React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autopostvn.cloud';

export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: 'AutoPost VN - Tự động hóa đăng bài mạng xã hội',
    template: '%s | AutoPost VN'
  },
  description: 'Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam. Lên lịch đăng bài Facebook, Instagram, Zalo tự động với AI hỗ trợ viết nội dung.',
  keywords: [
    'autopost',
    'tự động đăng bài',
    'đăng bài mạng xã hội',
    'lên lịch đăng bài',
    'facebook marketing',
    'instagram marketing',
    'social media automation',
    'quản lý mạng xã hội',
    'marketing automation vietnam'
  ],
  authors: [{ name: 'AutoPost VN Team' }],
  creator: 'AutoPost VN',
  publisher: 'AutoPost VN',
  
  // Favicon & Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  
  // PWA Manifest
  manifest: '/manifest.webmanifest',
  
  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: siteUrl,
    siteName: 'AutoPost VN',
    title: 'AutoPost VN - Tự động hóa đăng bài mạng xã hội',
    description: 'Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam. Lên lịch đăng bài Facebook, Instagram, Zalo tự động.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'AutoPost VN - Tự động hóa đăng bài mạng xã hội',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'AutoPost VN - Tự động hóa đăng bài mạng xã hội',
    description: 'Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@autopostvn',
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification (thêm sau khi có mã xác minh)
  // verification: {
  //   google: 'your-google-verification-code',
  //   yandex: 'your-yandex-verification-code',
  // },
  
  // Canonical URL
  alternates: {
    canonical: siteUrl,
  },
  
  // Category
  category: 'technology',
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
              // Service Worker
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
