import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Zap, BarChart, RefreshCw } from 'lucide-react'

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

// Mock data
const portfolioData = [
  { time: '00:00', value: 20000 },
  { time: '04:00', value: 21500 },
  { time: '08:00', value: 20800 },
  { time: '12:00', value: 22400 },
  { time: '16:00', value: 23200 },
  { time: '20:00', value: 24567 },
]

// API Functions
const fetchPriceData = async () => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(`${API_BASE}/api/admin/orders/price-data`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch price data')
  }
  
  const data = await response.json()
  return data.data
}

const fetchDashboardStats = async () => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }
  
  const data = await response.json()
  return data.data
}

export function Dashboard() {
  const [cryptoPrices, setCryptoPrices] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [priceData, stats] = await Promise.all([
          fetchPriceData(),
          fetchDashboardStats()
        ])
        setCryptoPrices(priceData || [])
        setDashboardStats(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Error loading data:', err)
        setCryptoPrices([
          { tokenName: 'Bitcoin', currentPrice: 67845.32, priceChangePercent: 2.45 },
          { tokenName: 'Ethereum', currentPrice: 3456.78, priceChangePercent: -1.23 },
          { tokenName: 'Solana', currentPrice: 145.67, priceChangePercent: 5.67 },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleRefreshData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [priceData, stats] = await Promise.all([
        fetchPriceData(),
        fetchDashboardStats()
      ])
      setCryptoPrices(priceData || [])
      setDashboardStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

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
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  ${dashboardStats?.totalPortfolio?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  Total order budgets
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${dashboardStats?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dashboardStats?.totalPnL >= 0 ? '+' : ''}${dashboardStats?.totalPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="text-sm text-gray-400">
                  Daily: {dashboardStats?.dailyPnL >= 0 ? '+' : ''}${dashboardStats?.dailyPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Tokens</CardTitle>
            <Zap className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{dashboardStats?.activeTokensCount || 0}</div>
                <div className="text-sm text-gray-400">tokens currently active</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Available Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{dashboardStats?.availableTokensCount || 0}</div>
                <div className="text-sm text-gray-400">tokens to choose from</div>
              </>
            )}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Crypto Prices</CardTitle>
            <Button 
              onClick={handleRefreshData}
              disabled={loading}
              variant="outline" 
              size="sm"
              className="border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                <p className="text-red-400 text-sm">Error: {error}</p>
              </div>
            )}
            <div className="space-y-4">
              {loading && cryptoPrices.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading prices...</span>
                </div>
              ) : (
                cryptoPrices.map((crypto) => (
                  <div key={crypto.tokenName} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-300">
                          {crypto.tokenName.substring(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{crypto.tokenName}</p>
                        <p className="text-sm text-gray-400">
                          {crypto.lastUpdated ? new Date(crypto.lastUpdated).toLocaleTimeString() : 'Live'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${crypto.currentPrice.toLocaleString()}</p>
                      <div className={`flex items-center gap-1 text-sm ${
                        crypto.priceChangePercent > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {crypto.priceChangePercent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {crypto.priceChangePercent > 0 ? '+' : ''}{crypto.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
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
          {loading && !dashboardStats ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading strategies...</span>
            </div>
          ) : !dashboardStats?.activeStrategies || dashboardStats.activeStrategies.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No active strategies</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardStats.activeStrategies.map((strategy: any) => (
                <div key={strategy.id} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-white font-medium">{strategy.description}</p>
                      <p className="text-sm text-gray-400">{strategy.trades} trades today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="success">
                      Active
                    </Badge>
                    <div className="text-right">
                      <div className={`font-medium ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {strategy.tokenCount} token{strategy.tokenCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
