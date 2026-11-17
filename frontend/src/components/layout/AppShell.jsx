import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  House,
  LogOut,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

import './AppShell.css'

const navigationGroups = [
  {
    label: 'PREGLED',
    items: [
      { label: 'Početna', icon: House, href: '/dashboard', active: true },
    ],
  },
  {
    label: 'FINANSIJE',
    items: [
      { label: 'Računi', icon: WalletCards },
      { label: 'Transakcije', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'PLANIRANJE',
    items: [
      { label: 'Budžeti', icon: ChartNoAxesCombined },
      { label: 'Ciljevi štednje', icon: Target },
      { label: 'Ponavljanja', icon: Repeat2 },
    ],
  },
  {
    label: 'ASISTENT',
    items: [
      { label: 'Finansijski uvidi', icon: Sparkles },
    ],
  },
]

function AppShell({ children, isLoggingOut, onLogout }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link
          aria-label="Saldo — početna"
          className="app-brand"
          to="/dashboard"
        >
          <span className="app-brand-mark">s</span>
          <span className="app-brand-name">saldo</span>
        </Link>

        <div className="app-sidebar-caption">
          LIČNE FINANSIJE
        </div>

        <nav aria-label="Glavna navigacija" className="app-navigation">
          {navigationGroups.map((group) => (
            <section className="app-navigation-group" key={group.label}>
              <h2 className="app-navigation-label">{group.label}</h2>
              <ul>
                {group.items.map(({ active, href, icon: Icon, label }) => (
                  <li key={label}>
                    {active ? (
                      <Link
                        aria-current="page"
                        className="app-navigation-link is-active"
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
            onClick={onLogout}
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
