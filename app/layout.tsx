import type { Metadata } from 'next'
import { Noto_Sans_Khmer } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Layout from './components/Layout'

const notoSansKhmer = Noto_Sans_Khmer({ 
  subsets: ['khmer'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-khmer',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ជំនួយពលរដ្ឋកម្ពុជា - Khmer Aid',
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
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"
        />
      </head>
      <body className={`${notoSansKhmer.className} ${notoSansKhmer.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
