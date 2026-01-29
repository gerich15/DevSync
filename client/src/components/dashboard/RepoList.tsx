import { motion } from 'framer-motion'
import type { Repo } from '../../types/github'

export default function RepoList({ repos = [] }: { repos?: Repo[] }) {
  const list = Array.isArray(repos) ? repos : []
  return (
    <ul className="space-y-2">
      {list.map((repo, i) => (
        <motion.li
          key={repo.github_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3 hover:bg-white/10"
        >
          <div className="min-w-0 flex-1">
            <a
              href={`https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:underline"
            >
              {repo.name}
            </a>
            {repo.description && (
              <p className="truncate text-sm text-slate-400">{repo.description}</p>
            )}
          </div>
          <div className="ml-4 flex shrink-0 gap-4 text-sm text-slate-400">
            {repo.language && <span>{repo.language}</span>}
            <span title="Stars">&#9733; {repo.stars}</span>
            <span title="Forks">&#9492; {repo.forks}</span>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}
