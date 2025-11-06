import { useState, useRef, useEffect } from 'react'
import { LoginPage } from './components/landing/LoginPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { Sidebar } from './components/dashboard/Sidebar'
import { Trading } from './components/dashboard/Trading'
import { Backtesting } from './components/dashboard/Backtesting'
import { Portfolio } from './components/dashboard/Portfolio'
import { History } from './components/dashboard/History'
import { Settings } from './components/dashboard/Settings'
import { Admin } from './components/dashboard/Admin'
import { Button } from './components/ui/button'
import {
  ChevronDown, User, Settings as SettingsIcon, LogOut, Bell
} from 'lucide-react'

type AppState = 'login' | 'dashboard'

function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('login')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userData, setUserData] = useState<{ fullname: string; username: string; email: string } | null>(null)
  const [portfolioValue, setPortfolioValue] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchPortfolioValue = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      if (!token) return
      
      const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
      const getApiUrl = (path: string) => {
        if (API_BASE) {
          const base = API_BASE.replace(/\/$/, '')
          const apiPath = path.startsWith('/') ? path : `/${path}`
          return `${base}${apiPath}`
        }
        return path.startsWith('/') ? path : `/${path}`
      }
      
      const response = await fetch(getApiUrl('/api/admin/portfolio'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPortfolioValue(data.data?.totalValue || 0)
      }
    } catch (error) {
      console.error('Error fetching portfolio value:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => { 
    setCurrentPage('dashboard')
    // Load user data from localStorage
    try {
      const auth = localStorage.getItem('auth')
      if (auth) {
        const { user } = JSON.parse(auth)
        setUserData(user)
      }
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
    fetchPortfolioValue()
  }
  const handleSignOut = () => { 
    setCurrentPage('login')
    setActiveTab('dashboard')
    setUserData(null)
    localStorage.removeItem('auth')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    // Listen for portfolio value updates from Dashboard
    const handlePortfolioUpdate = (event: CustomEvent) => {
      setPortfolioValue(event.detail)
    }
    
    window.addEventListener('portfolioValueUpdate', handlePortfolioUpdate as EventListener)
    
    // Also check localStorage on mount
    const storedValue = localStorage.getItem('adminPortfolioValue')
    if (storedValue) {
      setPortfolioValue(parseFloat(storedValue))
    }
    
    return () => {
      window.removeEventListener('portfolioValueUpdate', handlePortfolioUpdate as EventListener)
    }
  }, [])

  // Login Page
  if (currentPage === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
      />
    )
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'trading': return <Trading />
      case 'backtesting': return <Backtesting />
      case 'portfolio': return <Portfolio />
      case 'history': return <History />
      case 'admin': return <Admin />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="bg-gray-950 border-t border-r border-b border-gray-800 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Live Trading Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Live Trading Active</span>
            </div>

            <div className="flex items-center gap-6">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
              </Button>

              {/* Portfolio Value - Non-clickable */}
              <div className="text-right">
                <div className="text-sm text-gray-400">Portfolio Value</div>
                <div className="text-lg font-semibold text-white">
                  {loading ? (
                    <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </div>
              </div>

              {/* User Menu - Clickable */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{userData?.fullname || 'Admin User'}</div>
                    <div className="text-xs text-gray-400">@{userData?.username || 'admin'}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{userData?.fullname || 'Admin User'}</div>
                          <div className="text-sm text-gray-400">{userData?.email || 'admin@example.com'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4" /> Settings
                      </button>
                      <button
                        onClick={() => { handleSignOut(); setIsUserMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}

export default App
