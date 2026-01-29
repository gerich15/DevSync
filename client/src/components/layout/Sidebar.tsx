import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-white/10 bg-surface/50">
      <nav className="flex flex-col gap-1 p-4">
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
