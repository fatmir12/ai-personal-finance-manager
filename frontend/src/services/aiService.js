import { ensureCsrfToken } from './csrfService.js'

async function request(path, accessToken, { method = 'GET', body, signal } = {}) {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  if (method !== 'GET') {
    headers['X-XSRF-TOKEN'] = await ensureCsrfToken()
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new Error(
      'Nije moguće povezati se sa serverom. Provjerite da li je backend pokrenut.',
      { cause: error }
    )
  }

  const responseText = await response.text()
  let result = null

  if (responseText) {
    try {
      result = JSON.parse(responseText)
    } catch (error) {
      if (response.ok) {
        throw new Error('Server je vratio neispravan odgovor.', { cause: error })
      }
    }
  }

  if (!response.ok) {
    const message =
      typeof result?.message === 'string'
        ? result.message
        : typeof result?.detail === 'string'
          ? result.detail
          : null

    throw new Error(message || `Zahtjev nije uspio (${response.status}).`)
  }

  return result
}

function isConversation(value) {
  return (
    value &&
    value.id !== undefined &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

function isMessage(value) {
  return (
    value &&
    value.id !== undefined &&
    value.conversationId !== undefined &&
    ['USER', 'ASSISTANT'].includes(value.role) &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string'
  )
}

export async function getAiConversations(accessToken, { signal } = {}) {
  const result = await request('/ai/conversations', accessToken, { signal })

  if (!Array.isArray(result) || !result.every(isConversation)) {
    throw new Error('Server je vratio neispravnu listu AI razgovora.')
  }

  return result
}

export async function createAiConversation(accessToken, title) {
  const result = await request('/ai/conversations', accessToken, {
    method: 'POST',
    body: { title },
  })

  if (!isConversation(result)) {
    throw new Error('Server nije potvrdio kreiranje razgovora.')
  }

  return result
}

export async function deleteAiConversation(accessToken, conversationId) {
  return request(`/ai/conversations/${conversationId}`, accessToken, {
    method: 'DELETE',
  })
}

export async function getAiMessages(accessToken, conversationId, { signal } = {}) {
  const result = await request(
    `/ai/conversations/${conversationId}/messages`,
    accessToken,
    { signal }
  )

  if (
    !Array.isArray(result) ||
    !result.every(
      (message) =>
        isMessage(message) &&
        String(message.conversationId) === String(conversationId)
    )
  ) {
    throw new Error('Server je vratio neispravnu historiju razgovora.')
  }

  return result
}

export async function sendAiMessage(accessToken, conversationId, content) {
  const result = await request(
    `/ai/conversations/${conversationId}/chat`,
    accessToken,
    {
      method: 'POST',
      body: { content },
    }
  )

  if (
    !isMessage(result) ||
    String(result.conversationId) !== String(conversationId)
  ) {
    throw new Error('Server je vratio neispravan odgovor AI asistenta.')
  }

  return result
}
