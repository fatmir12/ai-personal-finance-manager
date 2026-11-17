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
        : path === '/transactions'
          ? result.every(
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
          : path === '/budgets'
            ? result.every(
                (budget) =>
                  budget &&
                  budget.id !== undefined &&
                  budget.categoryId !== undefined &&
                  Number.isFinite(Number(budget.amountLimit)) &&
                  Number.isFinite(Number(budget.spentAmount)) &&
                  Number.isInteger(Number(budget.month)) &&
                  Number.isInteger(Number(budget.year))
              )
            : result.every(
                (goal) =>
                  goal &&
                  goal.id !== undefined &&
                  typeof goal.name === 'string' &&
                  Number.isFinite(Number(goal.targetAmount)) &&
                  Number.isFinite(Number(goal.currentAmount)) &&
                  Number.isFinite(Number(goal.remainingAmount)) &&
                  Number.isFinite(Number(goal.progressPercentage)) &&
                  (goal.targetDate === null ||
                    goal.targetDate === undefined ||
                    (typeof goal.targetDate === 'string' &&
                      /^\d{4}-\d{2}-\d{2}$/.test(goal.targetDate)))
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

export function getBudgets(accessToken, { signal } = {}) {
  return getCollection('/budgets', accessToken, signal)
}

export function getSavingGoals(accessToken, { signal } = {}) {
  return getCollection('/saving-goals', accessToken, signal)
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

export function createBudget(accessToken, budget) {
  return request('/budgets', accessToken, {
    method: 'POST',
    body: budget,
  })
}

export function updateBudget(accessToken, id, budget) {
  return request(`/budgets/${id}`, accessToken, {
    method: 'PUT',
    body: budget,
  })
}

export function deleteBudget(accessToken, id) {
  return request(`/budgets/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export function createSavingGoal(accessToken, goal) {
  return request('/saving-goals', accessToken, {
    method: 'POST',
    body: goal,
  })
}

export function updateSavingGoal(accessToken, id, goal) {
  return request(`/saving-goals/${id}`, accessToken, {
    method: 'PUT',
    body: goal,
  })
}

export function deleteSavingGoal(accessToken, id) {
  return request(`/saving-goals/${id}`, accessToken, {
    method: 'DELETE',
  })
}
