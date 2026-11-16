
import { useState } from 'react'

import { AuthContext } from './auth-context.js'
import {
  loginUser,
  logoutUser,
} from '../services/authService.js'

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)

  const login = async (email, password) => {
    const response = await loginUser(email, password)

    setAccessToken(response.accessToken)
    setRefreshToken(response.refreshToken)
  }

  const logout = async () => {
    try {
      await logoutUser(refreshToken)
    } finally {
      setAccessToken(null)
      setRefreshToken(null)
    }
  }

  const isAuthenticated = Boolean(accessToken)

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
