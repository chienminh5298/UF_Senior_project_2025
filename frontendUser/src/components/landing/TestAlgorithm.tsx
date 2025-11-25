import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Shield, 
  Zap,
  ArrowRight,
  Lock,
  Play,
  RefreshCw,
} from 'lucide-react'
import { useBacktestingEngine } from '../shared/BacktestingEngine'
import { DailyTradeSummary } from '../shared/DailyTradeSummary'
import { PerformanceMetrics } from '../shared/PerformanceMetrics'

interface TestAlgorithmProps {
  onNavigateToLogin: () => void
  onLogin: () => void
}

export function TestAlgorithm({ onNavigateToLogin, onLogin }: TestAlgorithmProps) {
  const [selectedToken, setSelectedToken] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [selectedYear, setSelectedYear] = useState(2024)
  const [initialCapital, setInitialCapital] = useState(10000)
  const [renderSpeed, setRenderSpeed] = useState(1)
  const [availableStrategies, setAvailableStrategies] = useState<any[]>([])
  const [availableTokens, setAvailableTokens] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [backtestResults, setBacktestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const tradesPerPage = 10

  const {
    chartContainerRef,
    runBacktest: runBacktestEngine,
    stopAnimation,
    isAnimating,
    currentAnimationTime
  } = useBacktestingEngine({
    token: selectedToken,
    year: selectedYear,
    showChart: true
  })

  // Calculate trades with capital and group by day
  const { tradesWithCapital, dailySummaries } = useMemo(() => {
    if (!backtestResults?.trades) return { tradesWithCapital: [], dailySummaries: [] }
    
    // Filter trades based on animation progress (if animating)
    let relevantTrades = backtestResults.trades
    if (isAnimating && currentAnimationTime !== null) {
      relevantTrades = backtestResults.trades.filter((trade: any) => trade.timestamp <= currentAnimationTime)
    }
    
    let runningCapital = initialCapital
    const trades = relevantTrades.map((trade: any) => {
      const tradeWithCapital = { ...trade, capitalBefore: runningCapital }
      if (trade.pnl !== undefined) {
        runningCapital += trade.pnl
      }
      return { ...tradeWithCapital, capitalAfter: runningCapital }
    })

    // Group trades by day (newest first)
    const tradesByDay = new Map<string, any[]>()
    trades.forEach((trade: any) => {
      const date = new Date(trade.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      if (!tradesByDay.has(date)) {
        tradesByDay.set(date, [])
      }
      tradesByDay.get(date)!.push(trade)
    })

    // Create daily summaries (newest first)
    const summaries = Array.from(tradesByDay.entries()).map(([date, dayTrades]) => {
      const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      const buyOrders = dayTrades.filter(t => t.side === 'BUY').length
      const sellOrders = dayTrades.filter(t => t.side === 'SELL').length
      const openingCapital = dayTrades[0]?.capitalBefore || initialCapital
      const closingCapital = dayTrades[dayTrades.length - 1]?.capitalAfter || initialCapital
      
      return {
        date,
        timestamp: dayTrades[0].timestamp,
        totalOrders: dayTrades.length,
        buyOrders,
        sellOrders,
        totalPnL,
        openingCapital,
        closingCapital,
        trades: dayTrades
      }
    }).sort((a, b) => b.timestamp - a.timestamp) // Newest first

    return { tradesWithCapital: trades, dailySummaries: summaries }
  }, [backtestResults?.trades, initialCapital, isAnimating, currentAnimationTime])

  const finalCapital = tradesWithCapital.length > 0 
    ? tradesWithCapital[tradesWithCapital.length - 1].capitalAfter 
    : initialCapital

  // Fetch available tokens on component mount
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/backtest/tokens')
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          setAvailableTokens(data.data)
          // Auto-select first token if none selected
          if (!selectedToken && data.data.length > 0) {
            setSelectedToken(data.data[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error)
      }
    }
    fetchTokens()
  }, [])

  // Fetch available strategies when token changes
  useEffect(() => {
    if (!selectedToken) return
    
    console.log('Fetching strategies for token:', selectedToken)
    const fetchStrategies = async () => {
      try {
        console.error('Fetching strategies for token:', selectedToken)
        const response = await fetch(`/api/backtest/strategies?token=${selectedToken}`)
        const data = await response.json()
        if (data.success && data.data) {
          setAvailableStrategies(data.data)
          // Auto-select first strategy if current selection is invalid
          if (data.data.length > 0) {
            const strategyIds = data.data.map((s: any) => s.id)
            if (!strategyIds.includes(selectedStrategy)) {
              setSelectedStrategy(data.data[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch strategies:', error)
      }
    }
    fetchStrategies()
  }, [selectedToken])

  // Get strategy description and name
  const getStrategyInfo = (strategyId: string) => {
    const strategy = availableStrategies.find((s: any) => s.id === strategyId)
    return strategy || null
    }

    const handleRunBacktest = async () => {
    if (!selectedStrategy) return
    
    setCurrentPage(1) // Reset to first page when new backtest runs
    setSelectedDate(null) // Clear selected date
    setIsLoading(true)
    setError(null)
        setBacktestResults(null)
        
        try {
      // Run the backtest animation
      await runBacktestEngine({
        token: selectedToken,
        strategy: selectedStrategy,
        year: selectedYear,
        initialCapital,
        renderSpeed
      })
      
      // Fetch the backtest results
      const strategyId = parseInt(String(selectedStrategy), 10)
      const response = await fetch('/api/backtest/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
          token: selectedToken,
          year: selectedYear,
          strategyId: strategyId,
          budget: initialCapital,
                })
            })

            const data = await response.json()
            
            if (response.ok && data.message === 'Backtest done' && data.result) {
        setBacktestResults(data.result)
            } else {
        setError(data.message || 'Backtest failed')
      }
    } catch (err) {
      setError('Failed to run backtest')
      console.error('Backtest error:', err)
        } finally {
      setIsLoading(false)
        }
  }

  const handleDemoLogin = () => {
    // Automatically login to dashboard (demo login)
    onLogin()
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
                        <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            Test Our Algorithms
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                        Experience the power of our trading algorithms with real historical data. See how our strategies would have performed without creating an account.
                    </p>
                </div>

                {/* Algorithm Testing Interface */}
        <Card className="bg-gray-900/50 border-gray-800 mb-16">
                    <CardHeader>
                        <CardTitle className="text-white text-center text-3xl">Backtesting Tool</CardTitle>
                        <p className="text-sm text-gray-400 text-center">Test our strategies with historical data</p>
                    </CardHeader>
                    <CardContent>
            {/* Main Layout: Left Config + Right Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Configuration Panel */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Configuration</CardTitle>
                  <p className="text-sm text-gray-400">Setup test parameters</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Token Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Token</label>
                    <select 
                      value={selectedToken}
                      onChange={(e) => {
                        setSelectedToken(e.target.value)
                        setSelectedStrategy('')
                      }}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      disabled={isLoading || isAnimating || availableTokens.length === 0}
                    >
                      {availableTokens.length === 0 ? (
                        <option value="">Loading tokens...</option>
                      ) : (
                        availableTokens.map((token) => (
                          <option key={token} value={token}>{token}</option>
                        ))
                      )}
                    </select>
                  </div>

                            {/* Strategy Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Strategy</label>
                                <select 
                                    value={selectedStrategy}
                                    onChange={(e) => setSelectedStrategy(e.target.value)}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      disabled={isLoading || isAnimating || availableStrategies.length === 0}
                    >
                      {availableStrategies.length === 0 ? (
                        <option value="">Loading strategies...</option>
                      ) : (
                        availableStrategies.map((strategy: any) => (
                          <option key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </option>
                        ))
                      )}
                                </select>
                    <div className="min-h-[2.5rem]">
                      {selectedStrategy && getStrategyInfo(selectedStrategy) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {getStrategyInfo(selectedStrategy).description}
                        </p>
                      )}
                                </div>
                            </div>

                  {/* Year Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Year</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[2023, 2024, 2025].map((year) => (
                                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          disabled={isLoading || isAnimating}
                          className={`p-2 rounded text-sm font-medium transition-colors ${
                            selectedYear === year
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {year}
                                        </button>
                                    ))}
                                </div>
                  </div>

                  {/* Initial Capital */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Initial Capital ($)</label>
                    <input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(Number(e.target.value))}
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      min="100"
                      max="1000000"
                      disabled={isLoading || isAnimating}
                    />
                                </div>

                  {/* Render Speed */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Chart Render Speed</label>
                    <div className="grid grid-cols-5 gap-1">
                      {[0.5, 1, 2, 5, 10].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setRenderSpeed(speed)}
                          disabled={isLoading || isAnimating}
                          className={`p-2 rounded text-xs font-medium transition-colors ${
                            renderSpeed === speed
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {speed}x
                        </button>
                      ))}
                            </div>
                        </div>

                  {/* Run Button */}
                            <Button 
                                onClick={handleRunBacktest}
                    disabled={isLoading || !selectedStrategy}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-base font-semibold disabled:opacity-50"
                            >
                    {isLoading ? (
                                    <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                                    </>
                                ) : (
                                    <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Test
                                    </>
                                )}
                            </Button>

                  {isAnimating && (
                    <Button
                      onClick={stopAnimation}
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Stop Animation
                    </Button>
                  )}

                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                      {error}
                                </div>
                            )}
                                        </CardContent>
                                    </Card>

              {/* Right: Chart Display */}
              <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
                                        <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">{selectedToken} Price Chart</CardTitle>
                      <p className="text-sm text-gray-400">{selectedYear} - {getStrategyInfo(selectedStrategy)?.name || 'Select a strategy'}</p>
                                            </div>
                                            </div>
                </CardHeader>
                <CardContent>
                  <div ref={chartContainerRef} className="w-full h-[500px]" />
                                        </CardContent>
                                    </Card>
                                </div>

            {/* Results Section */}
            {backtestResults && backtestResults.totalReturn !== undefined && (
              <div className="space-y-6 mt-6">
                {/* Daily Trade Summary - Show during and after animation */}
                {backtestResults.trades && backtestResults.trades.length > 0 && (
                  <DailyTradeSummary
                    dailySummaries={dailySummaries}
                    totalTrades={tradesWithCapital.length}
                    currentPage={currentPage}
                    tradesPerPage={tradesPerPage}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onPageChange={setCurrentPage}
                  />
                )}

                {/* Performance Metrics - Only show after animation completes */}
                {!isAnimating && (
                  <PerformanceMetrics
                    results={backtestResults}
                    token={selectedToken}
                    strategy={getStrategyInfo(selectedStrategy)?.name || selectedStrategy}
                    year={selectedYear}
                    initialCapital={initialCapital}
                    finalCapital={finalCapital}
                  />
                )}
                            </div>
                        )}

                        {/* Call to Action */}
                        <div className="text-center mt-8 p-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg border border-gray-600">
                            <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Trading?</h3>
                            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                                {backtestResults ? 
                                    'Impressed with the results? Get full access to all our algorithms and start trading with real money.' :
                                    'Run a backtest to see how our algorithms perform, then get full access to start live trading.'
                                }
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button 
                                    onClick={onNavigateToLogin}
                                    className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                                >
                                    Start Live Trading
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                                <Button 
                                    onClick={handleDemoLogin}
                                    variant="outline" 
                                    className="border-gray-500 text-gray-300 hover:text-white hover:border-gray-400 px-8 py-3 text-lg"
                                >
                                    Try Demo Dashboard
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="bg-gray-900/50 border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-8 h-8 text-yellow-400" />
                            <h3 className="text-xl font-semibold text-white">Lightning Fast</h3>
                        </div>
                        <p className="text-gray-400">
              Get backtest results with animated visualizations showing each trade in real-time.
                        </p>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-8 h-8 text-blue-400" />
                            <h3 className="text-xl font-semibold text-white">Real Data</h3>
                        </div>
                        <p className="text-gray-400">
                            All backtests use actual historical market data for accurate results.
                        </p>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-8 h-8 text-green-400" />
                            <h3 className="text-xl font-semibold text-white">No Signup Required</h3>
                        </div>
                        <p className="text-gray-400">
                            Test our algorithms without creating an account or providing any information.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}
