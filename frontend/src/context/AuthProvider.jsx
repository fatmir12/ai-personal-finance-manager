
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AuthContext } from './auth-context.js'

import {
  loginUser,
  logoutUser,
  refreshSession,
} from '../services/authService.js'

function getTokenExpiration(token) {
  try {
    const payload = token.split('.')[1]

    if (!payload) {
      return null
    }

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const decoded = JSON.parse(atob(base64))

    if (typeof decoded.exp !== 'number') {
      return null
    }

    return decoded.exp * 1000
  } catch {
    return null
  }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  const sessionRef = useRef(null)
  const refreshPromiseRef = useRef(null)
  const sessionVersionRef = useRef(0)

  const updateSession = useCallback((newSession) => {
    sessionRef.current = newSession
    setSession(newSession)
  }, [])

  const clearSession = useCallback(() => {
    sessionVersionRef.current += 1
    updateSession(null)
  }, [updateSession])

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const version = sessionVersionRef.current

    const promise = refreshSession()
      .then((response) => {
        if (version === sessionVersionRef.current) {
          updateSession(response)
        }

        return response
      })
      .catch((error) => {
        if (version === sessionVersionRef.current) {
          clearSession()
        }

        throw error
      })

    refreshPromiseRef.current = promise

    try {
      return await promise
    } finally {
      if (refreshPromiseRef.current === promise) {
        refreshPromiseRef.current = null
      }
    }
  }, [clearSession, updateSession])

  // Obnavljanje sesije pri pokretanju aplikacije
  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        await refresh()
      } catch {
        // Nema važeće sesije ili server nije dostupan.
      } finally {
        if (active) {
          setReady(true)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [refresh])

  // Prijava korisnika
  const login = async (email, password) => {
    const version = ++sessionVersionRef.current

    const response = await loginUser(email, password)

    if (version === sessionVersionRef.current) {
      updateSession(response)
    }
  }

  // Odjava korisnika
  const logout = async () => {
    clearSession()

    if (refreshPromiseRef.current) {
      try {
        await refreshPromiseRef.current
      } catch {
        // Bez obzira na ishod nastavljamo odjavu.
      }
    }

    await logoutUser()
  }

  // Automatski refresh prije isteka JWT-a
  useEffect(() => {
    if (!session?.accessToken) {
      return
    }

    const expiration = getTokenExpiration(
      session.accessToken
    )

    if (!expiration) {
      return
    }

    const oneMinute = 60 * 1000

    const delay = Math.max(
      expiration - Date.now() - oneMinute,
      1000
    )

    const timeoutId = setTimeout(() => {
      refresh().catch(() => {
        // Neuspješan refresh uklanja lokalnu sesiju.
      })
    }, Math.min(delay, 2147483647))

    return () => {
      clearTimeout(timeoutId)
    }
  }, [session, refresh])

  const accessToken = session?.accessToken ?? null
  const isAuthenticated = Boolean(accessToken)

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p
          className="text-sm text-slate-600"
          role="status"
        >
          Provjera korisničke sesije...
        </p>
      </main>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
