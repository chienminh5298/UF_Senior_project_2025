import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  History as HistoryIcon,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

export function History() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<any>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)


  // Fetch stats from API
  const fetchStats = async () => {
    const token = localStorage.getItem('adminToken')
    const response = await fetch(`${API_BASE}/api/admin/orders/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    
    const data = await response.json()
    return data.data
  }

  // Fetch orders from API with pagination - only FINISHED orders
  const fetchOrders = async (page: number = currentPage, limit: number = pageSize) => {
    const token = localStorage.getItem('adminToken')
    const response = await fetch(`${API_BASE}/api/admin/orders/all?page=${page}&limit=${limit}&status=FINISHED`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch orders')
    }

    const data = await response.json()
    return data.data
  }

  // Load stats and orders on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const statsData = await fetchStats()
        const ordersData = await fetchOrders(currentPage, pageSize)
        setStats(statsData)
        setOrders(ordersData.orders)
        setPagination(ordersData.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats or orders')
        console.error('Error loading stats or orders:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentPage, pageSize])

  // No filtering needed - only FINISHED orders are fetched from API

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading History</h1>
          <p className="text-gray-400">Complete record of all your trading activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Trading Stats */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? '...' : (stats?.totalTrades || 0)}
              </span>
              <HistoryIcon className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Completed Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? '...' : (stats?.completedTrades || 0)}
              </span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Successfully executed</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${(stats?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {loading ? '...' : `$${(stats?.totalProfit || 0).toFixed(2)}`}
              </span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Net profit/loss</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Avg Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${(stats?.avgProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {loading ? '...' : `$${(stats?.avgProfit || 0).toFixed(2)}`}
              </span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Per trade</p>
          </CardContent>
        </Card>
      </div>

      {/* Trade History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Completed Trades</CardTitle>
        </CardHeader>
        <CardContent>

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
                 {loading ? (
                   <tr>
                     <td colSpan={9} className="py-8 text-center text-gray-400">
                       Loading orders...
                     </td>
                   </tr>
                 ) : orders?.length === 0 ? (
                   <tr>
                     <td colSpan={9} className="py-8 text-center text-gray-400">
                       No completed orders found
                     </td>
                   </tr>
                 ) : (
                   orders?.map((order: any) => (
                     <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                       <td className="py-4 text-sm text-gray-300">
                         <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-gray-500" />
                           {new Date(order.buyDate).toLocaleString()}
                         </div>
                       </td>
                       <td className="py-4 text-sm text-white font-medium">{order.token.name}</td>
                       <td className="py-4">
                         <Badge className={`${order.side === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                           {order.side}
                         </Badge>
                       </td>
                       <td className="py-4 text-sm text-gray-300">{order.qty}</td>
                       <td className="py-4 text-sm text-gray-300">${order.entryPrice.toLocaleString()}</td>
                       <td className="py-4 text-sm text-white font-medium">${order.budget.toLocaleString()}</td>
                       <td className="py-4">
                         <span className={`text-sm font-medium ${order.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {order.netProfit >= 0 ? '+' : ''}${order.netProfit.toFixed(2)}
                         </span>
                       </td>
                       <td className="py-4">
                         <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                           <CheckCircle className="w-3 h-3 mr-1" />
                           {order.status}
                         </Badge>
                       </td>
                     </tr>
                   ))
                 )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Show:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1) // Reset to first page when changing page size
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="text-sm text-gray-400">per page</span>
            </div>
            <div className="text-sm text-gray-400">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)} of {pagination.totalOrders} orders
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={
                      pageNum === pagination.currentPage
                        ? "bg-blue-600 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}