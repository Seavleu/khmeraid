import type { Metadata } from 'next'
import { Noto_Sans_Khmer } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import GoogleMapsLoader from './components/GoogleMapsLoader'

const notoSansKhmer = Noto_Sans_Khmer({ 
  subsets: ['khmer'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-khmer',
  display: 'swap',
})

export const metadata: Metadata = {
  description: 'Community aid platform for Cambodia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="km">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"
          suppressHydrationWarning
        />
      </head>
      <body className={`${notoSansKhmer.className} ${notoSansKhmer.variable}`}>
        <GoogleMapsLoader />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
