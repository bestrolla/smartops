import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const data = [
  { week: 'W1', tasks: 5 },
  { week: 'W2', tasks: 12 },
  { week: 'W3', tasks: 8 },
  { week: 'W4', tasks: 18 },
  { week: 'W5', tasks: 25 },
  { week: 'W6', tasks: 15 },
  { week: 'W7', tasks: 30 },
]

export function CompletedTasksChart() {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#ffffff' }}
          />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#ffffff"
            strokeWidth={2}
            fill="#ffffff"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
