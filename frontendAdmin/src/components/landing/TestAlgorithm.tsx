import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  ArrowLeft,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  TrendingDown
} from 'lucide-react'

interface TestAlgorithmProps {
  onBack: () => void
}

export function TestAlgorithm({ onBack }: TestAlgorithmProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results] = useState({
    totalReturn: '+15.3%',
    winRate: '68.2%',
    trades: 45,
    profit: '+$1,234.56'
  })

  const handleToggleTest = () => {
    setIsRunning(!isRunning)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Buy-nance Bandits</h1>
                <p className="text-xs text-gray-400">Algorithm Testing</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">Algorithm Testing</h1>
            <p className="text-xl text-gray-400">
              Test our trading algorithms with real market data
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={handleToggleTest}
              className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Test
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Test
                </>
              )}
            </Button>
            <Button variant="outline" className="border-gray-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Total Return</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-400">{results.totalReturn}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Win Rate</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-white">{results.winRate}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Total Trades</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-white">{results.trades}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Profit</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-400">{results.profit}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Algorithm Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {isRunning ? (
                  <div className="text-green-400">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl">Algorithm Running...</p>
                    <p className="text-gray-400">Testing in progress</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <TrendingDown className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl">Algorithm Stopped</p>
                    <p className="text-gray-400">Click start to begin testing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
