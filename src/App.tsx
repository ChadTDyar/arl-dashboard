import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { CommandCenter } from '@/pages/CommandCenter'
import { ContentQueue } from '@/pages/ContentQueue'
import { EngagementFeed } from '@/pages/EngagementFeed'
import { OutreachHub } from '@/pages/OutreachHub'
import { PortfolioHealth } from '@/pages/PortfolioHealth'
import { Revenue } from '@/pages/Revenue'
import { SystemAdmin } from '@/pages/SystemAdmin'
import { useOverview } from '@/lib/queries'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

function Layout() {
  const { data: overview } = useOverview()
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar pendingCount={overview?.pending_approval || 0} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/queue" element={<ContentQueue />} />
          <Route path="/engagement" element={<EngagementFeed />} />
          <Route path="/outreach" element={<OutreachHub />} />
          <Route path="/portfolio" element={<PortfolioHealth />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/admin" element={<SystemAdmin />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
