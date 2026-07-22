import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { JsonTree } from '@/components/json-tree'
import { loadSecurityControlsSnapshot } from '@/lib/security-controls'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const securityControls = await loadSecurityControlsSnapshot()

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-hidden">
        <JsonTree initialSecurityControls={securityControls} />
      </main>
      <Footer />
    </div>
  )
}
