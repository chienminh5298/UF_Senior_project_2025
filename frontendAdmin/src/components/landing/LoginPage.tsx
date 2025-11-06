import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Shield,
  TrendingUp
} from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      // Admin Login - no credentials needed, uses environment variables
      const loginUrl = API_BASE
        ? `${API_BASE.replace(/\/$/, '')}/api/auth/login/admin`
        : '/api/auth/login/admin'
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store the token for future requests
        localStorage.setItem('adminToken', data.token)
        onLogin()
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      {/* Main Content */}
      <div className="w-full px-6">
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
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center text-gray-400 mb-6">
                  <p>Admin access uses secure environment credentials</p>
                  <p className="text-sm mt-2">No manual login required</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Access Admin Panel'}
                </Button>
              </form>

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
