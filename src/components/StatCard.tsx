interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export function StatCard({ label, value, sub, color = 'text-blue-400' }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  )
}
