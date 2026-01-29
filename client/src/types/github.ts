export interface User {
  id: string
  github_id: number
  username: string
  email?: string
  avatar_url?: string
  last_synced_at?: string
  created_at: string
  updated_at: string
}

export interface UserStats {
  total_repos: number
  total_stars: number
  total_forks: number
  contributions: ContributionDay[]
  languages: LanguageStats[]
  top_repos: Repo[]
  daily_stats: DailyStats[]
  contribution_sum: number
}

export interface ContributionDay {
  date: string
  count: number
}

export interface LanguageStats {
  language: string
  bytes: number
  percent: number
}

export interface Repo {
  id?: string
  user_id?: string
  github_id: number
  name: string
  full_name: string
  description: string
  stars: number
  forks: number
  language: string
  is_private: boolean
}

export interface DailyStats {
  user_id: string
  date: string
  commits: number
  prs: number
  issues: number
  stars_received: number
}
