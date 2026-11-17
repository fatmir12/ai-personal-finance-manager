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
const shortMonthNames = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
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

function toDate(value) {
  return value instanceof Date ? value : new Date(`${value}T00:00:00`)
}

export function formatMoney(value) {
  return amountFormatter.format(Number(value))
}

export function formatFinanceDate(value) {
  const date = toDate(value)
  return `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}.`
}

export function formatFinanceShortDate(value) {
  const date = toDate(value)
  return `${date.getDate()}. ${shortMonthNames[date.getMonth()]}`
}

export function formatFinanceLongDate(value) {
  const date = toDate(value)
  return `${weekdayNames[date.getDay()]}, ${formatFinanceDate(date)}`
}

export function formatFinanceMonth(value) {
  const date = toDate(value)
  return monthNames[date.getMonth()]
}

export function formatFinanceDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()}. ${shortMonthNames[date.getMonth()]} ${date.getFullYear()}. · ${hour}:${minute}`
}

export function getLocalDateValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}
