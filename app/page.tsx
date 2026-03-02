import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { JsonTree } from '@/components/json-tree'

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-hidden">
        <JsonTree />
      </main>
      <Footer />
    </div>
  )
}
