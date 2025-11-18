import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts'

interface BacktestingEngineProps {
  token: string
  year: number
  onBacktestRun?: () => void
  onTradeAnimated?: (tradeIndex: number) => void
  showChart?: boolean
}

interface Trade {
  id: string
  timestamp: number
  side: 'BUY' | 'SELL'
  price: number
  quantity: number
  pnl?: number
}

interface ChartCandle {
  Date: string
  Open: number
  High: number
  Low: number
  Close: number
  Volume: number
}

interface ChartEntry {
  candle: ChartCandle
  executedOrder?: Array<{
    id: number
    entryTime: string
    executedTime?: string
    side: 'BUY' | 'SELL'
    entryPrice: number
    markPrice?: number
    pnl?: number
  }>
  openOrderSide?: 'BUY' | 'SELL'
}

type ChartResponse = Record<string, ChartEntry>

export function useBacktestingEngine({ token: _token, year: _year, onBacktestRun, onTradeAnimated, showChart = true }: BacktestingEngineProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const markersRef = useRef<any[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAnimationTime, setCurrentAnimationTime] = useState<number | null>(null)

  // Initialize chart once
  useEffect(() => {
    if (!showChart) return

    let raf = 0
    const init = () => {
      if (!chartContainerRef.current || chartRef.current) return
      const width = chartContainerRef.current.clientWidth || 600
      const height = chartContainerRef.current.clientHeight || 600
      if (width <= 0 || height <= 0) {
        raf = requestAnimationFrame(init)
        return
      }
      
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: { background: { color: '#111827' }, textColor: '#9CA3AF' },
        rightPriceScale: { borderColor: '#1F2937' },
        timeScale: { 
          borderColor: '#1F2937',
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8, // Optimized for monthly view
          minBarSpacing: 2,
          rightOffset: 10,
          fixLeftEdge: false,
          fixRightEdge: false
        },
        grid: { vertLines: { color: '#1F2937' }, horzLines: { color: '#1F2937' } },
        localization: { 
          locale: 'en-US',
          dateFormat: 'dd MMM yyyy'
        }
      })
      
      chartRef.current = chart
      
      // Add candlestick series (lightweight-charts v5.x)
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981', 
        downColor: '#EF4444', 
        borderVisible: false,
        wickUpColor: '#10B981', 
        wickDownColor: '#EF4444'
      })

      resizeObserverRef.current = new ResizeObserver(() => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight 
          })
        }
      })
      resizeObserverRef.current.observe(chartContainerRef.current)
    }

    raf = requestAnimationFrame(init)

    return () => {
      cancelAnimationFrame(raf)
      if (resizeObserverRef.current && chartContainerRef.current) {
        resizeObserverRef.current.unobserve(chartContainerRef.current)
      }
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [showChart])

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Aggregate candles to reduce count for better performance
  const aggregateCandles = (candles: any[], targetCount: number = 2000) => {
    if (candles.length <= targetCount) return candles

    const ratio = Math.ceil(candles.length / targetCount)
    const aggregated: any[] = []

    for (let i = 0; i < candles.length; i += ratio) {
      const chunk = candles.slice(i, i + ratio)
      if (chunk.length === 0) continue

      aggregated.push({
        time: chunk[0].time,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close
      })
    }

    return aggregated
  }

  // Aggregate trades proportionally based on candle aggregation
  // If we're showing ~3000 candles (1 month equivalent), we keep proportional trades
  const aggregateTrades = (trades: Trade[], originalCandleCount: number, aggregatedCandleCount: number): Trade[] => {
    // Calculate the aggregation ratio
    const ratio = aggregatedCandleCount / originalCandleCount
    const targetTradeCount = Math.max(50, Math.floor(trades.length * ratio))
    
    if (trades.length <= targetTradeCount) return trades
    
    // Evenly sample trades to maintain chronological distribution
    const step = trades.length / targetTradeCount
    const aggregatedTrades: Trade[] = []
    
    for (let i = 0; i < targetTradeCount; i++) {
      const index = Math.floor(i * step)
      if (index < trades.length) {
        aggregatedTrades.push(trades[index])
      }
    }
    
    console.log(`Aggregated ${trades.length} trades down to ${aggregatedTrades.length} trades (ratio: ${ratio.toFixed(2)})`)
    return aggregatedTrades
  }

  const formatChartCandles = (chart: ChartResponse) => {
    const candles = Object.values(chart || {})
      .filter((entry) => entry?.candle)
      .sort(
        (a, b) =>
          new Date(a.candle.Date).getTime() - new Date(b.candle.Date).getTime()
      )
      .map((entry) => ({
        time: Math.floor(new Date(entry.candle.Date).getTime() / 1000),
        open: entry.candle.Open,
        high: entry.candle.High,
        low: entry.candle.Low,
        close: entry.candle.Close
      }))

    return candles
  }

  // Animate chart with trades
  const animateChart = useCallback((candles: any[], trades: Trade[], renderSpeed: number) => {
    if (!seriesRef.current || !chartRef.current) {
      console.log('Chart not initialized')
      return
    }

    setIsAnimating(true)
    console.log(`Starting animation with ${candles.length} candles and ${trades.length} trades at ${renderSpeed}x speed`)

    // Clear existing data
    seriesRef.current.setData([])
    markersRef.current = []

    // ===== ANIMATION SPEED CONTROL =====
    // Adjust these values to change animation timing:
    const candlesPerFrame = Math.max(1, Math.floor(candles.length / 150)) // Target ~150 frames for balance
    const baseDelay = 100 // Base milliseconds per frame at 1x speed (increase for slower base speed, decrease for faster)
    // ===================================
    
    const delay = baseDelay / renderSpeed

    let currentIndex = 0
    const tradeMarkers: any[] = []
    let currentTradeIndex = 0
    let frameCount = 0

    const animateNextBatch = () => {
      if (currentIndex >= candles.length) {
        // Animation complete
        console.log('Animation complete')
        setIsAnimating(false)
        setCurrentAnimationTime(null) // Reset animation time when complete
        // Don't call fitContent() to maintain the zoom level
        return
      }

      // Add next batch of candles
      const endIndex = Math.min(currentIndex + candlesPerFrame, candles.length)
      const candlesUpToNow = candles.slice(0, endIndex)
      seriesRef.current?.setData(candlesUpToNow)

      // Throttle trade history updates - only update every 5 frames to reduce lag
      frameCount++
      if (frameCount % 5 === 0 || currentIndex + candlesPerFrame >= candles.length) {
        const lastCandle = candlesUpToNow[candlesUpToNow.length - 1]
        if (lastCandle) {
          setCurrentAnimationTime(lastCandle.time * 1000) // Convert back to milliseconds
        }
      }

      // Check if there are any trades in this batch
      for (let i = currentIndex; i < endIndex; i++) {
        const currentCandle = candles[i]
        while (currentTradeIndex < trades.length && 
               Math.floor(trades[currentTradeIndex].timestamp / 1000) <= currentCandle.time) {
          const trade = trades[currentTradeIndex]
          
          // Add marker for this trade
          tradeMarkers.push({
            time: Math.floor(trade.timestamp / 1000),
            position: trade.side === 'BUY' ? 'belowBar' : 'aboveBar',
            color: trade.side === 'BUY' ? '#10B181' : '#EF4444',
            shape: trade.side === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${trade.side} @ $${trade.price.toFixed(2)}`
          })

          onTradeAnimated?.(currentTradeIndex)
          currentTradeIndex++
        }
      }

      // Update markers on chart
      if (tradeMarkers.length > 0 && seriesRef.current) {
        try {
          // Type assertion needed because setMarkers is not in the generic ISeriesApi type
          const series = seriesRef.current as any
          if (series && typeof series.setMarkers === 'function') {
            series.setMarkers(tradeMarkers)
          } else {
            console.warn('setMarkers not available on series, skipping markers')
          }
        } catch (error) {
          console.error('Error setting markers:', error)
        }
      }

      // Scroll to show the latest data
      chartRef.current?.timeScale().scrollToPosition(3, false)

      currentIndex = endIndex

      // Schedule next frame - use requestAnimationFrame for smoother rendering
      if (delay > 16) {
        // If delay is significant, use setTimeout
        animationFrameRef.current = window.setTimeout(animateNextBatch, delay)
      } else {
        // For fast speeds, cap at 60fps using requestAnimationFrame
        animationFrameRef.current = window.setTimeout(() => {
          requestAnimationFrame(animateNextBatch)
        }, 16)
      }
    }

    // Start animation
    animateNextBatch()
  }, [onTradeAnimated])

  // Run backtest with animation
  const runBacktest = async (config: {
    token: string
    strategy: string
    year: number
    initialCapital: number
    renderSpeed: number
  }) => {
    try {
      // Convert strategy to strategyId and initialCapital to budget
      const strategyId = parseInt(String(config.strategy), 10)
      const budget = config.initialCapital
      
      const requestBody = {
        token: config.token,
        year: config.year,
        strategyId: strategyId,
        budget: budget,
      }
      
      console.log('Starting backtest with config:', requestBody)
      
      // Get auth token for authenticated requests
      const adminToken = localStorage.getItem('adminToken')
      
      // Run the backtest
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }
      
      const response = await fetch('/api/backtest/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      
      if (response.ok && data.message === 'Backtest done' && data.result) {
        console.log('Backtest completed:', data.result)
        const results = data.result
        const chartData: ChartResponse = results.chart || {}
        const chartCandles = formatChartCandles(chartData)

        if (chartCandles.length === 0) {
          throw new Error('No candle data available')
        }

        let candles = chartCandles
        if (candles.length > 20000) {
          console.log(`Aggregating ${candles.length} candles down to ~20000 for smoother rendering...`)
          candles = aggregateCandles(candles, 20000)
        }

        const trades = results.trades || []
        const aggregatedTrades = aggregateTrades(trades, chartCandles.length, candles.length)

        await animateChart(candles, aggregatedTrades, config.renderSpeed)

        onBacktestRun?.()
        return {
          ...results,
          minQty: data.minQty,
          leverage: data.leverage,
        }
      } else {
        console.error('Backtest failed:', data.message)
        throw new Error(data.message || 'Backtest failed')
      }
    } catch (error) {
      console.error('Error running backtest:', error)
      throw error
    }
  }

  // Stop animation
  const stopAnimation = useCallback(() => {
    setIsAnimating(false)
    setCurrentAnimationTime(null) // Reset animation time
    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  return {
    chartContainerRef,
    runBacktest,
    stopAnimation,
    isAnimating,
    currentAnimationTime
  }
}
