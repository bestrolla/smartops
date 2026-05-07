import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'Mon', sales: 12 },
  { day: 'Tue', sales: 19 },
  { day: 'Wed', sales: 15 },
  { day: 'Thu', sales: 25 },
  { day: 'Fri', sales: 22 },
  { day: 'Sat', sales: 30 },
  { day: 'Sun', sales: 28 },
]

export function DailySalesChart() {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#ffffff' }}
          />
          <YAxis hide />
          <Bar
            dataKey="sales"
            fill="#ffffff"
            radius={[4, 4, 0, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
