import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  History, 
  Briefcase, 
  Settings,
  Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'trading', label: 'Trading', icon: TrendingUp, badge: '3' },
  { id: 'backtesting', label: 'Backtesting', icon: Target },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'history', label: 'History', icon: History },
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Buy-nance Bandits</h1>
            <p className="text-xs text-gray-400">Trading System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
