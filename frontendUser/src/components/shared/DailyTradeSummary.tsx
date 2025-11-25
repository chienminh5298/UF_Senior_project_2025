import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Trade {
  id: string
  timestamp: number
  side: 'BUY' | 'SELL'
  price: number
  quantity: number
  pnl?: number
}

interface DailySummary {
  date: string
  timestamp: number
  totalOrders: number
  buyOrders: number
  sellOrders: number
  totalPnL: number
  openingCapital: number
  closingCapital: number
  trades: Trade[]
}

interface DailyTradeSummaryProps {
  dailySummaries: DailySummary[]
  totalTrades: number
  currentPage: number
  tradesPerPage: number
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  onPageChange: (page: number) => void
}

export function DailyTradeSummary({
  dailySummaries,
  totalTrades,
  currentPage,
  tradesPerPage,
  selectedDate,
  onSelectDate,
  onPageChange
}: DailyTradeSummaryProps) {
  const totalPages = Math.ceil(dailySummaries.length / tradesPerPage)
  const startIndex = (currentPage - 1) * tradesPerPage
  const endIndex = startIndex + tradesPerPage
  const paginatedDays = dailySummaries.slice(startIndex, endIndex)

  const selectedDayData = selectedDate 
    ? dailySummaries.find(d => d.date === selectedDate)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Summary Table */}
      <div className={selectedDate ? "lg:col-span-2" : "lg:col-span-3"}>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Daily Trade Summary</CardTitle>
                <p className="text-sm text-gray-400">
                  Showing days {startIndex + 1}-{Math.min(endIndex, dailySummaries.length)} of {dailySummaries.length} trading days
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Trades</p>
                <p className="text-lg font-bold text-blue-400">{totalTrades}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Orders</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Buy/Sell</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Daily P&L</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Closing Capital</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDays.map((day) => (
                    <tr 
                      key={day.date} 
                      onClick={() => onSelectDate(day.date === selectedDate ? null : day.date)}
                      className={`border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                        selectedDate === day.date ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-white">{day.date}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm text-gray-300">{day.totalOrders}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-green-400">{day.buyOrders}↑</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-red-400">{day.sellOrders}↓</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-bold ${day.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {day.totalPnL >= 0 ? '+' : ''}${day.totalPnL.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-medium ${day.closingCapital >= day.openingCapital ? 'text-green-400' : 'text-red-400'}`}>
                          ${day.closingCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    First
                  </Button>
                  <Button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Details Panel */}
      {selectedDate && selectedDayData && (
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-gray-800 sticky top-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white text-lg">{selectedDate}</CardTitle>
                <Button
                  onClick={() => onSelectDate(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400">Opening</p>
                  <p className="text-sm font-bold text-blue-400">
                    ${selectedDayData.openingCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Closing</p>
                  <p className="text-sm font-bold text-blue-400">
                    ${selectedDayData.closingCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {selectedDayData.trades.map((trade, index) => (
                  <div
                    key={trade.id || index}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {trade.side === 'BUY' ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-xs font-bold ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.side}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(trade.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white font-medium">
                          ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Qty:</span>
                        <span className="text-gray-300">{trade.quantity.toFixed(4)}</span>
                      </div>
                      {trade.pnl !== undefined && (
                        <div className="flex justify-between pt-1 border-t border-gray-700">
                          <span className="text-gray-400">P&L:</span>
                          <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

