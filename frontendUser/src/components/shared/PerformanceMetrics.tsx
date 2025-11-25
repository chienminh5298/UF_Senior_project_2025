import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, Percent } from 'lucide-react'

interface BacktestResults {
  totalReturn: number
  totalReturnPercent: string
  sharpeRatio: number
  maxDrawdown: number
  maxDrawdownPercent: string
  winRate: number
  totalTrades: number
  profitFactor: number
  avgTrade: number
  bestTrade: number
  worstTrade: number
  winningTrades?: number
  losingTrades?: number
  avgHoldTime?: number
  avgTradePercent?: string
  bestTradePercent?: string
  worstTradePercent?: string
  trades?: any[]
}

interface PerformanceMetricsProps {
  results: BacktestResults
  token: string
  strategy: string
  year: number
  initialCapital: number
  finalCapital: number
}

export function PerformanceMetrics({
  results,
  token,
  strategy,
  year,
  initialCapital,
  finalCapital
}: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Summary Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Token</p>
            <p className="text-xl font-bold text-white">{token}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Strategy</p>
            <p className="text-base font-medium text-gray-200">{strategy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Year</p>
            <p className="text-base font-medium text-gray-200">{year}</p>
          </div>
          <div className="pt-2 border-t border-gray-800">
            <p className="text-sm text-gray-400">Initial Capital</p>
            <p className="text-lg font-bold text-blue-400">
              ${initialCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Final Capital</p>
            <p className={`text-lg font-bold ${finalCapital >= initialCapital ? 'text-green-400' : 'text-red-400'}`}>
              ${finalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Returns Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {results.totalReturn >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            Returns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Total Return</p>
            <p className={`text-2xl font-bold ${results.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {results.totalReturn >= 0 ? '+' : ''}${results.totalReturn.toFixed(2)}
            </p>
            <p className={`text-lg ${results.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({results.totalReturnPercent}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Sharpe Ratio</p>
            <p className="text-xl font-bold text-white">{results.sharpeRatio.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Max Drawdown</p>
            <p className="text-xl font-bold text-red-400">{results.maxDrawdownPercent}</p>
          </div>
        </CardContent>
      </Card>

      {/* Trading Stats Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Trading Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Win Rate</p>
            <p className="text-2xl font-bold text-white">{results.winRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Trades</p>
            <p className="text-xl font-bold text-white">{results.totalTrades}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Profit Factor</p>
            <p className="text-xl font-bold text-white">{results.profitFactor.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Trade Performance Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            Trade Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Avg Trade</p>
            <p className={`text-xl font-bold ${results.avgTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {results.avgTrade >= 0 ? '+' : ''}${results.avgTrade.toFixed(2)}
              {results.avgTradePercent && (
                <span className="text-sm ml-2">({results.avgTradePercent})</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Best Trade</p>
            <p className="text-lg font-bold text-green-400">
              +${results.bestTrade.toFixed(2)}
              {results.bestTradePercent && (
                <span className="text-sm ml-2">({results.bestTradePercent})</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Worst Trade</p>
            <p className="text-lg font-bold text-red-400">
              ${results.worstTrade.toFixed(2)}
              {results.worstTradePercent && (
                <span className="text-sm ml-2">({results.worstTradePercent})</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats Card - Only show if additional data is available */}
      {(results.winningTrades !== undefined || results.losingTrades !== undefined || results.avgHoldTime !== undefined) && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-cyan-400" />
              Detailed Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.winningTrades !== undefined && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Winning Trades</p>
                <p className="text-lg font-bold text-green-400">{results.winningTrades}</p>
              </div>
            )}
            {results.losingTrades !== undefined && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Losing Trades</p>
                <p className="text-lg font-bold text-red-400">{results.losingTrades}</p>
              </div>
            )}
            {results.avgHoldTime !== undefined && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Avg Hold Time</p>
                <p className="text-lg font-bold text-white">{results.avgHoldTime.toFixed(1)}h</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

