import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  History as HistoryIcon,
  Filter,
  Download,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const getApiUrl = (path: string) => {
  if (API_BASE) {
    const base = API_BASE.replace(/\/$/, '')
    const apiPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${apiPath}`
  }
  return path.startsWith('/') ? path : `/${path}`
}

export function History() {
  const [filter, setFilter] = useState('all')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem('adminToken')
        const res = await fetch(getApiUrl('/api/admin/orders/all'), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to fetch orders')
        }
        setOrders(Array.isArray(data.data?.orders) ? data.data.orders : [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])
  
  const filters = [
    { id: 'all', label: 'All Trades' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending', label: 'Pending' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  const tradeHistory = useMemo(() => {
    return orders.map((o) => {
      const finished = o.status === 'FINISHED'
      const pending = o.status === 'ACTIVE'
      const cancelled = o.status === 'EXPIRED'
      const status = finished ? 'Completed' : pending ? 'Pending' : cancelled ? 'Cancelled' : o.status
      const statusColor = finished
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : pending
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30'
      const tokenName = o.token?.name || 'TOKEN'
      const stable = o.token?.stable || 'USDT'
      const pair = `${tokenName}/${stable}`
      const type = o.side === 'BUY' ? 'Buy' : 'Sell'
      const amount = `${o.qty} ${tokenName}`
      const price = `$${Number(o.entryPrice).toLocaleString()}`
      const value = `$${Number(o.budget).toLocaleString()}`
      const pnlNum = typeof o.netProfit === 'number' ? o.netProfit : 0
      const pnl = `${pnlNum >= 0 ? '+' : ''}$${pnlNum.toFixed(2)}`
      const pnlColor = pnlNum > 0 ? 'text-green-400' : pnlNum < 0 ? 'text-red-400' : 'text-gray-400'
      const date = new Date(o.buyDate || o.timestamp || o.createdAt).toLocaleString()
      return {
        id: o.id,
        date,
        pair,
        type,
        side: o.side === 'BUY' ? 'Long' : 'Short',
        amount,
        price,
        value,
        fee: `$${(Number(o.fee) || 0).toFixed(2)}`,
        pnl,
        pnlColor,
        status,
        statusColor,
      }
    })
  }, [orders])

  const stats = useMemo(() => {
    const totalTrades = orders.length
    const completedTrades = orders.filter((o) => o.status === 'FINISHED').length
    const pendingTrades = orders.filter((o) => o.status === 'ACTIVE').length
    const cancelledTrades = orders.filter((o) => o.status === 'EXPIRED').length
    const totalVolumeNum = orders.reduce((s, o) => s + Number(o.budget || 0), 0)
    const totalPnLNum = orders.reduce((s, o) => s + Number(o.netProfit || 0), 0)
    const avgTradeNum = totalTrades ? totalPnLNum / totalTrades : 0
    return {
      totalTrades,
      completedTrades,
      pendingTrades,
      cancelledTrades,
      totalVolume: `$${totalVolumeNum.toLocaleString()}`,
      totalPnL: `${totalPnLNum >= 0 ? '+' : ''}$${totalPnLNum.toFixed(2)}`,
      avgTrade: `${avgTradeNum >= 0 ? '+' : ''}$${avgTradeNum.toFixed(2)}`,
    }
  }, [orders])

  const filteredTrades = filter === 'all' 
    ? tradeHistory 
    : tradeHistory.filter(trade => trade.status.toLowerCase() === filter)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading History</h1>
          <p className="text-sm sm:text-base text-gray-400">Complete record of all trading activity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Date Range</span>
            <span className="sm:hidden">Date</span>
          </Button>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.totalTrades}</span>
              <HistoryIcon className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.totalVolume}</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Traded volume</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${stats.totalPnL.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stats.totalPnL}</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Net profit/loss</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Avg Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${stats.avgTrade.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stats.avgTrade}</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Per trade</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-white">Trade History</CardTitle>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trades..."
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              {/* Filter */}
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-gray-400 text-sm">Loading orders…</div>}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
              {error}
            </div>
          )}
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {filters.map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {filterOption.label}
                {filterOption.id === 'completed' && (
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">{stats.completedTrades}</span>
                )}
                {filterOption.id === 'pending' && (
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">{stats.pendingTrades}</span>
                )}
                {filterOption.id === 'cancelled' && (
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">{stats.cancelledTrades}</span>
                )}
              </button>
            ))}
          </div>

          {/* Trade Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Date & Time</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Pair</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Side</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Price</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Value</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">P&L</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {trade.date}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-white font-medium">{trade.pair}</td>
                    <td className="py-4">
                      <Badge className={`${trade.type === 'Buy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {trade.type}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-gray-300">{trade.side}</td>
                    <td className="py-4 text-sm text-white font-medium">{trade.amount}</td>
                    <td className="py-4 text-sm text-gray-300">{trade.price}</td>
                    <td className="py-4 text-sm text-white font-medium">{trade.value}</td>
                    <td className="py-4">
                      <span className={`text-sm font-medium ${trade.pnlColor}`}>{trade.pnl}</span>
                    </td>
                    <td className="py-4">
                      <Badge className={trade.statusColor}>
                        {trade.status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {trade.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                        {trade.status === 'Cancelled' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {trade.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
