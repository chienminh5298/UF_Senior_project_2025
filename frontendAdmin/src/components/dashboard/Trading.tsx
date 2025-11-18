import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  TrendingUp, 
  Target,
  Activity,
  Plus,
  DollarSign,
  ShoppingCart,
  Eye
} from 'lucide-react'

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const getApiUrl = (path: string) => {
  if (API_BASE) {
    const base = API_BASE.replace(/\/$/, '')
    const apiPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${apiPath}`
  }
  return path.startsWith('/') ? path : `/${path}`
}

interface TradingSummary {
  totalPositions: number;
  activeTokensCount: number;
  totalPnL: number;
  totalInvestment: number;
  winRate: number;
  availableCash: number;
}

export function Trading() {
  const [isAutoTrading, setIsAutoTrading] = useState(true)
  const [selectedToken, setSelectedToken] = useState('')
  const [orderAmount, setOrderAmount] = useState('')
  const [summary, setSummary] = useState<TradingSummary | null>(null)
  const [availableTokens, setAvailableTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTradingData();
    fetchAvailableTokens();
  }, []);

  const fetchTradingData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      // Note: Admin might need a different endpoint, using user endpoint for now
      const response = await fetch(getApiUrl('/api/user/trading/positions'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.data.summary);
      } else {
        console.error('Failed to fetch trading data');
      }
    } catch (error) {
      console.error('Error fetching trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTokens = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(getApiUrl('/api/admin/tokens'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setAvailableTokens(result.data?.tokens || []);
      } else {
        console.error('Failed to fetch available tokens');
      }
    } catch (error) {
      console.error('Error fetching available tokens:', error);
    }
  };

  const handlePlaceOrder = () => {
    const amount = parseFloat(orderAmount)
    const maxAmount = summary?.availableCash || 0
    if (selectedToken && orderAmount && amount > 0 && amount <= maxAmount) {
      console.log(`Placing order for ${selectedToken} with amount $${amount}`)
      // Reset form
      setSelectedToken('')
      setOrderAmount('')
    }
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading</h1>
          <p className="text-sm sm:text-base text-gray-400">Place orders for any available token</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Badge className={`text-xs sm:text-sm ${isAutoTrading ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            Auto Trading {isAutoTrading ? 'Active' : 'Paused'}
          </Badge>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoTrading}
              onChange={(e) => setIsAutoTrading(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>

      {/* Place Orders Section */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-h-0 overflow-hidden items-stretch">
        {/* Left Column - Account Balance & Order Form */}
        <div className="xl:col-span-2 flex flex-col gap-4 sm:gap-6 h-full">
          {/* Order Placement Form */}
          <Card className="bg-gray-900 border-gray-800 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-white">Place Token Order</CardTitle>
              <p className="text-sm text-gray-400">Choose a token and investment amount to start trading</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Select Token</label>
                <select 
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose a token...</option>
                  {availableTokens.map((token, index) => (
                    <option key={`select-${token.id}-${index}`} value={token.name}>
                      {token.name}/{token.stable || 'USDT'} (Leverage: {token.leverage || 1}x)
                    </option>
                  ))}
                </select>
              </div>

              {/* Investment Amount */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Investment Amount (USD)</label>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  placeholder="Enter amount..."
                  max={summary?.availableCash || 0}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-green-400">
                    Maximum investment: ${(summary?.availableCash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOrderAmount((summary?.availableCash || 0).toString())}
                    className="text-blue-400 hover:text-white text-xs"
                  >
                    Use Max
                  </Button>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="space-y-2">
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={!selectedToken || !orderAmount || parseFloat(orderAmount) <= 0 || parseFloat(orderAmount) > (summary?.availableCash || 0)}
                  className="w-full bg-green-600 hover:bg-green-700 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Place Token Order
                </Button>
                {orderAmount && parseFloat(orderAmount) > (summary?.availableCash || 0) && (
                  <p className="text-sm text-red-400 text-center">
                    Amount exceeds available cash (${(summary?.availableCash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="bg-gray-900 border-gray-800 flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-white">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="flex justify-between">
                <span className="text-gray-400">Available Balance</span>
                <span className="text-white font-bold">${(summary?.availableCash ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Invested in Strategies</span>
                <span className="text-white font-medium">${(summary?.totalInvestment ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total P&L</span>
                <span className={`font-medium ${(summary?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(summary?.totalPnL ?? 0) >= 0 ? '+' : ''}${(summary?.totalPnL ?? 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Available Tokens */}
        <div className="flex flex-col h-full">
          {/* Available Tokens */}
          <Card className="bg-gray-900 border-gray-800 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white">Available Tokens</CardTitle>
              <p className="text-sm text-gray-400">All tokens available for trading</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-3">
                {availableTokens.map((token, index) => {
                  const isSelected = selectedToken === token.name;
                  return (
                    <div 
                      key={`card-${token.id}-${index}`} 
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                      }`}
                      onClick={() => setSelectedToken(token.name)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium text-sm ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                          {token.name}
                        </h4>
                        <Badge className={`${
                          isSelected 
                            ? 'bg-blue-500/30 text-blue-300 border-blue-500/50' 
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          Available
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-400">Min Quantity</p>
                          <p className={`font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                            {token.minQty || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Leverage</p>
                          <p className={`font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                            {token.leverage || 1}x
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
