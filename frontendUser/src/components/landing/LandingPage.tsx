import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { About } from './About'
import { TestAlgorithm } from './TestAlgorithm'
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
  LineChart
} from 'lucide-react'

interface LandingPageProps {
  onNavigateToLogin: () => void
  onLogin: () => void
}



export function LandingPage({ onNavigateToLogin, onLogin }: LandingPageProps) {
    const [showAbout, setShowAbout] = useState(false)
    const [showTestAlgorithm, setShowTestAlgorithm] = useState(false)

    const handleDemoLogin = () => {
        // Automatically login to dashboard (demo login)
        onLogin()
    }

    const toggleAbout = () => {
        if (showAbout || showTestAlgorithm) {
            // If either About or Test Algorithm is active, clicking this button goes to Home
            setShowAbout(false)
            setShowTestAlgorithm(false)
        } else {
            // If on home page, clicking this button goes to About
            setShowAbout(true)
            setShowTestAlgorithm(false)
        }
        // Scroll to top when navigating between content
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const toggleTestAlgorithm = () => {
        if (!showTestAlgorithm) {
            // If not already showing Test Algorithm, show it
            setShowTestAlgorithm(true)
            setShowAbout(false)
        }
        // If already showing Test Algorithm, don't hide it (user can click Home/About instead)
        // Scroll to top when navigating between content
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return (
        <div className="min-h-screen bg-gray-950 text-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800">
            <div className="flex justify-between items-center h-20 px-4 mx-6">
                <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-black" />
                </div>
                <span className="text-2xl font-semibold text-white">Buy-nance Bandits</span>
                </div>
                <div className="flex items-center gap-6">
                <Button 
                    onClick={toggleAbout}
                    variant="ghost" 
                    className={`text-lg ${showAbout ? 'text-blue-400 hover:text-blue-300' : 'text-white hover:text-gray-300'}`}
                >
                    {showAbout || showTestAlgorithm ? 'Home' : 'About'}
                </Button>
                <Button 
                    onClick={toggleTestAlgorithm}
                    variant="ghost" 
                    className={`text-lg ${showTestAlgorithm ? 'text-blue-400 hover:text-blue-300' : 'text-white hover:text-gray-300'}`}
                >
                    Test Algorithm
                </Button>
                <Button 
                    onClick={onNavigateToLogin}
                    className="bg-white text-black hover:bg-gray-100 rounded-full px-6 text-lg"
                >
                    Sign In
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                </div>
            </div>
        </nav>

        {/* Main Content */}
        {!showAbout && !showTestAlgorithm ? (
          <>
            {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto text-center">
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
                <span className="text-white">Dominate Crypto Markets with</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Buy-nance Bandits
                </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                Advanced AI-powered trading bots that work 24/7 to maximize your profits. Trade SOL, 
                ETH, and BTC futures with professional-grade risk management and lightning-fast 
                backtesting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
                <Button 
                onClick={onNavigateToLogin}
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg rounded-lg font-medium"
                >
                Start Trading Now
                <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                variant="ghost" 
                size="lg" 
                className="text-white hover:text-gray-300 px-8 py-4 text-lg font-medium"
                onClick={() => handleDemoLogin()}
                >
                Demo Login
                </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
                Free demo account • No credit card required • Full platform access
            </p>
            </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="flex flex-col items-center">
                <Users className="w-8 h-8 text-gray-400 mb-4" />
                <div className="text-3xl font-bold text-white mb-2">2,500+</div>
                <div className="text-gray-400 text-sm">Active Traders</div>
                </div>
                <div className="flex flex-col items-center">
                <DollarSign className="w-8 h-8 text-gray-400 mb-4" />
                <div className="text-3xl font-bold text-white mb-2">$45M+</div>
                <div className="text-gray-400 text-sm">Total Volume</div>
                </div>
                <div className="flex flex-col items-center">
                <TrendingUp className="w-8 h-8 text-gray-400 mb-4" />
                <div className="text-3xl font-bold text-white mb-2">73.2%</div>
                <div className="text-gray-400 text-sm">Success Rate</div>
                </div>
                <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 text-gray-400 mb-4" />
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-gray-400 text-sm">Uptime</div>
                </div>
            </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Everything You Need to Win</h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Professional-grade trading tools designed for both beginners and experienced traders
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                    <Bot className="w-6 h-6 text-white" />
                    <CardTitle className="text-white text-lg">Advanced Trading Bots</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-gray-400 text-sm leading-relaxed">
                    AI-powered trading strategies that work 24/7 to maximize your crypto profits with SOL, ETH, and BTC.
                    </p>
                </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-white" />
                    <CardTitle className="text-white text-lg">Risk Management</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-gray-400 text-sm leading-relaxed">
                    Built-in stop-loss and take-profit mechanisms with leverage capping to protect your investments.
                    </p>
                </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                    <LineChart className="w-6 h-6 text-white" />
                    <CardTitle className="text-white text-lg">Backtesting Engine</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-gray-400 text-sm leading-relaxed">
                    Test your strategies with historical data. Get results in under 30 seconds with 99% accuracy.
                    </p>
                </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-white" />
                    <CardTitle className="text-white text-lg">Strategy Management</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-gray-400 text-sm leading-relaxed">
                    Create, customize, and deploy multiple trading strategies tailored to your risk tolerance.
                    </p>
                </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-6 h-6 text-white" />
                    <CardTitle className="text-white text-lg">Real-time Analytics</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-gray-400 text-sm leading-relaxed">
                    Comprehensive performance tracking with detailed charts and portfolio insights.
                    </p>
                </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                    <Lock className="w-6 h-6 text-white" />
                    <CardTitle className="text-white text-lg">Non-Custodial Trading</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-gray-400 text-sm leading-relaxed">
                    Your funds stay in your wallet. We never hold your crypto - trade with complete security.
                    </p>
                </CardContent>
                </Card>
            </div>
            </div>
        </section>


        {/* Trade Smarter Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                <div className="text-sm text-gray-400 mb-4">Why Choose Buy-nance Bandits</div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Trade Smarter, Not Harder</h2>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                    Our platform combines cutting-edge AI with battle-tested trading strategies to give you the edge in volatile crypto markets.
                </p>
                
                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">24/7 automated trading - never miss an opportunity</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Advanced risk management with stop-loss protection</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Multi-asset support (SOL, ETH, BTC futures)</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Lightning-fast backtesting (&lt;30 second results)</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Compound interest optimization</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Professional admin dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Real-time performance tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Paper trading for safe strategy testing</span>
                    </div>
                </div>
                
                <Button 
                    onClick={onNavigateToLogin}
                    className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-lg font-medium"
                >
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 text-sm">● BTC/USDT</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">$68,245</div>
                    <div className="text-green-400 text-sm">+2.34%</div>
                </Card>
                
                <Card className="bg-gray-900 border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                    <span className="text-blue-400 text-sm">● ETH/USDT</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">$3,456</div>
                    <div className="text-green-400 text-sm">+1.87%</div>
                </Card>
                
                <Card className="bg-gray-900 border-gray-800 p-6 col-span-2">
                    <div className="text-sm text-gray-400 mb-2">Portfolio Performance</div>
                    <div className="text-3xl font-bold text-green-400 mb-1">+$12,847</div>
                    <div className="text-green-400 text-sm">+23.4% this month</div>
                </Card>
                </div>
            </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-800 p-12 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Trading?</h2>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of traders who trust Buy-nance Bandits to maximize their crypto profits. Start with our free demo account today.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Button 
                    onClick={onNavigateToLogin}
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg rounded-lg font-medium"
                >
                    Start Free Demo
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                    onClick={onNavigateToLogin}
                    variant="ghost" 
                    size="lg" 
                    className="text-white hover:text-gray-300 px-8 py-4 text-lg font-medium underline"
                >
                    Existing User? Sign In
                </Button>
                </div>
                
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span>✓ No credit card required</span>
                <span>✓ Full platform access</span>
                <span>✓ Risk-free testing</span>
                </div>
            </Card>
            </div>
        </section>
          </>
        ) : showAbout ? (
          /* About Content */
          <About />
        ) : (
          /* Test Algorithm Content */
          <TestAlgorithm onNavigateToLogin={onNavigateToLogin} onLogin={onLogin} />
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-black" />
                </div>
                <span className="text-lg font-semibold text-white">Buy-nance Bandits</span>
                </div>
                <div className="flex items-center gap-8 text-sm text-gray-400">
                <button className="hover:text-white">Terms of Service</button>
                <button className="hover:text-white">Privacy Policy</button>
                <button className="hover:text-white">Risk Disclosure</button>
                <button className="hover:text-white">Support</button>
                </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 space-y-2">
                <p>© 2025 Buy-nance Bandits. All rights reserved.</p>
                <p className="max-w-4xl mx-auto">
                <strong>Disclaimer:</strong> Cryptocurrency trading involves substantial risk of loss. Trade responsibly and never invest more than you can afford to lose.
                </p>
            </div>
            </div>
        </footer>
        </div>
    )
}
