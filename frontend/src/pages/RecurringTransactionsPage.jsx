import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CirclePause,
  CirclePlay,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react'

import AppShell from '@/components/layout/AppShell.jsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Dialog from '@/components/ui/dialog.jsx'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  formatFinanceDate,
  formatMoney,
  getLocalDateValue,
} from '@/lib/financeFormatters.js'
import { useAuth } from '@/hooks/useAuth.js'
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getAccounts,
  getCategories,
  getRecurringTransactions,
  updateRecurringTransaction,
} from '@/services/financeService.js'

import '../styles/ActivityPages.css'

const frequencies = [
  { value: 'DAILY', label: 'Dnevno' },
  { value: 'WEEKLY', label: 'Sedmično' },
  { value: 'MONTHLY', label: 'Mjesečno' },
]

const filters = [
  { value: 'ALL', label: 'Sva ponavljanja' },
  { value: 'ACTIVE', label: 'Aktivna' },
  { value: 'PAUSED', label: 'Pauzirana' },
]

function getFrequencyLabel(frequency) {
  return frequencies.find((item) => item.value === frequency)?.label ?? frequency
}

function RecurringTransactionsPage() {
  const { accessToken } = useAuth()
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    categoryId: '',
    accountId: '',
    amount: '',
    description: '',
    frequency: 'MONTHLY',
    nextRunDate: getLocalDateValue(),
    active: true,
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    Promise.all([
      getRecurringTransactions(accessToken, { signal: controller.signal }),
      getAccounts(accessToken, { signal: controller.signal }),
      getCategories(accessToken, { signal: controller.signal }),
    ])
      .then(([rules, loadedAccounts, loadedCategories]) => {
        if (active) {
          setRecurringTransactions(rules)
          setAccounts(loadedAccounts)
          setCategories(loadedCategories)
        }
      })
      .catch((loadError) => {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Ponavljanja nije moguće učitati.')
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

  const visibleTransactions = useMemo(
    () =>
      recurringTransactions.filter((transaction) => {
        if (filter === 'ACTIVE') {
          return transaction.active
        }
        if (filter === 'PAUSED') {
          return !transaction.active
        }
        return true
      }),
    [filter, recurringTransactions]
  )

  const activeCount = recurringTransactions.filter(
    (transaction) => transaction.active
  ).length
  const availableCategories = categories.filter(
    (category) => category.type === formData.type
  )

  const openCreateDialog = () => {
    setFormData({
      type: 'EXPENSE',
      categoryId: '',
      accountId: accounts[0] ? String(accounts[0].id) : '',
      amount: '',
      description: '',
      frequency: 'MONTHLY',
      nextRunDate: getLocalDateValue(),
      active: true,
    })
    setActionError('')
    setDialog({ mode: 'create' })
  }

  const openEditDialog = (transaction) => {
    setFormData({
      type: transaction.type,
      categoryId: String(transaction.categoryId),
      accountId: String(transaction.accountId),
      amount: String(transaction.amount),
      description: transaction.description ?? '',
      frequency: transaction.frequency,
      nextRunDate: transaction.nextRunDate,
      active: transaction.active,
    })
    setActionError('')
    setDialog({ mode: 'edit', transaction })
  }

  const closeDialog = () => {
    if (!isSaving) {
      setDialog(null)
      setActionError('')
    }
  }

  const toRequest = (data) => ({
    categoryId: Number(data.categoryId),
    accountId: Number(data.accountId),
    amount: Number(data.amount),
    description: data.description.trim() || null,
    frequency: data.frequency,
    nextRunDate: data.nextRunDate,
    active: data.active,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const amount = Number(formData.amount)
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !formData.categoryId ||
      !formData.accountId ||
      !formData.nextRunDate
    ) {
      setActionError('Unesite kategoriju, račun, pozitivan iznos i datum.')
      return
    }

    setActionError('')
    setIsSaving(true)

    try {
      if (dialog.mode === 'edit') {
        await updateRecurringTransaction(
          accessToken,
          dialog.transaction.id,
          toRequest(formData)
        )
        setNotice('Ponavljanje je ažurirano.')
      } else {
        await createRecurringTransaction(accessToken, toRequest(formData))
        setNotice('Novo ponavljanje je kreirano.')
      }

      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setActionError(saveError.message || 'Ponavljanje nije moguće sačuvati.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (transaction) => {
    if (updatingId !== null) {
      return
    }

    setUpdatingId(transaction.id)
    setActionError('')

    try {
      await updateRecurringTransaction(
        accessToken,
        transaction.id,
        toRequest({
          ...transaction,
          active: !transaction.active,
        })
      )
      setNotice(
        transaction.active
          ? 'Ponavljanje je pauzirano.'
          : 'Ponavljanje je ponovo aktivno.'
      )
      setReloadKey((key) => key + 1)
    } catch (updateError) {
      setActionError(updateError.message || 'Status ponavljanja nije moguće promijeniti.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (isSaving || dialog?.mode !== 'delete') {
      return
    }

    setActionError('')
    setIsSaving(true)

    try {
      await deleteRecurringTransaction(accessToken, dialog.transaction.id)
      setNotice('Ponavljanje je obrisano.')
      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (deleteError) {
      setActionError(deleteError.message || 'Ponavljanje nije moguće obrisati.')
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
      <div className="finance-page activity-page">
        <header className="finance-page-header">
          <div>
            <p className="finance-eyebrow">PLANIRANJE / AUTOMATIZACIJA</p>
            <h1>Ponavljajuće transakcije</h1>
            <p className="finance-page-description">
              Pripremite redovne uplate i račune unaprijed.
            </p>
          </div>
          <Button
            className="finance-primary-action"
            disabled={!accounts.length || !categories.length}
            onClick={openCreateDialog}
          >
            <Plus aria-hidden="true" size={16} />
            Novo ponavljanje
          </Button>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">U redu</button>
          </div>
        )}
        {actionError && !dialog && (
          <div className="finance-error" role="alert">
            <p>{actionError}</p>
            <button onClick={() => setActionError('')} type="button">Zatvori</button>
          </div>
        )}

        <section className="activity-summary-grid">
          <Card className="activity-summary-card activity-summary-feature">
            <span>AKTIVNA PRAVILA</span>
            <strong>{isLoading ? '—' : activeCount}</strong>
            <p>Automatski raspoređene transakcije</p>
            <div className="activity-summary-art" aria-hidden="true">
              <CalendarClock size={24} strokeWidth={1.5} />
            </div>
          </Card>
          <Card className="activity-summary-card">
            <span>UKUPNO PRAVILA</span>
            <strong>{isLoading ? '—' : recurringTransactions.length}</strong>
            <p>{recurringTransactions.length - activeCount} pauziranih</p>
          </Card>
        </section>

        <section className="finance-content-section">
          <div className="finance-section-heading activity-section-heading">
            <div>
              <p className="finance-eyebrow">RUTINA BEZ NAPORA</p>
              <h2>Vaš raspored</h2>
            </div>
            <label className="activity-filter">
              <span className="sr-only">Filtriraj ponavljanja</span>
              <select
                aria-label="Filtriraj ponavljanja"
                className="finance-select"
                onChange={(event) => setFilter(event.target.value)}
                value={filter}
              >
                {filters.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
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
            <div className="finance-loading" role="status">
              Učitavanje ponavljanja…
            </div>
          ) : !accounts.length || !categories.length ? (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <CalendarClock aria-hidden="true" size={21} />
              </div>
              <h3>Za početak dodajte račun i kategoriju.</h3>
              <p>
                Svako ponavljanje mora biti vezano za vaš račun i jednu
                kategoriju prihoda ili rashoda.
              </p>
            </Card>
          ) : visibleTransactions.length ? (
            <div className="recurring-card-grid">
              {visibleTransactions.map((transaction) => {
                const isIncome = transaction.type === 'INCOME'
                const isDue = transaction.nextRunDate <= getLocalDateValue()

                return (
                  <Card className="recurring-card" key={transaction.id}>
                    <div className="recurring-card-heading">
                      <span className={`recurring-type-icon ${isIncome ? 'is-income' : 'is-expense'}`}>
                        {isIncome ? (
                          <ArrowDownLeft aria-hidden="true" size={18} />
                        ) : (
                          <ArrowUpRight aria-hidden="true" size={18} />
                        )}
                      </span>
                      <span className={`recurring-status${transaction.active ? ' is-active' : ''}`}>
                        {transaction.active ? 'Aktivno' : 'Pauzirano'}
                      </span>
                    </div>
                    <div className="recurring-title-row">
                      <div>
                        <h3>{transaction.description || transaction.categoryName}</h3>
                        <p>{transaction.categoryName} · {transaction.accountName}</p>
                      </div>
                      <strong className={isIncome ? 'is-income' : 'is-expense'}>
                        {isIncome ? '+' : '−'} {formatMoney(Number(transaction.amount))}
                      </strong>
                    </div>
                    <div className="recurring-detail-row">
                      <span>{getFrequencyLabel(transaction.frequency)}</span>
                      <span className={isDue && transaction.active ? 'is-due' : ''}>
                        {transaction.active && isDue ? 'Dospjelo · ' : 'Sljedeće · '}
                        {formatFinanceDate(transaction.nextRunDate)}
                      </span>
                    </div>
                    <div className="recurring-card-actions">
                      <Button
                        disabled={updatingId !== null}
                        onClick={() => handleToggleActive(transaction)}
                        variant="outline"
                      >
                        {transaction.active ? (
                          <CirclePause aria-hidden="true" size={15} />
                        ) : (
                          <CirclePlay aria-hidden="true" size={15} />
                        )}
                        {updatingId === transaction.id
                          ? 'Čuvanje…'
                          : transaction.active
                            ? 'Pauziraj'
                            : 'Aktiviraj'}
                      </Button>
                      <Button
                        onClick={() => openEditDialog(transaction)}
                        variant="ghost"
                      >
                        Uredi
                      </Button>
                      <Button
                        aria-label={`Obriši ponavljanje ${transaction.description || transaction.categoryName}`}
                        className="activity-delete-action"
                        onClick={() => {
                          setActionError('')
                          setDialog({ mode: 'delete', transaction })
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : recurringTransactions.length ? (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <CalendarClock aria-hidden="true" size={21} />
              </div>
              <h3>Nema ponavljanja u ovom prikazu.</h3>
              <p>Promijenite filter da biste vidjeli druga pravila.</p>
              <Button onClick={() => setFilter('ALL')} variant="outline">
                Prikaži sva ponavljanja
              </Button>
            </Card>
          ) : (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <CalendarClock aria-hidden="true" size={21} />
              </div>
              <h3>Automatizujte ponavljajuće izdatke.</h3>
              <p>
                Postavite raspored za redovne troškove i prihode; svako pravilo
                možete pauzirati ili urediti.
              </p>
              <Button className="finance-primary-action" onClick={openCreateDialog}>
                <Plus aria-hidden="true" size={16} />
                Kreiraj prvo pravilo
              </Button>
            </Card>
          )}
        </section>
      </div>

      <Dialog
        description={
          dialog?.mode === 'delete'
            ? 'Brisanje pravila ne uklanja već evidentirane transakcije.'
            : 'Odredite račun, kategoriju i kada se pravilo treba izvršiti.'
        }
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        open={Boolean(dialog)}
        title={
          dialog?.mode === 'delete'
            ? 'Obrisati ponavljanje?'
            : dialog?.mode === 'edit'
              ? 'Uredi ponavljanje'
              : 'Novo ponavljanje'
        }
      >
        {dialog?.mode === 'delete' ? (
          <div className="finance-dialog-form">
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <p className="finance-confirm-copy">
              Želite li obrisati pravilo{' '}
              <strong>{dialog.transaction.description || dialog.transaction.categoryName}</strong>?
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
                {isSaving ? 'Brisanje…' : 'Obriši pravilo'}
              </Button>
            </div>
          </div>
        ) : (
          <form className="finance-dialog-form" onSubmit={handleSubmit}>
            <div className="finance-form-field">
              <Label htmlFor="recurring-type">Vrsta</Label>
              <select
                className="finance-select"
                id="recurring-type"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    type: event.target.value,
                    categoryId: '',
                  }))
                }
                value={formData.type}
              >
                <option value="EXPENSE">Rashod</option>
                <option value="INCOME">Prihod</option>
              </select>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="recurring-category">Kategorija</Label>
              <select
                className="finance-select"
                id="recurring-category"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    categoryId: event.target.value,
                  }))
                }
                required
                value={formData.categoryId}
              >
                <option value="" disabled>Odaberite kategoriju</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="recurring-account">Račun</Label>
              <select
                className="finance-select"
                id="recurring-account"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    accountId: event.target.value,
                  }))
                }
                required
                value={formData.accountId}
              >
                <option value="" disabled>Odaberite račun</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>
            <div className="finance-form-row">
              <div className="finance-form-field">
                <Label htmlFor="recurring-amount">Iznos (KM)</Label>
                <Input
                  autoFocus
                  id="recurring-amount"
                  min="0.01"
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      amount: event.target.value,
                    }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={formData.amount}
                />
              </div>
              <div className="finance-form-field">
                <Label htmlFor="recurring-frequency">Učestalost</Label>
                <select
                  className="finance-select"
                  id="recurring-frequency"
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      frequency: event.target.value,
                    }))
                  }
                  value={formData.frequency}
                >
                  {frequencies.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="recurring-next-run">Sljedeći datum izvršavanja</Label>
              <Input
                id="recurring-next-run"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    nextRunDate: event.target.value,
                  }))
                }
                required
                type="date"
                value={formData.nextRunDate}
              />
            </div>
            <div className="finance-form-field">
              <Label htmlFor="recurring-description">Opis (opcionalno)</Label>
              <Input
                id="recurring-description"
                maxLength={255}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="npr. Internet pretplata"
                value={formData.description}
              />
            </div>
            <label className="recurring-active-field">
              <input
                checked={formData.active}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Pravilo je aktivno</span>
            </label>
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
                    : 'Kreiraj pravilo'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  )
}

export default RecurringTransactionsPage
