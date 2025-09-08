import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Target,
  Play,
  Pause,
  Settings,
  Plus,
  TrendingUp,
  Activity,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  DollarSign,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react'

export function Strategies() {
  const [strategies] = useState([
    {
      id: 1,
      name: 'BTC Momentum Pro',
      status: 'active',
      pair: 'BTC/USDT',
      performance: '+12.4%',
      performanceColor: 'text-green-400',
      winRate: '78%',
      trades: 156,
      pnl: '+$3,245',
      risk: 'Medium',
      riskColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    {
      id: 2,
      name: 'ETH Scalping Bot',
      status: 'active',
      pair: 'ETH/USDT',
      performance: '+8.7%',
      performanceColor: 'text-green-400',
      winRate: '82%',
      trades: 203,
      pnl: '+$1,876',
      risk: 'High',
      riskColor: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    {
      id: 3,
      name: 'SOL Swing Trader',
      status: 'paused',
      pair: 'SOL/USDT',
      performance: '-2.1%',
      performanceColor: 'text-red-400',
      winRate: '65%',
      trades: 89,
      pnl: '-$234',
      risk: 'Low',
      riskColor: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    {
      id: 4,
      name: 'Multi-Pair Arbitrage',
      status: 'active',
      pair: 'Multiple',
      performance: '+15.2%',
      performanceColor: 'text-green-400',
      winRate: '91%',
      trades: 78,
      pnl: '+$4,567',
      risk: 'Low',
      riskColor: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  ])

  const strategyTemplates = [
    { name: 'DCA Bot', description: 'Dollar Cost Averaging for long-term accumulation', icon: DollarSign },
    { name: 'Grid Trading', description: 'Profit from market volatility with grid orders', icon: BarChart3 },
    { name: 'Momentum', description: 'Follow strong price movements and trends', icon: TrendingUp },
    { name: 'Mean Reversion', description: 'Trade based on price returning to average', icon: Activity },
  ]

  const handleToggleStrategy = (id: number) => {
    // Toggle strategy active/paused status
    console.log(`Toggling strategy ${id}`)
  }

  const handleEditStrategy = (id: number) => {
    // Open strategy editor
    console.log(`Editing strategy ${id}`)
  }

  const handleDeleteStrategy = (id: number) => {
    // Delete strategy with confirmation
    console.log(`Deleting strategy ${id}`)
  }

  const handleCloneStrategy = (id: number) => {
    // Clone strategy
    console.log(`Cloning strategy ${id}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Strategies</h1>
          <p className="text-gray-400">Manage and monitor your automated trading strategies</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Global Settings
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Strategy
          </Button>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Active Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {strategies.filter(s => s.status === 'active').length}
              </span>
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">of {strategies.length} total</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">+$9,454</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Avg Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">79%</span>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Across all strategies</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">526</span>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Strategies */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Your Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${strategy.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <h3 className="font-semibold text-white">{strategy.name}</h3>
                        <Badge className={strategy.riskColor}>
                          {strategy.risk} Risk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleToggleStrategy(strategy.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          {strategy.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleEditStrategy(strategy.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleCloneStrategy(strategy.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteStrategy(strategy.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Pair</p>
                        <p className="text-white font-medium">{strategy.pair}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Performance</p>
                        <p className={`font-medium ${strategy.performanceColor}`}>{strategy.performance}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Win Rate</p>
                        <p className="text-white font-medium">{strategy.winRate}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Trades</p>
                        <p className="text-white font-medium">{strategy.trades}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">P&L</p>
                        <p className={`font-medium ${strategy.performanceColor}`}>{strategy.pnl}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Templates */}
        <div>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Strategy Templates</CardTitle>
              <p className="text-sm text-gray-400">Quick start with proven strategies</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategyTemplates.map((template, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <template.icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <h4 className="font-medium text-white">{template.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400">{template.description}</p>
                    <Button size="sm" variant="ghost" className="w-full mt-2 text-blue-400 hover:text-white">
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:text-white">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Strategy
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance Report
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:text-white">
                <AlertCircle className="w-4 h-4 mr-2" />
                Risk Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
