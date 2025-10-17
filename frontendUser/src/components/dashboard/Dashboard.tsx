import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Zap, BarChart } from 'lucide-react'

// Mock data
const portfolioData = [
  { time: '00:00', value: 20000 },
  { time: '04:00', value: 21500 },
  { time: '08:00', value: 20800 },
  { time: '12:00', value: 22400 },
  { time: '16:00', value: 23200 },
  { time: '20:00', value: 24567 },
]

const cryptoPrices = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67845.32, change: 2.45, volume: '1.2B' },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -1.23, volume: '890M' },
  { symbol: 'SOL', name: 'Solana', price: 145.67, change: 5.67, volume: '245M' },
]

const activeStrategies = [
  { 
    name: 'Momentum Scalper', 
    status: 'Active', 
    trades: 12, 
    pnl: 234.56,
    isActive: true 
  },
  { 
    name: 'Mean Reversion', 
    status: 'Active', 
    trades: 8, 
    pnl: 156.78,
    isActive: true 
  },
]

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Portfolio</CardTitle>
            <BarChart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$24,567.89</div>
            <div className="flex items-center gap-1 text-sm text-green-400">
              <TrendingUp className="h-3 w-3" />
              +2.34% (+$567.89)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Daily P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">+$234.56</div>
            <div className="text-sm text-gray-400">+0.96%</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Strategies</CardTitle>
            <Zap className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3</div>
            <div className="text-sm text-gray-400">2 profitable</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">68.4%</div>
            <div className="text-sm text-gray-400">Last 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="url(#gradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Crypto Prices */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Crypto Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cryptoPrices.map((crypto) => (
                <div key={crypto.symbol} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-300">{crypto.symbol}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{crypto.symbol}</p>
                      <p className="text-sm text-gray-400">Vol: {crypto.volume}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${crypto.price.toLocaleString()}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      crypto.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {crypto.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {crypto.change > 0 ? '+' : ''}{crypto.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Trading Strategies */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Active Trading Strategies</CardTitle>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeStrategies.map((strategy, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">{strategy.name}</p>
                    <p className="text-sm text-gray-400">{strategy.trades} trades today</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">
                    {strategy.status}
                  </Badge>
                  <div className="text-right text-green-400 font-medium">
                    +${strategy.pnl.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
