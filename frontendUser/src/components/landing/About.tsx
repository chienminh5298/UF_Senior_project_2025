import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Users,
  Target,
  Shield,
  Zap,
  Award,
  TrendingUp,
  Globe,
  Clock
} from 'lucide-react'

export function About() {
  return (
    <div id="about" className="bg-gray-950 text-white">

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8">About Us</h2>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
            <span className="text-white">Revolutionizing</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Crypto Trading
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Buy-nance Bandits is a cutting-edge non-custodial crypto trading platform that empowers traders 
            with AI-powered automation, advanced risk management, and lightning-fast backtesting capabilities.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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
                  To democratize advanced crypto trading by providing retail investors with institutional-grade 
                  tools and strategies. We believe everyone should have access to sophisticated trading technology 
                  that was once exclusive to hedge funds and professional traders.
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
                  To become the world's leading non-custodial trading platform, where security meets innovation. 
                  We envision a future where traders maintain complete control of their assets while leveraging 
                  the power of AI and automation to maximize their returns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Core Values</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors">
              <CardHeader className="p-0 mb-4">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Security First</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Non-custodial architecture ensures your funds remain under your control at all times.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors">
              <CardHeader className="p-0 mb-4">
                <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Innovation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Cutting-edge AI and machine learning algorithms power our trading strategies.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors">
              <CardHeader className="p-0 mb-4">
                <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Building a supportive ecosystem where traders share knowledge and grow together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors">
              <CardHeader className="p-0 mb-4">
                <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-white text-lg">Excellence</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-400 text-sm">
                  Continuous improvement and refinement of our platform and strategies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Advanced Technology</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built with cutting-edge technology for maximum performance and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Algorithms</h3>
              <p className="text-gray-400">
                Machine learning models that adapt to market conditions and optimize trading strategies in real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Lightning-Fast Execution</h3>
              <p className="text-gray-400">
                Sub-second trade execution and backtesting results powered by optimized infrastructure.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Enterprise Security</h3>
              <p className="text-gray-400">
                Bank-grade encryption and security protocols to protect your data and trading strategies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Team</h2>
          <p className="text-xl text-gray-400 mb-12">
            <div className="grid grid-cols-1 gap-4">
              <p>Minh Nguyen — Project Manager; Backend (Bot); DevOps</p>
              <p>Jayden Shelderfer — Full-stack; Database & Prisma; Data infrastructure</p>
              <p>Ethan Cheung — Full-stack; Auth/API; Frontend UI/UX</p>
            </div>
          </p>
          
          <Card className="bg-gray-900/50 border-gray-800 p-8">
            <p className="text-lg text-gray-300 leading-relaxed">
            We are a diverse team from the University of Florida's Computer & Information Science & Engineering department, 
            combining knowledge in quantitative finance, software engineering, and cryptocurrency markets. 
            Driven by a shared passion for innovation, we strive to democratize access to advanced trading tools 
            and empower users to achieve their financial goals with confidence.
            </p>
          </Card>
        </div>
      </section>

    </div>
  )
}
