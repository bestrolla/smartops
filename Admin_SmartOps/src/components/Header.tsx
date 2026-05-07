import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Settings,
  Bell,
  User,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from "../lib/AuthContext"
import { getCurrentSubscription, requiresPaymentVerification, getSubscriptionStatus } from '@/lib/subscriptionsApi'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [pendingText, setPendingText] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const sub = await getCurrentSubscription()
        if (requiresPaymentVerification(sub)) {
          const s = getSubscriptionStatus(sub)
          setPendingText(`Tu pago de suscripción está pendiente de verificación. Puedes usar los módulos mientras el admin confirma. Estado: ${s.label}`)
        } else {
          setPendingText(null)
        }
      } catch {
        setPendingText(null)
      }
    })()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <header className="border-b border-smartops-gray px-6 py-4 bg-transparent">
      {pendingText && (
        <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-montserrat">{pendingText}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm">
          <Link to="/" className="text-smartops-dark/60 hover:text-smartops-dark font-montserrat">
            Pages
          </Link>
          <ChevronRight className="w-4 h-4 text-smartops-dark/40" />
          <span className="text-smartops-dark font-medium font-montserrat">Dashboard</span>
        </div>

        {/* Search Bar and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
            <Input
              type="text"
              placeholder="Type here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-64 h-10 bg-smartops-gray border-smartops-gray focus:bg-smartops-white font-montserrat"
            />
          </div>

          {/* Online Builder Link */}
          <Button variant="smartopsOutline" size="sm" className="font-montserrat">
            <ExternalLink className="w-4 h-4 mr-2" />
            Online Builder
          </Button>

          {/* Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Settings */}
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="w-5 h-5 text-smartops-dark/60" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 relative">
                  <Bell className="w-5 h-5 text-smartops-dark/60" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-smartops-blue rounded-full text-xs" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 border-b border-smartops-gray">
                  <h3 className="font-medium text-smartops-dark font-montserrat">Notifications</h3>
                </div>
                <DropdownMenuItem className="flex items-start space-x-3 p-4">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-smartops-blue text-smartops-white">L</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-smartops-dark font-montserrat">New message from Laur</p>
                    <p className="text-xs text-smartops-dark/60 font-montserrat">13 minutes ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start space-x-3 p-4">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-smartops-blue text-smartops-white">T</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-smartops-dark font-montserrat">New album by Travis Scott</p>
                    <p className="text-xs text-smartops-dark/60 font-montserrat">1 day</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start space-x-3 p-4">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-smartops-blue text-smartops-white">💳</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-smartops-dark font-montserrat">Payment successfully completed</p>
                    <p className="text-xs text-smartops-dark/60 font-montserrat">2 days</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Button visible */}
            <Button variant="smartopsSecondary" size="sm" className="ml-2 font-montserrat" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
