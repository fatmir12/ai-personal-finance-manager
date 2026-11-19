import { useState } from 'react'
import {
  ArrowLeftRight,
  Bell,
  ChartNoAxesCombined,
  House,
  LogOut,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.js'

import './AppShell.css'

const navigationGroups = [
  {
    label: 'PREGLED',
    items: [
      { label: 'Početna', icon: House, href: '/dashboard' },
    ],
  },
  {
    label: 'FINANSIJE',
    items: [
      { label: 'Računi', icon: WalletCards, href: '/accounts' },
      { label: 'Transakcije', icon: ArrowLeftRight, href: '/transactions' },
    ],
  },
  {
    label: 'PLANIRANJE',
    items: [
      { label: 'Budžeti', icon: ChartNoAxesCombined, href: '/budgets' },
      { label: 'Ciljevi štednje', icon: Target, href: '/saving-goals' },
      { label: 'Ponavljanja', icon: Repeat2, href: '/recurring-transactions' },
    ],
  },
  {
    label: 'AKTIVNOSTI',
    items: [
      { label: 'Obavijesti', icon: Bell, href: '/notifications' },
    ],
  },

  {
    label: 'ASISTENT',
    items: [
      { label: 'Finansijski uvidi', icon: Sparkles, href: '/assistant' },
    ],
  },
]

function AppShell({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand-line">
          <Link
            aria-label="MyWallet — početna"
            className="app-brand"
            to="/dashboard"
          >
            <span className="app-brand-name">MyWallet</span>
          </Link>
          <div className="app-sidebar-caption">
            LIČNE FINANSIJE
          </div>
        </div>

        <nav aria-label="Glavna navigacija" className="app-navigation">
          {navigationGroups.map((group) => (
            <section className="app-navigation-group" key={group.label}>
              <h2 className="app-navigation-label">{group.label}</h2>
              <ul>
                {group.items.map(({ href, icon: Icon, label }) => (
                  <li key={label}>
                    {href ? (
                      <Link
                        aria-current={pathname === href ? 'page' : undefined}
                        className={`app-navigation-link${pathname === href ? ' is-active' : ''}`}
                        to={href}
                      >
                        <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                        <span>{label}</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="app-navigation-link is-upcoming"
                        title="Dostupno u narednom modulu"
                      >
                        <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                        <span>{label}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="app-sidebar-bottom">
          <div className="app-privacy-note">
            <ShieldCheck aria-hidden="true" size={17} />
            <span>Vaše finansije ostaju privatne.</span>
          </div>
          <Button
            className="app-logout-button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            variant="ghost"
          >
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? 'Odjavljivanje…' : 'Odjavi se'}
          </Button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  )
}

export default AppShell
