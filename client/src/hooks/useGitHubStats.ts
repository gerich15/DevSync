import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { UserStats } from '../types/github'

export type StatsPeriod = 'week' | 'month' | 'year'

export function useGitHubStats(period: StatsPeriod = 'year') {
  return useQuery({
    queryKey: ['user-stats', period],
    queryFn: async () => {
      const { data } = await api.get<UserStats>('/user/stats', { params: { period } })
      return data
    },
  })
}
