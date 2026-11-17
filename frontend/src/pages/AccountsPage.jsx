import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plus,
  RotateCw,
  Trash2,
  WalletCards,
} from 'lucide-react'

import AppShell from '@/components/layout/AppShell.jsx'
import Dialog from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth.js'
import { formatMoney } from '@/lib/financeFormatters.js'
import {
  createAccount,
  deleteAccount,
  getAccounts,
  updateAccount,
} from '@/services/financeService.js'

import '../styles/FinancePages.css'

const accountTypes = [
  { value: 'BANK', label: 'Bankovni račun', icon: Landmark },
  { value: 'CASH', label: 'Gotovina', icon: Banknote },
  { value: 'SAVINGS', label: 'Štednja', icon: PiggyBank },
]

function getAccountType(type) {
  return accountTypes.find((accountType) => accountType.value === type)
    ?? accountTypes[0]
}

function AccountsPage() {
  const { accessToken } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    initialBalance: '0',
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getAccounts(accessToken, { signal: controller.signal })
      .then((result) => {
        if (active) {
          setAccounts(result)
        }
      })
      .catch((loadError) => {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Račune nije moguće učitati.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [accessToken, reloadKey])

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0),
    [accounts]
  )

  const openCreateDialog = () => {
    setFormData({ name: '', type: 'BANK', initialBalance: '0' })
    setActionError('')
    setDialog({ mode: 'create' })
  }

  const openEditDialog = (account) => {
    setFormData({
      name: account.name,
      type: account.type,
      initialBalance: String(account.initialBalance),
    })
    setActionError('')
    setDialog({ mode: 'edit', account })
  }

  const closeDialog = () => {
    if (!isSaving) {
      setDialog(null)
      setActionError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const initialBalance = Number(formData.initialBalance)

    if (!formData.name.trim() || !Number.isFinite(initialBalance)) {
      setActionError('Unesite naziv računa i ispravno početno stanje.')
      return
    }

    const request = {
      name: formData.name.trim(),
      type: formData.type,
      initialBalance,
    }

    setActionError('')
    setIsSaving(true)

    try {
      if (dialog.mode === 'edit') {
        await updateAccount(accessToken, dialog.account.id, request)
        setNotice('Izmjene računa su sačuvane.')
      } else {
        await createAccount(accessToken, request)
        setNotice('Račun je uspješno dodan.')
      }

      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setActionError(saveError.message || 'Račun nije moguće sačuvati.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isSaving || dialog?.mode !== 'delete') {
      return
    }

    setActionError('')
    setIsSaving(true)

    try {
      await deleteAccount(accessToken, dialog.account.id)
      setNotice('Račun je obrisan.')
      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (deleteError) {
      setActionError(deleteError.message || 'Račun nije moguće obrisati.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetry = () => {
    setError('')
    setIsLoading(true)
    setReloadKey((key) => key + 1)
  }

  return (
    <AppShell>
      <div className="finance-page">
        <header className="finance-page-header">
          <div>
            <p className="finance-eyebrow">FINANSIJE / RAČUNI</p>
            <h1>Računi</h1>
            <p className="finance-page-description">
              Jedno mjesto za pregled svih vaših novčanih tokova.
            </p>
          </div>
          <Button className="finance-primary-action" onClick={openCreateDialog}>
            <Plus aria-hidden="true" size={16} />
            Dodaj račun
          </Button>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">U redu</button>
          </div>
        )}

        <section aria-label="Sažetak računa" className="account-summary-grid">
          <Card className="account-summary-card account-summary-primary">
            <span>UKUPNO STANJE</span>
            <strong>{isLoading ? '—' : formatMoney(totalBalance)}</strong>
            <p>Zbir stanja na svim računima</p>
            <div className="account-summary-symbol" aria-hidden="true">
              <WalletCards size={26} strokeWidth={1.5} />
            </div>
          </Card>
          <Card className="account-summary-card">
            <span>RAČUNI</span>
            <strong>{isLoading ? '—' : accounts.length}</strong>
            <p>{accounts.length === 1 ? 'Aktivan račun' : 'Aktivnih računa'}</p>
            <div className="account-count-mark" aria-hidden="true">
              {String(accounts.length).padStart(2, '0')}
            </div>
          </Card>
        </section>

        <section className="finance-content-section">
          <div className="finance-section-heading">
            <div>
              <p className="finance-eyebrow">VAŠ NOVAC</p>
              <h2>Pregled računa</h2>
            </div>
            <span>{isLoading ? 'Učitavanje…' : `${accounts.length} računa`}</span>
          </div>

          {error ? (
            <div className="finance-error" role="alert">
              <p>{error}</p>
              <Button onClick={handleRetry} variant="outline">
                <RotateCw aria-hidden="true" size={15} />
                Pokušaj ponovo
              </Button>
            </div>
          ) : isLoading ? (
            <div className="finance-loading" role="status">Učitavanje računa…</div>
          ) : accounts.length ? (
            <div className="account-card-grid">
              {accounts.map((account) => {
                const { icon: Icon, label } = getAccountType(account.type)

                return (
                  <Card className="account-card" key={account.id}>
                    <div className={`account-type-icon account-type-${account.type.toLowerCase()}`}>
                      <Icon aria-hidden="true" size={19} strokeWidth={1.7} />
                    </div>
                    <div className="account-card-heading">
                      <div>
                        <span className="account-type-label">{label}</span>
                        <h3>{account.name}</h3>
                      </div>
                      <div className="account-actions">
                        <Button
                          aria-label={`Uredi račun ${account.name}`}
                          onClick={() => openEditDialog(account)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <MoreHorizontal aria-hidden="true" size={17} />
                        </Button>
                        <Button
                          aria-label={`Obriši račun ${account.name}`}
                          className="account-delete-action"
                          onClick={() => {
                            setActionError('')
                            setDialog({ mode: 'delete', account })
                          }}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                        </Button>
                      </div>
                    </div>
                    <div className="account-balance">
                      <span>Trenutno stanje</span>
                      <strong>{formatMoney(Number(account.currentBalance))}</strong>
                    </div>
                    <div className="account-card-footer">
                      <span>Početno stanje</span>
                      <span>{formatMoney(Number(account.initialBalance))}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <WalletCards aria-hidden="true" size={22} />
              </div>
              <h3>Počnite od svog prvog računa.</h3>
              <p>
                Dodajte bankovni račun, gotovinu ili štednju i pratite stanje
                na jednom mjestu.
              </p>
              <Button className="finance-primary-action" onClick={openCreateDialog}>
                <Plus aria-hidden="true" size={16} />
                Dodaj prvi račun
              </Button>
            </Card>
          )}
        </section>
      </div>

      <Dialog
        description={
          dialog?.mode === 'delete'
            ? 'Brisanje računa je trajno.'
            : 'Podaci se odmah provjeravaju i čuvaju na vašem računu.'
        }
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        open={Boolean(dialog)}
        title={
          dialog?.mode === 'delete'
            ? 'Obrisati račun?'
            : dialog?.mode === 'edit'
              ? 'Uredi račun'
              : 'Novi račun'
        }
      >
        {dialog?.mode === 'delete' ? (
          <div className="finance-dialog-form">
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <p className="finance-confirm-copy">
              Želite li obrisati račun <strong>{dialog.account.name}</strong>?
              Račun s povezanim transakcijama nije moguće obrisati.
            </p>
            <div className="finance-dialog-actions">
              <Button disabled={isSaving} onClick={closeDialog} variant="outline">
                Odustani
              </Button>
              <Button
                className="finance-danger-action"
                disabled={isSaving}
                onClick={handleDelete}
              >
                {isSaving ? 'Brisanje…' : 'Obriši račun'}
              </Button>
            </div>
          </div>
        ) : (
          <form className="finance-dialog-form" onSubmit={handleSubmit}>
            <div className="finance-form-field">
              <Label htmlFor="account-name">Naziv računa</Label>
              <Input
                autoFocus
                id="account-name"
                maxLength={100}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="npr. Glavni račun"
                required
                value={formData.name}
              />
            </div>
            <div className="finance-form-field">
              <Label htmlFor="account-type">Vrsta računa</Label>
              <select
                className="finance-select"
                id="account-type"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    type: event.target.value,
                  }))
                }
                value={formData.type}
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="account-initial-balance">Početno stanje (KM)</Label>
              <Input
                id="account-initial-balance"
                inputMode="decimal"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    initialBalance: event.target.value,
                  }))
                }
                required
                step="0.01"
                type="number"
                value={formData.initialBalance}
              />
            </div>
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <div className="finance-dialog-actions">
              <Button disabled={isSaving} onClick={closeDialog} type="button" variant="outline">
                Odustani
              </Button>
              <Button className="finance-primary-action" disabled={isSaving} type="submit">
                {isSaving
                  ? 'Čuvanje…'
                  : dialog?.mode === 'edit'
                    ? 'Sačuvaj izmjene'
                    : 'Dodaj račun'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  )
}

export default AccountsPage
