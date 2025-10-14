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
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Admin Login - no credentials needed, uses environment variables
    console.log(`${API_BASE}/api/auth/login/admin`)
    const response = await fetch(`${API_BASE}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include cookies for CORS
    })
    const data = await response.json()
    if (data.success) {
      // Store the token for future requests
      localStorage.setItem('adminToken', data.token)
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
                <div className="text-center text-gray-400 mb-6">
                  <p>Admin access uses secure environment credentials</p>
                  <p className="text-sm mt-2">No manual login required</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                >
                  Access Admin Panel
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
