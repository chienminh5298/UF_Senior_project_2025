import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const [apiKey, setApiKey] = useState('')
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null)
  const [savingApiKey, setSavingApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null)

  useEffect(() => {
    // Load user data from localStorage
    try {
      const auth = localStorage.getItem('auth')
      if (auth) {
        const { user } = JSON.parse(auth)
        const nameParts = (user.fullname || '').split(' ')
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')
        setUsername(user.username || '')
        setEmail(user.email || '')
        if (user.apiKey) {
          setCurrentApiKey(user.apiKey)
        }
      }
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
  }, [])

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  const handleSaveProfile = async () => {
    if (savingProfile) return
    setProfileError(null)
    setProfileSuccess(null)
    try {
      setSavingProfile(true)
      const auth = localStorage.getItem('auth')
      const token = auth ? JSON.parse(auth).token : null
      const fullname = `${firstName} ${lastName}`.trim()
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fullname, username, email }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update profile')
      }
      // Update local storage auth user
      const authObj = auth ? JSON.parse(auth) : null
      if (authObj) {
        authObj.user = data.data
        localStorage.setItem('auth', JSON.stringify(authObj))
      }
      setProfileSuccess('Profile updated successfully')
    } catch (e: any) {
      setProfileError(e?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const renderProfileSection = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {profileError && (
          <div className="mb-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="mb-2 p-3 bg-green-900/20 border border-green-800 rounded-lg text-sm text-green-400" role="status">
            {profileSuccess}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Time Zone</label>
          <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option>UTC-5 (Eastern Time)</option>
            <option>UTC-8 (Pacific Time)</option>
            <option>UTC+0 (GMT)</option>
            <option>UTC+1 (Central European Time)</option>
          </select>
        </div>

        <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    )
  }

  const handleChangePassword = async () => {
    if (savingPassword) return
    setPasswordError(null)
    setPasswordSuccess(null)
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Please fill out all password fields')
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match')
      }
      setSavingPassword(true)
      const auth = localStorage.getItem('auth')
      const token = auth ? JSON.parse(auth).token : null
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update password')
      }
      setPasswordSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setPasswordError(e?.message || 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-sm text-green-400" role="status">
              {passwordSuccess}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
            {savingPassword ? 'Updating...' : 'Update Password'}
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


  const handleSetApiKey = async () => {
    if (savingApiKey) return
    setApiKeyError(null)
    setApiKeySuccess(null)
    try {
      if (!apiKey || !apiKey.trim()) {
        throw new Error('Please enter an API key')
      }
      setSavingApiKey(true)
      const auth = localStorage.getItem('auth')
      const token = auth ? JSON.parse(auth).token : null
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update API key')
      }
      setCurrentApiKey(apiKey.trim())
      setApiKey('')
      setShowApiKeys(false)
      setApiKeySuccess('API key updated successfully')
      // Update local storage auth user
      const authObj = auth ? JSON.parse(auth) : null
      if (authObj) {
        authObj.user.apiKey = apiKey.trim()
        localStorage.setItem('auth', JSON.stringify(authObj))
      }
    } catch (e: any) {
      setApiKeyError(e?.message || 'Failed to update API key')
    } finally {
      setSavingApiKey(false)
    }
  }

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

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  {currentApiKey ? 'API Key' : 'Enter API Key'}
                </label>
                {currentApiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowApiKeys(!showApiKeys)
                      if (!showApiKeys && !apiKey) {
                        setApiKey(currentApiKey)
                      }
                    }}
                    className="h-6 px-2"
                  >
                    {showApiKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                )}
              </div>
              <input
                type={showApiKeys ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={currentApiKey ? "Modify your API key" : "Enter your API key"}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono text-sm"
                onFocus={() => {
                  // When user focuses and there's a current key but no input, populate it
                  if (currentApiKey && !apiKey) {
                    setApiKey(currentApiKey)
                    setShowApiKeys(true)
                  }
                }}
              />
              {currentApiKey && !apiKey && (
                <p className="text-xs text-gray-400">
                  Current API key is set. Click the eye icon or focus the field to view/modify it.
                </p>
              )}
            </div>

            {apiKeyError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
                {apiKeyError}
              </div>
            )}
            {apiKeySuccess && (
              <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-sm text-green-400" role="status">
                {apiKeySuccess}
              </div>
            )}

            <Button 
              onClick={handleSetApiKey} 
              disabled={savingApiKey || !apiKey} 
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {savingApiKey ? 'Saving...' : currentApiKey ? 'Update API Key' : 'Set API Key'}
            </Button>
          </div>
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
