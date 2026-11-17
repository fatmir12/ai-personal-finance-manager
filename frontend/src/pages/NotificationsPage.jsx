import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  CircleCheck,
  Goal,
  Repeat2,
  RotateCw,
  Trash2,
} from 'lucide-react'

import AppShell from '@/components/layout/AppShell.jsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Dialog from '@/components/ui/dialog.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { formatBosnianDateTime } from '@/lib/financeFormatters.js'
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from '@/services/financeService.js'

import '../styles/ActivityPages.css'

const notificationTypes = {
  BUDGET_ALERT: { label: 'Budžet', icon: AlertTriangle },
  SAVING_GOAL: { label: 'Cilj štednje', icon: Goal },
  RECURRING_TRANSACTION: { label: 'Ponavljanje', icon: Repeat2 },
}

function NotificationsPage() {
  const { accessToken } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    Promise.all([
      getNotifications(accessToken, { signal: controller.signal }),
      getUnreadNotificationCount(accessToken, { signal: controller.signal }),
    ])
      .then(([loadedNotifications, count]) => {
        if (active) {
          setNotifications(loadedNotifications)
          setUnreadCount(count)
        }
      })
      .catch((loadError) => {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Obavijesti nije moguće učitati.')
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

  const visibleNotifications = useMemo(
    () =>
      filter === 'UNREAD'
        ? notifications.filter((notification) => !notification.read)
        : notifications,
    [filter, notifications]
  )

  const closeDialog = () => {
    if (processingId === null) {
      setDialog(null)
      setActionError('')
    }
  }

  const handleMarkRead = async (notification) => {
    if (notification.read || processingId !== null) {
      return
    }

    setProcessingId(notification.id)
    setActionError('')

    try {
      await markNotificationAsRead(accessToken, notification.id)
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      )
      setUnreadCount((count) => Math.max(count - 1, 0))
    } catch (markError) {
      setActionError(markError.message || 'Obavijest nije moguće označiti pročitanom.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async () => {
    if (processingId !== null || dialog?.mode !== 'delete') {
      return
    }

    const notification = dialog.notification
    setProcessingId(notification.id)
    setActionError('')

    try {
      await deleteNotification(accessToken, notification.id)
      setNotifications((previous) =>
        previous.filter((item) => item.id !== notification.id)
      )
      if (!notification.read) {
        setUnreadCount((count) => Math.max(count - 1, 0))
      }
      setDialog(null)
      setNotice('Obavijest je obrisana.')
    } catch (deleteError) {
      setActionError(deleteError.message || 'Obavijest nije moguće obrisati.')
    } finally {
      setProcessingId(null)
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
            <p className="finance-eyebrow">VAŠ PROSTOR / AKTIVNOSTI</p>
            <h1>Obavijesti</h1>
            <p className="finance-page-description">
              Važni trenuci i promjene, na jednom mjestu.
            </p>
          </div>
          <div className="notification-unread-counter">
            <Bell aria-hidden="true" size={16} />
            <strong>{isLoading ? '—' : unreadCount}</strong>
            <span>nepročitano</span>
          </div>
        </header>

        {notice && (
          <div className="finance-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} type="button">U redu</button>
          </div>
        )}

        <section className="finance-content-section notification-section">
          <div className="finance-section-heading activity-section-heading">
            <div>
              <p className="finance-eyebrow">CENTAR OBAVIJESTI</p>
              <h2>Najnovije informacije</h2>
            </div>
            <label className="activity-filter">
              <span className="sr-only">Filtriraj obavijesti</span>
              <select
                aria-label="Filtriraj obavijesti"
                className="finance-select"
                onChange={(event) => setFilter(event.target.value)}
                value={filter}
              >
                <option value="ALL">Sve obavijesti</option>
                <option value="UNREAD">Nepročitane</option>
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
            <div className="finance-loading" role="status">Učitavanje obavijesti…</div>
          ) : visibleNotifications.length ? (
            <Card className="notification-list">
              {visibleNotifications.map((notification) => {
                const notificationType = notificationTypes[notification.type]
                  ?? { label: 'Obavijest', icon: Bell }
                const Icon = notificationType.icon

                return (
                  <article
                    className={`notification-item${notification.read ? ' is-read' : ' is-unread'}`}
                    key={notification.id}
                  >
                    <span className={`notification-icon notification-icon-${notification.type.toLowerCase()}`}>
                      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                    </span>
                    <div className="notification-content">
                      <div className="notification-meta">
                        <span>{notificationType.label}</span>
                        <span className="notification-date">
                          <CalendarDays aria-hidden="true" size={12} />
                          {formatBosnianDateTime(notification.createdAt)}
                        </span>
                      </div>
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <Button
                          aria-label={`Označi kao pročitano: ${notification.title}`}
                          disabled={processingId !== null}
                          onClick={() => handleMarkRead(notification)}
                          size="icon-sm"
                          title="Označi kao pročitano"
                          variant="ghost"
                        >
                          <Check aria-hidden="true" size={16} />
                        </Button>
                      )}
                      <Button
                        aria-label={`Obriši obavijest: ${notification.title}`}
                        className="activity-delete-action"
                        disabled={processingId !== null}
                        onClick={() => {
                          setActionError('')
                          setDialog({ mode: 'delete', notification })
                        }}
                        size="icon-sm"
                        title="Obriši obavijest"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </Button>
                    </div>
                  </article>
                )
              })}
            </Card>
          ) : notifications.length ? (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <CircleCheck aria-hidden="true" size={21} />
              </div>
              <h3>Nema nepročitanih obavijesti.</h3>
              <p>Sve je pregledano. Vratite se na sve obavijesti kad god želite.</p>
              <Button onClick={() => setFilter('ALL')} variant="outline">
                Prikaži sve
              </Button>
            </Card>
          ) : (
            <Card className="finance-empty-state">
              <div className="finance-empty-icon">
                <Bell aria-hidden="true" size={21} />
              </div>
              <h3>Ovdje ćete pronaći važne novosti.</h3>
              <p>
                Obavijesti o budžetima, ciljevima štednje i ponavljajućim
                transakcijama pojavit će se ovdje.
              </p>
            </Card>
          )}

          {actionError && (
            <p className="activity-action-error" role="alert">{actionError}</p>
          )}
        </section>
      </div>

      <Dialog
        description="Obavijest se trajno uklanja iz vašeg centra obavijesti."
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        open={dialog?.mode === 'delete'}
        title="Obrisati obavijest?"
      >
        <div className="finance-dialog-form">
          {actionError && <p className="finance-form-error" role="alert">{actionError}</p>}
          <p className="finance-confirm-copy">
            Želite li obrisati obavijest{' '}
            <strong>{dialog?.notification.title}</strong>?
          </p>
          <div className="finance-dialog-actions">
            <Button disabled={processingId !== null} onClick={closeDialog} variant="outline">
              Odustani
            </Button>
            <Button
              className="finance-danger-action"
              disabled={processingId !== null}
              onClick={handleDelete}
            >
              {processingId !== null ? 'Brisanje…' : 'Obriši obavijest'}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}

export default NotificationsPage
