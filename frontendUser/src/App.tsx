import { useState, useRef, useEffect, useCallback } from 'react'
import { LandingPage } from './components/landing/LandingPage'
import { LoginPage } from './components/landing/LoginPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { Sidebar } from './components/dashboard/Sidebar'
import { Trading } from './components/dashboard/Trading'
import { Backtesting } from './components/dashboard/Backtesting'
import { Portfolio } from './components/dashboard/Portfolio'
import { History } from './components/dashboard/History'
import { Settings } from './components/dashboard/Settings'
import { Bills } from './components/dashboard/Bills'
import { Button } from './components/ui/button'
import {
  ChevronDown, User, Settings as SettingsIcon, LogOut, Bell
} from 'lucide-react'

type AppState = 'landing' | 'login' | 'dashboard'

interface Notification {
  id: number
  type: 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'PAYMENT_PENDING' | 'TRADE_COMPLETE' | 'SYSTEM'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  claim?: {
    id: number
    amount: number
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('landing')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)
  const [portfolioValue, setPortfolioValue] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  const fetchPriceData = useCallback(async () => {
    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return []
      
      let parsedAuth
      try {
        parsedAuth = JSON.parse(authData)
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError)
        return []
      }
      
      const token = parsedAuth?.token
      if (!token || token === 'null' || token === 'undefined') {
        return []
      }
      
      const response = await fetch('/api/user/orders/price-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch price data')
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching price data:', error)
      return []
    }
  }, [])

  const loadPriceData = useCallback(async () => {
    const priceData = await fetchPriceData()
    setCryptoPrices(priceData)
  }, [fetchPriceData])

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

  const fetchNotifications = useCallback(async () => {
    if (currentPage !== 'dashboard') return
    
    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return

      const parsedAuth = JSON.parse(authData)
      const token = parsedAuth?.token

      if (!token) return

      setLoadingNotifications(true)
      const response = await fetch('/api/user/notifications?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.success) {
          setNotifications(data.data.notifications)
          const unread = data.data.notifications.filter((n: Notification) => !n.isRead).length
          setUnreadCount(unread)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }, [currentPage])

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return

      const parsedAuth = JSON.parse(authData)
      const token = parsedAuth?.token

      if (!token) return

      const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  useEffect(() => {
    if (currentPage === 'dashboard') {
      loadPriceData()
      fetchNotifications()
      // Set up automatic price updates every 2 seconds
      const priceInterval = setInterval(() => {
        loadPriceData()
      }, 2000)
      // Set up automatic notification updates every 30 seconds
      const notificationInterval = setInterval(() => {
        fetchNotifications()
      }, 30000)

      return () => {
        clearInterval(priceInterval)
        clearInterval(notificationInterval)
      }
    }
  }, [currentPage, loadPriceData, fetchNotifications])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
      case 'bills': return <Bills />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="bg-gray-950 border-t border-r border-b border-gray-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 min-w-0">
            {/* Crypto Prices Ticker */}
            <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
              <div className="flex items-center gap-4 animate-scroll" style={{ width: 'max-content' }}>
                {cryptoPrices.length > 0 ? (
                  <>
                    {cryptoPrices.map((crypto, index) => {
                      const symbol = crypto.tokenName?.substring(0, 3).toUpperCase() || 'N/A'
                      const priceChange = crypto.priceChangePercent || 0
                      const isPositive = priceChange >= 0
                      
                      return (
                        <div key={`${crypto.tokenName}-${index}`} className="flex items-center gap-4 whitespace-nowrap px-6 py-2">
                          <span className="text-lg font-semibold text-white">{symbol}</span>
                          <span className="text-lg text-gray-300">${(crypto.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`text-base font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                          </span>
                          {index < cryptoPrices.length - 1 && (
                            <div className="w-px h-6 bg-gray-700"></div>
                          )}
                        </div>
                      )
                    })}
                    {/* Duplicate for seamless loop */}
                    {cryptoPrices.map((crypto, index) => {
                      const symbol = crypto.tokenName?.substring(0, 3).toUpperCase() || 'N/A'
                      const priceChange = crypto.priceChangePercent || 0
                      const isPositive = priceChange >= 0
                      
                      return (
                        <div key={`${crypto.tokenName}-dup-${index}`} className="flex items-center gap-4 whitespace-nowrap px-6 py-2">
                          <span className="text-lg font-semibold text-white">{symbol}</span>
                          <span className="text-lg text-gray-300">${(crypto.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`text-base font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                          </span>
                          {index < cryptoPrices.length - 1 && (
                            <div className="w-px h-6 bg-gray-700"></div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-base text-gray-400">Loading prices...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 flex-shrink-0">
              {/* Notifications */}
              <div className="relative" ref={notificationMenuRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white relative"
                  onClick={() => {
                    setIsNotificationMenuOpen(!isNotificationMenuOpen)
                    if (!isNotificationMenuOpen) {
                      fetchNotifications() // Refresh when opening
                    }
                  }}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                {isNotificationMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-[600px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-sm text-gray-400">{unreadCount} unread</span>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-gray-400">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No notifications</div>
                      ) : (
                        <div className="divide-y divide-gray-700">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                                !notification.isRead ? 'bg-blue-500/5' : ''
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markNotificationAsRead(notification.id)
                                }
                                if (notification.type === 'PAYMENT_REJECTED' || notification.type === 'PAYMENT_APPROVED') {
                                  setActiveTab('bills')
                                  setIsNotificationMenuOpen(false)
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`text-sm font-semibold ${
                                      notification.isRead ? 'text-gray-400' : 'text-white'
                                    }`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </div>
                                  <p className={`text-xs ${
                                    notification.isRead ? 'text-gray-500' : 'text-gray-300'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  {notification.type === 'PAYMENT_REJECTED' && (
                                    <p className="text-xs text-red-400 mt-1 italic">
                                      Click to view details on Bills page
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-700">
                        <button
                          onClick={() => {
                            setActiveTab('bills')
                            setIsNotificationMenuOpen(false)
                          }}
                          className="w-full text-sm text-blue-400 hover:text-blue-300 text-center"
                        >
                          View All Bills
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

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