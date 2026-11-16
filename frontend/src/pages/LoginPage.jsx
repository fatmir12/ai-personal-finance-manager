
import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useAuth } from '../hooks/useAuth.js'

import '../styles/LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const registrationSuccess =
    location.state?.registrationSuccess === true

  const logoutWarning =
    location.state?.logoutWarning === true

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setError('')
    setLoading(true)

    try {
      await login(email.trim(), password)

      setPassword('')

      navigate('/dashboard', {
        replace: true,
      })
    } catch (err) {
      setError(
        err.message || 'Prijava nije uspjela.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <Card className="login-card">
        <CardHeader className="login-header">
          <div className="login-brand">
            AI Finance Manager
          </div>

          <CardTitle className="login-title">
            Prijava
          </CardTitle>

          <CardDescription className="login-description">
            Prijavite se kako biste upravljali svojim
            finansijama.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {registrationSuccess && (
            <div
              className="login-success"
              role="status"
            >
              Registracija je uspješna!

              <p>
                Sada se možete prijaviti svojim
                korisničkim podacima.
              </p>
            </div>
          )}

          {logoutWarning && (
            <p className="login-error" role="alert">
              Lokalno ste odjavljeni, ali server nije
              potvrdio opoziv refresh tokena.
            </p>
          )}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-field">
              <Label htmlFor="login-email">
                Email adresa
              </Label>

              <Input
                id="login-email"
                type="email"
                placeholder="Unesite email adresu"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={loading}
                required
              />
            </div>

            <div className="login-field">
              <Label htmlFor="login-password">
                Lozinka
              </Label>

              <Input
                id="login-password"
                type="password"
                placeholder="Unesite lozinku"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p
                className="login-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? 'Prijavljivanje...'
                : 'Prijavi se'}
            </Button>
          </form>

          <p className="login-footer">
            Nemate račun?{' '}
            <Link to="/register">
              Registrujte se
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default LoginPage
