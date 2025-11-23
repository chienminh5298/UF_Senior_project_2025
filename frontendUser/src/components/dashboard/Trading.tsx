import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { CheckCircle, RefreshCw, X, DollarSign, Coins } from 'lucide-react'

interface Token {
  id: number
  name: string
  stable: string
  minQty: number
  leverage: number
  isActive: boolean
}

interface UserToken {
  id: number
  token: {
    id: number
    name: string
    isActive: boolean
  }
}

export function Trading() {
  const [tradeBalance, setTradeBalance] = useState<number>(0)
  const [tradeBalanceInput, setTradeBalanceInput] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [savingBalance, setSavingBalance] = useState(false)
  
  // Token selector state
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<Token[]>([])
  const [userTokens, setUserTokens] = useState<UserToken[]>([])
  const [selectedTokenIds, setSelectedTokenIds] = useState<number[]>([])
  const [tokenSelectorLoading, setTokenSelectorLoading] = useState(false)

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData()
    fetchAvailableTokens()
  }, [])

  const fetchUserData = async () => {
    try {
      const authData = localStorage.getItem('auth')
      const token = authData ? JSON.parse(authData).token : null

      const response = await fetch('/api/user/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const balance = data.data?.tradeBalance || 0
        setTradeBalance(balance)
        setTradeBalanceInput(balance.toString())
        setUserTokens(data.data?.userTokens || [])
        // Pre-select user's current tokens
        const currentTokenIds = (data.data?.userTokens || []).map((ut: UserToken) => ut.token.id)
        setSelectedTokenIds(currentTokenIds)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTokens = async () => {
    try {
      const authData = localStorage.getItem('auth')
      const token = authData ? JSON.parse(authData).token : null

      const response = await fetch('/api/user/tokens/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableTokens(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching available tokens:', error)
    }
  }

  const handleSaveTradeBalance = async () => {
    const balance = parseInt(tradeBalanceInput, 10)
    
    if (isNaN(balance) || balance < 0) {
      alert('Please enter a valid non-negative whole number')
      return
    }

    setSavingBalance(true)
    try {
      const authData = localStorage.getItem('auth')
      const token = authData ? JSON.parse(authData).token : null

      const response = await fetch('/api/user/trade-balance', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeBalance: balance }),
      })

      if (response.ok) {
        const data = await response.json()
        setTradeBalance(data.data.tradeBalance)
        setTradeBalanceInput(data.data.tradeBalance.toString())
        alert('Trade balance updated successfully')
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to update trade balance')
      }
    } catch (error) {
      console.error('Error updating trade balance:', error)
      alert('Failed to update trade balance')
    } finally {
      setSavingBalance(false)
    }
  }

  const handleOpenTokenSelector = () => {
    setShowTokenSelector(true)
    // Pre-select user's current tokens
    const currentTokenIds = userTokens.map(ut => ut.token.id)
    setSelectedTokenIds(currentTokenIds)
  }

  const handleCloseTokenSelector = () => {
    setShowTokenSelector(false)
    // Reset to current user tokens
    const currentTokenIds = userTokens.map(ut => ut.token.id)
    setSelectedTokenIds(currentTokenIds)
  }

  const toggleToken = (tokenId: number) => {
    setSelectedTokenIds(prev =>
      prev.includes(tokenId)
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    )
  }

  const handleSaveTokenSelection = async () => {
    setTokenSelectorLoading(true)

    try {
      const authData = localStorage.getItem('auth')
      const token = authData ? JSON.parse(authData).token : null

      const response = await fetch('/api/user/tokens/bulk', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIds: selectedTokenIds }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserTokens(data.data.userTokens || [])
        setShowTokenSelector(false)
        alert('Token selection updated successfully')
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to update token selection')
      }
    } catch (error) {
      console.error('Error updating token selection:', error)
      alert('Failed to update token selection')
    } finally {
      setTokenSelectorLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading Settings</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Configure your trade balance and token selection</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Trade Balance Selector */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Trade Balance</CardTitle>
            </div>
            <p className="text-sm text-gray-400 mt-1">Set your trading balance (whole number only)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Balance</label>
              <div className="text-2xl font-bold text-white">
                ${tradeBalance.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="tradeBalance" className="text-sm font-medium text-gray-300">
                New Trade Balance
              </label>
              <input
                id="tradeBalance"
                type="number"
                min="0"
                step="1"
                value={tradeBalanceInput}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow whole numbers
                  if (value === '' || /^\d+$/.test(value)) {
                    setTradeBalanceInput(value)
                  }
                }}
                placeholder="Enter trade balance..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <Button
              onClick={handleSaveTradeBalance}
              disabled={savingBalance || tradeBalanceInput === '' || parseInt(tradeBalanceInput, 10) === tradeBalance}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingBalance ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Trade Balance'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Token Selector */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Token Selection</CardTitle>
            </div>
            <p className="text-sm text-gray-400 mt-1">Select tokens you want to trade with</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Selected Tokens</label>
              <div className="text-2xl font-bold text-white">
                {userTokens.length} token{userTokens.length !== 1 ? 's' : ''}
              </div>
              {userTokens.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {userTokens.map((ut) => (
                    <span
                      key={ut.id}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-full text-sm"
                    >
                      {ut.token.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleOpenTokenSelector}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Coins className="w-4 h-4 mr-2" />
              Select Tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Token Selection Modal */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
              <CardTitle className="text-white">Select Trading Tokens</CardTitle>
              <Button
                onClick={handleCloseTokenSelector}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {tokenSelectorLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading tokens...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    Select tokens to trade with. Only selected tokens will be used for trading.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {Array.isArray(availableTokens) && availableTokens.length > 0 ? (
                      availableTokens.map((token) => (
                        <div
                          key={token.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTokenIds.includes(token.id)
                              ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                              : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                          }`}
                          onClick={() => toggleToken(token.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{token.name}</span>
                            {selectedTokenIds.includes(token.id) && (
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-400">
                        <p>No tokens available</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button
                      onClick={handleCloseTokenSelector}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTokenSelection}
                      disabled={tokenSelectorLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {tokenSelectorLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
