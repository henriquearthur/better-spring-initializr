import { useQuery } from '@tanstack/react-query'
import { getInitializrMetadata } from '@/server/functions/get-initializr-metadata'

export function useInitializrMetadata() {
  return useQuery({
    queryKey: ['initializr', 'metadata'],
    queryFn: () => getInitializrMetadata(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
