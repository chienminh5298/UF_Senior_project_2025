import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  TrendingUp, 
  Settings,
} from 'lucide-react'

export function Trading() {
  const [isAutoTrading, setIsAutoTrading] = useState(true)
  const [orderType, setOrderType] = useState('Market')
  const [orderSide, setOrderSide] = useState('Buy')

  const cryptoPairs = [
    { symbol: 'BTC/USDT', price: '$68,245', change: '+2.34%', changeColor: 'text-green-400', volume: '$1.2B' },
    { symbol: 'ETH/USDT', price: '$3,456', change: '+1.87%', changeColor: 'text-green-400', volume: '$856M' },
    { symbol: 'SOL/USDT', price: '$142', change: '-0.45%', changeColor: 'text-red-400', volume: '$234M' },
    { symbol: 'BNB/USDT', price: '$598', change: '+3.21%', changeColor: 'text-green-400', volume: '$189M' },
  ]

  const activePositions = [
    { pair: 'BTC/USDT', type: 'Long', size: '0.05 BTC', pnl: '+$1,234', pnlColor: 'text-green-400', entry: '$67,000' },
    { pair: 'ETH/USDT', type: 'Short', size: '2.5 ETH', pnl: '-$156', pnlColor: 'text-red-400', entry: '$3,500' },
    { pair: 'SOL/USDT', type: 'Long', size: '15 SOL', pnl: '+$89', pnlColor: 'text-green-400', entry: '$140' },
  ]

  const recentTrades = [
    { time: '14:32', pair: 'BTC/USDT', type: 'Buy', amount: '0.02 BTC', price: '$68,100', status: 'Filled' },
    { time: '14:28', pair: 'ETH/USDT', type: 'Sell', amount: '1.0 ETH', price: '$3,445', status: 'Filled' },
    { time: '14:25', pair: 'SOL/USDT', type: 'Buy', amount: '10 SOL', price: '$141.50', status: 'Filled' },
    { time: '14:20', pair: 'BTC/USDT', type: 'Sell', amount: '0.01 BTC', price: '$68,200', status: 'Filled' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Interface</h1>
          <p className="text-gray-400">Manage your crypto futures positions</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={`${isAutoTrading ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            Auto Trading
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
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">BTC/USDT</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">$68,320.45</div>
                  <div className="text-green-400 text-sm">+2.34% (+$1,567.89)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-sm">1m</Button>
                <Button variant="ghost" size="sm" className="text-sm">5m</Button>
                <Button size="sm" className="bg-gray-700 text-white text-sm">15m</Button>
                <Button variant="ghost" size="sm" className="text-sm">1h</Button>
                <Button variant="ghost" size="sm" className="text-sm">4h</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Trading Chart</p>
                  <p className="text-sm text-gray-500">Real-time price chart will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Panel */}
        <div>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Place Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Type Toggle */}
              <div className="flex rounded-lg bg-gray-800 p-1">
                <button
                  onClick={() => setOrderSide('Buy')}
                  className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                    orderSide === 'Buy'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Buy / Long
                </button>
                <button
                  onClick={() => setOrderSide('Sell')}
                  className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                    orderSide === 'Sell'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sell / Short
                </button>
              </div>

              {/* Symbol Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Symbol</label>
                <select className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option>BTC/USDT</option>
                  <option>ETH/USDT</option>
                  <option>SOL/USDT</option>
                </select>
              </div>

              {/* Order Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Order Type</label>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Market</option>
                  <option>Limit</option>
                  <option>Stop</option>
                </select>
              </div>

              {/* Size and Leverage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Size</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Leverage</label>
                  <select className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option>2x</option>
                    <option>5x</option>
                    <option>10x</option>
                    <option>20x</option>
                  </select>
                </div>
              </div>

              {/* Stop Loss and Take Profit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Stop Loss</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Take Profit</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Place Order Button */}
              <Button 
                className={`w-full py-3 text-base font-medium ${
                  orderSide === 'Buy' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Place {orderSide} Order
              </Button>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Available Balance</span>
                <span className="text-white font-medium">$12,345.67</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used Margin</span>
                <span className="text-white font-medium">$8,234.12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unrealized PnL</span>
                <span className="text-green-400 font-medium">+$267.50</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span className="text-gray-400">Total Equity</span>
                <span className="text-white font-bold">$20,847.29</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
