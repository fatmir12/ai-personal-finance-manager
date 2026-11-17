const amountFormatter = new Intl.NumberFormat('bs-BA', {
  style: 'currency',
  currency: 'BAM',
  maximumFractionDigits: 2,
})

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

const weekdayNames = [
  'nedjelja',
  'ponedjeljak',
  'utorak',
  'srijeda',
  'četvrtak',
  'petak',
  'subota',
]

export function formatMoney(value) {
  return amountFormatter.format(Number(value))
}

export function formatBosnianMonth(date) {
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return monthNames[date.getMonth()]
}

export function formatBosnianDate(date, { includeWeekday = false, includeYear = false } = {}) {
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  const parts = []

  if (includeWeekday) {
    parts.push(`${weekdayNames[date.getDay()]},`)
  }

  parts.push(`${date.getDate()}.`, monthNames[date.getMonth()])

  if (includeYear) {
    parts.push(`${date.getFullYear()}.`)
  }

  return parts.join(' ')
}

export function formatBosnianDateTime(value) {
  const date = new Date(value)
  const formattedDate = formatBosnianDate(date, { includeYear: true })

  if (formattedDate === 'Invalid Date') {
    return formattedDate
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${formattedDate} · ${hours}:${minutes}`
}

export function formatFinanceDate(value) {
  return formatBosnianDate(new Date(`${value}T00:00:00`), { includeYear: true })
}

export function getLocalDateValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}
