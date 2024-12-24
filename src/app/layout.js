import './globals.css'
import { Inter } from 'next/font/google'
import ChatWidget from '@/components/chat/ChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'YR Music',
  description: 'Platform pembelian tiket event musik',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <ChatWidget />
      </body>
    </html>
  )
}
