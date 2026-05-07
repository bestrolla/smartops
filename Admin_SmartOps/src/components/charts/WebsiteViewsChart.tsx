import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', views: 400 },
  { month: 'Feb', views: 300 },
  { month: 'Mar', views: 600 },
  { month: 'Apr', views: 800 },
  { month: 'May', views: 500 },
  { month: 'Jun', views: 900 },
  { month: 'Jul', views: 700 },
]

export function WebsiteViewsChart() {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#ffffff' }}
          />
          <YAxis hide />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#ffffff"
            strokeWidth={3}
            dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#ffffff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
