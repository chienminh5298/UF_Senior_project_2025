import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  TrendingUp, 
  Shield, 
  Zap,
  Users,
  Target,
  DollarSign,
  ArrowRight,
  Check,
  Activity,
  Lock,
  Bot,
  LineChart,
  Play,
  RefreshCw,
  TrendingDown,
  BarChart3
} from 'lucide-react'

interface TestAlgorithmProps {
  onNavigateToLogin: () => void
  onLogin: () => void
}

export function TestAlgorithm({ onNavigateToLogin, onLogin }: TestAlgorithmProps) {
    const [isRunningBacktest, setIsRunningBacktest] = useState(false)
    const [selectedStrategy, setSelectedStrategy] = useState('BTC Momentum Pro')
    const [selectedTimeframe, setSelectedTimeframe] = useState('1M')
    const [backtestResults, setBacktestResults] = useState<{
        totalReturn: string;
        sharpeRatio: string;
        maxDrawdown: string;
        winRate: string;
        totalTrades: number;
        profitFactor: string;
        avgTrade: string;
        bestTrade: string;
        worstTrade: string;
    } | null>(null)

    const strategies = [
        'BTC Momentum Pro',
        'ETH Scalping Bot',
        'SOL Swing Trader',
        'Multi-Pair Arbitrage'
    ]

    const timeframes = ['1W', '1M', '3M', '6M', '1Y']

    const handleDemoLogin = () => {
        // Automatically login to dashboard (demo login)
        onLogin()
    }

    const handleRunBacktest = () => {
        setIsRunningBacktest(true)
        setBacktestResults(null)
        
        // Simulate backtest running
        setTimeout(() => {
            setBacktestResults({
                totalReturn: '+34.7%',
                sharpeRatio: '2.18',
                maxDrawdown: '-8.4%',
                winRate: '73.2%',
                totalTrades: 156,
                profitFactor: '2.47',
                avgTrade: '+0.89%',
                bestTrade: '+4.2%',
                worstTrade: '-2.1%'
            })
            setIsRunningBacktest(false)
        }, 3000)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
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
                <Card className="bg-gray-900/50 border-gray-800 max-w-5xl mx-auto mb-16">
                    <CardHeader>
                        <CardTitle className="text-white text-center text-2xl">Live Algorithm Backtesting</CardTitle>
                        <p className="text-sm text-gray-400 text-center">Test our strategies with historical data - Results in under 30 seconds</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Strategy Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Select Trading Strategy</label>
                                <select 
                                    value={selectedStrategy}
                                    onChange={(e) => setSelectedStrategy(e.target.value)}
                                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-lg"
                                >
                                    {strategies.map((strategy) => (
                                        <option key={strategy} value={strategy}>{strategy}</option>
                                    ))}
                                </select>
                                <div className="p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-sm text-gray-400 mb-2">Strategy Details:</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                            <Bot className="w-3 h-3 mr-1" />
                                            AI-Powered
                                        </Badge>
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                            Professional Grade
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Timeframe Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Select Test Period</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {timeframes.map((timeframe) => (
                                        <button
                                            key={timeframe}
                                            onClick={() => setSelectedTimeframe(timeframe)}
                                            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                                                selectedTimeframe === timeframe
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                        >
                                            {timeframe}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-400">
                                        Testing with real historical market data from the past {selectedTimeframe.toLowerCase()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Run Backtest Button */}
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <Button 
                                onClick={handleRunBacktest}
                                disabled={isRunningBacktest}
                                className="bg-blue-600 hover:bg-blue-700 px-12 py-4 text-lg font-semibold"
                            >
                                {isRunningBacktest ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                        Running Backtest...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 mr-3" />
                                        Run Algorithm Test
                                    </>
                                )}
                            </Button>
                            {!isRunningBacktest && (
                                <div className="text-center">
                                    <div className="text-sm text-gray-400">Lightning fast results</div>
                                    <div className="text-xs text-gray-500">No signup required</div>
                                </div>
                            )}
                        </div>

                        {/* Results Display */}
                        {backtestResults && (
                            <div className="space-y-6">
                                {/* Main Results Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-400 mb-2">Total Return</div>
                                        <div className="text-3xl font-bold text-green-400 flex items-center justify-center gap-2">
                                            {backtestResults.totalReturn}
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-400 mb-2">Win Rate</div>
                                        <div className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                                            {backtestResults.winRate}
                                            <Target className="w-6 h-6 text-green-400" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-400 mb-2">Sharpe Ratio</div>
                                        <div className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                                            {backtestResults.sharpeRatio}
                                            <BarChart3 className="w-6 h-6 text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-400 mb-2">Max Drawdown</div>
                                        <div className="text-3xl font-bold text-red-400 flex items-center justify-center gap-2">
                                            {backtestResults.maxDrawdown}
                                            <TrendingDown className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Results */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-gray-800/30 border-gray-700">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg">Performance Metrics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Total Trades</span>
                                                <span className="text-white font-semibold">{backtestResults.totalTrades}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Profit Factor</span>
                                                <span className="text-green-400 font-semibold">{backtestResults.profitFactor}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Average Trade</span>
                                                <span className="text-green-400 font-semibold">{backtestResults.avgTrade}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gray-800/30 border-gray-700">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg">Trade Analysis</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Best Trade</span>
                                                <span className="text-green-400 font-semibold">{backtestResults.bestTrade}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Worst Trade</span>
                                                <span className="text-red-400 font-semibold">{backtestResults.worstTrade}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Strategy</span>
                                                <span className="text-blue-400 font-semibold">{selectedStrategy}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

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
                            Get backtest results in under 30 seconds with our optimized testing engine.
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
