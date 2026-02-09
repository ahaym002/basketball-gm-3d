import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import PlayButton from './PlayButton'
import NotificationPanel from './NotificationPanel'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <PlayButton />
      <NotificationPanel />
    </div>
  )
}
