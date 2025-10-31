import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Zap, BarChart } from 'lucide-react'


interface PortfolioData {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  activeTokensCount: number;
  availableTokens: Array<{ id: number; name: string; isActive: boolean }>;
  userTokens: Array<{ id: number; token: { id: number; name: string; isActive: boolean } }>;
}

interface PerformanceData {
  time: string;
  year: string;
  month: number;
  day: number;
  value: number;
}

export function Dashboard() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);

  useEffect(() => {
    fetchPortfolioData();
    fetchPerformanceData();
    fetchAvailableTokens();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        console.error('No auth data in localStorage');
        return;
      }
      
      let parsedAuth;
      try {
        parsedAuth = JSON.parse(authData);
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError);
        return;
      }
      
      const token = parsedAuth?.token;
      if (!token || token === 'null' || token === 'undefined') {
        console.error('Invalid or missing token');
        return;
      }
      
      console.log('Fetching portfolio data with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/user/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Portfolio API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Portfolio data received:', data);
        setPortfolioData(data.data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('Portfolio API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        console.error('No auth data in localStorage');
        return;
      }
      
      let parsedAuth;
      try {
        parsedAuth = JSON.parse(authData);
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError);
        return;
      }
      
      const token = parsedAuth?.token;
      if (!token || token === 'null' || token === 'undefined') {
        console.error('Invalid or missing token');
        return;
      }
      
      console.log('Fetching performance data with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/user/portfolio/performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Performance API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Performance data received:', data);
        setPerformanceData(data.data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('Performance API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchAvailableTokens = async () => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        console.error('No auth data in localStorage');
        return;
      }
      
      let parsedAuth;
      try {
        parsedAuth = JSON.parse(authData);
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError);
        return;
      }
      
      const token = parsedAuth?.token;
      if (!token || token === 'null' || token === 'undefined') {
        console.error('Invalid or missing token');
        return;
      }
      
      const response = await fetch('/api/user/tokens/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTokens(data.data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('Failed to fetch available tokens:', errorData);
      }
    } catch (error) {
      console.error('Error fetching available tokens:', error);
    }
  };

  const activeTokens = portfolioData?.userTokens || [];
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Overview of your trading performance and portfolio</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                ${portfolioData?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </span>
              <BarChart className="w-5 h-5 text-blue-400" />
            </div>
            <p className={`text-sm mt-1 ${(portfolioData?.totalPnLPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(portfolioData?.totalPnLPercent ?? 0) >= 0 ? '+' : ''}{(portfolioData?.totalPnLPercent ?? 0).toFixed(2)}% today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${(portfolioData?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(portfolioData?.totalPnL ?? 0) >= 0 ? '+' : ''}${(portfolioData?.totalPnL ?? 0).toFixed(2)}
              </span>
              <TrendingUp className={`w-5 h-5 ${(portfolioData?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {(portfolioData?.totalPnLPercent ?? 0) >= 0 ? '+' : ''}{(portfolioData?.totalPnLPercent ?? 0).toFixed(2)}% total gain
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
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">{activeTokens.length} selected</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 font-medium">Available Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{portfolioData?.availableTokens.length || 0}</span>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mt-1">tokens to choose from</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0">
        {/* Portfolio Chart */}
        <Card className="bg-gray-900 border-gray-800 flex flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl">Portfolio Chart</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[180px] sm:min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(_, index) => {
                      // Only show year labels on January 1st of each year
                      const dataPoint = performanceData[index];
                      if (!dataPoint) return '';
                      
                      // Show year label only if it's January 1st (month = 1, day = 1)
                      return (dataPoint.month === 1 && dataPoint.day === 1) ? dataPoint.year : '';
                    }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="url(#gradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Crypto Prices */}
        <Card className="bg-gray-900 border-gray-800 flex flex-col lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl">Crypto Prices</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {availableTokens.map((token, index) => {
                // Hardcoded prices for demo - will be replaced with API calls later
                const prices: { [key: string]: { price: number; change: number; volume: string } } = {
                  'Bitcoin': { price: 67845.32, change: 2.45, volume: '1.2B' },
                  'Ethereum': { price: 3456.78, change: -1.23, volume: '890M' },
                  'Solana': { price: 145.67, change: 5.67, volume: '245M' },
                  'Cardano': { price: 0.45, change: 3.21, volume: '180M' },
                  'Polygon': { price: 0.89, change: -2.15, volume: '95M' },
                  'Chainlink': { price: 12.34, change: 1.56, volume: '120M' },
                };
                
                // Try exact match first, then fallback to partial match
                let tokenData = prices[token.name];
                if (!tokenData) {
                  // Try to match by partial name (e.g., "Bitcoin" matches "BTC")
                  const partialMatch = Object.keys(prices).find(key => 
                    key.toLowerCase().includes(token.name.toLowerCase()) || 
                    token.name.toLowerCase().includes(key.toLowerCase())
                  );
                  tokenData = partialMatch ? prices[partialMatch] : { price: 0, change: 0, volume: '0M' };
                }
                
                // Debug log to see what tokens we're getting
                console.log('Token name:', token.name, 'Token data:', tokenData);
                
                // Get token symbol for display
                const tokenSymbols: { [key: string]: string } = {
                  'Bitcoin': 'BTC',
                  'Ethereum': 'ETH', 
                  'Solana': 'SOL',
                  'Cardano': 'ADA',
                  'Polygon': 'MATIC',
                  'Chainlink': 'LINK'
                };
                
                const symbol = tokenSymbols[token.name] || token.name.substring(0, 3).toUpperCase();
                
                return (
                  <div key={`crypto-${token.id}-${index}`} className="flex items-center justify-between p-2.5 sm:p-3.5 border border-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-300">{symbol}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm sm:text-lg truncate">{token.name}</p>
                        <p className="text-xs sm:text-sm text-gray-400">Vol: {tokenData.volume}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      <p className="text-white font-medium text-sm sm:text-lg">${tokenData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <div className={`flex items-center gap-1 text-xs sm:text-sm ${
                        tokenData.change > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tokenData.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{tokenData.change > 0 ? '+' : ''}{tokenData.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
