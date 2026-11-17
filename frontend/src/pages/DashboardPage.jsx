import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  Landmark,
  RotateCw,
  Wallet,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell.jsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth.js'
import { getDashboardData } from '@/services/dashboardService.js'

import '../styles/DashboardPage.css'

const FinanceTrendChart = lazy(
  () => import('@/components/dashboard/FinanceTrendChart.jsx')
)

const amountFormatter = new Intl.NumberFormat('bs-BA', {
  style: 'currency',
  currency: 'BAM',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('bs-BA', {
  day: 'numeric',
  month: 'short',
})

const monthFormatter = new Intl.DateTimeFormat('bs-BA', {
  month: 'short',
})

function toAmount(value) {
  return Number(value)
}

function toDate(value) {
  return new Date(`${value}T00:00:00`)
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatAmount(value) {
  return amountFormatter.format(value)
}

function formatSignedAmount(value, type) {
  const sign = type === 'EXPENSE' ? '−' : '+'
  return `${sign} ${formatAmount(Math.abs(value))}`
}

function getMonthlyData(transactions) {
  const today = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1)

    return {
      key: getMonthKey(date),
      label: monthFormatter.format(date).replace('.', ''),
      prihod: 0,
      rashod: 0,
    }
  })

  const monthByKey = new Map(months.map((month) => [month.key, month]))

  transactions.forEach((transaction) => {
    const month = monthByKey.get(getMonthKey(toDate(transaction.transactionDate)))

    if (!month) {
      return
    }

    if (transaction.type === 'INCOME') {
      month.prihod += toAmount(transaction.amount)
    } else if (transaction.type === 'EXPENSE') {
      month.rashod += toAmount(transaction.amount)
    }
  })

  return months
}

function getCurrentMonthSummary(transactions) {
  const now = new Date()
  const currentMonth = getMonthKey(now)
  const thisMonth = transactions.filter(
    (transaction) =>
      getMonthKey(toDate(transaction.transactionDate)) === currentMonth
  )

  return {
    income: thisMonth
      .filter((transaction) => transaction.type === 'INCOME')
      .reduce((sum, transaction) => sum + toAmount(transaction.amount), 0),
    expenses: thisMonth
      .filter((transaction) => transaction.type === 'EXPENSE')
      .reduce((sum, transaction) => sum + toAmount(transaction.amount), 0),
    expensesByCategory: Object.values(
      thisMonth
        .filter((transaction) => transaction.type === 'EXPENSE')
        .reduce((categories, transaction) => {
          const name = transaction.categoryName || 'Ostalo'
          categories[name] ??= { name, amount: 0 }
          categories[name].amount += toAmount(transaction.amount)
          return categories
        }, {})
    ).sort((first, second) => second.amount - first.amount),
  }
}

function DashboardPage() {
  const navigate = useNavigate()
  const { accessToken, logout } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getDashboardData(accessToken, { signal: controller.signal })
      .then((data) => {
        if (active) {
          setDashboardData(data)
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

  const summary = useMemo(
    () => getCurrentMonthSummary(dashboardData?.transactions ?? []),
    [dashboardData]
  )

  const monthlyData = useMemo(
    () => getMonthlyData(dashboardData?.transactions ?? []),
    [dashboardData]
  )

  const recentTransactions = useMemo(
    () =>
      [...(dashboardData?.transactions ?? [])]
        .sort((first, second) =>
          second.transactionDate.localeCompare(first.transactionDate)
        )
        .slice(0, 5),
    [dashboardData]
  )

  const totalBalance = useMemo(
    () =>
      (dashboardData?.accounts ?? []).reduce(
        (sum, account) => sum + toAmount(account.currentBalance),
        0
      ),
    [dashboardData]
  )

  const maxCategoryAmount = summary.expensesByCategory[0]?.amount || 1
  const todayLabel = new Intl.DateTimeFormat('bs-BA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const handleRetry = () => {
    setIsLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', {
        replace: true,
        state: { logoutWarning: true },
      })
    }
  }

  return (
    <AppShell isLoggingOut={isLoggingOut} onLogout={handleLogout}>
      <div className="dashboard-page">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <span>Moj prostor</span>
            <i aria-hidden="true">/</i>
            <strong>Pregled</strong>
          </div>
          <div className="dashboard-date">
            <CalendarDays aria-hidden="true" size={15} />
            <span>{todayLabel}</span>
          </div>
        </header>

        <section className="dashboard-intro">
          <div>
            <p className="dashboard-eyebrow">VAŠ FINANSIJSKI PREGLED</p>
            <h1>Dobro došli nazad.</h1>
            <p className="dashboard-intro-copy">
              Vaš novac, jasnije posložen.
            </p>
          </div>
          <div className="dashboard-period">
            <span className="dashboard-period-dot" />
            Ovaj mjesec
          </div>
        </section>

        <section aria-label="Ukupni saldo" className="dashboard-balance-banner">
          <div className="balance-banner-copy">
            <span>UKUPNO STANJE</span>
            <h2>{isLoading ? '—' : formatAmount(totalBalance)}</h2>
            <p>
              Zbir stanja na {dashboardData?.accounts.length ?? 0}{' '}
              {(dashboardData?.accounts.length ?? 0) === 1 ? 'računu' : 'računa'}
            </p>
          </div>
          <div aria-hidden="true" className="balance-banner-art">
            <span className="balance-art-ring balance-art-ring-one" />
            <span className="balance-art-ring balance-art-ring-two" />
            <span className="balance-art-dot" />
            <Wallet size={29} strokeWidth={1.4} />
          </div>
          <div className="balance-banner-foot">
            <span>Saldo svih računa</span>
            <span className="balance-foot-mark">KM</span>
          </div>
        </section>

        {error ? (
          <section aria-live="polite" className="dashboard-error">
            <div className="dashboard-error-icon">
              <CircleAlert aria-hidden="true" size={20} />
            </div>
            <div>
              <h2>Pregled trenutno nije dostupan</h2>
              <p>{error}</p>
            </div>
            <Button
              className="dashboard-retry"
              onClick={handleRetry}
              variant="outline"
            >
              <RotateCw aria-hidden="true" size={15} />
              Pokušaj ponovo
            </Button>
          </section>
        ) : (
          <>
            <section aria-label="Mjesečni sažetak" className="dashboard-metrics">
              <MetricCard
                icon={ArrowDownLeft}
                label="Prihodi ovog mjeseca"
                loading={isLoading}
                tone="income"
                value={summary.income}
              />
              <MetricCard
                icon={ArrowUpRight}
                label="Rashodi ovog mjeseca"
                loading={isLoading}
                tone="expense"
                value={summary.expenses}
              />
              <MetricCard
                icon={Landmark}
                label="Aktivni računi"
                loading={isLoading}
                tone="accounts"
                value={dashboardData?.accounts.length ?? 0}
                isCount
              />
            </section>

            <section className="dashboard-insights-grid">
              <Card className="dashboard-panel dashboard-trend-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <p className="dashboard-eyebrow">KRETANJE NOVCA</p>
                    <h2>Prihodi i rashodi</h2>
                  </div>
                  <div className="chart-legend">
                    <span><i className="legend-income" /> Prihodi</span>
                    <span><i className="legend-expense" /> Rashodi</span>
                  </div>
                </div>
                <div className="dashboard-chart">
                  {isLoading ? (
                    <div className="dashboard-chart-loading" role="status">
                      Učitavanje pregleda…
                    </div>
                  ) : (
                    <Suspense
                      fallback={
                        <div className="dashboard-chart-loading" role="status">
                          Priprema grafikona…
                        </div>
                      }
                    >
                      <FinanceTrendChart data={monthlyData} />
                    </Suspense>
                  )}
                </div>
                <p className="dashboard-chart-caption">
                  Mjesečni pregled prometa za posljednjih šest mjeseci.
                </p>
              </Card>

              <Card className="dashboard-panel dashboard-category-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <p className="dashboard-eyebrow">STRUKTURA POTROŠNJE</p>
                    <h2>Gdje odlazi novac</h2>
                  </div>
                  <span className="dashboard-category-period">OVAJ MJESEC</span>
                </div>
                {isLoading ? (
                  <div className="dashboard-list-loading" role="status">
                    Učitavanje kategorija…
                  </div>
                ) : summary.expensesByCategory.length ? (
                  <ul className="dashboard-category-list">
                    {summary.expensesByCategory.slice(0, 5).map((category, index) => (
                      <li key={category.name}>
                        <div className="category-row">
                          <span className={`category-swatch category-swatch-${index % 5}`} />
                          <span className="category-name">{category.name}</span>
                          <strong>{formatAmount(category.amount)}</strong>
                        </div>
                        <div
                          aria-label={`${Math.round((category.amount / maxCategoryAmount) * 100)}% od najveće kategorije`}
                          className="category-track"
                          role="img"
                        >
                          <span
                            className={`category-fill category-fill-${index % 5}`}
                            style={{
                              width: `${Math.max(4, (category.amount / maxCategoryAmount) * 100)}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="dashboard-empty-note">
                    <span className="empty-note-mark">↗</span>
                    <p>Potrošnja će se ovdje prikazati kada unesete prve transakcije.</p>
                  </div>
                )}
                <div className="dashboard-category-total">
                  <span>Ukupni rashodi</span>
                  <strong>{isLoading ? '—' : formatAmount(summary.expenses)}</strong>
                </div>
              </Card>
            </section>

            <section className="dashboard-activity-section">
              <div className="dashboard-activity-heading">
                <div>
                  <p className="dashboard-eyebrow">NEDAVNO</p>
                  <h2>Posljednje aktivnosti</h2>
                </div>
                <span className="dashboard-activity-count">
                  {isLoading ? '…' : `${dashboardData?.transactions.length ?? 0} ukupno`}
                </span>
              </div>

              <Card className="dashboard-panel dashboard-activity-panel">
                {isLoading ? (
                  <div className="dashboard-list-loading" role="status">
                    Učitavanje transakcija…
                  </div>
                ) : recentTransactions.length ? (
                  <ul className="transaction-list">
                    {recentTransactions.map((transaction) => {
                      const isIncome = transaction.type === 'INCOME'

                      return (
                        <li className="transaction-row" key={transaction.id}>
                          <span className={`transaction-icon ${isIncome ? 'is-income' : 'is-expense'}`}>
                            {isIncome ? (
                              <ArrowDownLeft aria-hidden="true" size={17} />
                            ) : (
                              <ArrowUpRight aria-hidden="true" size={17} />
                            )}
                          </span>
                          <span className="transaction-main">
                            <strong>{transaction.description || transaction.categoryName || 'Transakcija'}</strong>
                            <span>{transaction.categoryName || 'Ostalo'} · {transaction.accountName || 'Račun'}</span>
                          </span>
                          <span className="transaction-date">
                            {dateFormatter.format(toDate(transaction.transactionDate))}
                          </span>
                          <strong className={`transaction-amount ${isIncome ? 'is-income' : 'is-expense'}`}>
                            {formatSignedAmount(toAmount(transaction.amount), transaction.type)}
                          </strong>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="dashboard-empty-activity">
                    <div className="empty-activity-icon">
                      <ArrowRight aria-hidden="true" size={18} />
                    </div>
                    <div>
                      <strong>Vaša priča počinje ovdje.</strong>
                      <p>Kada evidentirate transakcije, ovdje ćete imati jasan pregled kretanja novca.</p>
                    </div>
                  </div>
                )}
              </Card>
            </section>
          </>
        )}

        <footer className="dashboard-footer">
          <span>Saldo</span>
          <span>Jasnoća u svakom iznosu.</span>
        </footer>
      </div>
    </AppShell>
  )
}

function MetricCard({ icon: Icon, label, loading, tone, value, isCount = false }) {
  return (
    <Card className="dashboard-metric-card">
      <div className={`metric-icon metric-icon-${tone}`}>
        <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
      </div>
      <p>{label}</p>
      <strong>{loading ? '—' : isCount ? value : formatAmount(value)}</strong>
    </Card>
  )
}

export default DashboardPage
