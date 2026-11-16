
const AUTH_API = '/api/auth'

async function sendAuthRequest(endpoint, data) {
  let response

  try {
    response = await fetch(`${AUTH_API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
      throw new Error('Server je vratio neispravan odgovor.')
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
      message || 'Zahtjev nije uspio. Provjerite unesene podatke.'
    )
  }

  return result
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

  if (
    !result?.accessToken ||
    !result?.refreshToken ||
    result?.tokenType !== 'Bearer'
  ) {
    throw new Error(
      'Server nije vratio očekivane podatke za prijavu.'
    )
  }

  return result
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) {
    return
  }

  return sendAuthRequest('/logout', {
    refreshToken,
  })
}
