import { useState } from 'react'
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

export function Trading() {
  const [isAutoTrading, setIsAutoTrading] = useState(true)
  const [activeView, setActiveView] = useState('positions') // 'positions' or 'orders'
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [orderAmount, setOrderAmount] = useState('')
  
  // Available cash for trading
  const availableCash = 12345.67

  // Available strategies for users to choose from
  const availableStrategies = [
    {
      id: 1,
      name: 'BTC Momentum Pro',
      description: 'Advanced momentum trading for Bitcoin with dynamic risk management',
      pair: 'BTC/USDT',
      performance: '+12.4%',
      performanceColor: 'text-green-400',
      winRate: '78%',
      risk: 'Medium',
      riskColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      leverage: '5x'
    },
    {
      id: 2,
      name: 'ETH Scalping Bot',
      description: 'High-frequency scalping strategy optimized for Ethereum',
      pair: 'ETH/USDT',
      performance: '+8.7%',
      performanceColor: 'text-green-400',
      winRate: '82%',
      risk: 'High',
      riskColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      leverage: '10x'
    },
    {
      id: 3,
      name: 'SOL Swing Trader',
      description: 'Medium-term swing trading strategy for Solana',
      pair: 'SOL/USDT',
      performance: '-2.1%',
      performanceColor: 'text-red-400',
      winRate: '65%',
      risk: 'Low',
      riskColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      leverage: '3x'
    },
    {
      id: 4,
      name: 'Multi-Pair Arbitrage',
      description: 'Cross-exchange arbitrage across multiple trading pairs',
      pair: 'Multiple',
      performance: '+15.2%',
      performanceColor: 'text-green-400',
      winRate: '91%',
      risk: 'Low',
      riskColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      leverage: '2x'
    }
  ]

  // User's active positions (including multiple instances of same strategy)
  const activePositions = [
    { 
      id: 1,
      pair: 'BTC/USDT', 
      type: 'Long', 
      size: '0.05 BTC', 
      pnl: '+$1,234', 
      pnlColor: 'text-green-400', 
      entry: '$67,000', 
      strategy: 'BTC Momentum Pro',
      investment: '$1,000',
      startDate: '2024-01-15'
    },
    { 
      id: 2,
      pair: 'BTC/USDT', 
      type: 'Long', 
      size: '0.03 BTC', 
      pnl: '+$756', 
      pnlColor: 'text-green-400', 
      entry: '$66,500', 
      strategy: 'BTC Momentum Pro',
      investment: '$750',
      startDate: '2024-01-16'
    },
    { 
      id: 3,
      pair: 'ETH/USDT', 
      type: 'Short', 
      size: '2.5 ETH', 
      pnl: '-$156', 
      pnlColor: 'text-red-400', 
      entry: '$3,500', 
      strategy: 'ETH Scalping Bot',
      investment: '$2,500',
      startDate: '2024-01-14'
    },
    { 
      id: 4,
      pair: 'SOL/USDT', 
      type: 'Long', 
      size: '15 SOL', 
      pnl: '+$89', 
      pnlColor: 'text-green-400', 
      entry: '$140', 
      strategy: 'SOL Swing Trader',
      investment: '$500',
      startDate: '2024-01-13'
    },
  ]

  const handlePlaceOrder = () => {
    const amount = parseFloat(orderAmount)
    if (selectedStrategy && orderAmount && amount > 0 && amount <= availableCash) {
      console.log(`Placing order for ${selectedStrategy} with amount $${amount}`)
      // Reset form
      setSelectedStrategy('')
      setOrderAmount('')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading</h1>
          <p className="text-gray-400">Monitor positions and place strategy orders</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={`${isAutoTrading ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            Auto Trading {isAutoTrading ? 'Active' : 'Paused'}
          </Badge>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoTrading}
              onChange={(e) => setIsAutoTrading(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex rounded-lg bg-gray-800 p-1 w-fit">
        <button
          onClick={() => setActiveView('positions')}
          className={`py-2 px-6 rounded text-sm font-medium transition-colors ${
            activeView === 'positions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 mr-2 inline" />
          Live Positions
        </button>
        <button
          onClick={() => setActiveView('orders')}
          className={`py-2 px-6 rounded text-sm font-medium transition-colors ${
            activeView === 'orders'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2 inline" />
          Place Orders
        </button>
      </div>

      {activeView === 'positions' ? (
        <>
          {/* Position Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 font-medium">Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{activePositions.length}</span>
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm text-gray-400 mt-1">Running strategies</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-400">+$1,923</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm text-gray-400 mt-1">All positions</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 font-medium">Total Investment</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">$4,750</span>
                  <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
                <p className="text-sm text-gray-400 mt-1">Across strategies</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">75%</span>
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm text-gray-400 mt-1">Overall</p>
            </CardContent>
          </Card>
        </div>

          {/* Active Positions List */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Your Active Positions</CardTitle>
              <p className="text-sm text-gray-400">All your strategy positions including multiple instances</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activePositions.map((position) => (
                  <div key={position.id} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{position.pair}</span>
                        <Badge className={position.type === 'Long' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                          {position.type}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {position.strategy}
                        </Badge>
                      </div>
                      <span className={`font-bold text-lg ${position.pnlColor}`}>{position.pnl}</span>
              </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Investment</p>
                        <p className="text-white font-medium">{position.investment}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Size</p>
                        <p className="text-white font-medium">{position.size}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Entry Price</p>
                        <p className="text-white font-medium">{position.entry}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Start Date</p>
                        <p className="text-white font-medium">{position.startDate}</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/20">
                          Close Position
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Place Orders View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Placement Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Place Strategy Order</CardTitle>
                  <p className="text-sm text-gray-400">Choose a strategy and investment amount to start trading</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Strategy Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Select Strategy</label>
                <select 
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                      <option value="">Choose a strategy...</option>
                      {availableStrategies.map((strategy) => (
                        <option key={strategy.id} value={strategy.name}>
                          {strategy.name} - {strategy.pair}
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
                      max={availableCash}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-green-400">
                        Maximum investment: ${availableCash.toLocaleString()}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOrderAmount(availableCash.toString())}
                        className="text-blue-400 hover:text-white text-xs"
                      >
                        Use Max
                      </Button>
                    </div>
              </div>

                  {/* Strategy Details Preview */}
                  {selectedStrategy && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      {(() => {
                        const strategy = availableStrategies.find(s => s.name === selectedStrategy);
                        return strategy ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-white">{strategy.name}</h3>
                              <Badge className={strategy.riskColor}>
                                {strategy.risk} Risk
                              </Badge>
                              <Badge className="bg-gray-700/50 text-gray-300 border-gray-600">
                                {strategy.leverage} Leverage
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{strategy.description}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Performance</p>
                                <p className={`font-medium ${strategy.performanceColor}`}>{strategy.performance}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Win Rate</p>
                                <p className="text-white font-medium">{strategy.winRate}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Trading Pair</p>
                                <p className="text-white font-medium">{strategy.pair}</p>
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
                      disabled={!selectedStrategy || !orderAmount || parseFloat(orderAmount) <= 0 || parseFloat(orderAmount) > availableCash}
                      className="w-full bg-green-600 hover:bg-green-700 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Place Strategy Order
                </Button>
                {orderAmount && parseFloat(orderAmount) > availableCash && (
                  <p className="text-sm text-red-400 text-center">
                    Amount exceeds available cash (${availableCash.toLocaleString()})
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Available Strategies List & Account Info */}
            <div className="space-y-6">
          {/* Account Summary */}
              <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
                  <CardTitle className="text-white">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Available Balance</span>
                    <span className="text-white font-bold">${availableCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-gray-400">Invested in Strategies</span>
                    <span className="text-white font-medium">$4,750.00</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-gray-400">Total P&L</span>
                    <span className="text-green-400 font-medium">+$1,923.00</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Strategy Overview */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Available Strategies</CardTitle>
                  <p className="text-sm text-gray-400">Quick overview of all strategies</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableStrategies.map((strategy) => (
                      <div key={strategy.id} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white text-sm">{strategy.name}</h4>
                          <Badge className={`${strategy.riskColor} text-xs`}>
                            {strategy.risk}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-400">Performance</p>
                            <p className={`font-medium ${strategy.performanceColor}`}>{strategy.performance}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Win Rate</p>
                            <p className="text-white font-medium">{strategy.winRate}</p>
                          </div>
                        </div>
              </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
