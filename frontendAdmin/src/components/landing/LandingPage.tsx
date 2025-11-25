import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { About } from './About'
import { 
  TrendingUp, 
  Shield, 
  Users,
  Target,
  DollarSign,
  ArrowRight,
  Activity,
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
        setShowTestAlgorithm(!showTestAlgorithm)
        setShowAbout(false)
        // Scroll to top when navigating between content
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (showAbout) {
        return <About onBack={toggleAbout} />
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white">Buy-nance Bandits</h1>
                                <p className="text-xs text-gray-400">Admin Portal</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-8">
                            <button 
                                onClick={toggleAbout}
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                {showAbout || showTestAlgorithm ? 'Home' : 'About'}
                            </button>
                            <button 
                                onClick={toggleTestAlgorithm}
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Test Algorithm
                            </button>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={onNavigateToLogin}
                                className="text-gray-300 hover:text-white"
                            >
                                Sign In
                            </Button>
                            <Button
                                onClick={handleDemoLogin}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Demo Login
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto text-center">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Admin Dashboard for<br />
                            Crypto Trading Excellence
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                            Manage your trading platform with advanced administrative tools. 
                            Monitor users, analyze performance, and control system operations with precision.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={handleDemoLogin}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                            >
                                Access Admin Portal
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={toggleAbout}
                                className="border-gray-700 text-gray-300 hover:text-white px-8 py-3 text-lg"
                            >
                                Learn More
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Administrative Capabilities
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Comprehensive tools to manage every aspect of your trading platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 - User Management */}
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mb-4">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                                <CardTitle className="text-white text-xl">User Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400">
                                    Monitor user accounts, manage permissions, track performance, and handle support requests efficiently.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Feature 2 - System Analytics */}
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center mb-4">
                                    <LineChart className="w-6 h-6 text-green-400" />
                                </div>
                                <CardTitle className="text-white text-xl">System Analytics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400">
                                    Comprehensive insights into platform performance, trading volumes, and system health metrics.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Feature 3 - Order Management */}
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-purple-600/20 border border-purple-600/30 flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6 text-purple-400" />
                                </div>
                                <CardTitle className="text-white text-xl">Order Oversight</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400">
                                    Monitor all trading orders across the platform with real-time status updates and management controls.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Feature 4 - Transaction Control */}
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center mb-4">
                                    <DollarSign className="w-6 h-6 text-yellow-400" />
                                </div>
                                <CardTitle className="text-white text-xl">Transaction Control</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400">
                                    Review and approve deposits, withdrawals, and other financial transactions with advanced security.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Feature 5 - Strategy Management */}
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center mb-4">
                                    <Target className="w-6 h-6 text-red-400" />
                                </div>
                                <CardTitle className="text-white text-xl">Strategy Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400">
                                    Configure and monitor trading strategies, set parameters, and analyze performance across users.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Feature 6 - Security & Compliance */}
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-orange-600/20 border border-orange-600/30 flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6 text-orange-400" />
                                </div>
                                <CardTitle className="text-white text-xl">Security & Compliance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400">
                                    Advanced security monitoring, compliance tracking, and risk management tools for platform safety.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 bg-gray-900/50">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-blue-400 mb-2">5+</div>
                            <div className="text-gray-400">Active Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-400 mb-2">$1.25M</div>
                            <div className="text-gray-400">Assets Under Management</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-purple-400 mb-2">1,284</div>
                            <div className="text-gray-400">Total Trades</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-yellow-400 mb-2">68.5%</div>
                            <div className="text-gray-400">Success Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Ready to Manage Your Trading Platform?
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Access comprehensive administrative tools and take control of your crypto trading platform today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={handleDemoLogin}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                            >
                                Access Admin Dashboard
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={onNavigateToLogin}
                                className="border-gray-700 text-gray-300 hover:text-white px-8 py-3"
                            >
                                Sign In
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-12 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center gap-3 mb-4 md:mb-0">
                            <div className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white">Buy-nance Bandits</h1>
                                <p className="text-xs text-gray-400">Admin Portal</p>
                            </div>
                        </div>
                        <div className="text-gray-400 text-sm">
                            © 2024 Buy-nance Bandits. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
