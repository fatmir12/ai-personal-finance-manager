import { useEffect, useState } from 'react'
import {
  CalendarDays,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import AppShell from '@/components/layout/AppShell.jsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth.js'
import {
  changePassword,
  getProfile,
} from '@/services/authService.js'

import '../styles/ProfilePage.css'

function formatCreatedAt(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const monthNames = [
    'januar',
    'februar',
    'mart',
    'april',
    'maj',
    'juni',
    'juli',
    'august',
    'septembar',
    'oktobar',
    'novembar',
    'decembar',
  ]

  return `${String(date.getDate()).padStart(2, '0')}. ${monthNames[date.getMonth()]} ${date.getFullYear()}.`
}

function ProfilePage() {
  const { accessToken } = useAuth()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    let active = true

    getProfile(accessToken)
      .then((result) => {
        if (active) {
          setProfile(result)
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            error.message || 'Profil nije moguće učitati.'
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [accessToken])

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setActionError('')
    setNotice('')

    if (passwordData.newPassword.length < 8) {
      setActionError(
        'Nova lozinka mora imati najmanje 8 karaktera.'
      )
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setActionError('Nove lozinke se ne podudaraju.')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setActionError(
        'Nova lozinka mora biti različita od trenutne lozinke.'
      )
      return
    }

    setIsSaving(true)

    try {
      const result = await changePassword(accessToken, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setNotice(
        result.message || 'Lozinka je uspješno promijenjena.'
      )
    } catch (error) {
      setActionError(
        error.message || 'Lozinku nije moguće promijeniti.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : ''
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : ''

  return (
    <AppShell>
      <div className="finance-page profile-page">
        <header className="finance-page-header">
          <div>
            <p className="finance-eyebrow">VAŠ PROSTOR / KORISNIČKI RAČUN</p>
            <h1>Moj profil</h1>
            <p className="finance-page-description">
              Pregledajte podatke o računu i zaštitite svoju lozinku.
            </p>
          </div>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">
              U redu
            </button>
          </div>
        )}

        {loadError ? (
          <div className="finance-error" role="alert">
            <ShieldCheck aria-hidden="true" size={20} />
            <p>{loadError}</p>
          </div>
        ) : (
          <div className="profile-layout">
            <section className="profile-details-card">
              {isLoading ? (
                <div className="profile-loading">Učitavanje profila…</div>
              ) : (
                <>
                  <div className="profile-person">
                    <div className="profile-avatar" aria-hidden="true">
                      {initials}
                    </div>
                    <div>
                      <p className="profile-eyebrow">OSOBNI PODACI</p>
                      <h2>{fullName}</h2>
                    </div>
                  </div>

                  <dl className="profile-data-list">
                    <div>
                      <dt>
                        <UserRound aria-hidden="true" size={16} />
                        Ime i prezime
                      </dt>
                      <dd>{fullName}</dd>
                    </div>
                    <div>
                      <dt>
                        <Mail aria-hidden="true" size={16} />
                        Email adresa
                      </dt>
                      <dd>{profile.email}</dd>
                    </div>
                    <div>
                      <dt>
                        <CalendarDays aria-hidden="true" size={16} />
                        Račun kreiran
                      </dt>
                      <dd>{formatCreatedAt(profile.createdAt)}</dd>
                    </div>
                  </dl>
                </>
              )}
            </section>

            <section className="profile-security-card">
              <div className="profile-security-heading">
                <div className="profile-security-icon">
                  <KeyRound aria-hidden="true" size={18} />
                </div>
                <div>
                  <p className="profile-eyebrow">SIGURNOST</p>
                  <h2>Promjena lozinke</h2>
                </div>
              </div>

              <form className="profile-password-form" onSubmit={handleSubmit}>
                <div className="profile-field">
                  <Label htmlFor="current-password">Trenutna lozinka</Label>
                  <Input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Unesite trenutnu lozinku"
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="profile-field">
                  <Label htmlFor="new-password">Nova lozinka</Label>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Najmanje 8 karaktera"
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="profile-field">
                  <Label htmlFor="confirm-password">
                    Potvrdite novu lozinku
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Ponovite novu lozinku"
                    disabled={isSaving}
                    required
                  />
                </div>

                {actionError && (
                  <p className="profile-action-error" role="alert">
                    {actionError}
                  </p>
                )}

                <Button
                  className="profile-password-submit"
                  disabled={isSaving}
                  type="submit"
                >
                  <KeyRound aria-hidden="true" size={16} />
                  {isSaving ? 'Čuvanje…' : 'Promijeni lozinku'}
                </Button>
              </form>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default ProfilePage
