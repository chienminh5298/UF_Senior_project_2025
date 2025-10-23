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

interface ActivePosition {
  id: number;
  orderId: string | null;
  pair: string;
  type: string;
  size: string;
  pnl: string;
  pnlColor: string;
  entry: string;
  strategy: string;
  investment: string;
  startDate: string;
  currentValue: number;
  markPrice: number;
  hasActiveOrder?: boolean;
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
      const authData = localStorage.getItem('auth');
      const token = authData ? JSON.parse(authData).token : null;
      
      const response = await fetch('/api/user/trading/positions', {
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
      const authData = localStorage.getItem('auth');
      const token = authData ? JSON.parse(authData).token : null;
      
      const response = await fetch('/api/user/tokens/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTokens(data.data);
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Account Balance & Order Form */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Account Summary */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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

            {/* Order Placement Form */}
              <Card className="bg-gray-900 border-gray-800">
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
                      {token.name}/{token.stable} (Leverage: {token.leverage}x)
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

              {/* Token Details Preview */}
              {selectedToken && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      {(() => {
                    const token = availableTokens.find(t => t.name === selectedToken);
                    return token ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{token.name}</h3>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Available
                              </Badge>
                            </div>
                        <p className="text-gray-400 text-sm">Trading pair: {token.name}/{token.stable}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                            <p className="text-gray-400">Minimum Quantity</p>
                            <p className="text-white font-medium">{token.minQty}</p>
                              </div>
                              <div>
                            <p className="text-gray-400">Leverage</p>
                            <p className="text-white font-medium">{token.leverage}x</p>
                </div>
                </div>
              </div>
                        ) : null;
                      })()}
                    </div>
                  )}

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
            </div>

        {/* Right Column - Available Tokens */}
        <div className="space-y-6">
          {/* Available Tokens */}
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader>
              <CardTitle className="text-white">Available Tokens</CardTitle>
              <p className="text-sm text-gray-400">All tokens available for trading</p>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              <div className="space-y-3 flex-1">
                {availableTokens.map((token, index) => (
                  <div key={`card-${token.id}-${index}`} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white text-sm">{token.name}</h4>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Available
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Min Quantity</p>
                        <p className="text-white font-medium">{token.minQty}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Leverage</p>
                        <p className="text-white font-medium">{token.leverage}x</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
