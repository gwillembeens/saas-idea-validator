import { store } from '../store'
import { setUser, clearAuth } from '../store/slices/authSlice'

export async function fetchWithAuth(url, options = {}) {
  const { accessToken } = store.getState().auth

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (res.status === 401) {
    // Try to refresh
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!refreshRes.ok) {
      store.dispatch(clearAuth())
      return res
    }
    const data = await refreshRes.json()
    store.dispatch(setUser({ user: data.user, accessToken: data.accessToken }))

    // Retry original request with new token
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        Authorization: `Bearer ${data.accessToken}`,
      },
    })
  }

  return res
}
