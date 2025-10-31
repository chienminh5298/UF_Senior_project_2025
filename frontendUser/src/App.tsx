import { useState, useRef, useEffect } from 'react'
import { LandingPage } from './components/landing/LandingPage'
import { LoginPage } from './components/landing/LoginPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { Sidebar } from './components/dashboard/Sidebar'
import { Trading } from './components/dashboard/Trading'
import { Backtesting } from './components/dashboard/Backtesting'
import { Portfolio } from './components/dashboard/Portfolio'
import { History } from './components/dashboard/History'
import { Settings } from './components/dashboard/Settings'
import { Button } from './components/ui/button'
import {
  ChevronDown, User, Settings as SettingsIcon, LogOut, Bell
} from 'lucide-react'

type AppState = 'landing' | 'login' | 'dashboard'

function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('landing')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [portfolioValue, setPortfolioValue] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleNavigateToLogin = () => { setCurrentPage('login') }
  const handleNavigateToLanding = () => { setCurrentPage('landing') }
  const handleLogin = () => { 
    setCurrentPage('dashboard')
    fetchPortfolioValue()
  }
  const handleSignOut = () => { 
    setCurrentPage('landing')
    setActiveTab('dashboard')
    setPortfolioValue(0)
  }

  const fetchPortfolioValue = async () => {
    try {
      setLoading(true)
      const authData = localStorage.getItem('auth')
      if (!authData) {
        console.error('No auth data in localStorage')
        return
      }
      
      let parsedAuth
      try {
        parsedAuth = JSON.parse(authData)
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError)
        return
      }
      
      const token = parsedAuth?.token
      if (!token || token === 'null' || token === 'undefined') {
        console.error('Invalid or missing token')
        return
      }
      
      const response = await fetch('/api/user/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPortfolioValue(data.data.totalValue || 0)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }))
        console.error('Failed to fetch portfolio value:', errorData)
      }
    } catch (error) {
      console.error('Error fetching portfolio value:', error)
    } finally {
      setLoading(false)
    }
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

  // Refresh portfolio value when switching tabs
  useEffect(() => {
    if (currentPage === 'dashboard') {
      fetchPortfolioValue()
    }
  }, [activeTab])

  // Landing Page
  if (currentPage === 'landing') {
    return <LandingPage onNavigateToLogin={handleNavigateToLogin} onLogin={handleLogin} />
  }

  // Login Page
  if (currentPage === 'login') {
    return (
      <LoginPage
        onNavigateToLanding={handleNavigateToLanding}
        onLogin={handleLogin}
      />
    )
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'portfolio': return <Portfolio />
      case 'trading': return <Trading />
      case 'backtesting': return <Backtesting />
      case 'history': return <History />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="bg-gray-950 border-t border-r border-b border-gray-800 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Live Trading Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-300">Live Trading Active</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* Portfolio Value - Non-clickable */}
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-400">Portfolio Value</div>
                <div className="text-sm sm:text-lg font-semibold text-white">
                  {loading ? (
                    <div className="w-16 sm:w-20 h-4 sm:h-6 bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </div>
              </div>

              {/* User Menu - Clickable */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium text-white">John Doe</div>
                    <div className="text-xs text-gray-400">INVESTOR</div>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">John Doe</div>
                          <div className="text-sm text-gray-400">john@example.com</div>
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