import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Receipt,
  X,
  Copy,
  Calendar,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react'

export function Bills() {
  // Bills state
  const [bills, setBills] = useState<any[]>([])
  const [loadingBills, setLoadingBills] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentHashId, setPaymentHashId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNetwork, setPaymentNetwork] = useState('ERC20')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    setLoadingBills(true)
    try {
      const auth = localStorage.getItem('auth')
      const token = auth ? JSON.parse(auth).token : null
      const res = await fetch('/api/user/bills', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        // Include all bills (NEW, PROCESSING, REJECTED, FINISHED) to show status
        const unpaidBills = data.data.bills
          .filter((bill: any) => bill.netProfit > 0)
          .map((bill: any) => {
            // Get token name from orders (use first order's token, or combine if multiple)
            const tokenNames = bill.orders
              ?.map((order: any) => order.token?.name)
              .filter((name: string) => name)
              .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) || []
            const tokenName = tokenNames.length > 0 
              ? (tokenNames.length === 1 ? tokenNames[0] : `${tokenNames.length} tokens`)
              : 'Unknown'
            
            // Calculate due date (30 days from the 'to' date or latest sellDate)
            const latestSellDate = bill.orders
              ?.map((order: any) => order.sellDate ? new Date(order.sellDate) : null)
              .filter((date: Date | null) => date)
              .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
            
            const completionDate = latestSellDate || new Date(bill.to)
            const dueDate = new Date(completionDate)
            dueDate.setDate(dueDate.getDate() + 30)
            
            return {
              ...bill,
              // Ensure we have commission percentages, use defaults if not present
              adminCommissionPercent: bill.adminCommissionPercent ?? 30,
              referralCommissionPercent: bill.referralCommissionPercent ?? 0,
              tokenName,
              dueDate,
              completionDate,
            }
          })
        setBills(unpaidBills)
      }
    } catch (e) {
      console.error('Failed to load bills:', e)
    } finally {
      setLoadingBills(false)
    }
  }

  // Helper function to round up to 2 decimal places
  const roundUpToCents = (value: number): number => {
    return Math.ceil(value * 100) / 100
  }

  const calculateTotalCommission = () => {
    // Count unpaid bills (NEW status) and rejected bills (can be paid again)
    const total = bills
      .filter((bill: any) => bill.status === 'NEW' || bill.status === 'REJECTED')
      .reduce((sum, bill) => {
        const adminCommissionPercent = bill.adminCommissionPercent > 1 
          ? bill.adminCommissionPercent / 100 
          : bill.adminCommissionPercent
        const referralCommissionPercent = bill.referralCommissionPercent > 1
          ? bill.referralCommissionPercent / 100
          : bill.referralCommissionPercent
        
        if (bill.netProfit > 0) {
          return sum + (bill.netProfit * (adminCommissionPercent + referralCommissionPercent))
        }
        return sum
      }, 0)
    return roundUpToCents(total)
  }

  const handleBillToggle = (billId: number) => {
    setSelectedBillIds(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    )
  }

  const handleSelectAll = () => {
    // Select unpaid bills (NEW status) and rejected bills (can be paid again)
    const payableBills = bills.filter((bill: any) => bill.status === 'NEW' || bill.status === 'REJECTED')
    if (selectAll) {
      setSelectedBillIds([])
    } else {
      setSelectedBillIds(payableBills.map(bill => bill.id))
    }
    setSelectAll(!selectAll)
  }

  useEffect(() => {
    // Update selectAll state when selectedBillIds changes (for unpaid and rejected bills)
    const payableBills = bills.filter((bill: any) => bill.status === 'NEW' || bill.status === 'REJECTED')
    setSelectAll(selectedBillIds.length === payableBills.length && payableBills.length > 0)
  }, [selectedBillIds, bills])

  const handlePayClick = () => {
    if (selectedBillIds.length === 0) {
      setPaymentError('Please select at least one bill to pay')
      return
    }
    setShowPaymentModal(true)
    setPaymentError(null)
    setPaymentSuccess(null)
    setPaymentHashId('')
    setPaymentAmount('')
    setPaymentNetwork('ERC20')
  }

  const calculateSelectedCommission = () => {
    const total = bills
      .filter(bill => selectedBillIds.includes(bill.id))
      .reduce((sum, bill) => {
        const adminCommissionPercent = bill.adminCommissionPercent > 1 
          ? bill.adminCommissionPercent / 100 
          : bill.adminCommissionPercent
        const referralCommissionPercent = bill.referralCommissionPercent > 1
          ? bill.referralCommissionPercent / 100
          : bill.referralCommissionPercent
        
        if (bill.netProfit > 0) {
          return sum + (bill.netProfit * (adminCommissionPercent + referralCommissionPercent))
        }
        return sum
      }, 0)
    return roundUpToCents(total)
  }

  const handleSubmitPayment = async () => {
    // Validate all required fields
    const missingFields: string[] = []
    if (!paymentHashId || paymentHashId.trim() === '') {
      missingFields.push('Transaction Hash ID')
    }
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      missingFields.push('Amount Paid')
    }
    if (!paymentNetwork) {
      missingFields.push('Network')
    }
    
    // Use the same platform wallet address logic as the display (with fallback)
    const platformAddress = (import.meta as any).env?.VITE_PLATFORM_WALLET_ADDRESS ||
      '0x1234567890123456789012345678901234567890' // Placeholder - should be configured
    if (!platformAddress || platformAddress.trim() === '') {
      missingFields.push('Platform Wallet Address (not configured)')
    }

    if (missingFields.length > 0) {
      setPaymentError(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    setSubmittingPayment(true)
    setPaymentError(null)
    setPaymentSuccess(null)

    try {
      const auth = localStorage.getItem('auth')
      const token = auth ? JSON.parse(auth).token : null
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      // Use the claim endpoint to create a claim for the selected bills
      // This groups the bills together with one payment hash ID
      const res = await fetch('/api/user/bills/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billIds: selectedBillIds,
          hashId: paymentHashId.trim(),
          amount: parseFloat(paymentAmount),
          network: paymentNetwork,
          address: platformAddress.trim(),
        }),
      })
      
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to submit payment')
      }
      setPaymentSuccess('Payment submitted successfully. Your claim has been created.')
      setTimeout(() => {
        setShowPaymentModal(false)
        setSelectedBillIds([])
        setSelectAll(false)
        fetchBills() // Refresh bills list
      }, 2000)
    } catch (e: any) {
      setPaymentError(e?.message || 'Failed to submit payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const totalCommission = calculateTotalCommission()
  const selectedCommission = calculateSelectedCommission()

  // Safely access platform wallet address from environment variables (works around type error)
  const platformWalletAddress =
    (import.meta as any).env?.VITE_PLATFORM_WALLET_ADDRESS ||
    '0x1234567890123456789012345678901234567890' // Placeholder - should be configured

  // Calculate overdue bills
  const now = new Date()
  const overdueBills = bills.filter(bill => new Date(bill.dueDate) < now)

  // Get days until due for a bill
  const getDaysUntilDue = (dueDate: Date) => {
    const diff = new Date(dueDate).getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Bills</h1>
          <p className="text-gray-400">Pay commissions for completed trades with profits</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Unpaid</p>
                <p className="text-2xl font-bold text-white mt-1">${totalCommission.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overdue Bills</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{overdueBills.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Bills</p>
                <p className="text-2xl font-bold text-white mt-1">{bills.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Commissions</CardTitle>
          <p className="text-sm text-gray-400">View and pay commissions for completed trades with profits</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingBills ? (
            <div className="text-center py-8 text-gray-400">Loading bills...</div>
          ) : bills.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No commissions</div>
          ) : (
            <>
              {bills.filter((b: any) => b.status === 'NEW' || b.status === 'REJECTED').length > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 bg-gray-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 flex items-center justify-center group-hover:border-blue-500">
                        {selectAll && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Select All (Payable Bills)</span>
                  </label>
                  <span className="text-sm text-gray-400">
                    {selectedBillIds.length} of {bills.filter((b: any) => b.status === 'NEW' || b.status === 'REJECTED').length} payable selected
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {bills
                  .sort((a, b) => {
                    // First sort by status: Pending first, then by due date urgency
                    const statusOrder = { PROCESSING: 0, REJECTED: 1, FINISHED: 2, NEW: 3 }
                    const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 3) - (statusOrder[b.status as keyof typeof statusOrder] || 3)
                    
                    // If same status, sort by due date (most urgent first - oldest/upcoming due dates)
                    if (statusDiff === 0) {
                      const dateA = new Date(a.dueDate).getTime()
                      const dateB = new Date(b.dueDate).getTime()
                      return dateA - dateB // Ascending: oldest/upcoming dates first
                    }
                    
                    return statusDiff
                  })
                  .map((bill) => {
                  const adminCommissionPercent = bill.adminCommissionPercent > 1 
                    ? bill.adminCommissionPercent / 100 
                    : bill.adminCommissionPercent
                  const referralCommissionPercent = bill.referralCommissionPercent > 1
                    ? bill.referralCommissionPercent / 100
                    : bill.referralCommissionPercent
                  const commission = bill.netProfit > 0
                    ? roundUpToCents(bill.netProfit * (adminCommissionPercent + referralCommissionPercent))
                    : 0
                  const isSelected = selectedBillIds.includes(bill.id)
                  const daysUntilDue = getDaysUntilDue(bill.dueDate)
                  const isOverdue = daysUntilDue < 0
                  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7
                  const isPending = bill.status === 'PROCESSING'
                  const isRejected = bill.status === 'REJECTED'
                  const isApproved = bill.status === 'FINISHED'
                  const adminNote = bill.claim?.adminNote || bill.note
                  
                  return (
                    <div 
                      key={bill.id} 
                      className={`p-5 bg-gray-800 rounded-lg border ${
                        isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
                      } transition-all hover:border-gray-600 hover:bg-gray-800/80 ${
                        isPending || isApproved ? '' : 'cursor-pointer'
                      }`}
                      onClick={() => !isPending && !isApproved && handleBillToggle(bill.id)}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {!isPending && !isApproved && (
                            <div className="relative mt-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleBillToggle(bill.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="sr-only peer"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'bg-gray-800 border-gray-600 hover:border-blue-500'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-white font-semibold text-lg">
                                {bill.tokenName} Bill #{bill.id}
                              </p>
                              {isPending && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                  Pending Approval
                                </Badge>
                              )}
                              {isRejected && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                  Rejected
                                </Badge>
                              )}
                              {isApproved && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  Approved
                                </Badge>
                              )}
                              {!isPending && !isRejected && !isApproved && isOverdue && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                  Overdue
                                </Badge>
                              )}
                              {!isPending && !isRejected && !isApproved && isDueSoon && !isOverdue && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                  Due Soon
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Period: {new Date(bill.from).toLocaleDateString()} - {new Date(bill.to).toLocaleDateString()}
                                </span>
                              </div>
                              {(!isPending && !isApproved) && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  <span className={isOverdue ? 'text-red-400 font-medium' : isDueSoon ? 'text-yellow-400 font-medium' : ''}>
                                    Due Date: {new Date(bill.dueDate).toLocaleDateString()} 
                                    {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
                                    {isDueSoon && ` (${daysUntilDue} days remaining)`}
                                  </span>
                                </div>
                              )}
                              {isPending && (
                                <div className="flex items-center gap-2 text-sm text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="font-medium">Payment submitted, awaiting admin approval</span>
                                </div>
                              )}
                              {isRejected && adminNote && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-2">
                                  <p className="text-sm font-medium text-red-400 mb-1">Previous Rejection Reason:</p>
                                  <p className="text-sm text-red-300">{adminNote}</p>
                                  <p className="text-xs text-red-400 mt-2 italic">You can pay this bill again after addressing the issue.</p>
                                </div>
                              )}
                              {isApproved && adminNote && (
                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mt-2">
                                  <p className="text-sm font-medium text-green-400 mb-1">Admin Note:</p>
                                  <p className="text-sm text-green-300">{adminNote}</p>
                                </div>
                              )}
                              <p className="text-sm text-gray-400">
                                Net Profit: <span className="text-green-400 font-medium">${bill.netProfit.toFixed(2)}</span>
                              </p>
                              <p className="text-sm text-gray-400">
                                Commission Rate: {((adminCommissionPercent + referralCommissionPercent) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-xl font-bold text-yellow-400 mb-2">
                            ${commission.toFixed(2)}
                          </p>
                          {isPending && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Pending
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Rejected
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Paid
                            </Badge>
                          )}
                          {!isPending && !isApproved && (
                            <Badge className={isRejected ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                              {isRejected ? 'Rejected' : 'Unpaid'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {bills.filter((b: any) => b.status === 'NEW' || b.status === 'REJECTED').length > 0 && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">
                        Total Amount Due:
                      </span>
                      <span className="text-2xl font-bold text-yellow-400">
                        ${totalCommission.toFixed(2)}
                      </span>
                    </div>
                    {selectedBillIds.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-base font-medium text-gray-300">
                          Total Amount Selected:
                        </span>
                        <span className="text-xl font-bold text-blue-400">
                          ${selectedCommission.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={handlePayClick}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={selectedBillIds.length === 0}
                  >
                    Pay Selected ({selectedBillIds.length})
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingPayment) {
              setShowPaymentModal(false)
            }
          }}
        >
          <Card 
            className="bg-gray-900 border-gray-800 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Submit Payment</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Paying for {selectedBillIds.length} {selectedBillIds.length === 1 ? 'bill' : 'bills'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm font-medium mb-2">Payment Instructions:</p>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Send the payment amount (${calculateSelectedCommission().toFixed(2)}) to our platform wallet address below</li>
                  <li>After completing the transaction, copy the transaction hash ID</li>
                  <li>Select the network used and enter the hash ID and amount paid in the form below</li>
                  <li>All selected bills will be grouped into one claim with this payment</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Platform Wallet Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={platformWalletAddress}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(platformWalletAddress)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Network *</label>
                <select
                  value={paymentNetwork}
                  onChange={(e) => setPaymentNetwork(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                  <option value="SOLANA">Solana</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Transaction Hash ID *</label>
                <input
                  type="text"
                  value={paymentHashId}
                  onChange={(e) => setPaymentHashId(e.target.value)}
                  placeholder="Enter transaction hash ID"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Amount Paid (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400">
                  Expected amount: ${calculateSelectedCommission().toFixed(2)} ({selectedBillIds.length} {selectedBillIds.length === 1 ? 'bill' : 'bills'})
                </p>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
                  {paymentError}
                </div>
              )}
              {paymentSuccess && (
                <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-sm text-green-400" role="status">
                  {paymentSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  disabled={submittingPayment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  disabled={submittingPayment || !paymentHashId || !paymentAmount || !paymentNetwork}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submittingPayment ? 'Submitting...' : 'Submit Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

