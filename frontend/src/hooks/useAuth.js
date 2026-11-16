
import { useContext } from 'react'
import { AuthContext } from '../context/auth-context.js'

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error(
      'useAuth mora biti korišten unutar AuthProvider komponente.'
    )
  }

  return context
}
