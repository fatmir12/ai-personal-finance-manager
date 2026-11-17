import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CircleCheck,
  Goal,
  Plus,
  RotateCw,
  Sparkles,
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
} from '@/lib/financeFormatters.js'
import { useAuth } from '@/hooks/useAuth.js'
import {
  createSavingGoal,
  deleteSavingGoal,
  getSavingGoals,
  updateSavingGoal,
} from '@/services/financeService.js'

import '../styles/PlanningPages.css'

function SavingGoalsPage() {
  const { accessToken } = useAuth()
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getSavingGoals(accessToken, { signal: controller.signal })
      .then((result) => {
        if (active) {
          setGoals(result)
        }
      })
      .catch((loadError) => {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Ciljeve štednje nije moguće učitati.')
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

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0),
    [goals]
  )
  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0),
    [goals]
  )
  const completedCount = goals.filter(
    (goal) => Number(goal.currentAmount) >= Number(goal.targetAmount)
  ).length

  const openCreateDialog = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
    })
    setActionError('')
    setDialog({ mode: 'create' })
  }

  const openEditDialog = (goal) => {
    setFormData({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate ?? '',
    })
    setActionError('')
    setDialog({ mode: 'edit', goal })
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

    const targetAmount = Number(formData.targetAmount)
    const currentAmount = Number(formData.currentAmount)

    if (
      !formData.name.trim() ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      setActionError('Unesite naziv, ciljani iznos i ispravno trenutno stanje.')
      return
    }

    const request = {
      name: formData.name.trim(),
      targetAmount,
      currentAmount,
      targetDate: formData.targetDate || null,
    }

    setActionError('')
    setIsSaving(true)

    try {
      if (dialog.mode === 'edit') {
        await updateSavingGoal(accessToken, dialog.goal.id, request)
        setNotice('Cilj štednje je ažuriran.')
      } else {
        await createSavingGoal(accessToken, request)
        setNotice('Novi cilj štednje je kreiran.')
      }

      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setActionError(saveError.message || 'Cilj štednje nije moguće sačuvati.')
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
      await deleteSavingGoal(accessToken, dialog.goal.id)
      setNotice('Cilj štednje je obrisan.')
      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (deleteError) {
      setActionError(deleteError.message || 'Cilj štednje nije moguće obrisati.')
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
            <p className="finance-eyebrow">PLANIRANJE / ŠTEDNJA</p>
            <h1>Ciljevi štednje</h1>
            <p className="finance-page-description">
              Veliki planovi počinju malim, vidljivim koracima.
            </p>
          </div>
          <Button className="finance-primary-action" onClick={openCreateDialog}>
            <Plus aria-hidden="true" size={16} />
            Novi cilj
          </Button>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">U redu</button>
          </div>
        )}

        <section aria-label="Sažetak ciljeva štednje" className="planning-summary">
          <Card className="planning-summary-card planning-summary-feature">
            <span>UKUPNO UŠTEĐENO</span>
            <strong>{isLoading ? '—' : formatMoney(totalSaved)}</strong>
            <p>
              {isLoading
                ? 'Učitavanje ciljeva'
                : `Od ukupnog plana ${formatMoney(totalTarget)}`}
            </p>
            <div className="planning-summary-art" aria-hidden="true">
              <Goal size={25} strokeWidth={1.5} />
            </div>
          </Card>
          <Card className="planning-summary-card">
            <span>OSTVARENI CILJEVI</span>
            <strong>{isLoading ? '—' : `${completedCount} / ${goals.length}`}</strong>
            <p>{goals.length === 1 ? 'Cilj štednje' : 'Ukupno ciljeva'}</p>
          </Card>
        </section>

        <section className="finance-content-section">
          <div className="finance-section-heading">
            <div>
              <p className="finance-eyebrow">VAŠI PLANOVI</p>
              <h2>Korak po korak</h2>
            </div>
            <span>{isLoading ? 'Učitavanje…' : `${goals.length} ciljeva`}</span>
          </div>

          {error ? (
            <div className="finance-error" role="alert">
              <Sparkles aria-hidden="true" size={19} />
              <p>{error}</p>
              <Button onClick={handleRetry} variant="outline">
                <RotateCw aria-hidden="true" size={15} />
                Pokušaj ponovo
              </Button>
            </div>
          ) : isLoading ? (
            <div className="finance-loading" role="status">Učitavanje ciljeva…</div>
          ) : goals.length ? (
            <div className="saving-goal-grid">
              {goals.map((goal) => {
                const targetAmount = Number(goal.targetAmount)
                const currentAmount = Number(goal.currentAmount)
                const progress = targetAmount > 0
                  ? (currentAmount / targetAmount) * 100
                  : 0
                const isCompleted = currentAmount >= targetAmount

                return (
                  <Card className={`saving-goal-card${isCompleted ? ' is-complete' : ''}`} key={goal.id}>
                    <div className="saving-goal-card-top">
                      <span className={`saving-goal-symbol${isCompleted ? ' is-complete' : ''}`}>
                        {isCompleted ? (
                          <CircleCheck aria-hidden="true" size={19} />
                        ) : (
                          <Goal aria-hidden="true" size={19} />
                        )}
                      </span>
                      <div className="planning-card-actions">
                        <Button
                          aria-label={`Uredi cilj ${goal.name}`}
                          onClick={() => openEditDialog(goal)}
                          size="sm"
                          variant="ghost"
                        >
                          Uredi
                        </Button>
                        <Button
                          aria-label={`Obriši cilj ${goal.name}`}
                          className="planning-delete-action"
                          onClick={() => {
                            setActionError('')
                            setDialog({ mode: 'delete', goal })
                          }}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                        </Button>
                      </div>
                    </div>
                    <div className="saving-goal-title">
                      <h3>{goal.name}</h3>
                      <span className={isCompleted ? 'goal-complete-label' : ''}>
                        {isCompleted ? 'Cilj ostvaren' : 'U toku'}
                      </span>
                    </div>
                    <div className="saving-goal-amounts">
                      <strong>{formatMoney(currentAmount)}</strong>
                      <span>od {formatMoney(targetAmount)}</span>
                    </div>
                    <div className="goal-progress-labels">
                      <span>
                        {isCompleted
                          ? 'Sjajan rezultat'
                          : `Preostalo ${formatMoney(Number(goal.remainingAmount))}`}
                      </span>
                      <strong>{Math.round(progress)}%</strong>
                    </div>
                    <div
                      aria-label={`${Math.round(progress)}% cilja ostvareno`}
                      className="planning-progress-track"
                      role="img"
                    >
                      <span
                        className={`planning-progress-fill goal-progress-fill${isCompleted ? ' is-complete' : ''}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="saving-goal-card-footer">
                      <CalendarDays aria-hidden="true" size={13} />
                      <span>
                        {goal.targetDate
                          ? `Ciljni datum: ${formatFinanceDate(goal.targetDate)}`
                          : 'Bez ciljnog datuma'}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <Goal aria-hidden="true" size={22} />
              </div>
              <h3>Šta želite ostvariti?</h3>
              <p>
                Napravite cilj za putovanje, sigurnosnu rezervu ili nešto
                posebno. Vi određujete tempo.
              </p>
              <Button className="finance-primary-action" onClick={openCreateDialog}>
                <Plus aria-hidden="true" size={16} />
                Postavi prvi cilj
              </Button>
            </Card>
          )}
        </section>
      </div>

      <Dialog
        description={
          dialog?.mode === 'delete'
            ? 'Brisanje cilja ne mijenja stanje vaših računa.'
            : 'Unesite koliko želite uštedjeti i gdje se trenutno nalazite.'
        }
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        open={Boolean(dialog)}
        title={
          dialog?.mode === 'delete'
            ? 'Obrisati cilj?'
            : dialog?.mode === 'edit'
              ? 'Uredi cilj štednje'
              : 'Novi cilj štednje'
        }
      >
        {dialog?.mode === 'delete' ? (
          <div className="finance-dialog-form">
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <p className="finance-confirm-copy">
              Želite li obrisati cilj <strong>{dialog.goal.name}</strong>?
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
                {isSaving ? 'Brisanje…' : 'Obriši cilj'}
              </Button>
            </div>
          </div>
        ) : (
          <form className="finance-dialog-form" onSubmit={handleSubmit}>
            <div className="finance-form-field">
              <Label htmlFor="goal-name">Naziv cilja</Label>
              <Input
                autoFocus
                id="goal-name"
                maxLength={100}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="npr. Putovanje u Portugal"
                required
                value={formData.name}
              />
            </div>
            <div className="finance-form-row">
              <div className="finance-form-field">
                <Label htmlFor="goal-target-amount">Ciljani iznos (KM)</Label>
                <Input
                  id="goal-target-amount"
                  min="0.01"
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      targetAmount: event.target.value,
                    }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={formData.targetAmount}
                />
              </div>
              <div className="finance-form-field">
                <Label htmlFor="goal-current-amount">Trenutno ušteđeno (KM)</Label>
                <Input
                  id="goal-current-amount"
                  min="0"
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      currentAmount: event.target.value,
                    }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={formData.currentAmount}
                />
              </div>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="goal-target-date">Ciljni datum (opcionalno)</Label>
              <Input
                id="goal-target-date"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    targetDate: event.target.value,
                  }))
                }
                type="date"
                value={formData.targetDate}
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
                    : 'Kreiraj cilj'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  )
}

export default SavingGoalsPage
