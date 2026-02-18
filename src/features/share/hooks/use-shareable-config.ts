import {
  decodeShareConfig,
  encodeShareConfig,
  type ShareConfigSnapshot,
} from '@/features/share/model/share-config'

const SHARE_TOKEN_PARAM = 'share'

export type UseShareableConfigResult = {
  restoredSnapshot: ShareConfigSnapshot | null
  hasShareToken: boolean
  createShareUrl: (snapshot: ShareConfigSnapshot) => string
  clearShareTokenFromUrl: () => void
}

export function useShareableConfig(): UseShareableConfigResult {
  const restoredSnapshot = (() => {
    if (typeof window === 'undefined') {
      return null
    }

    const url = new URL(window.location.href)
    const shareToken = url.searchParams.get(SHARE_TOKEN_PARAM)

    if (!shareToken) {
      return null
    }

    return decodeShareConfig(shareToken)
  })()

  const hasShareToken = (() => {
    if (typeof window === 'undefined') {
      return false
    }

    return new URL(window.location.href).searchParams.has(SHARE_TOKEN_PARAM)
  })()

  const createShareUrl = (snapshot: ShareConfigSnapshot): string => {
    if (typeof window === 'undefined') {
      return ''
    }

    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set(SHARE_TOKEN_PARAM, encodeShareConfig(snapshot))

    return url.toString()
  }

  const clearShareTokenFromUrl = () => {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)

    if (!url.searchParams.has(SHARE_TOKEN_PARAM)) {
      return
    }

    url.searchParams.delete(SHARE_TOKEN_PARAM)
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return {
    restoredSnapshot,
    hasShareToken,
    createShareUrl,
    clearShareTokenFromUrl,
  }
}
