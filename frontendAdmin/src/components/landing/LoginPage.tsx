import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  TrendingUp
} from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Login
    console.log(`${API_BASE}/api/auth/login`)
    const response = await fetch(`${API_BASE}/api/auth/login`,{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (data.success) {
      onLogin()
    } else {
      alert(data.message)
    }
  }

  const handleDemoLogin = () => {
    // Simulate demo login
    onLogin()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Main Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Buy-nance Bandits</span>
              </div>
              <p className="text-gray-400 text-xl">
                Admin Sign In
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>


                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">Or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleDemoLogin}
                  className="w-full mt-4 border-gray-700 text-gray-300 hover:text-white"
                >
                  Demo Admin Access
                </Button>
              </div>


              {/* Admin Badge */}
              <div className="mt-6 flex justify-center">
                <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrative Access
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
