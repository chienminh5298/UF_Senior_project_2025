import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CheckCircle,
  X,
  Settings,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react'

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

// Types for API responses
interface ApiOrder {
  id: number
  orderId: string
  status: 'ACTIVE' | 'FINISHED' | 'EXPIRED'
  side: 'BUY' | 'SELL'
  entryPrice: number
  fee: number
  qty: number
  budget: number
  netProfit: number
  buyDate: string
  token: {
    name: string
  }
  user: {
    id: number
    email: string
  }
}

interface ApiUser {
  id: number
  fullname: string
  username: string
  email: string
  isActive: boolean
  tradeBalance: number
  profit: number
}

interface ApiToken {
  id: number
  name: string
  isActive: boolean
}

interface NewStrategyForm {
  description: string
  contribution: number
  direction: 'SAME' | 'OPPOSITE'
  isCloseBeforeNewCandle: boolean
  selectedTokens: number[]
  targets: Array<{
    targetPercent: number
    stoplossPercent: number
    tokenId?: number
  }>
}

// Mock data
const users = [
  {
    id: 1,
    name: 'John Thompson',
    email: 'john.thompson@example.com',
    role: 'INVESTOR',
    status: 'ACTIVE',
    balance: 142000,
    returns: 17000,
    returnsPercent: 13.6,
    joinDate: '2024-01-15'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    role: 'INVESTOR',
    status: 'ACTIVE',
    balance: 89500,
    returns: 4500,
    returnsPercent: 5.3,
    joinDate: '2024-02-20'
  },
  {
    id: 3,
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@example.com',
    role: 'INVESTOR',
    status: 'PENDING KYC',
    balance: 0,
    returns: 0,
    returnsPercent: 0,
    joinDate: '2024-09-10'
  },
  {
    id: 4,
    name: 'Emily Watson',
    email: 'emily.watson@example.com',
    role: 'INVESTOR',
    status: 'SUSPENDED',
    balance: 185000,
    returns: -15000,
    returnsPercent: -7.5,
    joinDate: '2023-11-05'
  },
  {
    id: 5,
    name: 'David Park',
    email: 'david.park@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    balance: 0,
    returns: 0,
    returnsPercent: 0,
    joinDate: '2023-06-01'
  }
]


const transactions = [
  { id: 1, user: 'John Thompson', type: 'DEPOSIT', amount: 15000, status: 'PENDING', timestamp: '2024-09-18 12:00:00' },
  { id: 2, user: 'Sarah Chen', type: 'WITHDRAW', amount: 5000, status: 'PENDING', timestamp: '2024-09-18 11:30:00' },
  { id: 3, user: 'Emily Watson', type: 'DEPOSIT', amount: 25000, status: 'APPROVED', timestamp: '2024-09-18 10:15:00' },
  { id: 4, user: 'Michael Rodriguez', type: 'WITHDRAW', amount: 2000, status: 'REJECTED', timestamp: '2024-09-18 09:45:00' }
]

const strategies = [
  { 
    id: 1, 
    name: 'Momentum Scalper', 
    status: 'ACTIVE', 
    pairs: ['BTC/USDT', 'ETH/USDT'], 
    takeProfit: 2.5, 
    stopLoss: 1.5, 
    performance: 15.2 
  },
  { 
    id: 2, 
    name: 'Arbitrage Hunter', 
    status: 'PAUSED', 
    pairs: ['BTC/USDT'], 
    takeProfit: 1.0, 
    stopLoss: 0.5, 
    performance: 8.7 
  },
  { 
    id: 3, 
    name: 'Trend Follower', 
    status: 'ACTIVE', 
    pairs: ['ETH/USDT', 'BNB/USDT'], 
    takeProfit: 3.0, 
    stopLoss: 2.0, 
    performance: 22.1 
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': case 'FILLED': case 'APPROVED': return 'bg-green-600'
    case 'PENDING KYC': case 'PENDING': return 'bg-yellow-600'
    case 'SUSPENDED': case 'CANCELLED': case 'REJECTED': return 'bg-red-600'
    case 'PAUSED': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

const getRoleColor = (role: string) => {
  return role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'
}

const getReturnsColor = (returns: number) => {
  if (returns > 0) return 'text-green-400'
  if (returns < 0) return 'text-red-400'
  return 'text-gray-400'
}

// API Functions
const fetchOrders = async (status?: string): Promise<ApiOrder[]> => {
  const token = localStorage.getItem('adminToken')
  const url = status ? `${API_BASE}/api/admin/orders?status=${status}` : `${API_BASE}/api/admin/orders`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  const data = await response.json()
  return data.data.orders
}

const fetchUsers = async (): Promise<ApiUser[]> => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  
  const data = await response.json()
  return data.data.users
}

const fetchOrderStats = async () => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/orders/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch order stats')
  }
  
  const data = await response.json()
  return data.data
}

const fetchTokens = async (): Promise<ApiToken[]> => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/tokens`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch tokens')
  }
  
  const data = await response.json()
  return data.data.tokens
}

const createStrategy = async (strategyData: NewStrategyForm) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/strategies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: strategyData.description,
      contribution: strategyData.contribution,
      direction: strategyData.direction,
      isCloseBeforeNewCandle: strategyData.isCloseBeforeNewCandle,
      tokenStrategies: strategyData.selectedTokens.map(tokenId => ({ tokenId })),
      targets: strategyData.targets
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create strategy')
  }
  
  const data = await response.json()
  return data.data.strategy
}

export function Admin() {
  const [activeTab, setActiveTab] = useState('Analyze')
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [selectedYear, setSelectedYear] = useState('2024')
  
  // API Data State
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>([])
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [orderStats, setOrderStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Strategy Form State
  const [showNewStrategyForm, setShowNewStrategyForm] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<ApiToken[]>([])
  const [newStrategyForm, setNewStrategyForm] = useState<NewStrategyForm>({
    description: '',
    contribution: 0,
    direction: 'SAME',
    isCloseBeforeNewCandle: false,
    selectedTokens: [],
    targets: [{ targetPercent: 0, stoplossPercent: 0 }]
  })
  
  const tabs = ['Analyze', 'Orders', 'Transactions', 'Strategies', 'Users']

  // Load data when component mounts or tab changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        if (activeTab === 'Orders') {
          const ordersData = await fetchOrders()
          setApiOrders(ordersData)
        } else if (activeTab === 'Users') {
          const usersData = await fetchUsers()
          setApiUsers(usersData)
        } else if (activeTab === 'Analyze') {
          const statsData = await fetchOrderStats()
          setOrderStats(statsData)
        } else if (activeTab === 'Strategies') {
          const tokensData = await fetchTokens()
          setAvailableTokens(tokensData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activeTab])

  const renderAnalyzeContent = () => (
    <div className="space-y-6">
      {/* Header with Year Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Analysis</h1>
          <p className="text-gray-400">Comprehensive system performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </div>

      {/* System Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Account Funds</p>
                  <p className="text-2xl font-bold text-white">$1,247,500</p>
                  <p className="text-green-400 text-sm">+12.3% from last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Deposits</p>
                  <p className="text-2xl font-bold text-white">$987,600</p>
                  <p className="text-blue-400 text-sm">+8.7% from last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Withdrawals</p>
                  <p className="text-2xl font-bold text-white">$123,450</p>
                  <p className="text-yellow-400 text-sm">+5.2% from last month</p>
                </div>
                <TrendingDown className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trades Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Trading Performance
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading stats...</span>
          </div>
        ) : orderStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-xl font-bold text-white">{orderStats.totalTrades}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm">Completed Trades</p>
                <p className="text-xl font-bold text-green-400">{orderStats.completedTrades}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm">Pending Trades</p>
                <p className="text-xl font-bold text-yellow-400">{orderStats.pendingTrades}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm">Total Profit</p>
                <p className={`text-xl font-bold ${orderStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${orderStats.totalProfit?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm">Total Profit</p>
                <p className="text-xl font-bold text-green-400">$45,670</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm">Total Loss</p>
                <p className="text-xl font-bold text-red-400">-$12,340</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Net P&L</p>
              <p className="text-xl font-bold text-green-400">$33,330</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-xl font-bold text-white">68.5%</p>
            </CardContent>
          </Card>
        </div>
        )}
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Performance Chart ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Performance chart visualization would go here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderOrdersContent = () => {
    const handleOrderClick = (order: ApiOrder) => {
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null)
      } else {
        // Convert API order to display format
        const displayOrder = {
          id: order.id,
          symbol: order.token.name,
          type: order.side,
          amount: order.qty,
          price: order.entryPrice,
          status: order.status,
          timestamp: new Date(order.buyDate).toLocaleString(),
          pnl: order.netProfit,
          user: order.user.email.split('@')[0], // Use email prefix as name
          userId: order.user.id,
          userEmail: order.user.email,
          orderType: 'Market', // Default since not in API
          fillPrice: order.entryPrice,
          fees: order.fee,
          strategy: 'API Strategy' // Default since not in API
        }
        setSelectedOrder(displayOrder as any)
      }
    }

    const handleRefresh = async () => {
      setLoading(true)
      setError(null)
      try {
        const ordersData = await fetchOrders()
        setApiOrders(ordersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh orders')
      } finally {
        setLoading(false)
      }
    }

    // Calculate total P&L from API data
    const totalPnL = apiOrders.reduce((sum, order) => sum + order.netProfit, 0)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-gray-400">Monitor current orders and P&L</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              variant="outline" 
              size="sm"
              className="border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Table */}
          <div className={selectedOrder ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Current Orders</CardTitle>
                <p className="text-sm text-gray-400">Click on an order to view details</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 text-sm font-medium text-gray-400">User</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Symbol</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Amount</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Price</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading orders...
                          </td>
                        </tr>
                      ) : apiOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        apiOrders.map((order) => (
                          <tr 
                            key={order.id} 
                            className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                              selectedOrder?.id === order.id 
                                ? 'bg-blue-600/10 border-blue-600/30' 
                                : 'hover:bg-gray-800/30'
                            }`}
                            onClick={() => handleOrderClick(order)}
                          >
                            <td className="py-3">
                              <div>
                                <p className="text-white font-medium text-sm">{order.user.email.split('@')[0]}</p>
                                <p className="text-gray-400 text-xs">{order.user.email}</p>
                              </div>
                            </td>
                            <td className="py-3 text-white font-medium">{order.token.name}</td>
                            <td className="py-3">
                              <Badge className={order.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                                {order.side}
                              </Badge>
                            </td>
                            <td className="py-3 text-white">{order.qty}</td>
                            <td className="py-3 text-white">${order.entryPrice.toLocaleString()}</td>
                            <td className="py-3">
                              <Badge className={`${getStatusColor(order.status)} text-white`}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <span className={order.netProfit > 0 ? 'text-green-400' : order.netProfit < 0 ? 'text-red-400' : 'text-gray-400'}>
                                {order.netProfit > 0 ? '+' : ''}${order.netProfit.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details Side Panel */}
          {selectedOrder && (
            <div className="lg:col-span-1">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Order Details</CardTitle>
                    <p className="text-sm text-gray-400">Order #{selectedOrder.id}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedOrder(null)}
                    className="hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-gray-400 text-sm">User</p>
                      <p className="text-white font-medium">{selectedOrder.user}</p>
                      <p className="text-gray-400 text-xs">{selectedOrder.userEmail}</p>
                    </div>

                    {/* Trade Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Symbol</p>
                        <p className="text-white font-medium">{selectedOrder.symbol}</p>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Type</p>
                        <Badge className={selectedOrder.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                          {selectedOrder.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p className="text-white font-medium">{selectedOrder.amount}</p>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Order Type</p>
                        <p className="text-white font-medium">{selectedOrder.orderType}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Pricing</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Order Price:</span>
                          <span className="text-white">${selectedOrder.price.toLocaleString()}</span>
                        </div>
                        {selectedOrder.fillPrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Fill Price:</span>
                            <span className="text-white">${selectedOrder.fillPrice.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Fees:</span>
                          <span className="text-white">${selectedOrder.fees}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & P&L */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Status</p>
                        <Badge className={`${getStatusColor(selectedOrder.status)} text-white mt-1`}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">P&L</p>
                        <p className={`font-medium text-lg ${
                          selectedOrder.pnl > 0 ? 'text-green-400' : 
                          selectedOrder.pnl < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {selectedOrder.pnl > 0 ? '+' : ''}${selectedOrder.pnl}
                        </p>
                      </div>
                    </div>

                    {/* Strategy & Time */}
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-gray-400 text-sm">Strategy</p>
                      <p className="text-white font-medium">{selectedOrder.strategy}</p>
                    </div>

                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-gray-400 text-sm">Timestamp</p>
                      <p className="text-white font-medium">{selectedOrder.timestamp}</p>
                    </div>

                    {/* Actions */}
                    {selectedOrder.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                          Cancel Order
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTransactionsContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Management</h1>
          <p className="text-gray-400">Approve or reject investor deposits and withdrawals</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Pending Requests</p>
          <p className="text-2xl font-bold text-yellow-400">2</p>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Transaction Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'DEPOSIT' ? 'bg-green-600/20' : 'bg-red-600/20'
                  }`}>
                    {transaction.type === 'DEPOSIT' ? 
                      <TrendingUp className="w-5 h-5 text-green-400" /> : 
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.user}</p>
                    <p className="text-gray-400 text-sm">
                      {transaction.type} - ${transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">{transaction.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(transaction.status)} text-white`}>
                    {transaction.status}
                  </Badge>
                  {transaction.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStrategiesContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy Management</h1>
          <p className="text-gray-400">Configure trading bot strategies and conditions</p>
        </div>
        <Button 
          onClick={() => setShowNewStrategyForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          New Strategy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{strategy.name}</CardTitle>
                <Badge className={`${getStatusColor(strategy.status)} text-white`}>
                  {strategy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Trading Pairs</p>
                  <div className="flex flex-wrap gap-2">
                    {strategy.pairs.map((pair, index) => (
                      <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                        {pair}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Take Profit</p>
                    <p className="text-green-400 font-medium">{strategy.takeProfit}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Stop Loss</p>
                    <p className="text-red-400 font-medium">{strategy.stopLoss}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Performance</p>
                  <p className={`font-medium ${strategy.performance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    +{strategy.performance}%
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Settings className="w-4 h-4 mr-1" />
                    Configure
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={strategy.status === 'ACTIVE' ? 'border-red-600 text-red-400' : 'border-green-600 text-green-400'}
                  >
                    {strategy.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderUsersContent = () => {
    const handleUserClick = (user: ApiUser) => {
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
      } else {
        // Convert API user to display format
        const displayUser = {
          id: user.id,
          name: user.fullname,
          email: user.email,
          role: 'INVESTOR',
          status: user.isActive ? 'ACTIVE' : 'SUSPENDED',
          balance: user.tradeBalance,
          returns: user.profit,
          returnsPercent: user.tradeBalance > 0 ? (user.profit / user.tradeBalance) * 100 : 0,
          joinDate: '2024-01-01' // Default since not in API
        }
        setSelectedUser(displayUser as any)
      }
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400">Manage investors and system users</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-white">{apiUsers.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All Users */}
          <div className={selectedUser ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">All Users</CardTitle>
                <p className="text-sm text-gray-400">Click on a user to view details</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 text-sm font-medium text-gray-400">User</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Role</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Balance</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Returns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading users...
                          </td>
                        </tr>
                      ) : apiUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        apiUsers.map((user) => (
                          <tr
                            key={user.id}
                            className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                              selectedUser?.id === user.id
                                ? 'bg-blue-600/10 border-blue-600/30'
                                : 'hover:bg-gray-800/30'
                            }`}
                            onClick={() => handleUserClick(user)}
                          >
                          <td className="py-3">
                            <div>
                              <p className="text-white font-medium text-sm">{user.fullname}</p>
                              <p className="text-gray-400 text-xs">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge className="bg-blue-600 text-white">
                              INVESTOR
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge className={`${getStatusColor(user.isActive ? 'ACTIVE' : 'SUSPENDED')} text-white`}>
                              {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </Badge>
                          </td>
                          <td className="py-3 text-white">
                            ${user.tradeBalance.toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className={`font-medium ${getReturnsColor(user.profit)}`}>
                              {user.profit === 0 ? '+$0 (0%)' : 
                               (user.profit > 0 ? '+' : '') + `$${user.profit.toLocaleString()} (${user.tradeBalance > 0 ? ((user.profit / user.tradeBalance) * 100).toFixed(1) : '0.0'}%)`}
                            </span>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Details Panel */}
          {selectedUser && (
            <div className="lg:col-span-1">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">User Details</CardTitle>
                    <p className="text-sm text-gray-400">User ID: {selectedUser.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className="hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{selectedUser.name}</h3>
                        <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                        <Badge className={`${getRoleColor(selectedUser.role)} text-white mt-1`}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Status</p>
                        <Badge className={`${getStatusColor(selectedUser.status)} text-white mt-1`}>
                          {selectedUser.status}
                        </Badge>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Member Since</p>
                        <p className="text-white font-medium">{selectedUser.joinDate}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Account Balance</p>
                        <p className="text-white font-semibold text-lg">
                          ${selectedUser.balance.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Total Returns</p>
                        <p className={`font-semibold text-lg ${getReturnsColor(selectedUser.returns)}`}>
                          {selectedUser.returns === 0 ? '$0 (0%)' : 
                           (selectedUser.returns > 0 ? '+' : '') + `$${selectedUser.returns.toLocaleString()} (${selectedUser.returnsPercent > 0 ? '+' : ''}${selectedUser.returnsPercent}%)`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit User
                      </Button>
                      {selectedUser.status === 'ACTIVE' ? (
                        <Button variant="outline" className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                          <X className="w-4 h-4 mr-2" />
                          Suspend User
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full border-green-600 text-green-400 hover:bg-green-600 hover:text-white">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activate User
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderNewStrategyForm = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)
      
      try {
        await createStrategy(newStrategyForm)
        setShowNewStrategyForm(false)
        setNewStrategyForm({
          description: '',
          contribution: 0,
          direction: 'SAME',
          isCloseBeforeNewCandle: false,
          selectedTokens: [],
          targets: [{ targetPercent: 0, stoplossPercent: 0 }]
        })
        // Refresh strategies data
        const tokensData = await fetchTokens()
        setAvailableTokens(tokensData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create strategy')
      } finally {
        setLoading(false)
      }
    }

    const addTarget = () => {
      setNewStrategyForm(prev => ({
        ...prev,
        targets: [...prev.targets, { targetPercent: 0, stoplossPercent: 0 }]
      }))
    }

    const removeTarget = (index: number) => {
      setNewStrategyForm(prev => ({
        ...prev,
        targets: prev.targets.filter((_, i) => i !== index)
      }))
    }

    const updateTarget = (index: number, field: 'targetPercent' | 'stoplossPercent', value: number) => {
      setNewStrategyForm(prev => ({
        ...prev,
        targets: prev.targets.map((target, i) => 
          i === index ? { ...target, [field]: value } : target
        )
      }))
    }

    const toggleToken = (tokenId: number) => {
      setNewStrategyForm(prev => ({
        ...prev,
        selectedTokens: prev.selectedTokens.includes(tokenId)
          ? prev.selectedTokens.filter(id => id !== tokenId)
          : [...prev.selectedTokens, tokenId]
      }))
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="bg-gray-900 border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Create New Strategy</CardTitle>
              <p className="text-gray-400 text-sm">Configure a new trading strategy</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNewStrategyForm(false)}
              className="hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                  <p className="text-red-400">Error: {error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Strategy Description *
                  </label>
                  <input
                    type="text"
                    value={newStrategyForm.description}
                    onChange={(e) => setNewStrategyForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Breakout Scalper"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contribution
                    </label>
                    <input
                      type="value"
                      value={newStrategyForm.contribution}
                      onChange={(e) => setNewStrategyForm(prev => ({ ...prev, contribution: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Direction
                    </label>
                    <select
                      value={newStrategyForm.direction}
                      onChange={(e) => setNewStrategyForm(prev => ({ ...prev, direction: e.target.value as 'SAME' | 'OPPOSITE' }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SAME">Same Direction</option>
                      <option value="OPPOSITE">Opposite Direction</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="closeBeforeNewCandle"
                    checked={newStrategyForm.isCloseBeforeNewCandle}
                    onChange={(e) => setNewStrategyForm(prev => ({ ...prev, isCloseBeforeNewCandle: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="closeBeforeNewCandle" className="text-sm text-gray-300">
                    Close before new candle
                  </label>
                </div>
              </div>

              {/* Token Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Token Pairs</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableTokens.map((token) => (
                    <div
                      key={token.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        newStrategyForm.selectedTokens.includes(token.id)
                          ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      }`}
                      onClick={() => toggleToken(token.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{token.name}</span>
                        {newStrategyForm.selectedTokens.includes(token.id) && (
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Targets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Targets</h3>
                  <Button
                    type="button"
                    onClick={addTarget}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    Add Target
                  </Button>
                </div>

                {newStrategyForm.targets.map((target, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">Target {index + 1}</span>
                      {newStrategyForm.targets.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeTarget(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Target Percent
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={target.targetPercent}
                          onChange={(e) => updateTarget(index, 'targetPercent', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Stop Loss Percent
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={target.stoplossPercent}
                          onChange={(e) => updateTarget(index, 'stoplossPercent', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  onClick={() => setShowNewStrategyForm(false)}
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !newStrategyForm.description || newStrategyForm.targets.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Strategy'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Analyze':
        return renderAnalyzeContent()
      case 'Orders':
        return renderOrdersContent()
      case 'Transactions':
        return renderTransactionsContent()
      case 'Strategies':
        return renderStrategiesContent()
      case 'Users':
        return renderUsersContent()
      default:
        return renderAnalyzeContent()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* New Strategy Modal */}
      {showNewStrategyForm && renderNewStrategyForm()}
      {/* Header */}
      <div className="p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Manage system operations, orders, transactions, and trading strategies</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-6">
        <div className="flex bg-gray-800/50 rounded-full p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium rounded-full transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-4">
        {renderTabContent()}
      </div>
    </div>
  )
}
