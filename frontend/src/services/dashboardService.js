const API_BASE = '/api'

async function getCollection(path, accessToken, signal) {
  let response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new Error(
      'Ne možemo se povezati sa serverom. Provjerite da li je backend pokrenut.',
      { cause: error }
    )
  }

  const responseText = await response.text()
  let result = null

  if (responseText) {
    try {
      result = JSON.parse(responseText)
    } catch {
      if (response.ok) {
        throw new Error('Server je vratio neispravan odgovor.')
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

    throw new Error(
      message || `Učitavanje podataka nije uspjelo (${response.status}).`
    )
  }

  if (!Array.isArray(result)) {
    throw new Error('Server je vratio neočekivan format podataka.')
  }

  const validCollection =
    path === '/accounts'
      ? result.every(
          (account) =>
            account &&
            account.id !== undefined &&
            account.name &&
            Number.isFinite(Number(account.currentBalance))
        )
      : result.every(
          (transaction) =>
            transaction &&
            transaction.id !== undefined &&
            Number.isFinite(Number(transaction.amount)) &&
            typeof transaction.transactionDate === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(transaction.transactionDate) &&
            ['INCOME', 'EXPENSE'].includes(transaction.type)
        )

  if (!validCollection) {
    throw new Error('Server je vratio neispravne finansijske podatke.')
  }

  return result
}

export async function getDashboardData(accessToken, { signal } = {}) {
  const [accounts, transactions] = await Promise.all([
    getCollection('/accounts', accessToken, signal),
    getCollection('/transactions', accessToken, signal),
  ])

  return { accounts, transactions }
}
