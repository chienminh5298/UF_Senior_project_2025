import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  TrendingUp,
  DollarSign,
  Briefcase,
  PieChart,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'

interface PortfolioData {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  activeTokensCount: number;
  availableTokens: Array<{ id: number; name: string; isActive: boolean }>;
  userTokens: Array<{ id: number; token: { id: number; name: string; isActive: boolean } }>;
}

export function Portfolio() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
    fetchActiveOrders();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const authData = localStorage.getItem('auth');
      const token = authData ? JSON.parse(authData).token : null;
      const response = await fetch('/api/user/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const authData = localStorage.getItem('auth');
      const token = authData ? JSON.parse(authData).token : null;
      const response = await fetch('/api/user/trading/positions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveOrders(data.data.activePositions);
      } else {
        console.error('Failed to fetch active orders');
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchPortfolioData();
    fetchActiveOrders();
  };

  const portfolioStats = {
    totalValue: portfolioData?.totalValue || 0,
    todayChange: portfolioData?.totalPnL || 0,
    todayChangePercent: portfolioData?.totalPnLPercent || 0,
    totalPnL: portfolioData?.totalPnL || 0,
    totalPnLPercent: portfolioData?.totalPnLPercent || 0,
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Portfolio</h1>
          <p className="text-sm sm:text-base text-gray-400">Track your crypto holdings and performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white text-xs sm:text-sm">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Hide Balances</span>
            <span className="sm:hidden">Hide</span>
          </Button>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white text-xs sm:text-sm" onClick={handleRefresh}>
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
                   <span className="text-2xl font-bold text-white">${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <p className={`text-sm mt-1 ${portfolioStats.todayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolioStats.todayChange >= 0 ? '+' : ''}${portfolioStats.todayChange.toFixed(2)} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">24h Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${portfolioStats.todayChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioStats.todayChangePercent >= 0 ? '+' : ''}{portfolioStats.todayChangePercent.toFixed(2)}%
              </span>
              <TrendingUp className={`w-5 h-5 ${portfolioStats.todayChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <p className="text-sm text-gray-400 mt-1">vs yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${portfolioStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioStats.totalPnL >= 0 ? '+' : ''}${portfolioStats.totalPnL.toFixed(2)}
              </span>
              <DollarSign className={`w-5 h-5 ${portfolioStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {portfolioStats.totalPnLPercent >= 0 ? '+' : ''}{portfolioStats.totalPnLPercent.toFixed(2)}% total gain
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Active Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{portfolioData?.activeTokensCount || 0}</span>
              <PieChart className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">{portfolioData?.availableTokens.length || 0} available</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Positions */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Active Positions</CardTitle>
          <p className="text-sm text-gray-400">
            {portfolioData?.userTokens.length || 0} selected tokens
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading positions...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolioData?.userTokens.map((userToken, index) => {
                // Find if there's an active order for this token
                const activeOrder = activeOrders.find(order => 
                  order.pair === `${userToken.token.name}/USDT`
                );
                
                return (
                  <div key={`position-${userToken.id}-${index}`} className="p-4 sm:p-6 rounded-lg bg-gray-800/50 border border-gray-700">
                    {/* Header with token name, badges, and P&L */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <span className="font-bold text-white text-lg sm:text-xl">{userToken.token.name}/USDT</span>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm">
                            Selected
                          </Badge>
                          <Badge className={`text-sm ${activeOrder ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                            {activeOrder ? 'Active Trading' : 'Ready to Trade'}
                          </Badge>
                        </div>
                      </div>
                      <span className={`font-bold text-lg sm:text-xl ${activeOrder ? activeOrder.pnlColor : 'text-gray-400'}`}>
                        {activeOrder ? activeOrder.pnl : '$0.00'}
                      </span>
                    </div>

                    {/* Data fields with even spacing and right-aligned button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 flex-1">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Investment</p>
                          <p className="text-white font-semibold text-base">{activeOrder ? activeOrder.investment : '$0.00'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Size</p>
                          <p className="text-white font-semibold text-base">{activeOrder ? activeOrder.size : `0 ${userToken.token.name}`}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Entry Price</p>
                          <p className="text-white font-semibold text-base">{activeOrder ? activeOrder.entry : 'Not started'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Start Date</p>
                          <p className="text-white font-semibold text-base">{activeOrder ? activeOrder.startDate : 'Not started'}</p>
                        </div>
                      </div>
                      
                      {/* Right-aligned button */}
                      <div className="flex justify-end sm:justify-start">
                        {activeOrder ? (
                          <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/20 text-sm px-4 py-2">
                            Close Position
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="border-green-500 text-green-400 hover:bg-green-500/20 text-sm px-4 py-2">
                            Start Trading
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {(!portfolioData?.userTokens || portfolioData.userTokens.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No active positions</p>
                  <p className="text-sm text-gray-500 mt-1">Select tokens to start trading</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}