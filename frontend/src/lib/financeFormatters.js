const amountFormatter = new Intl.NumberFormat('bs-BA', {
  style: 'currency',
  currency: 'BAM',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('bs-BA', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatMoney(value) {
  return amountFormatter.format(Number(value))
}

export function formatFinanceDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00`))
}

export function getLocalDateValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}
