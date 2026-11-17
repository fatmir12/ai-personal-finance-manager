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

export async function ensureCsrfToken() {
  let token = getCsrfToken()

  if (token) {
    return token
  }

  let response

  try {
    response = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    })
  } catch (error) {
    throw new Error(
      'Nije moguće povezati se sa serverom.',
      { cause: error }
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
