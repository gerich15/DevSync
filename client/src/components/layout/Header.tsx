import { useAuth, logout } from '../../hooks/useGitHubAuth'

export default function Header() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-surface/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-6">
        <h2 className="text-lg font-semibold text-white">DevSync</h2>
        <div className="flex items-center gap-4">
          {user?.avatar_url && (
            <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
          )}
          <span className="text-sm text-slate-300">{user?.username}</span>
          <button
            onClick={() => logout()}
            className="rounded-lg bg-white/10 py-1.5 px-3 text-sm text-white hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
