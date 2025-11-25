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
  RefreshCw,
  Trash2,
  Clock,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Key
} from 'lucide-react'

// API Configuration
const API_BASE = 'http://localhost:3001'

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
  strategy: {
    description: string
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
  createdAt: string
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




const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': case 'FILLED': case 'APPROVED': return 'bg-green-600'
    case 'PENDING KYC': case 'PENDING': return 'bg-yellow-600'
    case 'SUSPENDED': case 'CANCELLED': case 'REJECTED': return 'bg-red-600'
    case 'PAUSED': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
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
  return data.data.orders || []
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

const fetchSystemOverview = async () => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/system/overview`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch system overview')
  }
  
  const data = await response.json()
  return data.data
}

const fetchClaims = async () => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/claims`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch claims')
  }
  
  const data = await response.json()
  return data.data.claims
}

const fetchClaimDetails = async (claimId: number) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/claims/${claimId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch claim details')
  }
  
  const data = await response.json()
  return data.data.claim
}

const approveClaim = async (claimId: number, note: string) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/claims/${claimId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note })
  })
  
  if (!response.ok) {
    throw new Error('Failed to approve claim')
  }
  
  const data = await response.json()
  return data.data.claim
}

const rejectClaim = async (claimId: number, note: string) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/claims/${claimId}/reject`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note })
  })
  
  if (!response.ok) {
    throw new Error('Failed to reject claim')
  }
  
  const data = await response.json()
  return data.data.claim
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

  const fetchStrategies = async () => {
    const token = localStorage.getItem('adminToken')
    
    const response = await fetch(`${API_BASE}/api/admin/strategies`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch strategies')
    }
    
    const data = await response.json()
    return data.data.response
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

const fetchStrategyDetails = async (strategyId: number) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/strategies/${strategyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch strategy details')
  }
  
  const data = await response.json()
  return data.data.response
}

const updateStrategy = async (strategyId: number, strategyData: any) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/strategies/${strategyId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(strategyData)
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update strategy')
  }
  
  return response.json()
}

const updateStrategyTargets = async (strategyId: number, targets: any[]) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/strategies/${strategyId}/targets`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targets })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update strategy targets')
  }
  
  return response.json()
}

const updateStrategyTokens = async (strategyId: number, tokenIds: number[]) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/strategies/${strategyId}/tokens`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tokenIds })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update strategy tokens')
  }
  
  return response.json()
}

const fetchUserDetails = async (userId: number) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch user details')
  }
  
  const data = await response.json()
  return data.data.user_specific
}

const updateUserStatus = async (userId: number) => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update user status')
  }
  
  const data = await response.json()
  return data
}

// Real-time P&L API Functions
const fetchRealtimePnL = async () => {
  const token = localStorage.getItem('adminToken')
  
  const response = await fetch(`${API_BASE}/api/admin/orders/realtime-pnl`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch real-time P&L data')
  }
  
  const data = await response.json()
  return data.data
}

const fetchPriceData = async (tokens?: string[]) => {
  const token = localStorage.getItem('adminToken')
  const url = tokens 
    ? `${API_BASE}/api/admin/orders/price-data?tokens=${tokens.join(',')}`
    : `${API_BASE}/api/admin/orders/price-data`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch price data')
  }
  
  const data = await response.json()
  return data.data
}

export function Admin() {
  const [activeTab, setActiveTab] = useState('Analyze')
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [selectedYear, setSelectedYear] = useState('2024')
  
  // API Data State
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>([])
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [apiClaims, setApiClaims] = useState<any[]>([])
  const [orderStats, setOrderStats] = useState<any>(null)
  const [systemOverview, setSystemOverview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time P&L State
  const [realtimeOrders, setRealtimeOrders] = useState<any[]>([])
  const [realtimeSummary, setRealtimeSummary] = useState<any>(null)
  const [priceData, setPriceData] = useState<any[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<any | null>(null)
  
  // Strategy Form State
  const [showNewStrategyForm, setShowNewStrategyForm] = useState(false)
  const [showConfigureStrategy, setShowConfigureStrategy] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null)
  
  // Claim Details Modal State
  const [showClaimDetails, setShowClaimDetails] = useState(false)
  const [claimDetails, setClaimDetails] = useState<any>(null)
  
  // Approve/Reject Modal State
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const [availableTokens, setAvailableTokens] = useState<ApiToken[]>([])
  const [strategies, setStrategies] = useState<any[]>([])

  // Real-time P&L Functions
  const loadRealtimeData = async () => {
    try {
      const [realtimeData, priceDataResult] = await Promise.all([
        fetchRealtimePnL(),
        fetchPriceData()
      ])
      
      setRealtimeOrders(realtimeData.orders || [])
      setRealtimeSummary(realtimeData.summary || null)
      setPriceData(priceDataResult || [])
    } catch (err) {
      console.error('Error loading real-time data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load real-time data')
    }
  }

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
      setAutoRefresh(false)
    } else {
      const interval = setInterval(loadRealtimeData, 10000) // Refresh every 10 seconds
      setRefreshInterval(interval)
      setAutoRefresh(true)
    }
  }

  const handleRealtimeRefresh = async () => {
    setLoading(true)
    await loadRealtimeData()
    setLoading(false)
  }
  const [newStrategyForm, setNewStrategyForm] = useState<NewStrategyForm>({
    description: '',
    contribution: 0,
    direction: 'SAME',
    isCloseBeforeNewCandle: false,
    selectedTokens: [],
    targets: [{ targetPercent: 0, stoplossPercent: 0 }]
  })
  const [configureStrategyForm, setConfigureStrategyForm] = useState<NewStrategyForm>({
    description: '',
    contribution: 0,
    direction: 'SAME',
    isCloseBeforeNewCandle: false,
    selectedTokens: [],
    targets: [{ targetPercent: 0, stoplossPercent: 0 }]
  })
  
  // User Details State
  const [userDetails, setUserDetails] = useState<any>(null)
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [updatingUserStatus, setUpdatingUserStatus] = useState(false)
  
  // Strategy delete functions
  const deleteStrategy = async (strategyId: number) => {
    const token = localStorage.getItem('adminToken')
    
    const response = await fetch(`${API_BASE}/api/admin/strategies/${strategyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to delete strategy')
    }
    
    const data = await response.json()
    return data
  }

  const handleDeleteStrategy = async (strategyId: number) => {
    if (!confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await deleteStrategy(strategyId)
      
      // Refresh strategies list
      const strategiesData = await fetchStrategies()
      setStrategies(strategiesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete strategy')
      console.error('Failed to delete strategy:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureStrategy = async (strategy: any) => {
    try {
      setLoading(true)
      const strategyDetails = await fetchStrategyDetails(strategy.id)
      
      // Populate the configure form with current strategy data
      setConfigureStrategyForm({
        description: strategyDetails.description || '',
        contribution: strategyDetails.contribution || 0,
        direction: strategyDetails.direction || 'SAME',
        isCloseBeforeNewCandle: strategyDetails.isCloseBeforeNewCandle || false,
        selectedTokens: strategyDetails.tokenStrategies?.map((ts: any) => ts.token?.id).filter(Boolean) || [],
        targets: strategyDetails.targets?.map((target: any) => ({
          targetPercent: target.targetPercent || 0,
          stoplossPercent: target.stoplossPercent || 0
        })) || [{ targetPercent: 0, stoplossPercent: 0 }]
      })
      
      setSelectedStrategy(strategyDetails)
      setShowConfigureStrategy(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load strategy details')
      console.error('Failed to load strategy details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfiguredStrategy = async () => {
    if (!selectedStrategy) return
    
    try {
      setLoading(true)
      
      // Update strategy basic info
      await updateStrategy(selectedStrategy.id, {
        description: configureStrategyForm.description,
        contribution: configureStrategyForm.contribution,
        direction: configureStrategyForm.direction,
        isCloseBeforeNewCandle: configureStrategyForm.isCloseBeforeNewCandle
      })
      
      // Update targets
      await updateStrategyTargets(selectedStrategy.id, configureStrategyForm.targets)
      
      // Update token associations
      await updateStrategyTokens(selectedStrategy.id, configureStrategyForm.selectedTokens)
      
      // Refresh strategies list
      const strategiesData = await fetchStrategies()
      setStrategies(strategiesData)
      
      setShowConfigureStrategy(false)
      setSelectedStrategy(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update strategy')
      console.error('Failed to update strategy:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewClaimDetails = async (claim: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const details = await fetchClaimDetails(claim.id)
      setClaimDetails(details)
      setShowClaimDetails(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claim details')
      console.error('Failed to load claim details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClaim = (claim: any) => {
    setSelectedClaimForAction(claim)
    setAdminNote('')
    setShowApproveModal(true)
  }

  const handleRejectClaim = (claim: any) => {
    setSelectedClaimForAction(claim)
    setAdminNote('')
    setShowRejectModal(true)
  }

  const confirmApproveClaim = async () => {
    if (!selectedClaimForAction) return
    
    setLoading(true)
    setError(null)
    
    try {
      await approveClaim(selectedClaimForAction.id, adminNote)
      
      // Refresh claims list
      const claimsData = await fetchClaims()
      setApiClaims(claimsData)
      
      // Refresh claim details if modal is open to update status and hide buttons
      if (showClaimDetails && claimDetails && claimDetails.id === selectedClaimForAction.id) {
        const updatedDetails = await fetchClaimDetails(selectedClaimForAction.id)
        setClaimDetails(updatedDetails)
      }
      
      // Close approve modal and reset state
      setShowApproveModal(false)
      setSelectedClaimForAction(null)
      setAdminNote('')
      
      // Show success message (you could add a toast notification here)
      console.log('Claim approved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve claim')
      console.error('Failed to approve claim:', err)
    } finally {
      setLoading(false)
    }
  }

  const confirmRejectClaim = async () => {
    if (!selectedClaimForAction) return
    
    setLoading(true)
    setError(null)
    
    try {
      await rejectClaim(selectedClaimForAction.id, adminNote)
      
      // Refresh claims list
      const claimsData = await fetchClaims()
      setApiClaims(claimsData)
      
      // Refresh claim details if modal is open to update status and hide buttons
      if (showClaimDetails && claimDetails && claimDetails.id === selectedClaimForAction.id) {
        const updatedDetails = await fetchClaimDetails(selectedClaimForAction.id)
        setClaimDetails(updatedDetails)
      }
      
      // Close reject modal and reset state
      setShowRejectModal(false)
      setSelectedClaimForAction(null)
      setAdminNote('')
      
      // Show success message (you could add a toast notification here)
      console.log('Claim rejected successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject claim')
      console.error('Failed to reject claim:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const tabs = ['Analyze', 'Orders', 'Transactions', 'Strategies', 'Users']

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        if (activeTab === 'Orders') {
          const [ordersData, realtimeData, priceDataResult] = await Promise.all([
            fetchOrders(),
            fetchRealtimePnL(),
            fetchPriceData()
          ])
          setApiOrders(ordersData)
          setRealtimeOrders(realtimeData.orders || [])
          setRealtimeSummary(realtimeData.summary || null)
          setPriceData(priceDataResult || [])
        } else if (activeTab === 'Users') {
          const usersData = await fetchUsers()
          setApiUsers(usersData)
        } else if (activeTab === 'Transactions') {
          const claimsData = await fetchClaims()
          setApiClaims(claimsData)
        } else if (activeTab === 'Analyze') {
          const [statsData, priceDataResult, overviewData] = await Promise.all([
            fetchOrderStats(),
            fetchPriceData(),
            fetchSystemOverview().catch(err => {
              console.error('Error loading system overview:', err)
              return null
            })
          ])
          setOrderStats(statsData)
          setPriceData(priceDataResult || [])
          setSystemOverview(overviewData)
        } else if (activeTab === 'Strategies') {
          const [tokensData, strategiesData] = await Promise.all([
            fetchTokens(),
            fetchStrategies()
          ])
          setAvailableTokens(tokensData)
          setStrategies(strategiesData)
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

  // Cleanup auto-refresh interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

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
          <Button 
            onClick={async () => {
              setLoading(true)
              try {
                const priceDataResult = await fetchPriceData()
                setPriceData(priceDataResult || [])
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to refresh prices')
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            variant="outline" 
            size="sm"
            className="border-gray-700 hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
                  {loading && !systemOverview ? (
                    <div className="flex items-center gap-2 mt-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-white">
                        ${(systemOverview?.totalAccountFunds || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${(systemOverview?.accountFundsChangePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(systemOverview?.accountFundsChangePercent || 0) >= 0 ? '+' : ''}{(systemOverview?.accountFundsChangePercent || 0).toFixed(2)}% from last month
                      </p>
                    </>
                  )}
                </div>
                {(systemOverview?.accountFundsChangePercent || 0) >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Deposits</p>
                  {loading && !systemOverview ? (
                    <div className="flex items-center gap-2 mt-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-white">
                        ${(systemOverview?.totalDeposits || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${(systemOverview?.depositsChangePercent || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {(systemOverview?.depositsChangePercent || 0) >= 0 ? '+' : ''}{(systemOverview?.depositsChangePercent || 0).toFixed(2)}% from last month
                      </p>
                    </>
                  )}
                </div>
                {(systemOverview?.depositsChangePercent || 0) >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Withdrawals</p>
                  {loading && !systemOverview ? (
                    <div className="flex items-center gap-2 mt-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-white">
                        ${(systemOverview?.totalWithdrawals || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${(systemOverview?.withdrawalsChangePercent || 0) >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {(systemOverview?.withdrawalsChangePercent || 0) >= 0 ? '+' : ''}{(systemOverview?.withdrawalsChangePercent || 0).toFixed(2)}% from last month
                      </p>
                    </>
                  )}
                </div>
                {(systemOverview?.withdrawalsChangePercent || 0) >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
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

      {/* Crypto Prices Section */}
      {priceData.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Current Token Prices
            </CardTitle>
            <p className="text-sm text-gray-400">Real-time price data for all active tokens</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {priceData.map((price) => (
                <div key={price.tokenName} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">{price.tokenName}</h3>
                    <span className={`text-xs ${price.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {price.priceChange >= 0 ? '+' : ''}{price.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-white font-bold text-lg">
                    ${price.currentPrice.toLocaleString()}
                  </div>
                  <div className={`text-xs ${price.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {price.priceChange >= 0 ? '+' : ''}${price.priceChange.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(price.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
    const handleOrderClick = (order: any) => {
      if (selectedOrder?.id === order.orderId) {
        setSelectedOrder(null)
      } else {
        // Convert real-time order to display format
        const displayOrder = {
          id: order.orderId,
          symbol: order.tokenName,
          type: order.side,
          amount: order.quantity,
          price: order.entryPrice,
          currentPrice: order.currentPrice,
          status: order.status,
          timestamp: new Date(order.buyDate).toLocaleString(),
          pnl: order.unrealizedPnL,
          pnlPercent: order.unrealizedPnLPercent,
          user: order.userEmail.split('@')[0], 
          userId: order.userId,
          userEmail: order.userEmail,
          fillPrice: order.entryPrice,
          strategy: order.strategy || 'Unknown Strategy',
          orderType: 'Market',
          lastUpdated: order.lastUpdated,
        }
        setSelectedOrder(displayOrder as any)
      }
    }

    const handleRefresh = async () => {
      await handleRealtimeRefresh()
    }

    // Use real-time data if available, fallback to regular orders
    const displayOrders = realtimeOrders.length > 0 ? realtimeOrders : apiOrders
    const totalPnL = realtimeSummary?.totalUnrealizedPnL || apiOrders.reduce((sum, order) => sum + order.netProfit, 0)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-gray-400">Monitor current orders and real-time P&L</p>
            {realtimeSummary && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(realtimeSummary.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">
                {realtimeSummary ? 'Real-time P&L' : 'Total P&L'}
              </p>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
              {realtimeSummary && (
                <p className="text-xs text-gray-500">
                  {realtimeSummary.totalUnrealizedPnLPercent >= 0 ? '+' : ''}{realtimeSummary.totalUnrealizedPnLPercent.toFixed(2)}%
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={toggleAutoRefresh}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-gray-700 hover:bg-gray-800"}
              >
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </Button>
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
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Entry Price</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Current Price</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Real-time P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading orders...
                          </td>
                        </tr>
                      ) : !displayOrders || displayOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        (displayOrders || []).map((order) => {
                          // Handle both real-time and regular orders
                          const isRealtime = realtimeOrders.length > 0
                          const orderId = isRealtime ? order.orderId : order.id
                          const userEmail = isRealtime ? order.userEmail : order.user?.email
                          const tokenName = isRealtime ? order.tokenName : order.token?.name
                          const quantity = isRealtime ? order.quantity : order.qty
                          const entryPrice = isRealtime ? order.entryPrice : order.entryPrice
                          const currentPrice = isRealtime ? order.currentPrice : null
                          const pnl = isRealtime ? order.unrealizedPnL : order.netProfit
                          const pnlPercent = isRealtime ? order.unrealizedPnLPercent : null
                          
                          return (
                            <tr 
                              key={orderId} 
                              className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                                selectedOrder?.id === orderId 
                                  ? 'bg-blue-600/10 border-blue-600/30' 
                                  : 'hover:bg-gray-800/30'
                              }`}
                              onClick={() => handleOrderClick(order)}
                            >
                              <td className="py-3">
                                <div>
                                  <p className="text-white font-medium text-sm">{userEmail?.split('@')[0] || 'Unknown'}</p>
                                  <p className="text-gray-400 text-xs">{userEmail || 'No email'}</p>
                                </div>
                              </td>
                              <td className="py-3 text-white font-medium">{tokenName || 'Unknown Token'}</td>
                              <td className="py-3">
                                <Badge className={order.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                                  {order.side}
                                </Badge>
                              </td>
                              <td className="py-3 text-white">{quantity}</td>
                              <td className="py-3 text-white">${entryPrice.toLocaleString()}</td>
                              <td className="py-3 text-white">
                                {currentPrice ? (
                                  <div>
                                    <div className="font-medium">${currentPrice.toLocaleString()}</div>
                                    {isRealtime && (
                                      <div className="text-xs text-gray-400">
                                        {new Date(order.lastUpdated).toLocaleTimeString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="py-3">
                                <Badge className={`${getStatusColor(order.status)} text-white`}>
                                  {order.status}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <div>
                                  <span className={pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400'}>
                                    {pnl > 0 ? '+' : ''}${pnl.toFixed(2)}
                                  </span>
                                  {pnlPercent !== null && (
                                    <div className="text-xs text-gray-400">
                                      {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
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
          <h1 className="text-2xl font-bold text-white">Transaction Claims</h1>
          <p className="text-gray-400">Manage user withdrawal claims and transactions</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Pending Claims</p>
          <p className="text-2xl font-bold text-yellow-400">
            {loading ? '...' : (apiClaims?.filter(c => c.status === 'NEW').length || 0)}
          </p>
        </div>
      </div>

      {/* Claims Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? '...' : (apiClaims?.length || 0)}
              </span>
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">New Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">
                {loading ? '...' : (apiClaims?.filter(c => c.status === 'NEW').length || 0)}
              </span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Pending review</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-400">
                {loading ? '...' : (apiClaims?.filter(c => c.status === 'PROCESSING').length || 0)}
              </span>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">
                {loading ? '...' : (apiClaims?.filter(c => c.status === 'COMPLETED').length || 0)}
              </span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Claims Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-400">
              Loading claims...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-400">
              Error: {error}
            </div>
          ) : !apiClaims || apiClaims.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No claims found
            </div>
          ) : (
            <div className="space-y-4">
              {apiClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600/20">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{claim.user?.username || 'Unknown User'}</p>
                      <p className="text-gray-400 text-sm">
                        ${claim.amount.toLocaleString()} • {claim.network}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-gray-500 text-xs">
                          {claim.billsCount} bills
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                        {claim.hashId && (
                          <span className="text-blue-400 text-xs">
                            Has Transaction
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Address</p>
                      <p className="text-white text-sm font-mono">
                        {claim.address.slice(0, 8)}...{claim.address.slice(-6)}
                      </p>
                      {claim.hashId && (
                        <>
                          <p className="text-gray-400 text-xs mt-1">Hash ID</p>
                          <p className="text-white text-sm font-mono">
                            {claim.hashId.slice(0, 8)}...{claim.hashId.slice(-6)}
                          </p>
                        </>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(claim.status)} text-white`}>
                      {claim.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewClaimDetails(claim)}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {claim.status === 'NEW' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveClaim(claim)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRejectClaim(claim)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <Card key={strategy.description} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{strategy.description}</CardTitle>
                <Badge className={`${getStatusColor(strategy.isActive ? 'ACTIVE' : 'PAUSED')} text-white`}>
                  {strategy.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Trading Pairs</p>
                  <div className="flex flex-wrap gap-2">
                    {strategy.tokenStrategies?.map((tokenStrategy: any, index: number) => (
                      <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                        {tokenStrategy.token?.name || 'Unknown Token'}
                      </Badge>
                    )) || <span className="text-gray-500 text-sm">No tokens assigned</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">ID</p>
                    <p className="text-white font-medium">#{strategy.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`font-medium ${strategy.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {strategy.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleConfigureStrategy(strategy)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Configure
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={strategy.isActive ? 'border-red-600 text-red-400' : 'border-green-600 text-green-400'}
                  >
                    {strategy.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteStrategy(strategy.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
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
    const handleUserClick = async (user: ApiUser) => {
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
        setUserDetails(null)
        setShowApiKey(false)
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

          joinDate: new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
        }
        setSelectedUser(displayUser as any)
        setShowApiKey(false)
        
        // Fetch detailed user information
        setLoadingUserDetails(true)
        try {
          const details = await fetchUserDetails(user.id)
          setUserDetails(details)
        } catch (err) {
          console.error('Failed to fetch user details:', err)
          setUserDetails(null)
        } finally {
          setLoadingUserDetails(false)
        }
      }
    }

    // Admin can suspend or activate a user
  const handleUserStatusUpdate = async () => {
    if (!selectedUser || !userDetails) return

    setUpdatingUserStatus(true)
    setError(null)

    try {
      await updateUserStatus(selectedUser.id)

      // Toggle the user details status
      setUserDetails((prev: any) => ({
        ...prev,
        isActive: !prev.isActive
      }))

      // Update the users list
      setApiUsers(prev => prev.map(user =>
        user.id === selectedUser.id
          ? { ...user, isActive: !user.isActive }
          : user
      ))

      // Update selected user status
      setSelectedUser(prev => prev ? {
        ...prev,
        status: prev.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      } : null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
      console.error('Failed to update user status:', err)
    } finally {
      setUpdatingUserStatus(false)
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
                    onClick={() => {
                      setSelectedUser(null)
                      setUserDetails(null)
                      setShowApiKey(false)
                    }}
                    className="hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingUserDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-400">Loading user details...</span>
                    </div>
                  ) : userDetails ? (
                    <div className="space-y-4">
                      {/* User Avatar and Basic Info */}
                      <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{userDetails.fullname}</h3>
                          <p className="text-gray-400 text-sm">{userDetails.email}</p>
                          <p className="text-gray-400 text-xs">@{userDetails.username}</p>
                          <Badge className="bg-blue-600 text-white mt-1">
                            INVESTOR
                          </Badge>
                        </div>
                      </div>

                      {/* Status and Avatar */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-400 text-sm">Status</p>
                          <Badge className={`${getStatusColor(userDetails.isActive ? 'ACTIVE' : 'SUSPENDED')} text-white mt-1`}>
                            {userDetails.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-400 text-sm">Avatar ID</p>
                          <p className="text-white font-medium">{userDetails.avatar}</p>
                        </div>
                      </div>

                      {/* Financial Information */}
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-400 text-sm">Trade Balance</p>
                          <p className="text-white font-semibold text-lg">
                            ${userDetails.tradeBalance.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-400 text-sm">Total Profit</p>
                          <p className={`font-semibold text-lg ${getReturnsColor(userDetails.profit)}`}>
                            {userDetails.profit === 0 ? '$0' : 
                             (userDetails.profit > 0 ? '+' : '') + `$${userDetails.profit.toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      {/* Account Creation Date */}
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-sm">Member Since</p>
                        <p className="text-white font-medium">
                          {new Date(userDetails.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* API Key */}
                      {userDetails.apiKey && (
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Key className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-400 text-sm">API Key</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="h-6 px-2"
                            >
                              {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                          </div>
                          <p className="text-white font-mono text-xs break-all">
                            {showApiKey ? userDetails.apiKey : '••••••••••••••••••••••••'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Failed to load user details</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {userDetails && (
                    <div className="space-y-2 pt-4">
                      {userDetails.isActive ? (
                        <Button 
                          onClick={handleUserStatusUpdate}
                          disabled={updatingUserStatus}
                          variant="outline" 
                          className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50"
                        >
                          {updatingUserStatus ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Suspend User
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleUserStatusUpdate}
                          disabled={updatingUserStatus}
                          variant="outline" 
                          className="w-full border-green-600 text-green-400 hover:bg-green-600 hover:text-white disabled:opacity-50"
                        >
                          {updatingUserStatus ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate User
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
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
        const [tokensData, strategiesData] = await Promise.all([
          fetchTokens(),
          fetchStrategies()
        ])
        setAvailableTokens(tokensData)
        setStrategies(strategiesData)
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
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNewStrategyForm(false)
          }
        }}
      >
        <Card 
          className="bg-gray-900 border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
                    {/* Contribution field */}
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contribution <span className="ml-2 text-blue-400">{newStrategyForm.contribution}</span>
                    </label>

                    <div className="flex items-center gap-3">
                      {/* Slider */}
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={newStrategyForm.contribution}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const clamped = Math.max(1, Math.min(100, v));
                          setNewStrategyForm(p => ({ ...p, contribution: clamped }));
                        }}
                        aria-label="Strategy contribution"
                        className="w-full accent-blue-500"
                        list="contribution-ticks"
                      />
                      
                      {/* Numeric box for contribution edits */}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={newStrategyForm.contribution}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isNaN(v)) return;
                          const clamped = Math.max(1, Math.min(100, v));
                          setNewStrategyForm(p => ({ ...p, contribution: clamped }));
                        }}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          const clamped = Math.max(1, Math.min(100, v || 1));
                          if (v !== clamped) {
                            setNewStrategyForm(p => ({ ...p, contribution: clamped }));
                          }
                        }}
                        className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                      />
                    </div>

                    {/* Tick marks */}
                    <datalist id="contribution-ticks">
                      <option value="1" />
                      <option value="10" />
                      <option value="20" />
                      <option value="30" />
                      <option value="40" />
                      <option value="50" />
                      <option value="60" />
                      <option value="70" />
                      <option value="80" />
                      <option value="90" />
                      <option value="100" />
                    </datalist>


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

  const renderConfigureStrategyForm = () => {
    const addTarget = () => {
      setConfigureStrategyForm(prev => ({
        ...prev,
        targets: [...prev.targets, { targetPercent: 0, stoplossPercent: 0 }]
      }))
    }

    const removeTarget = (index: number) => {
      setConfigureStrategyForm(prev => ({
        ...prev,
        targets: prev.targets.filter((_, i) => i !== index)
      }))
    }

    const updateTarget = (index: number, field: 'targetPercent' | 'stoplossPercent', value: number) => {
      setConfigureStrategyForm(prev => ({
        ...prev,
        targets: prev.targets.map((target, i) => 
          i === index ? { ...target, [field]: value } : target
        )
      }))
    }

    const toggleToken = (tokenId: number) => {
      setConfigureStrategyForm(prev => ({
        ...prev,
        selectedTokens: prev.selectedTokens.includes(tokenId)
          ? prev.selectedTokens.filter(id => id !== tokenId)
          : [...prev.selectedTokens, tokenId]
      }))
    }

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowConfigureStrategy(false)
          }
        }}
      >
        <Card 
          className="bg-gray-900 border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Configure Strategy</CardTitle>
              <p className="text-gray-400 text-sm">Edit strategy settings and targets</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowConfigureStrategy(false)}
              className="hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveConfiguredStrategy(); }} className="space-y-6">
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
                    value={configureStrategyForm.description}
                    onChange={(e) => setConfigureStrategyForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Breakout Scalper"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* Contribution field */}
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contribution <span className="ml-2 text-blue-400">{configureStrategyForm.contribution}</span>
                    </label>

                    <div className="flex items-center gap-3">
                      {/* Slider */}
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={configureStrategyForm.contribution}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const clamped = Math.max(1, Math.min(100, v));
                          setConfigureStrategyForm(p => ({ ...p, contribution: clamped }));
                        }}
                        aria-label="Strategy contribution"
                        className="w-full accent-blue-500"
                        list="contribution-ticks"
                      />
                      
                      {/* Numeric box for contribution edits */}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={configureStrategyForm.contribution}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isNaN(v)) return;
                          const clamped = Math.max(1, Math.min(100, v));
                          setConfigureStrategyForm(p => ({ ...p, contribution: clamped }));
                        }}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          const clamped = Math.max(1, Math.min(100, v || 1));
                          if (v !== clamped) {
                            setConfigureStrategyForm(p => ({ ...p, contribution: clamped }));
                          }
                        }}
                        className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                      />
                    </div>

                    {/* Tick marks */}
                    <datalist id="contribution-ticks">
                      <option value="1" />
                      <option value="10" />
                      <option value="20" />
                      <option value="30" />
                      <option value="40" />
                      <option value="50" />
                      <option value="60" />
                      <option value="70" />
                      <option value="80" />
                      <option value="90" />
                      <option value="100" />
                    </datalist>

                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Direction
                    </label>
                    <select
                      value={configureStrategyForm.direction}
                      onChange={(e) => setConfigureStrategyForm(prev => ({ ...prev, direction: e.target.value as 'SAME' | 'OPPOSITE' }))}
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
                    checked={configureStrategyForm.isCloseBeforeNewCandle}
                    onChange={(e) => setConfigureStrategyForm(prev => ({ ...prev, isCloseBeforeNewCandle: e.target.checked }))}
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
                        configureStrategyForm.selectedTokens.includes(token.id)
                          ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      }`}
                      onClick={() => toggleToken(token.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{token.name}</span>
                        {configureStrategyForm.selectedTokens.includes(token.id) && (
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

                {configureStrategyForm.targets.map((target, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">Target {index + 1}</span>
                      {configureStrategyForm.targets.length > 1 && (
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
                  onClick={() => setShowConfigureStrategy(false)}
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !configureStrategyForm.description || configureStrategyForm.targets.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
      {/* Configure Strategy Modal */}
      {showConfigureStrategy && renderConfigureStrategyForm()}
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

      {/* Claim Details Modal */}
      {showClaimDetails && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClaimDetails(false)
              setClaimDetails(null)
            }
          }}
        >
          <div 
            className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Claim Details</h2>
                  <p className="text-gray-400">Comprehensive claim information and bills breakdown</p>
                </div>
                <Button
                  onClick={() => {
                    setShowClaimDetails(false)
                    setClaimDetails(null)
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-400">
                  Loading claim details...
                </div>
              ) : error ? (
                <div className="py-8 text-center text-red-400">
                  Error: {error}
                </div>
              ) : claimDetails ? (
                <div className="space-y-6">
                  {/* Claim Overview */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3">
                        <Users className="w-5 h-5" />
                        Claim Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-400">Claim ID</label>
                            <p className="text-white font-mono">#{claimDetails.id}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Amount</label>
                            <p className="text-white text-xl font-bold">${claimDetails.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Status</label>
                            <Badge className={`${getStatusColor(claimDetails.status)} text-white`}>
                              {claimDetails.status}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Network</label>
                            <p className="text-white">{claimDetails.network}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-400">User</label>
                            <p className="text-white">{claimDetails.user?.username || 'Unknown'}</p>
                            <p className="text-gray-400 text-sm">{claimDetails.user?.email}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Wallet Address</label>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-mono text-sm break-all">{claimDetails.address}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigator.clipboard.writeText(claimDetails.address)}
                                className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {claimDetails.hashId && (
                            <div>
                              <label className="text-sm text-gray-400">
                                {claimDetails.status === 'FINISHED' ? 'Admin Note' : 'Transaction Hash'}
                              </label>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-mono text-sm break-all">{claimDetails.hashId}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigator.clipboard.writeText(claimDetails.hashId)}
                                  className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="text-sm text-gray-400">Created</label>
                            <p className="text-white">{new Date(claimDetails.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bills Breakdown */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-3">
                          <DollarSign className="w-5 h-5" />
                          Bills Breakdown ({claimDetails.bills?.length || 0} bills)
                        </CardTitle>
                        {claimDetails.bills && claimDetails.bills.length > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Total Bills Value</p>
                            <p className="text-xl font-bold text-white">
                              ${claimDetails.bills.reduce((sum: number, bill: any) => sum + (bill.netProfit || 0), 0).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {claimDetails.bills && claimDetails.bills.length > 0 ? (
                        <div className="space-y-6">
                          {/* Bills Summary */}
                          {(() => {
                            const totalNetProfit = claimDetails.bills.reduce((sum: number, bill: any) => sum + (bill.netProfit || 0), 0);
                            const totalCommission = claimDetails.bills.reduce((sum: number, bill: any) => {
                              if (bill.netProfit <= 0) return sum;
                              // Handle both decimal (0.3) and percentage (30) formats
                              const adminCommissionPercent = bill.adminCommissionPercent > 1 
                                ? bill.adminCommissionPercent / 100 
                                : bill.adminCommissionPercent;
                              const referralCommissionPercent = bill.referralCommissionPercent > 1 
                                ? bill.referralCommissionPercent / 100 
                                : bill.referralCommissionPercent;
                              return sum + (bill.netProfit * (adminCommissionPercent + referralCommissionPercent));
                            }, 0);
                            const commissionPercent = totalNetProfit > 0 
                              ? ((totalCommission / totalNetProfit) * 100).toFixed(1)
                              : '0';
                            
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-gray-400">Total Bills Net Profit</span>
                                  </div>
                                  <p className="text-xl font-bold text-white">
                                    ${totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-gray-400">Total Commission ({commissionPercent}%)</span>
                                  </div>
                                  <p className="text-xl font-bold text-yellow-400">
                                    ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Individual Bills */}
                          {claimDetails.bills.map((bill: any) => (
                            <div key={bill.id} className="bg-gray-700 rounded-lg p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="bg-gray-600 rounded-lg p-3">
                                    <DollarSign className="w-6 h-6 text-blue-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium text-lg">Bill #{bill.id}</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span className="text-gray-400 text-sm">
                                        {bill.from && bill.to ? 
                                          `${new Date(bill.from).toLocaleDateString()} - ${new Date(bill.to).toLocaleDateString()}` :
                                          'Date range not available'
                                        }
                                      </span>
                                      <Badge className={`${getStatusColor(bill.status)} text-white`}>
                                        {bill.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-400">Net Profit</p>
                                  <p className={`text-xl font-bold ${
                                    bill.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    ${bill.netProfit.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Orders in this bill */}
                              {bill.orders && bill.orders.length > 0 ? (
                                <div className="mt-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-gray-300 font-medium">Orders ({bill.orders.length})</h5>
                                    <div className="text-sm text-gray-400">
                                      Total Orders Value: ${bill.orders.reduce((sum: number, order: any) => sum + (order.netProfit || 0), 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="grid gap-3">
                                    {bill.orders.map((order: any) => (
                                      <div key={order.id} className="bg-gray-600 rounded-lg p-4 border border-gray-500/30">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                              order.side === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                            <div>
                                              <p className="text-white font-mono text-sm">{order.orderId}</p>
                                              <p className="text-gray-400 text-xs">{order.token?.name || 'Unknown Token'}</p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className={`font-bold ${
                                              order.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                              ${order.netProfit.toLocaleString()}
                                            </p>
                                            <p className="text-gray-400 text-xs">{order.side}</p>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-400">Entry Price:</span>
                                            <p className="text-white">${order.entryPrice}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Quantity:</span>
                                            <p className="text-white">{order.qty}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Budget:</span>
                                            <p className="text-white">${order.budget?.toLocaleString() || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Date:</span>
                                            <p className="text-white">{new Date(order.buyDate).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                        
                                        {order.note && (
                                          <div className="mt-3 pt-3 border-t border-gray-500/30">
                                            <span className="text-gray-400 text-xs">Note:</span>
                                            <p className="text-gray-300 text-sm">{order.note}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-400">
                                  No orders in this bill
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-lg">No bills associated with this claim</p>
                          <p className="text-sm">This claim has no associated billing information</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  {claimDetails.status === 'NEW' && (
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectClaim(claimDetails)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject Claim
                      </Button>
                      <Button 
                        onClick={() => handleApproveClaim(claimDetails)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Claim
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  No claim details available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Claim Modal */}
      {showApproveModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApproveModal(false)
              setSelectedClaimForAction(null)
              setAdminNote('')
            }
          }}
        >
          <div 
            className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Approve Claim</h3>
                <Button
                  onClick={() => {
                    setShowApproveModal(false)
                    setSelectedClaimForAction(null)
                    setAdminNote('')
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm">
                  User: {selectedClaimForAction?.user?.username}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note for the user"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false)
                    setSelectedClaimForAction(null)
                    setAdminNote('')
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmApproveClaim}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Approving...' : 'Approve Claim'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Claim Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRejectModal(false)
              setSelectedClaimForAction(null)
              setAdminNote('')
            }
          }}
        >
          <div 
            className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Reject Claim</h3>
                <Button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedClaimForAction(null)
                    setAdminNote('')
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm">
                  User: {selectedClaimForAction?.user?.username}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason (Required)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Explain why the claim is being rejected"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedClaimForAction(null)
                    setAdminNote('')
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRejectClaim}
                  disabled={loading || !adminNote.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Rejecting...' : 'Reject Claim'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

