import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { JsonTree } from '@/components/json-tree'
import { loadSecurityControlsSnapshot } from '@/lib/security-controls'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HomePageProps {
  searchParams: Promise<{ present?: string | string[] }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const securityControls = await loadSecurityControlsSnapshot()
  const presentationMode = params.present === 'security'

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-hidden">
        <h1 className="sr-only">JSON Tree and PlatPhorm Schema Registry</h1>
        <JsonTree
          initialSecurityControls={securityControls}
          presentationMode={presentationMode}
        />
      </main>
      <Footer />
    </div>
  )
}
