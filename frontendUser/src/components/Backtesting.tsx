import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Play,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  Zap
} from 'lucide-react'

export function Backtesting() {
  const [isRunning, setIsRunning] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState('BTC Momentum Pro')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')

  const strategies = [
    'BTC Momentum Pro',
    'ETH Scalping Bot',
    'SOL Swing Trader',
    'Multi-Pair Arbitrage'
  ]

  const timeframes = ['1W', '1M', '3M', '6M', '1Y', 'Custom']
  
  const backtestResults = {
    totalReturn: '+34.7%',
    sharpeRatio: '2.18',
    maxDrawdown: '-8.4%',
    winRate: '73.2%',
    totalTrades: 156,
    profitFactor: '2.47',
    avgTrade: '+0.89%',
    bestTrade: '+4.2%',
    worstTrade: '-2.1%'
  }

  const recentBacktests = [
    {
      id: 1,
      strategy: 'BTC Momentum Pro',
      timeframe: '3M',
      return: '+23.4%',
      winRate: '71%',
      trades: 89,
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: 2,
      strategy: 'ETH Scalping Bot',
      timeframe: '1M',
      return: '+12.8%',
      winRate: '82%',
      trades: 203,
      status: 'completed',
      date: '2024-01-14'
    },
    {
      id: 3,
      strategy: 'SOL Swing Trader',
      timeframe: '6M',
      return: '-3.2%',
      winRate: '58%',
      trades: 45,
      status: 'completed',
      date: '2024-01-13'
    },
    {
      id: 4,
      strategy: 'Multi-Pair Arbitrage',
      timeframe: '1Y',
      return: '+45.6%',
      winRate: '91%',
      trades: 234,
      status: 'running',
      date: '2024-01-12'
    }
  ]

  const handleRunBacktest = () => {
    setIsRunning(true)
    // Simulate backtest running
    setTimeout(() => {
      setIsRunning(false)
    }, 3000)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Strategy Backtesting</h1>
          <p className="text-gray-400">Test your strategies with historical data</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Lightning Fast Results
          </Badge>
        </div>
      </div>

      {/* Backtest Configuration */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Backtest Configuration</CardTitle>
          <p className="text-sm text-gray-400">Configure your backtest parameters</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Strategy</label>
              <select 
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {strategies.map((strategy) => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>

            {/* Timeframe Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Timeframe</label>
              <div className="grid grid-cols-3 gap-2">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`p-2 rounded text-sm font-medium transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Settings</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-sm text-gray-300">Initial Capital</span>
                  <span className="text-sm text-white">$10,000</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-sm text-gray-300">Commission</span>
                  <span className="text-sm text-white">0.1%</span>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-blue-400 hover:text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button 
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
            <div className="text-sm text-gray-400">
              Estimated time: &lt;30 seconds
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">{backtestResults.totalReturn}</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">vs {selectedTimeframe} period</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{backtestResults.sharpeRatio}</span>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Risk-adjusted return</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{backtestResults.winRate}</span>
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">{backtestResults.totalTrades} trades</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-400">{backtestResults.maxDrawdown}</span>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Worst decline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Results */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Detailed Results</CardTitle>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit Factor</span>
                  <span className="text-white font-medium">{backtestResults.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Trade</span>
                  <span className="text-green-400 font-medium">{backtestResults.avgTrade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Trade</span>
                  <span className="text-green-400 font-medium">{backtestResults.bestTrade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Worst Trade</span>
                  <span className="text-red-400 font-medium">{backtestResults.worstTrade}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-white font-medium">{backtestResults.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Winning Trades</span>
                  <span className="text-green-400 font-medium">114</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losing Trades</span>
                  <span className="text-red-400 font-medium">42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Hold Time</span>
                  <span className="text-white font-medium">2.3h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart Placeholder */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Performance Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Performance chart will appear here</p>
                <p className="text-sm text-gray-500">Run a backtest to see results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Backtests */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Backtests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Strategy</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Timeframe</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Return</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Win Rate</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Trades</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBacktests.map((backtest) => (
                  <tr key={backtest.id} className="border-b border-gray-800/50">
                    <td className="py-3 text-sm text-white font-medium">{backtest.strategy}</td>
                    <td className="py-3 text-sm text-gray-300">{backtest.timeframe}</td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${backtest.return.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {backtest.return}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-300">{backtest.winRate}</td>
                    <td className="py-3 text-sm text-gray-300">{backtest.trades}</td>
                    <td className="py-3">
                      <Badge className={`${backtest.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                        {backtest.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Running
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-300">{backtest.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
