
import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeftRight,
  ChartColumnIncreasing,
  LogOut,
  PiggyBank,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { useAuth } from '../hooks/useAuth.js'

import '../styles/DashboardPage.css'

const sections = [
  {
    title: 'Računi',
    description: 'Pregled bankovnih i ostalih računa.',
    icon: Wallet,
  },
  {
    title: 'Transakcije',
    description: 'Praćenje prihoda i rashoda.',
    icon: ArrowLeftRight,
  },
  {
    title: 'Budžeti',
    description: 'Planiranje mjesečne potrošnje.',
    icon: ChartColumnIncreasing,
  },
  {
    title: 'Ciljevi štednje',
    description: 'Praćenje napretka prema ciljevima.',
    icon: PiggyBank,
  },
]

function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      await logout()

      navigate('/login', {
        replace: true,
      })
    } catch {
      navigate('/login', {
        replace: true,
        state: {
          logoutWarning: true,
        },
      })
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">
              AI Finance Manager
            </p>

            <h1 className="dashboard-title">
              Kontrolna tabla
            </h1>

            <p className="dashboard-subtitle">
              Dobrodošli u aplikaciju za upravljanje
              ličnim finansijama.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut size={17} />

            {loading
              ? 'Odjavljivanje...'
              : 'Odjavi se'}
          </Button>
        </header>

        <section className="dashboard-welcome">
          <h2>Vaše finansije na jednom mjestu</h2>

          <p>
            Ovdje ćete moći pregledati račune,
            transakcije, budžete i ciljeve štednje.
          </p>
        </section>

        <section className="dashboard-sections">
          <h2>Pregled funkcionalnosti</h2>

          <div className="dashboard-grid">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <Card
                  key={section.title}
                  className="dashboard-feature-card"
                >
                  <CardHeader>
                    <div className="dashboard-feature-icon">
                      <Icon size={22} />
                    </div>

                    <CardTitle>
                      {section.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p>{section.description}</p>

                    <span className="dashboard-coming-soon">
                      Povezivanje u narednim koracima
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export default DashboardPage
