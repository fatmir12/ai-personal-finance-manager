import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBosnianMonth } from '@/lib/financeFormatters.js'

const amountFormatter = new Intl.NumberFormat('bs-BA', {
  style: 'currency',
  currency: 'BAM',
  maximumFractionDigits: 2,
})

const compactAmountFormatter = new Intl.NumberFormat('bs-BA', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatMonthLabel(label) {
  const match = /^M\s*(1[0-2]|[1-9])$/i.exec(String(label))

  if (!match) {
    return label
  }

  return formatBosnianMonth(new Date(2026, Number(match[1]) - 1, 1))
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="dashboard-chart-tooltip">
      <span>{formatMonthLabel(label)}</span>
      {payload.map((item) => (
        <strong className={`tooltip-${item.dataKey}`} key={item.dataKey}>
          <i />
          {item.name}: {amountFormatter.format(item.value)}
        </strong>
      ))}
    </div>
  )
}

function FinanceTrendChart({ data }) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <AreaChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#406d55" stopOpacity={0.19} />
            <stop offset="95%" stopColor="#406d55" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d7a07a" stopOpacity={0.16} />
            <stop offset="95%" stopColor="#d7a07a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="var(--app-grid)"
          strokeDasharray="3 5"
          vertical={false}
        />
        <XAxis
          axisLine={false}
          dataKey="label"
          tick={{ fill: '#8a9188', fontSize: 10 }}
          tickFormatter={formatMonthLabel}
          tickLine={false}
          tickMargin={11}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: '#8a9188', fontSize: 10 }}
          tickFormatter={(value) => compactAmountFormatter.format(value)}
          tickLine={false}
          tickMargin={8}
          width={47}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          dataKey="prihod"
          fill="url(#incomeFill)"
          name="Prihodi"
          stroke="#406d55"
          strokeWidth={2.2}
          type="monotone"
        />
        <Area
          dataKey="rashod"
          fill="url(#expenseFill)"
          name="Rashodi"
          stroke="#d7a07a"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default FinanceTrendChart
