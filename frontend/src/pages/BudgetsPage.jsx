import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  ChartNoAxesCombined,
  CircleCheck,
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
import { formatBosnianMonth, formatMoney } from '@/lib/financeFormatters.js'
import { useAuth } from '@/hooks/useAuth.js'
import {
  createBudget,
  deleteBudget,
  getBudgets,
  getCategories,
  updateBudget,
} from '@/services/financeService.js'

import '../styles/PlanningPages.css'

const currentDate = new Date()
const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

function getPeriodParts(value) {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

function getCategoryName(budget) {
  return budget.categoryName || budget.CategoryName || 'Kategorija'
}

function BudgetsPage() {
  const { accessToken } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod)
  const [formData, setFormData] = useState({
    categoryId: '',
    amountLimit: '',
    period: currentPeriod,
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    Promise.all([
      getBudgets(accessToken, { signal: controller.signal }),
      getCategories(accessToken, { signal: controller.signal }),
    ])
      .then(([loadedBudgets, loadedCategories]) => {
        if (active) {
          setBudgets(loadedBudgets)
          setCategories(loadedCategories)
        }
      })
      .catch((loadError) => {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Budžete nije moguće učitati.')
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

  const { month, year } = getPeriodParts(selectedPeriod)
  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === month && budget.year === year),
    [budgets, month, year]
  )

  const totalLimit = visibleBudgets.reduce(
    (sum, budget) => sum + Number(budget.amountLimit),
    0
  )
  const totalSpent = visibleBudgets.reduce(
    (sum, budget) => sum + Number(budget.spentAmount),
    0
  )
  const expenseCategories = categories.filter(
    (category) => category.type === 'EXPENSE'
  )
  const monthLabel = `${formatBosnianMonth(new Date(year, month - 1, 1))} ${year}.`

  const openCreateDialog = () => {
    setFormData({
      categoryId: expenseCategories[0] ? String(expenseCategories[0].id) : '',
      amountLimit: '',
      period: selectedPeriod,
    })
    setActionError('')
    setDialog({ mode: 'create' })
  }

  const openEditDialog = (budget) => {
    setFormData({
      categoryId: String(budget.categoryId),
      amountLimit: String(budget.amountLimit),
      period: `${budget.year}-${String(budget.month).padStart(2, '0')}`,
    })
    setActionError('')
    setDialog({ mode: 'edit', budget })
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

    const amountLimit = Number(formData.amountLimit)
    const categoryId = Number(formData.categoryId)
    const period = getPeriodParts(formData.period)

    if (
      !Number.isFinite(amountLimit) ||
      amountLimit <= 0 ||
      !Number.isFinite(categoryId) ||
      period.month < 1 ||
      period.month > 12 ||
      period.year < 2000 ||
      period.year > 2100
    ) {
      setActionError('Unesite kategoriju, iznos veći od nule i ispravan mjesec.')
      return
    }

    const request = {
      categoryId,
      amountLimit,
      month: period.month,
      year: period.year,
    }

    setActionError('')
    setIsSaving(true)

    try {
      if (dialog.mode === 'edit') {
        await updateBudget(accessToken, dialog.budget.id, request)
        setNotice('Budžet je ažuriran.')
      } else {
        await createBudget(accessToken, request)
        setNotice('Budžet je kreiran.')
      }

      setSelectedPeriod(formData.period)
      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setActionError(saveError.message || 'Budžet nije moguće sačuvati.')
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
      await deleteBudget(accessToken, dialog.budget.id)
      setNotice('Budžet je obrisan.')
      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (deleteError) {
      setActionError(deleteError.message || 'Budžet nije moguće obrisati.')
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
      <div className="finance-page planning-page">
        <header className="finance-page-header">
          <div>
            <p className="finance-eyebrow">PLANIRANJE / BUDŽETI</p>
            <h1>Budžeti</h1>
            <p className="finance-page-description">
              Postavite granice potrošnje koje odgovaraju vašem životu.
            </p>
          </div>
          <Button
            className="finance-primary-action"
            disabled={!expenseCategories.length}
            onClick={openCreateDialog}
          >
            <Plus aria-hidden="true" size={16} />
            Novi budžet
          </Button>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">U redu</button>
          </div>
        )}

        <section className="planning-summary">
          <Card className="planning-summary-card planning-summary-feature">
            <span>PLAN ZA {monthLabel.toLocaleUpperCase('bs-BA')}</span>
            <strong>{isLoading ? '—' : formatMoney(totalLimit)}</strong>
            <p>Planirani iznos za odabrani mjesec</p>
            <div className="planning-summary-art" aria-hidden="true">
              <ChartNoAxesCombined size={25} strokeWidth={1.5} />
            </div>
          </Card>
          <Card className="planning-summary-card">
            <span>DO SADA POTROŠENO</span>
            <strong>{isLoading ? '—' : formatMoney(totalSpent)}</strong>
            <p>
              {totalLimit > 0
                ? `${Math.round((totalSpent / totalLimit) * 100)}% ukupnog plana`
                : 'Nema aktivnog plana'}
            </p>
          </Card>
        </section>

        <section className="finance-content-section">
          <div className="finance-section-heading planning-section-heading">
            <div>
              <p className="finance-eyebrow">MJESEČNI PLAN</p>
              <h2>Budžet po kategorijama</h2>
            </div>
            <label className="period-picker">
              <CalendarDays aria-hidden="true" size={15} />
              <span className="sr-only">Odaberite mjesec</span>
              <Input
                aria-label="Odaberite mjesec"
                max="2100-12"
                min="2000-01"
                onChange={(event) => {
                  if (event.target.value) {
                    setSelectedPeriod(event.target.value)
                  }
                }}
                type="month"
                value={selectedPeriod}
              />
            </label>
          </div>

          {error ? (
            <div className="finance-error" role="alert">
              <AlertTriangle aria-hidden="true" size={19} />
              <p>{error}</p>
              <Button onClick={handleRetry} variant="outline">
                <RotateCw aria-hidden="true" size={15} />
                Pokušaj ponovo
              </Button>
            </div>
          ) : isLoading ? (
            <div className="finance-loading" role="status">Učitavanje budžeta…</div>
          ) : !expenseCategories.length ? (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <AlertTriangle aria-hidden="true" size={21} />
              </div>
              <h3>Kategorije rashoda nisu dostupne.</h3>
              <p>Budžet se može postaviti samo za kategoriju rashoda.</p>
            </Card>
          ) : visibleBudgets.length ? (
            <div className="budget-card-grid">
              {visibleBudgets.map((budget) => {
                const limit = Number(budget.amountLimit)
                const spent = Number(budget.spentAmount)
                const remaining = limit - spent
                const progress = limit > 0 ? (spent / limit) * 100 : 0
                const isOver = remaining < 0
                const category = getCategoryName(budget)

                return (
                  <Card className="budget-card" key={budget.id}>
                    <div className="budget-card-top">
                      <span className={`budget-category-symbol${isOver ? ' is-over' : ''}`}>
                        {isOver ? (
                          <AlertTriangle aria-hidden="true" size={17} />
                        ) : (
                          <ChartNoAxesCombined aria-hidden="true" size={17} />
                        )}
                      </span>
                      <div className="planning-card-actions">
                        <Button
                          aria-label={`Uredi budžet za ${category}`}
                          onClick={() => openEditDialog(budget)}
                          size="sm"
                          variant="ghost"
                        >
                          Uredi
                        </Button>
                        <Button
                          aria-label={`Obriši budžet za ${category}`}
                          className="planning-delete-action"
                          onClick={() => {
                            setActionError('')
                            setDialog({ mode: 'delete', budget })
                          }}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                        </Button>
                      </div>
                    </div>
                    <div className="budget-card-title">
                      <h3>{category}</h3>
                      <span>{formatMoney(limit)} limit</span>
                    </div>
                    <div className="budget-progress-labels">
                      <span>{formatMoney(spent)} potrošeno</span>
                      <strong className={isOver ? 'is-over' : ''}>
                        {Math.round(progress)}%
                      </strong>
                    </div>
                    <div
                      aria-label={`${Math.round(progress)}% budžeta iskorišteno`}
                      className="planning-progress-track"
                      role="img"
                    >
                      <span
                        className={`planning-progress-fill${isOver ? ' is-over' : ''}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className={`budget-remaining${isOver ? ' is-over' : ''}`}>
                      {isOver ? (
                        <>
                          <AlertTriangle aria-hidden="true" size={13} />
                          <span>Prekoračenje: {formatMoney(Math.abs(remaining))}</span>
                        </>
                      ) : (
                        <>
                          <CircleCheck aria-hidden="true" size={13} />
                          <span>Preostalo: {formatMoney(remaining)}</span>
                        </>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <ChartNoAxesCombined aria-hidden="true" size={21} />
              </div>
              <h3>Još nema budžeta za {monthLabel}.</h3>
              <p>
                Odaberite kategoriju rashoda i postavite iznos koji želite
                pratiti tokom mjeseca.
              </p>
              <Button className="finance-primary-action" onClick={openCreateDialog}>
                <Plus aria-hidden="true" size={16} />
                Postavi prvi budžet
              </Button>
            </Card>
          )}
        </section>
      </div>

      <Dialog
        description={
          dialog?.mode === 'delete'
            ? 'Uklanjanje budžeta ne briše transakcije.'
            : 'Budžet se primjenjuje na jednu kategoriju u odabranom mjesecu.'
        }
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        open={Boolean(dialog)}
        title={
          dialog?.mode === 'delete'
            ? 'Obrisati budžet?'
            : dialog?.mode === 'edit'
              ? 'Uredi budžet'
              : 'Novi budžet'
        }
      >
        {dialog?.mode === 'delete' ? (
          <div className="finance-dialog-form">
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <p className="finance-confirm-copy">
              Želite li obrisati budžet za{' '}
              <strong>{getCategoryName(dialog.budget)}</strong>?
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
                {isSaving ? 'Brisanje…' : 'Obriši budžet'}
              </Button>
            </div>
          </div>
        ) : (
          <form className="finance-dialog-form" onSubmit={handleSubmit}>
            <div className="finance-form-field">
              <Label htmlFor="budget-category">Kategorija rashoda</Label>
              <select
                className="finance-select"
                id="budget-category"
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
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="budget-limit">Mjesečni limit (KM)</Label>
              <Input
                autoFocus
                id="budget-limit"
                min="0.01"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    amountLimit: event.target.value,
                  }))
                }
                required
                step="0.01"
                type="number"
                value={formData.amountLimit}
              />
            </div>
            <div className="finance-form-field">
              <Label htmlFor="budget-period">Mjesec</Label>
              <Input
                id="budget-period"
                max="2100-12"
                min="2000-01"
                onChange={(event) => {
                  if (event.target.value) {
                    setFormData((previous) => ({
                      ...previous,
                      period: event.target.value,
                    }))
                  }
                }}
                required
                type="month"
                value={formData.period}
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
                    : 'Kreiraj budžet'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  )
}

export default BudgetsPage
