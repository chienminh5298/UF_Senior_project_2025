import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Zap, BarChart, RefreshCw, CheckCircle, Settings, X } from 'lucide-react'

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const getApiUrl = (path: string) => {
  if (API_BASE) {
    // Remove trailing slash from API_BASE and ensure path starts with /
    const base = API_BASE.replace(/\/$/, '')
    const apiPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${apiPath}`
  }
  // Use relative path if no API_BASE (will use Vite proxy)
  return path.startsWith('/') ? path : `/${path}`
}

interface PerformanceData {
  time: string;
  year: string;
  month: number;
  day: number;
  value: number;
}

// API Functions
const fetchPriceData = async () => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(getApiUrl('/api/admin/orders/price-data'), {
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
  const response = await fetch(getApiUrl('/api/admin/dashboard/stats'), {
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

const fetchPerformanceData = async () => {
  const token = localStorage.getItem('adminToken')
  // Use admin endpoint for portfolio performance data
  const response = await fetch(getApiUrl('/api/admin/portfolio/performance'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch performance data')
  }
  
  const data = await response.json()
  return data.data
}

const fetchPortfolioData = async () => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(getApiUrl('/api/admin/portfolio'), {
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

const fetchTokens = async () => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(getApiUrl('/api/admin/tokens'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch tokens')
  }
  
  const result = await response.json()
  // API returns { success, message, data: { tokens } }
  return result.data?.tokens || []
}

const updateTokensBulk = async (tokenIds: number[]) => {
  const token = localStorage.getItem('adminToken')
  const response = await fetch(getApiUrl('/api/admin/tokens/bulk'), {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tokens: tokenIds })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update tokens')
  }
  
  return response.json()
}

export function Dashboard() {
  const [cryptoPrices, setCryptoPrices] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  
  // Token Selection Modal State
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<any[]>([])
  const [selectedTokenIds, setSelectedTokenIds] = useState<number[]>([])
  const [tokenSelectorLoading, setTokenSelectorLoading] = useState(false)

  const loadPriceData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setPriceLoading(true);
    }
    setPriceError(null);
    
    try {
      const priceData = await fetchPriceData();
      setCryptoPrices(priceData || []);
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Failed to load price data');
      console.error('Error loading price data:', err);
    } finally {
      if (showLoading) {
        setPriceLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      try {
        const [stats, portfolio, performance] = await Promise.all([
          fetchDashboardStats(),
          fetchPortfolioData().catch(err => {
            console.error('Error loading portfolio data:', err)
            return null
          }),
          fetchPerformanceData().catch(err => {
            console.error('Error loading performance data:', err)
            return []
          })
        ])
        setDashboardStats(stats)
        setPortfolioData(portfolio)
        setPerformanceData(performance || [])
        
        // Update portfolio value in App.tsx via localStorage
        if (portfolio?.totalValue !== undefined) {
          localStorage.setItem('adminPortfolioValue', portfolio.totalValue.toString())
          // Dispatch custom event to notify App.tsx
          window.dispatchEvent(new CustomEvent('portfolioValueUpdate', { detail: portfolio.totalValue }))
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    loadPriceData(true); // Show loading on initial load

    // Set up automatic price updates every 2 seconds
    const priceInterval = setInterval(() => {
      loadPriceData(false); // Don't show loading spinner on auto-updates
    }, 2000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(priceInterval);
    };
  }, [loadPriceData])


  // Token Selection Handlers
  const handleOpenTokenSelector = async () => {
    setShowTokenSelector(true)
    setTokenSelectorLoading(true)
    
    try {
      const tokens = await fetchTokens()
      setAvailableTokens(tokens)
      // Pre-select currently active tokens
      const activeTokenIds = tokens
        .filter((token: any) => token.isActive)
        .map((token: any) => token.id)
      setSelectedTokenIds(activeTokenIds)
    } catch (err) {
      console.error('Failed to load tokens:', err)
    } finally {
      setTokenSelectorLoading(false)
    }
  }

  const handleCloseTokenSelector = () => {
    setShowTokenSelector(false)
    setSelectedTokenIds([])
  }

  const toggleToken = (tokenId: number) => {
    setSelectedTokenIds(prev => 
      prev.includes(tokenId)
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    )
  }

  const handleSaveTokenSelection = async () => {
    setTokenSelectorLoading(true)
    
    try {
      await updateTokensBulk(selectedTokenIds)
      // Refresh dashboard stats to reflect changes
      const stats = await fetchDashboardStats()
      setDashboardStats(stats)
      setShowTokenSelector(false)
    } catch (err) {
      console.error('Failed to update tokens:', err)
    } finally {
      setTokenSelectorLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Overview of trading performance and portfolio</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Portfolio</CardTitle>
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
                    ${(portfolioData?.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <BarChart className="w-5 h-5 text-blue-400" />
                </div>
                <p className={`text-sm mt-1 ${(portfolioData?.totalPnLPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(portfolioData?.totalPnLPercent ?? 0) >= 0 ? '+' : ''}{(portfolioData?.totalPnLPercent ?? 0).toFixed(2)}% today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${dashboardStats?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats?.totalPnL >= 0 ? '+' : ''}${dashboardStats?.totalPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </span>
                  <TrendingUp className={`w-5 h-5 ${dashboardStats?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Daily: {dashboardStats?.dailyPnL >= 0 ? '+' : ''}${dashboardStats?.dailyPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-400 font-medium">Active Tokens</CardTitle>
            <Button
              onClick={handleOpenTokenSelector}
              variant="outline"
              size="sm"
              className="h-7 px-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{dashboardStats?.activeTokensCount || 0}</span>
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 mt-1">tokens currently active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Available Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !dashboardStats ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{dashboardStats?.availableTokensCount || 0}</span>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 mt-1">tokens to choose from</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0">
        {/* Portfolio Chart */}
        <Card className="bg-gray-900 border-gray-800 flex flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl">Portfolio Chart</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[180px] sm:min-h-[200px]">
              {loading && performanceData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading chart data...</span>
                </div>
              ) : performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <XAxis 
                      dataKey="time" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(_, index) => {
                        // Only show year labels on January 1st of each year
                        const dataPoint = performanceData[index];
                        if (!dataPoint) return '';
                        
                        // Show year label only if it's January 1st (month = 1, day = 1)
                        return (dataPoint.month === 1 && dataPoint.day === 1) ? dataPoint.year : '';
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No portfolio data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Crypto Prices */}
        <Card className="bg-gray-900 border-gray-800 flex flex-col lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl">Crypto Prices</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {priceError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                <p className="text-red-400 text-sm">Error: {priceError}</p>
              </div>
            )}
            <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {priceLoading && cryptoPrices.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading prices...</span>
                </div>
              ) : (
                cryptoPrices.length > 0 ? (
                  cryptoPrices.map((crypto) => {
                    const symbol = crypto.tokenName.substring(0, 3).toUpperCase();
                    
                    return (
                      <div key={crypto.tokenName} className="flex items-center justify-between p-2.5 sm:p-3.5 border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-300">{symbol}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm sm:text-lg truncate">{crypto.tokenName}</p>
                            <p className="text-xs sm:text-sm text-gray-400">
                              {crypto.lastUpdated ? new Date(crypto.lastUpdated).toLocaleTimeString() : 'Live'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <p className="text-white font-medium text-sm sm:text-lg">
                            ${crypto.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className={`flex items-center gap-1 text-xs sm:text-sm ${
                            crypto.priceChangePercent > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {crypto.priceChangePercent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span>{crypto.priceChangePercent > 0 ? '+' : ''}{crypto.priceChangePercent.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No price data available</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Selection Modal */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
              <CardTitle className="text-white">Select Active Tokens</CardTitle>
              <Button
                onClick={handleCloseTokenSelector}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {tokenSelectorLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading tokens...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    Select tokens to activate. Only selected tokens will be active.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {Array.isArray(availableTokens) && availableTokens.length > 0 ? (
                      availableTokens.map((token) => (
                      <div
                        key={token.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTokenIds.includes(token.id)
                            ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        }`}
                        onClick={() => toggleToken(token.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{token.name}</span>
                          {selectedTokenIds.includes(token.id) && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-400">
                        <p>No tokens available</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button
                      onClick={handleCloseTokenSelector}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTokenSelection}
                      disabled={tokenSelectorLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {tokenSelectorLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
