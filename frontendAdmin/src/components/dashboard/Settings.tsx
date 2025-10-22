import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Key,
  Save,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'

export function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  //const [darkMode, setDarkMode] = useState(true) //TODO: Add switch to light/dark mode
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [userData, setUserData] = useState<{ fullname: string; username: string; email: string } | null>(null)

  useEffect(() => {
    // Load user data from localStorage
    try {
      const auth = localStorage.getItem('auth')
      if (auth) {
        const { user } = JSON.parse(auth)
        setUserData(user)
      }
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
  }, [])

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trading', label: 'Trading', icon: SettingsIcon },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  const renderProfileSection = () => {
    // Split full name into first and last name
    const nameParts = userData?.fullname?.split(' ') || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">First Name</label>
            <input
              type="text"
              value={firstName}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Last Name</label>
            <input
              type="text"
              value={lastName}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              readOnly
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Username</label>
          <input
            type="text"
            value={userData?.username || ''}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            readOnly
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Email Address</label>
          <input
            type="email"
            value={userData?.email || ''}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Time Zone</label>
          <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option>UTC-5 (Eastern Time)</option>
            <option>UTC-8 (Pacific Time)</option>
            <option>UTC+0 (GMT)</option>
            <option>UTC+1 (Central European Time)</option>
          </select>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    )
  }

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">Secure your account with 2FA</p>
              <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={twoFactorEnabled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                variant={twoFactorEnabled ? "destructive" : "default"}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">Trading alerts</p>
              <p className="text-sm text-gray-400">Get notified about trade executions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">Portfolio updates</p>
              <p className="text-sm text-gray-400">Daily portfolio performance summaries</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Push Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">Browser notifications</p>
              <p className="text-sm text-gray-400">Real-time alerts in your browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTradingSection = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Trading Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Default Risk Level</label>
              <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option>Low Risk</option>
                <option>Medium Risk</option>
                <option>High Risk</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Auto-Trading</label>
              <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option>Enabled</option>
                <option>Disabled</option>
                <option>Scheduled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Max Position Size</label>
              <input
                type="number"
                defaultValue="1000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Stop Loss %</label>
              <input
                type="number"
                defaultValue="5"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderApiSection = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">API Keys</CardTitle>
          <p className="text-sm text-gray-400">Manage your API keys for trading bots and integrations</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Security Warning</p>
                <p className="text-sm text-gray-300">Never share your API keys. Keep them secure and regenerate them if compromised.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Trading Bot API Key</p>
                <p className="text-sm text-gray-400">
                  {showApiKeys ? 'sk_live_1234567890abcdef...' : '••••••••••••••••••••••••'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">Regenerate</Button>
              </div>
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Key className="w-4 h-4 mr-2" />
            Generate New API Key
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection()
      case 'security':
        return renderSecuritySection()
      case 'notifications':
        return renderNotificationsSection()
      case 'trading':
        return renderTradingSection()
      case 'api':
        return renderApiSection()
      default:
        return renderProfileSection()
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account and trading preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <nav className="p-4">
              <ul className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? "bg-blue-600 text-white" 
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{section.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                {sections.find(s => s.id === activeSection)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}