import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Play,
  RefreshCw,
  Zap
} from 'lucide-react'
import { useBacktestingEngine } from '../shared/BacktestingEngine'
import { DailyTradeSummary } from '../shared/DailyTradeSummary'
import { PerformanceMetrics } from '../shared/PerformanceMetrics'

export function Backtesting() {
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [selectedYear, setSelectedYear] = useState(2024)
  const [initialCapital, setInitialCapital] = useState(10000)
  const [renderSpeed, setRenderSpeed] = useState(1)
  const [backtestResults, setBacktestResults] = useState<any>(null)
  const [strategies, setStrategies] = useState<any[]>([])
  const [availableTokens, setAvailableTokens] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const tradesPerPage = 10
  const years = [2023, 2024, 2025]
  const renderSpeeds = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' }
  ]

  // Use shared backtesting engine (must be before useMemo that depends on it)
  const { chartContainerRef, runBacktest, stopAnimation, isAnimating, currentAnimationTime } = useBacktestingEngine({
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

  // Fetch strategies when token changes
  useEffect(() => {
    if (!selectedToken) return
    
    const fetchStrategies = async () => {
      try {
        const res = await fetch(`/api/backtest/strategies?token=${selectedToken}`)
        const data = await res.json()
        if (data.success) {
          setStrategies(data.data)
          if (data.data.length > 0 && !selectedStrategy) {
            setSelectedStrategy(data.data[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch strategies:', error)
      }
    }
    fetchStrategies()
  }, [selectedToken])

  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      alert('Please select a strategy')
      return
    }

    setIsRunning(true)
    setHasRun(false)
    try {
      const results = await runBacktest({
        token: selectedToken,
        strategy: selectedStrategy,
        year: selectedYear,
        initialCapital,
        renderSpeed
      })
      
      if (results) {
        setBacktestResults(results)
        setHasRun(true)
        setCurrentPage(1) // Reset to first page when new backtest runs
        setSelectedDate(null) // Clear selected date
      }
    } catch (e) {
      console.error('Backtest failed:', e)
      alert('Backtest failed: ' + (e as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  const handleStopAnimation = () => {
    stopAnimation()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Strategy Backtesting</h1>
          <p className="text-gray-400">Test your strategies with historical data</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Zap className="w-3 h-3 mr-1" />
          Lightning Fast Results
        </Badge>
      </div>

      {/* Main Layout: Left Config + Right Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Panel */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
            <p className="text-sm text-gray-400">Setup backtest parameters</p>
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
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                disabled={isRunning || isAnimating || availableTokens.length === 0}
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
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                disabled={isRunning || isAnimating || strategies.length === 0}
              >
                {strategies.length === 0 ? (
                  <option value="">Loading strategies...</option>
                ) : (
                  strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                  ))
                )}
              </select>
              {/* Always render description container to prevent layout shift */}
              <div className="min-h-[2.5rem]">
                {selectedStrategy && strategies.find(s => s.id === selectedStrategy) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {strategies.find(s => s.id === selectedStrategy)?.description}
                  </p>
                )}
              </div>
            </div>

            {/* Year Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Year</label>
              <div className="grid grid-cols-3 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    disabled={isRunning || isAnimating}
                    className={`p-2 rounded text-sm font-medium transition-colors ${
                      selectedYear === year
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="100"
                max="1000000"
                disabled={isRunning || isAnimating}
              />
            </div>

            {/* Render Speed */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Chart Render Speed</label>
              <div className="grid grid-cols-5 gap-2">
                {renderSpeeds.map((speed) => (
                  <button
                    key={speed.value}
                    onClick={() => setRenderSpeed(speed.value)}
                    disabled={isRunning || isAnimating}
                    className={`p-2 rounded text-sm font-medium transition-colors ${
                      renderSpeed === speed.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            {!isAnimating ? (
            <Button 
              onClick={handleRunBacktest}
                disabled={isRunning || !selectedStrategy}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
            ) : (
              <Button 
                onClick={handleStopAnimation}
                className="w-full bg-red-600 hover:bg-red-700 py-3"
              >
                Stop Backtest
            </Button>
            )}

          </CardContent>
        </Card>

        {/* Right: Chart (2 columns) */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">{selectedToken} Price Chart</CardTitle>
                <p className="text-sm text-gray-400">Year {selectedYear}</p>
              </div>
              {isAnimating && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Animating at {renderSpeed}x speed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={chartContainerRef} className="w-full" style={{ height: 600 }} />
          </CardContent>
        </Card>
      </div>

      {/* Daily Trade History - Show during and after animation */}
      {hasRun && backtestResults && backtestResults.trades && backtestResults.trades.length > 0 && (
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
      {hasRun && backtestResults && !isAnimating && (
        <PerformanceMetrics
          results={backtestResults}
          token={selectedToken}
          strategy={strategies.find(s => s.id === selectedStrategy)?.name || selectedStrategy}
          year={selectedYear}
          initialCapital={initialCapital}
          finalCapital={finalCapital}
        />
      )}
    </div>
  )
}
