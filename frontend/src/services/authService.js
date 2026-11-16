
const AUTH_API = '/api/auth'

let refreshPromise = null

function getCsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))

  if (!cookie) {
    return null
  }

  return decodeURIComponent(
    cookie.substring('XSRF-TOKEN='.length)
  )
}

async function ensureCsrfToken() {
  let token = getCsrfToken()

  if (token) {
    return token
  }

  let response

  try {
    response = await fetch(`${AUTH_API}/csrf`, {
      method: 'GET',
      credentials: 'same-origin',
    })
  } catch {
    throw new Error(
      'Nije moguće povezati se sa serverom.'
    )
  }

  if (!response.ok) {
    throw new Error(
      'Nije moguće pripremiti sigurnosni token.'
    )
  }

  token = getCsrfToken()

  if (!token) {
    throw new Error(
      'CSRF token nije dostupan.'
    )
  }

  return token
}

async function sendAuthRequest(endpoint, data) {
  const csrfToken = await ensureCsrfToken()

  const headers = {
    'X-XSRF-TOKEN': csrfToken,
  }

  if (data !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(`${AUTH_API}${endpoint}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      ...(data !== undefined
        ? { body: JSON.stringify(data) }
        : {}),
    })
  } catch {
    throw new Error(
      'Nije moguće povezati se sa serverom. Provjerite da li je backend pokrenut.'
    )
  }

  const responseText = await response.text()
  let result = null

  if (responseText) {
    try {
      result = JSON.parse(responseText)
    } catch {
      throw new Error(
        'Server je vratio neispravan odgovor.'
      )
    }
  }

  if (!response.ok) {
    const message =
      typeof result?.message === 'string'
        ? result.message
        : typeof result?.detail === 'string'
          ? result.detail
          : null

    throw new Error(
      message || `Zahtjev nije uspio (${response.status}).`
    )
  }

  return result
}

function validateAuthResponse(result) {
  if (
    !result?.accessToken ||
    result?.tokenType !== 'Bearer'
  ) {
    throw new Error(
      'Server nije vratio ispravan access token.'
    )
  }

  return {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
  }
}

export async function registerUser(userData) {
  return sendAuthRequest('/register', {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
  })
}

export async function loginUser(email, password) {
  const result = await sendAuthRequest('/login', {
    email,
    password,
  })

  return validateAuthResponse(result)
}

export async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const result = await sendAuthRequest('/refresh')

    return validateAuthResponse(result)
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export async function logoutUser() {
  return sendAuthRequest('/logout')
}
