import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Bot,
  Check,
  LoaderCircle,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import AppShell from '@/components/layout/AppShell.jsx'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.js'
import {
  createAiConversation,
  deleteAiConversation,
  getAiConversations,
  getAiMessages,
  sendAiMessage,
} from '@/services/aiService.js'

import '../styles/AiAssistantPage.css'

const suggestedQuestions = [
  'Koliko sam potrošio ovaj mjesec?',
  'Kako stojim sa svojim ciljevima štednje?',
  'Daj mi pregled mojih računa.',
]

const monthNames = [
  'januar',
  'februar',
  'mart',
  'april',
  'maj',
  'juni',
  'juli',
  'august',
  'septembar',
  'oktobar',
  'novembar',
  'decembar',
]

function parseDate(value) {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

function formatTime(value) {
  const date = parseDate(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatConversationDate(value) {
  const date = parseDate(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const time = formatTime(value)

  return isToday
    ? `Danas · ${time}`
    : `${date.getDate()}. ${monthNames[date.getMonth()]} · ${time}`
}

function getConversationTitle(content) {
  const title = content.trim().replace(/\s+/g, ' ')
  return title.length > 150 ? `${title.slice(0, 147)}...` : title
}

function AiAssistantPage() {
  const { accessToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const initialPrompt =
    typeof location.state?.aiPrompt === 'string'
      ? location.state.aiPrompt
      : ''
  const [startWithNewConversation] = useState(Boolean(initialPrompt.trim()))
  const [autoSendPrompt] = useState(Boolean(location.state?.autoSend))
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [composer, setComposer] = useState(initialPrompt)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [conversationError, setConversationError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [actionError, setActionError] = useState('')
  const messageLoadVersion = useRef(0)
  const skipMessageLoadFor = useRef(null)
  const messageEndRef = useRef(null)
  const startWithNewConversationRef = useRef(startWithNewConversation)
  const autoSendPromptRef = useRef(autoSendPrompt)
  const composerFormRef = useRef(null)
  const sendingControllerRef = useRef(null)
  const selectedConversation = conversations.find(
    (conversation) =>
      String(conversation.id) === String(selectedConversationId)
  )

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getAiConversations(accessToken, { signal: controller.signal })
      .then((result) => {
        if (active) {
          setConversations(result)
          setConversationError('')
          if (result.length > 0 && !startWithNewConversationRef.current) {
            setIsLoadingMessages(true)
            setSelectedConversationId(result[0].id)
          }
        }
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') {
          setConversationError(
            error.message || 'Razgovore nije moguće učitati.'
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingConversations(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [accessToken])

  useEffect(() => {
    if (location.state?.aiPrompt) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (
      !isLoadingConversations &&
      autoSendPromptRef.current &&
      composer.trim()
    ) {
      autoSendPromptRef.current = false
      composerFormRef.current?.requestSubmit()
    }
  }, [composer, isLoadingConversations])

  useEffect(() => {
    if (selectedConversationId === null) {
      return undefined
    }

    if (String(skipMessageLoadFor.current) === String(selectedConversationId)) {
      skipMessageLoadFor.current = null
      return undefined
    }

    const controller = new AbortController()
    const requestVersion = ++messageLoadVersion.current

    getAiMessages(accessToken, selectedConversationId, {
      signal: controller.signal,
    })
      .then((result) => {
        if (requestVersion === messageLoadVersion.current) {
          setMessages(result)
        }
      })
      .catch((error) => {
        if (requestVersion === messageLoadVersion.current && error.name !== 'AbortError') {
          setMessageError(error.message || 'Poruke nije moguće učitati.')
        }
      })
      .finally(() => {
        if (requestVersion === messageLoadVersion.current) {
          setIsLoadingMessages(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [accessToken, selectedConversationId])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const handleNewConversation = () => {
    if (isSending || isDeleting) {
      return
    }

    setSelectedConversationId(null)
    setMessages([])
    setIsLoadingMessages(false)
    setComposer('')
    setMessageError('')
    setActionError('')
  }

  const handleSelectConversation = (conversationId) => {
    if (
      isSending ||
      isDeleting ||
      String(selectedConversationId) === String(conversationId)
    ) {
      return
    }

    setSelectedConversationId(conversationId)
    setMessages([])
    setIsLoadingMessages(true)
    setMessageError('')
    setActionError('')
  }

  const handleDeleteConversation = async (conversation) => {
    if (
      isSending ||
      isDeleting ||
      !window.confirm(`Obrisati razgovor „${conversation.title}“?`)
    ) {
      return
    }

    setActionError('')
    setIsDeleting(true)

    try {
      await deleteAiConversation(accessToken, conversation.id)
      const remaining = conversations.filter(
        (item) => String(item.id) !== String(conversation.id)
      )
      setConversations(remaining)

      if (String(selectedConversationId) === String(conversation.id)) {
        setMessages([])
        setIsLoadingMessages(remaining.length > 0)
        setSelectedConversationId(remaining[0]?.id ?? null)
      }
    } catch (error) {
      setActionError(error.message || 'Razgovor nije moguće obrisati.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStopGenerating = () => {
    if (!isSending) {
      return
    }

    sendingControllerRef.current?.abort()
    sendingControllerRef.current = null
    setIsSending(false)
    setMessageError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const content = composer.trim()

    if (!content || isSending || isLoadingMessages || isLoadingConversations) {
      return
    }

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      conversationId: selectedConversationId,
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessageError('')
    setActionError('')
    setComposer('')
    setMessages((current) => [...current, optimisticMessage])
    setIsSending(true)
    const controller = new AbortController()
    sendingControllerRef.current = controller
    let conversation = selectedConversation

    try {
      if (!conversation) {
        conversation = await createAiConversation(
          accessToken,
          getConversationTitle(content)
        )
        setConversationError('')
        setConversations((current) => [conversation, ...current])
        skipMessageLoadFor.current = conversation.id
        setSelectedConversationId(conversation.id)
      }

      const assistantMessage = await sendAiMessage(
        accessToken,
        conversation.id,
        content,
        { signal: controller.signal }
      )
      const userMessage = {
        id: optimisticMessage.id,
        conversationId: conversation.id,
        role: 'USER',
        content,
        createdAt: new Date().toISOString(),
      }

      setMessages((current) => [
        ...current.filter((message) =>
          String(message.id) !== String(optimisticMessage.id)
        ),
        userMessage,
        assistantMessage,
      ])

      const updatedConversation = {
        ...conversation,
        updatedAt: new Date().toISOString(),
      }
      setConversations((current) =>
        [
          updatedConversation,
          ...current.filter(
            (item) => String(item.id) !== String(conversation.id)
          ),
        ]
      )
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages((current) => current.filter((message) =>
          String(message.id) !== String(optimisticMessage.id)
        ))
        setMessageError(error.message || 'Poruku nije moguće poslati.')
      }
    } finally {
      if (sendingControllerRef.current === controller) {
        sendingControllerRef.current = null
      }
      setIsSending(false)
    }
  }

  return (
    <AppShell>
      <div className="ai-page">
        <header className="ai-page-heading">
          <div>
            <p className="ai-eyebrow">
              <Sparkles aria-hidden="true" size={14} />
              LIČNI FINANSIJSKI ASISTENT
            </p>
            <h1>Razgovaraj sa svojim finansijama.</h1>
            <p className="ai-page-description">
              Jasni odgovori i praktični uvidi, zasnovani na tvojim podacima.
            </p>
          </div>
          <div className="ai-privacy-badge">
            <ShieldCheck aria-hidden="true" size={15} />
            Privatni razgovori
          </div>
        </header>

        <section className="ai-workspace" aria-label="AI finansijski asistent">
          <aside className="ai-conversation-sidebar">
            <div className="ai-conversation-heading">
              <div>
                <span className="ai-section-kicker">TVOJ PROSTOR</span>
                <h2>Razgovori</h2>
              </div>
              <Button
                aria-label="Novi razgovor"
                className="ai-new-conversation"
                disabled={isSending || isDeleting}
                onClick={handleNewConversation}
                size="icon"
                title="Novi razgovor"
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" size={17} />
              </Button>
            </div>

            {isLoadingConversations ? (
              <div className="ai-sidebar-status" role="status">
                <LoaderCircle aria-hidden="true" className="ai-spin" size={16} />
                Učitavanje razgovora…
              </div>
            ) : conversationError ? (
              <p className="ai-inline-error" role="alert">{conversationError}</p>
            ) : conversations.length === 0 ? (
              <p className="ai-sidebar-empty">
                Ovdje će se pojaviti tvoji razgovori.
              </p>
            ) : (
              <ul className="ai-conversation-list">
                {conversations.map((conversation) => {
                  const isSelected =
                    String(selectedConversationId) === String(conversation.id)

                  return (
                    <li key={conversation.id}>
                      <div className="ai-conversation-row">
                        <button
                          aria-current={isSelected ? 'page' : undefined}
                          className={`ai-conversation-item${isSelected ? ' is-selected' : ''}`}
                          disabled={isSending || isDeleting}
                          onClick={() => handleSelectConversation(conversation.id)}
                          type="button"
                        >
                          <span className="ai-conversation-icon">
                            <MessageCircle aria-hidden="true" size={15} />
                          </span>
                          <span className="ai-conversation-copy">
                            <span className="ai-conversation-title">
                              {conversation.title}
                            </span>
                            <span className="ai-conversation-date">
                              {formatConversationDate(conversation.updatedAt)}
                            </span>
                          </span>
                        </button>
                        <button
                          aria-label={`Obriši razgovor: ${conversation.title}`}
                          className="ai-delete-conversation"
                          disabled={isSending || isDeleting}
                          onClick={() => handleDeleteConversation(conversation)}
                          title="Obriši razgovor"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {actionError && (
              <p className="ai-inline-error" role="alert">{actionError}</p>
            )}

            <div className="ai-sidebar-footnote">
              <span className="ai-sidebar-footnote-icon">
                <Check aria-hidden="true" size={13} />
              </span>
              <span>Odgovori se oslanjaju na tvoje finansijske podatke.</span>
            </div>
          </aside>

          <div className="ai-chat-panel">
            <div className="ai-chat-topbar">
              <div className="ai-assistant-identity">
                <span className="ai-assistant-avatar">
                  <Bot aria-hidden="true" size={19} />
                </span>
                <div>
                  <strong>Finansijski asistent</strong>
                  <span><i /> Spreman za pitanje</span>
                </div>
              </div>
              {selectedConversation && (
                <span className="ai-chat-topic">
                  {selectedConversation.title}
                </span>
              )}
            </div>

            <div className="ai-messages" aria-live="polite">
              {isLoadingMessages ? (
                <div className="ai-chat-loading" role="status">
                  <LoaderCircle aria-hidden="true" className="ai-spin" size={19} />
                  Učitavanje poruka…
                </div>
              ) : messageError && messages.length === 0 ? (
                <div className="ai-chat-empty-state">
                  <span className="ai-empty-icon">
                    <MessageCircle aria-hidden="true" size={22} />
                  </span>
                  <h2>Razgovor nije dostupan</h2>
                  <p>{messageError}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="ai-welcome-state">
                  <span className="ai-welcome-orbit ai-welcome-orbit-one" />
                  <span className="ai-welcome-orbit ai-welcome-orbit-two" />
                  <span className="ai-welcome-icon">
                    <Sparkles aria-hidden="true" size={22} />
                  </span>
                  <span className="ai-section-kicker">FINANSIJSKI PREGLED</span>
                  <h2>
                    Sve o vašem novcu,
                    <br />
                    <em>na jednom mjestu.</em>
                  </h2>
                  <p>
                    Postavite pitanje o potrošnji, računima ili štednji.
                  </p>
                  <div className="ai-suggestions">
                    {suggestedQuestions.map((question) => (
                      <button
                        className="ai-suggestion"
                        disabled={isSending || isLoadingConversations}
                        key={question}
                        onClick={() => setComposer(question)}
                        type="button"
                      >
                        <span>{question}</span>
                        <ArrowUp aria-hidden="true" size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ai-message-list">
                  {messages.map((message) => {
                    const isAssistant = message.role === 'ASSISTANT'

                    return (
                      <article
                        className={`ai-message${isAssistant ? ' is-assistant' : ' is-user'}`}
                        key={message.id}
                      >
                        {isAssistant && (
                          <span className="ai-message-avatar">
                            <Sparkles aria-hidden="true" size={14} />
                          </span>
                        )}
                        <div className="ai-message-body">
                          <div className="ai-message-meta">
                            <strong>{isAssistant ? 'Finansijski asistent' : 'Vi'}</strong>
                            <time dateTime={message.createdAt}>
                              {formatTime(message.createdAt)}
                            </time>
                          </div>
                          <p>{message.content}</p>
                        </div>
                      </article>
                    )
                  })}
                  {isSending && (
                    <div className="ai-typing-indicator" role="status">
                      <span className="ai-message-avatar">
                        <Sparkles aria-hidden="true" size={14} />
                      </span>
                      <span>
                        Asistent priprema odgovor
                        <i /><i /><i />
                      </span>
                    </div>
                  )}
                  {messageError && (
                    <p className="ai-inline-error ai-message-error" role="alert">
                      {messageError}
                    </p>
                  )}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            <form
              className="ai-composer"
              onSubmit={handleSubmit}
              ref={composerFormRef}
            >
              <label className="sr-only" htmlFor="ai-message">
                Napiši poruku za finansijskog asistenta
              </label>
              <textarea
                id="ai-message"
                maxLength={10000}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="Pitaj nešto o svojim finansijama…"
                value={composer}
              />
              <div className="ai-composer-footer">
                <span>
                  <ShieldCheck aria-hidden="true" size={13} />
                  Privatni finansijski podaci
                  <span className="ai-composer-hint">· Enter za slanje</span>
                </span>
                <Button
                  aria-label={isSending ? 'Zaustavi odgovor' : 'Pošalji poruku'}
                  className="ai-send-button"
                  disabled={
                    (!isSending && !composer.trim()) ||
                    isLoadingMessages ||
                    isLoadingConversations
                  }
                  onClick={isSending ? handleStopGenerating : undefined}
                  size="icon"
                  type={isSending ? 'button' : 'submit'}
                >
                  {isSending ? (
                    <Square aria-hidden="true" size={15} fill="currentColor" />
                  ) : (
                    <ArrowUp aria-hidden="true" size={18} />
                  )}
                </Button>
              </div>
            </form>
            <p className="ai-disclaimer">
              Asistent može pogriješiti. Važne odluke provjeri prema svojim
              finansijskim evidencijama.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default AiAssistantPage
