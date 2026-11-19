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

function isValidCollection(path, result) {
  switch (path) {
    case '/accounts':
      return result.every(
        (account) =>
          account &&
          account.id !== undefined &&
          typeof account.name === 'string' &&
          ['CASH', 'BANK', 'SAVINGS'].includes(account.type) &&
          Number.isFinite(Number(account.initialBalance)) &&
          Number.isFinite(Number(account.currentBalance))
      )
    case '/categories':
      return result.every(
        (category) =>
          category &&
          category.id !== undefined &&
          typeof category.name === 'string' &&
          ['INCOME', 'EXPENSE'].includes(category.type)
      )
    case '/transactions':
      return result.every(
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
    case '/budgets':
      return result.every(
        (budget) =>
          budget &&
          budget.id !== undefined &&
          budget.categoryId !== undefined &&
          Number.isFinite(Number(budget.amountLimit)) &&
          Number.isFinite(Number(budget.spentAmount)) &&
          Number.isInteger(Number(budget.month)) &&
          Number.isInteger(Number(budget.year))
      )
    case '/saving-goals':
      return result.every(
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
    case '/recurring-transactions':
      return result.every(
        (transaction) =>
          transaction &&
          transaction.id !== undefined &&
          transaction.categoryId !== undefined &&
          transaction.accountId !== undefined &&
          ['INCOME', 'EXPENSE'].includes(transaction.type) &&
          Number.isFinite(Number(transaction.amount)) &&
          ['DAILY', 'WEEKLY', 'MONTHLY'].includes(transaction.frequency) &&
          typeof transaction.nextRunDate === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(transaction.nextRunDate) &&
          typeof transaction.active === 'boolean'
      )
    case '/notifications':
      return result.every(
        (notification) =>
          notification &&
          notification.id !== undefined &&
          typeof notification.title === 'string' &&
          typeof notification.message === 'string' &&
          typeof notification.type === 'string' &&
          typeof notification.read === 'boolean' &&
          typeof notification.createdAt === 'string'
      )
    default:
      throw new Error(`Validacija nije podržana za kolekciju ${path}.`)
  }
}

async function getCollection(path, accessToken, signal) {
  const result = await request(path, accessToken, { signal })

  if (!Array.isArray(result)) {
    throw new Error('Server je vratio neočekivan format podataka.')
  }

  if (!isValidCollection(path, result)) {
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

export function getRecurringTransactions(accessToken, { signal } = {}) {
  return getCollection('/recurring-transactions', accessToken, signal)
}

export function getNotifications(accessToken, { signal } = {}) {
  return getCollection('/notifications', accessToken, signal)
}

export async function getUnreadNotificationCount(accessToken, { signal } = {}) {
  const result = await request('/notifications/unread-count', accessToken, { signal })

  if (
    !result ||
    typeof result.unreadCount !== 'number' ||
    !Number.isInteger(result.unreadCount) ||
    result.unreadCount < 0
  ) {
    throw new Error('Server je vratio neispravan broj nepročitanih obavijesti.')
  }

  return result.unreadCount
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

export function createRecurringTransaction(accessToken, transaction) {
  return request('/recurring-transactions', accessToken, {
    method: 'POST',
    body: transaction,
  })
}

export function updateRecurringTransaction(accessToken, id, transaction) {
  return request(`/recurring-transactions/${id}`, accessToken, {
    method: 'PUT',
    body: transaction,
  })
}

export function deleteRecurringTransaction(accessToken, id) {
  return request(`/recurring-transactions/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export function markNotificationAsRead(accessToken, id) {
  return request(`/notifications/${id}/read`, accessToken, {
    method: 'PATCH',
  }).then((result) => {
    if (
      !result ||
      String(result.id) !== String(id) ||
      typeof result.read !== 'boolean' ||
      !result.read
    ) {
      throw new Error('Server nije potvrdio da je obavijest pročitana.')
    }

    return result
  })
}

export function deleteNotification(accessToken, id) {
  return request(`/notifications/${id}`, accessToken, {
    method: 'DELETE',
  })
}
