import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  PieChart,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

// API Functions
const fetchPortfolioData = async () => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(`${API_BASE}/api/admin/portfolio`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio data')
  }
  
  const data = await response.json()
  return data.data
}

export function Portfolio() {
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPortfolioData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await fetchPortfolioData()
        setPortfolioData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio data')
        console.error('Error loading portfolio data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchPortfolioData()
      setPortfolioData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh portfolio data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="text-gray-400">Track your crypto holdings and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Eye className="w-4 h-4 mr-2" />
            Hide Balances
          </Button>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:text-white"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <p className="text-red-400 text-sm">Error: {error}</p>
        </div>
      )}

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolioData ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    ${portfolioData?.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </span>
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                <p className={`text-sm mt-1 ${portfolioData?.todayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioData?.todayChange >= 0 ? '+' : ''}${portfolioData?.todayChange?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">24h Change</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolioData ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${portfolioData?.todayChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolioData?.todayChangePercent >= 0 ? '+' : ''}{portfolioData?.todayChangePercent?.toFixed(2) || '0.00'}%
                  </span>
                  {portfolioData?.todayChangePercent >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">vs yesterday</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolioData ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${portfolioData?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolioData?.totalPnL >= 0 ? '+' : ''}${portfolioData?.totalPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </span>
                  <DollarSign className={`w-5 h-5 ${portfolioData?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {portfolioData?.totalPnLPercent >= 0 ? '+' : ''}{portfolioData?.totalPnLPercent?.toFixed(2) || '0.00'}% total gain
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolioData ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{portfolioData?.assetsCount || 0}</span>
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-sm text-gray-400 mt-1">Different holdings</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Holdings */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolioData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Loading holdings...</span>
              </div>
            ) : !portfolioData?.holdings || portfolioData.holdings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No active holdings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolioData.holdings.map((holding: any) => {
                  const changeColor = holding.change >= 0 ? 'text-green-400' : 'text-red-400'
                  const allocation = portfolioData.totalValue > 0 
                    ? ((holding.value / portfolioData.totalValue) * 100).toFixed(1) + '%'
                    : '0%'
                  
                  return (
                    <div key={holding.tokenId} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{holding.name}</h3>
                          <p className="text-sm text-gray-400">{holding.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {holding.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm ${changeColor}`}>
                          {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gray-700 text-gray-300">
                          {allocation}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}