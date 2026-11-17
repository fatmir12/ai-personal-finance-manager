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

    throw new Error(
      message || `Zahtjev nije uspio (${response.status}).`
    )
  }

  return result
}

async function getCollection(path, accessToken, signal) {
  const result = await request(path, accessToken, { signal })

  if (!Array.isArray(result)) {
    throw new Error('Server je vratio neočekivan format podataka.')
  }

  const isValid =
    path === '/accounts'
      ? result.every(
          (account) =>
            account &&
            account.id !== undefined &&
            typeof account.name === 'string' &&
            ['CASH', 'BANK', 'SAVINGS'].includes(account.type) &&
            Number.isFinite(Number(account.initialBalance)) &&
            Number.isFinite(Number(account.currentBalance))
        )
      : path === '/categories'
        ? result.every(
            (category) =>
              category &&
              category.id !== undefined &&
              typeof category.name === 'string' &&
              ['INCOME', 'EXPENSE'].includes(category.type)
          )
        : result.every(
            (transaction) =>
              transaction &&
              transaction.id !== undefined &&
              transaction.categoryId !== undefined &&
              transaction.accountId !== undefined &&
              ['INCOME', 'EXPENSE'].includes(transaction.type) &&
              Number.isFinite(Number(transaction.amount)) &&
              typeof transaction.transactionDate === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(transaction.transactionDate)
          )

  if (!isValid) {
    throw new Error('Server je vratio neispravne finansijske podatke.')
  }

  return result
}

export function getAccounts(accessToken, { signal } = {}) {
  return getCollection('/accounts', accessToken, signal)
}

export function getCategories(accessToken, { signal } = {}) {
  return getCollection('/categories', accessToken, signal)
}

export function getTransactions(accessToken, { signal } = {}) {
  return getCollection('/transactions', accessToken, signal)
}

export function createAccount(accessToken, account) {
  return request('/accounts', accessToken, {
    method: 'POST',
    body: account,
  })
}

export function updateAccount(accessToken, id, account) {
  return request(`/accounts/${id}`, accessToken, {
    method: 'PUT',
    body: account,
  })
}

export function deleteAccount(accessToken, id) {
  return request(`/accounts/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export function createTransaction(accessToken, transaction) {
  return request('/transactions', accessToken, {
    method: 'POST',
    body: transaction,
  })
}

export function updateTransaction(accessToken, id, transaction) {
  return request(`/transactions/${id}`, accessToken, {
    method: 'PUT',
    body: transaction,
  })
}

export function deleteTransaction(accessToken, id) {
  return request(`/transactions/${id}`, accessToken, {
    method: 'DELETE',
  })
}
