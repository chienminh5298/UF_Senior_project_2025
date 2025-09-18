import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  TrendingUp,
  DollarSign,
  Briefcase,
  PieChart,
  BarChart3,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'

export function Portfolio() {
  const holdings = [
    { symbol: 'BTC', name: 'Bitcoin', amount: '0.15432', value: '$10,532.45', change: '+2.34%', changeColor: 'text-green-400', allocation: '45.2%' },
    { symbol: 'ETH', name: 'Ethereum', amount: '3.2156', value: '$11,098.76', change: '+1.87%', changeColor: 'text-green-400', allocation: '47.6%' },
    { symbol: 'SOL', name: 'Solana', amount: '12.4567', value: '$1,768.95', change: '-0.45%', changeColor: 'text-red-400', allocation: '7.6%' },
    { symbol: 'USDT', name: 'Tether', amount: '500.00', value: '$500.00', change: '0.00%', changeColor: 'text-gray-400', allocation: '2.1%' },
  ]

  const portfolioStats = {
    totalValue: '$23,900.16',
    todayChange: '+$1,234.56',
    todayChangePercent: '+5.45%',
    totalPnL: '+$8,456.78',
    totalPnLPercent: '+54.8%'
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
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{portfolioStats.totalValue}</span>
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-green-400 mt-1">{portfolioStats.todayChange} today</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">24h Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">{portfolioStats.todayChangePercent}</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">vs yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">{portfolioStats.totalPnL}</span>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">{portfolioStats.totalPnLPercent} total gain</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{holdings.length}</span>
              <PieChart className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Different holdings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{holding.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{holding.name}</h3>
                        <p className="text-sm text-gray-400">{holding.amount} {holding.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{holding.value}</div>
                      <div className={`text-sm ${holding.changeColor}`}>{holding.change}</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-gray-700 text-gray-300">
                        {holding.allocation}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Allocation Chart */}
        <div>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Allocation chart</p>
                  <p className="text-sm text-gray-500">Visual breakdown of holdings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-400">Performance chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
