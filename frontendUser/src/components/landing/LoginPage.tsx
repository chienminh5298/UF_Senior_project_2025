import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react'

interface LoginPageProps {
  onNavigateToLanding: () => void
  onLogin: () => void
}

export function LoginPage({ onNavigateToLanding, onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        const fullname = `${firstName} ${lastName}`.trim()
        const usernameToSend = (username || `${firstName}${lastName}` || firstName)
          .replace(/\s+/g, '')
          .toLowerCase()
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullname, username: usernameToSend, email, password })
        })
        let data: any = null
        try {
          data = await res.json()
        } catch (_) {
          // Non-JSON error, will be handled below
        }
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Signup failed')
        }
        // After signup, auto-login
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      let loginData: any = null
      try {
        loginData = await loginRes.json()
      } catch (_) {
        // Non-JSON error
      }
      if (!loginRes.ok || !loginData?.success) {
        throw new Error(loginData?.message || 'Login failed')
      }
      const authPayload = { token: loginData.token, user: loginData.user }
      localStorage.setItem('auth', JSON.stringify(authPayload))
      onLogin()
    } catch (err: any) {
      setError(err?.message || 'Unable to authenticate')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    const demoAuth = {
      token: 'demo-token',
      user: {
        id: 0,
        fullname: 'Demo Investor',
        username: 'demo',
        email: 'demo@example.com',
        isVerified: true
      }
    }
    try {
      localStorage.setItem('auth', JSON.stringify(demoAuth))
    } catch {}
    onLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">Buy-nance Bandits</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Welcome Back to the Future of Trading
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Access your AI-powered trading dashboard and take control of your crypto investments.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">Real-time portfolio tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-gray-300">Advanced risk management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-gray-300">Exclusive trading community</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-800">
            <div>
              <div className="text-2xl font-bold text-blue-400">78.5%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">$2.4M+</div>
              <div className="text-sm text-gray-400">Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">1,200+</div>
              <div className="text-sm text-gray-400">Traders</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onNavigateToLanding}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Secure Login
                </Badge>
              </div>
              <div className="text-center lg:hidden">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Buy-nance Bandits</span>
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-white">
                {isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}
              </CardTitle>
              <p className="text-center text-gray-400">
                {isSignUp 
                  ? 'Join thousands of successful crypto traders' 
                  : 'Access your trading dashboard and portfolio'
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <div className="text-sm text-red-400" role="alert">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label htmlFor="username" className="text-sm font-medium text-gray-300">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {!isSignUp && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-300">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 mt-1"
                        required
                      />
                      <span className="text-sm text-gray-300">
                        I agree to the{' '}
                        <button type="button" className="text-blue-400 hover:text-blue-300">Terms of Service</button>
                        {' '}and{' '}
                        <button type="button" className="text-blue-400 hover:text-blue-300">Privacy Policy</button>
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 mt-1"
                      />
                      <span className="text-sm text-gray-300">
                        I want to receive trading updates and market insights via email
                      </span>
                    </label>
                  </div>
                )}

                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In to Dashboard')}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Or try demo access</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={() => handleDemoLogin()}
                  variant="outline" 
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-blue-500 px-8"
                >
                  Demo Investor
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  {isSignUp ? (
                    <>
                      Already have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Protected by enterprise-grade security</p>
            <p>© 2025 Buy-nance Bandits. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
