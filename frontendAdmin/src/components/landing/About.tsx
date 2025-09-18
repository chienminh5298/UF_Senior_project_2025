import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Users,
  Target,
  Shield,
  Zap,
  Award,
  TrendingUp,
  Globe,
  ArrowLeft
} from 'lucide-react'

interface AboutProps {
  onBack: () => void
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Buy-nance Bandits</h1>
                <p className="text-xs text-gray-400">Admin Portal</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-white">About</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Buy-nance Bandits
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            A cutting-edge crypto trading platform with advanced administrative tools 
            for managing users, strategies, and system operations.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-8 h-8 text-blue-400" />
                  <CardTitle className="text-2xl text-white">Our Mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-300 text-lg leading-relaxed">
                  To provide secure, scalable, and intelligent crypto trading solutions 
                  with comprehensive administrative oversight for institutional-grade management.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-8 h-8 text-green-400" />
                  <CardTitle className="text-2xl text-white">Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-300 text-lg leading-relaxed">
                  To become the premier platform for automated crypto trading with 
                  unparalleled administrative control and security features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Core Values</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center">
              <CardHeader className="p-0 mb-4">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Security</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Advanced security measures protect user assets and platform integrity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center">
              <CardHeader className="p-0 mb-4">
                <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Lightning-fast execution and real-time monitoring capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center">
              <CardHeader className="p-0 mb-4">
                <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Management</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Comprehensive user and system management tools for administrators.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center">
              <CardHeader className="p-0 mb-4">
                <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Excellence</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Commitment to delivering exceptional trading and management experiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
