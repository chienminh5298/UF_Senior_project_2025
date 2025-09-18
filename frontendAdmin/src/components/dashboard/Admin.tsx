import { useState } from 'react'
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
  BarChart3
} from 'lucide-react'

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

const orders = [
  { 
    id: 1, 
    symbol: 'BTC/USDT', 
    type: 'BUY', 
    amount: 0.5, 
    price: 68500, 
    status: 'FILLED', 
    timestamp: '2024-09-18 14:30:00', 
    pnl: 1250,
    user: 'John Thompson',
    userId: 1,
    userEmail: 'john.thompson@example.com',
    orderType: 'Market',
    fillPrice: 68520,
    fees: 34.26,
    strategy: 'Momentum Scalper'
  },
  { 
    id: 2, 
    symbol: 'ETH/USDT', 
    type: 'SELL', 
    amount: 2.0, 
    price: 3400, 
    status: 'PENDING', 
    timestamp: '2024-09-18 14:25:00', 
    pnl: 0,
    user: 'Sarah Chen',
    userId: 2,
    userEmail: 'sarah.chen@example.com',
    orderType: 'Limit',
    fillPrice: null,
    fees: 0,
    strategy: 'Trend Follower'
  },
  { 
    id: 3, 
    symbol: 'BTC/USDT', 
    type: 'BUY', 
    amount: 0.25, 
    price: 67800, 
    status: 'FILLED', 
    timestamp: '2024-09-18 14:15:00', 
    pnl: 175,
    user: 'Emily Watson',
    userId: 4,
    userEmail: 'emily.watson@example.com',
    orderType: 'Market',
    fillPrice: 67850,
    fees: 16.96,
    strategy: 'Arbitrage Hunter'
  },
  { 
    id: 4, 
    symbol: 'ETH/USDT', 
    type: 'SELL', 
    amount: 1.5, 
    price: 3350, 
    status: 'CANCELLED', 
    timestamp: '2024-09-18 14:10:00', 
    pnl: -85,
    user: 'Michael Rodriguez',
    userId: 3,
    userEmail: 'michael.rodriguez@example.com',
    orderType: 'Limit',
    fillPrice: null,
    fees: 0,
    strategy: 'Manual Trade'
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

export function Admin() {
  const [activeTab, setActiveTab] = useState('Analyze')
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null)
  const [selectedYear, setSelectedYear] = useState('2024')
  
  const tabs = ['Analyze', 'Orders', 'Transactions', 'Strategies', 'Users']

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
    const handleOrderClick = (order: typeof orders[0]) => {
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null)
      } else {
        setSelectedOrder(order)
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-gray-400">Monitor current orders and P&L</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total P&L</p>
            <p className="text-2xl font-bold text-green-400">+$1,340</p>
          </div>
        </div>

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
                      {orders.map((order) => (
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
                              <p className="text-white font-medium text-sm">{order.user}</p>
                              <p className="text-gray-400 text-xs">{order.userEmail}</p>
                            </div>
                          </td>
                          <td className="py-3 text-white font-medium">{order.symbol}</td>
                          <td className="py-3">
                            <Badge className={order.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                              {order.type}
                            </Badge>
                          </td>
                          <td className="py-3 text-white">{order.amount}</td>
                          <td className="py-3 text-white">${order.price.toLocaleString()}</td>
                          <td className="py-3">
                            <Badge className={`${getStatusColor(order.status)} text-white`}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className={order.pnl > 0 ? 'text-green-400' : order.pnl < 0 ? 'text-red-400' : 'text-gray-400'}>
                              {order.pnl > 0 ? '+' : ''}${order.pnl}
                            </span>
                          </td>
                        </tr>
                      ))}
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
        <Button className="bg-blue-600 hover:bg-blue-700">
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
    const handleUserClick = (user: typeof users[0]) => {
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
      } else {
        setSelectedUser(user)
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
            <p className="text-2xl font-bold text-white">5</p>
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
                      {users.map((user) => (
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
                              <p className="text-white font-medium text-sm">{user.name}</p>
                              <p className="text-gray-400 text-xs">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge className={`${getRoleColor(user.role)} text-white`}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge className={`${getStatusColor(user.status)} text-white`}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-white">
                            {user.balance > 0 ? `$${user.balance.toLocaleString()}` : '$0'}
                          </td>
                          <td className="py-3">
                            <span className={`font-medium ${getReturnsColor(user.returns)}`}>
                              {user.returns === 0 ? '+$0 (0%)' : 
                               (user.returns > 0 ? '+' : '') + `$${user.returns.toLocaleString()} (${user.returnsPercent > 0 ? '+' : ''}${user.returnsPercent}%)`}
                            </span>
                          </td>
                        </tr>
                      ))}
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
