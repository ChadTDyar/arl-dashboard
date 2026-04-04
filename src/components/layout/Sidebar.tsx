import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Send, MessageSquare, Target, Package, DollarSign, Settings } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/queue', icon: Send, label: 'Content Queue' },
  { to: '/engagement', icon: MessageSquare, label: 'Engagement' },
  { to: '/outreach', icon: Target, label: 'Outreach' },
  { to: '/portfolio', icon: Package, label: 'Portfolio' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/admin', icon: Settings, label: 'System Admin' },
]

export function Sidebar({ pendingCount }: { pendingCount: number }) {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-500" />
          ARL
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Autonomous Revenue Labs</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
            {to === '/' && pendingCount > 0 && (
              <span className="ml-auto text-[10px] bg-destructive text-white px-1.5 py-0.5 rounded-full font-medium">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">System active</span>
        </div>
      </div>
    </aside>
  )
}
