import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleAlert,
  Plus,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react'

import AppShell from '@/components/layout/AppShell.jsx'
import Dialog from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth.js'
import {
  formatFinanceDate,
  formatMoney,
  getLocalDateValue,
} from '@/lib/financeFormatters.js'
import {
  createTransaction,
  deleteTransaction,
  getAccounts,
  getCategories,
  getTransactions,
  updateTransaction,
} from '@/services/financeService.js'

import '../styles/FinancePages.css'

const transactionTypes = [
  { value: 'EXPENSE', label: 'Rashod' },
  { value: 'INCOME', label: 'Prihod' },
]

function TransactionsPage() {
  const { accessToken } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    categoryId: '',
    accountId: '',
    amount: '',
    description: '',
    transactionDate: getLocalDateValue(),
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    Promise.all([
      getTransactions(accessToken, { signal: controller.signal }),
      getAccounts(accessToken, { signal: controller.signal }),
      getCategories(accessToken, { signal: controller.signal }),
    ])
      .then(([loadedTransactions, loadedAccounts, loadedCategories]) => {
        if (active) {
          setTransactions(loadedTransactions)
          setAccounts(loadedAccounts)
          setCategories(loadedCategories)
        }
      })
      .catch((loadError) => {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Podatke nije moguće učitati.')
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

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('bs-BA')

    return [...transactions]
      .filter((transaction) => typeFilter === 'ALL' || transaction.type === typeFilter)
      .filter((transaction) => {
        if (!query) {
          return true
        }

        return [
          transaction.description,
          transaction.categoryName,
          transaction.accountName,
        ]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase('bs-BA').includes(query))
      })
      .sort((first, second) =>
        second.transactionDate.localeCompare(first.transactionDate)
      )
  }, [search, transactions, typeFilter])

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
      transactionDate: getLocalDateValue(),
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
      transactionDate: transaction.transactionDate,
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const amount = Number(formData.amount)
    const categoryId = Number(formData.categoryId)
    const accountId = Number(formData.accountId)

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(categoryId) ||
      !Number.isFinite(accountId)
    ) {
      setActionError('Unesite iznos, kategoriju i račun.')
      return
    }

    const request = {
      categoryId,
      accountId,
      amount,
      description: formData.description.trim() || null,
      transactionDate: formData.transactionDate,
    }

    setActionError('')
    setIsSaving(true)

    try {
      if (dialog.mode === 'edit') {
        await updateTransaction(
          accessToken,
          dialog.transaction.id,
          request
        )
        setNotice('Transakcija je ažurirana.')
      } else {
        await createTransaction(accessToken, request)
        setNotice('Transakcija je dodana.')
      }

      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setActionError(saveError.message || 'Transakciju nije moguće sačuvati.')
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
      await deleteTransaction(accessToken, dialog.transaction.id)
      setNotice('Transakcija je obrisana.')
      setDialog(null)
      setReloadKey((key) => key + 1)
    } catch (deleteError) {
      setActionError(deleteError.message || 'Transakciju nije moguće obrisati.')
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
            <p className="finance-eyebrow">FINANSIJE / PROMET</p>
            <h1>Transakcije</h1>
            <p className="finance-page-description">
              Pratite svaki priliv i izdatak, bez nagađanja.
            </p>
          </div>
          <Button
            className="finance-primary-action"
            disabled={isLoading || Boolean(error)}
            onClick={openCreateDialog}
          >
            <Plus aria-hidden="true" size={16} />
            {isLoading ? 'Učitavanje…' : 'Nova transakcija'}
          </Button>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">U redu</button>
          </div>
        )}

        <Card className="transaction-toolbar">
          <div className="transaction-search">
            <Search aria-hidden="true" size={16} />
            <Input
              aria-label="Pretraži transakcije"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pretraži opis, kategoriju ili račun"
              value={search}
            />
          </div>
          <label className="transaction-filter">
            <span>Vrsta</span>
            <select
              aria-label="Filtriraj po vrsti transakcije"
              className="finance-select"
              onChange={(event) => setTypeFilter(event.target.value)}
              value={typeFilter}
            >
              <option value="ALL">Sve transakcije</option>
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>
        </Card>

        <section className="finance-content-section">
          <div className="finance-section-heading">
            <div>
              <p className="finance-eyebrow">EVIDENCIJA</p>
              <h2>Pregled prometa</h2>
            </div>
            <span>
              {isLoading
                ? 'Učitavanje…'
                : `${filteredTransactions.length} od ${transactions.length}`}
            </span>
          </div>

          {error ? (
            <div className="finance-error" role="alert">
              <CircleAlert aria-hidden="true" size={19} />
              <p>{error}</p>
              <Button onClick={handleRetry} variant="outline">
                <RotateCw aria-hidden="true" size={15} />
                Pokušaj ponovo
              </Button>
            </div>
          ) : isLoading ? (
            <div className="finance-loading" role="status">Učitavanje transakcija…</div>
          ) : !accounts.length || !categories.length ? (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <CircleAlert aria-hidden="true" size={21} />
              </div>
              <h3>Prvo dodajte račun i kategorije.</h3>
              <p>
                Transakcija mora biti povezana s računom i kategorijom. Kada
                budu dostupni, ovdje možete evidentirati prilive i izdatke.
              </p>
            </Card>
          ) : filteredTransactions.length ? (
            <Card className="transaction-table-card">
              <div className="transaction-table-scroll">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th scope="col">Transakcija</th>
                      <th scope="col">Datum</th>
                      <th scope="col">Račun</th>
                      <th className="amount-heading" scope="col">Iznos</th>
                      <th scope="col"><span className="sr-only">Akcije</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const isIncome = transaction.type === 'INCOME'

                      return (
                        <tr key={transaction.id}>
                          <td>
                            <div className="transaction-cell">
                              <span className={`transaction-type-icon ${isIncome ? 'is-income' : 'is-expense'}`}>
                                {isIncome ? (
                                  <ArrowDownLeft aria-hidden="true" size={17} />
                                ) : (
                                  <ArrowUpRight aria-hidden="true" size={17} />
                                )}
                              </span>
                              <span>
                                <strong>{transaction.description || transaction.categoryName}</strong>
                                <small>{transaction.categoryName}</small>
                              </span>
                            </div>
                          </td>
                          <td className="transaction-date-cell">
                            {formatFinanceDate(transaction.transactionDate)}
                          </td>
                          <td className="transaction-account-cell">
                            {transaction.accountName}
                          </td>
                          <td className={`transaction-value-cell ${isIncome ? 'is-income' : 'is-expense'}`}>
                            {isIncome ? '+' : '−'} {formatMoney(Number(transaction.amount))}
                          </td>
                          <td>
                            <div className="transaction-row-actions">
                              <Button
                                aria-label={`Uredi transakciju ${transaction.description || transaction.categoryName}`}
                                onClick={() => openEditDialog(transaction)}
                                size="sm"
                                variant="ghost"
                              >
                                Uredi
                              </Button>
                              <Button
                                aria-label={`Obriši transakciju ${transaction.description || transaction.categoryName}`}
                                className="transaction-delete-action"
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
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : transactions.length ? (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <Search aria-hidden="true" size={21} />
              </div>
              <h3>Nema rezultata za ovaj filter.</h3>
              <p>Promijenite pojam pretrage ili odaberite drugu vrstu transakcije.</p>
              <Button
                onClick={() => {
                  setSearch('')
                  setTypeFilter('ALL')
                }}
                variant="outline"
              >
                Očisti filtere
              </Button>
            </Card>
          ) : (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <ArrowDownLeft aria-hidden="true" size={21} />
              </div>
              <h3>Još nema evidentiranih transakcija.</h3>
              <p>
                Dodajte prvi prihod ili rashod kako biste dobili pregled
                kretanja novca.
              </p>
              <Button className="finance-primary-action" onClick={openCreateDialog}>
                <Plus aria-hidden="true" size={16} />
                Dodaj prvu transakciju
              </Button>
            </Card>
          )}
        </section>
      </div>

      <Dialog
        description={
          dialog?.mode === 'delete'
            ? 'Brisanje je trajno i mijenja stanje računa.'
            : 'Unesite detalje kako bi transakcija bila ispravno kategorizovana.'
        }
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        open={Boolean(dialog)}
        title={
          dialog?.mode === 'delete'
            ? 'Obrisati transakciju?'
            : dialog?.mode === 'edit'
              ? 'Uredi transakciju'
              : 'Nova transakcija'
        }
      >
        {dialog?.mode === 'delete' ? (
          <div className="finance-dialog-form">
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <p className="finance-confirm-copy">
              Želite li obrisati transakciju{' '}
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
                {isSaving ? 'Brisanje…' : 'Obriši transakciju'}
              </Button>
            </div>
          </div>
        ) : (
          <form className="finance-dialog-form" onSubmit={handleSubmit}>
            {!accounts.length && (
              <p className="finance-form-error" role="alert">
                Za unos transakcije prvo dodajte račun.{' '}
                <Link to="/accounts">Dodajte račun</Link>.
              </p>
            )}
            {!availableCategories.length && (
              <p className="finance-form-error" role="alert">
                Nema dostupnih kategorija za odabranu vrstu transakcije.
                Odaberite drugu vrstu ako su za nju dostupne kategorije.
              </p>
            )}
            <div className="finance-form-field">
              <Label htmlFor="transaction-type">Vrsta transakcije</Label>
              <select
                className="finance-select"
                id="transaction-type"
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    type: event.target.value,
                    categoryId: '',
                  }))
                }
                value={formData.type}
              >
                {transactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="transaction-category">Kategorija</Label>
              <select
                className="finance-select"
                id="transaction-category"
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
              <Label htmlFor="transaction-account">Račun</Label>
              <select
                className="finance-select"
                id="transaction-account"
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
                <Label htmlFor="transaction-amount">Iznos (KM)</Label>
                <Input
                  autoFocus
                  id="transaction-amount"
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
                <Label htmlFor="transaction-date">Datum</Label>
                <Input
                  id="transaction-date"
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      transactionDate: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={formData.transactionDate}
                />
              </div>
            </div>
            <div className="finance-form-field">
              <Label htmlFor="transaction-description">Opis</Label>
              <Input
                id="transaction-description"
                maxLength={500}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Kratka napomena (opcionalno)"
                value={formData.description}
              />
            </div>
            {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
            <div className="finance-dialog-actions">
              <Button disabled={isSaving} onClick={closeDialog} type="button" variant="outline">
                Odustani
              </Button>
              <Button
                className="finance-primary-action"
                disabled={isSaving || !accounts.length || !availableCategories.length}
                type="submit"
              >
                {isSaving
                  ? 'Čuvanje…'
                  : dialog?.mode === 'edit'
                    ? 'Sačuvaj izmjene'
                    : 'Dodaj transakciju'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  )
}

export default TransactionsPage
