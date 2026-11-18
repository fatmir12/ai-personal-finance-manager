
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'

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

import { registerUser } from '../services/authService.js'

import '../styles/RegisterPage.css'

function RegisterPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setError('')

    if (formData.password.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera.')
      return
    }

    setLoading(true)

    try {
      await registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess: true,
        },
      })
    } catch (err) {
      setError(
        err.message || 'Registracija nije uspjela.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-panel">
        <Card className="register-card">
          <CardHeader className="register-header">
            <CardTitle className="register-title">Kreirajte svoj profil</CardTitle>
            <CardDescription className="register-description">
              Potrebno je samo nekoliko osnovnih podataka.
            </CardDescription>
          </CardHeader>

          <CardContent>
          <form
            className="register-form"
            onSubmit={handleSubmit}
          >
            <div className="register-name-row">
              <div className="register-field">
                <Label htmlFor="register-firstname">
                  Ime
                </Label>

                <Input
                  id="register-firstname"
                  name="firstName"
                  type="text"
                  placeholder="Unesite ime"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="register-field">
                <Label htmlFor="register-lastname">
                  Prezime
                </Label>

                <Input
                  id="register-lastname"
                  name="lastName"
                  type="text"
                  placeholder="Unesite prezime"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <Label htmlFor="register-email">
                Email adresa
              </Label>

              <Input
                id="register-email"
                name="email"
                type="email"
                placeholder="Unesite email adresu"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="register-field">
              <Label htmlFor="register-password">
                Lozinka
              </Label>

              <Input
                id="register-password"
                name="password"
                type="password"
                placeholder="Kreirajte lozinku"
                autoComplete="new-password"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />

              <p className="register-hint">
                Lozinka mora imati najmanje 8 karaktera.
              </p>
            </div>

            {error && (
              <p className="register-error" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading
                ? 'Registracija u toku...'
                : 'Kreiraj račun'}
              {!loading && <ArrowRight aria-hidden="true" size={17} />}
            </Button>
          </form>

          <p className="register-footer">
            Već imate račun?{' '}
            <Link to="/login">
              Prijavite se
            </Link>
          </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export default RegisterPage
