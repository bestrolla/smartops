import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { smartopsColorClasses } from '@/lib/smartops-colors'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Briefcase,
  Package,
  ShoppingCart,
  Boxes,
  Store,
  Wrench,
  Bell,
  User,
  LogIn,
  UserPlus,
  ExternalLink,
  LogOut,
  Tag,
  Building2,
  ChevronDown,
  ChevronRight,
  Bot,
  UserCheck,
  ClipboardList,
  CreditCard
} from 'lucide-react'

interface MenuItem {
  title: string;
  href?: string;
  icon: any;
  submenu?: MenuItem[];
}

const sidebarItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mi Perfil',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Automatización',
    icon: Bot,
    submenu: [
      {
        title: 'Mis workflows',
        href: '/automation',
        icon: Bot,
      },
      {
        title: 'Templates',
        href: '/templates',
        icon: Package,
      },
    ],
  },
  {
    title: 'Configuración NFC',
    href: '/nfc-settings',
    icon: CreditCard,
  },
  {
    title: 'Tienda',
    icon: Store,
    submenu: [
      {
        title: 'Productos',
        href: '/products',
        icon: Package,
      },
      {
        title: 'Categorías',
        href: '/categories',
        icon: Tag,
      },
      {
        title: 'Inventarios',
        href: '/inventory',
        icon: Boxes,
      },
      {
        title: 'Órdenes',
        href: '/orders',
        icon: ClipboardList,
      },
    ],
  },
  {
    title: 'Servicios',
    icon: Wrench,
    submenu: [
      {
        title: 'Inicio',
        href: '/services',
        icon: Wrench,
      },
      {
        title: 'Profesionales',
        href: '/professionals',
        icon: UserCheck,
      },
      {
        title: 'Citas',
        href: '/appointments',
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: 'CRM',
    href: '/crm',
    icon: Users,
  },
  {
    title: 'Configuración',
    href: '/tenant-settings',
    icon: Building2,
  },
]

const accountPages = [
  {
    title: 'Perfil',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Iniciar Sesión',
    href: '/sign-in',
    icon: LogIn,
  },
  {
    title: 'Registrarse',
    href: '/sign-up',
    icon: UserPlus,
  },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const toggleMenu = (menuTitle: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuTitle]: !prev[menuTitle]
    }))
  }

  const isMenuOpen = (menuTitle: string) => openMenus[menuTitle] || false

  const isActiveRoute = (href: string) => location.pathname === href

  const hasActiveSubmenu = (submenu: MenuItem[]) => {
    return submenu.some(item => item.href && isActiveRoute(item.href))
  }

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isOpen = isMenuOpen(item.title)
    const isActive = item.href ? isActiveRoute(item.href) : false
    const hasActiveChild = hasSubmenu ? hasActiveSubmenu(item.submenu!) : false

    if (hasSubmenu) {
      return (
        <div key={item.title} className="space-y-1">
          {/* Menú padre con submenús */}
          <button
            onClick={() => toggleMenu(item.title)}
            className={cn(
              'w-full flex items-center justify-between px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-montserrat',
              hasActiveChild
                ? 'bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white shadow-lg'
                : 'text-gray-200 hover:bg-gradient-to-r hover:from-green-700 hover:to-blue-700 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform duration-200" />
            )}
          </button>

          {/* Submenús */}
          <div className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="pl-4 space-y-1 border-l border-gray-600 ml-7">
              {item.submenu!.map((subItem) => (
                <Link
                  key={subItem.title}
                  to={subItem.href!}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 font-montserrat',
                    isActiveRoute(subItem.href!)
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gradient-to-r hover:from-green-600 hover:to-blue-600 hover:text-white hover:shadow-sm'
                  )}
                >
                  <subItem.icon className="w-4 h-4" />
                  <span>{subItem.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Menú simple sin submenús
    return (
      <Link
        key={item.title}
        to={item.href!}
        className={cn(
          'flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-montserrat',
          isActive
            ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
            : 'text-gray-200 hover:bg-gradient-to-r hover:from-green-700 hover:to-blue-700 hover:text-white'
        )}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.title}</span>
      </Link>
    )
  }

  return (
    <div className="fixed left-6 top-6 bottom-6 z-30 flex flex-col">
      <div className={cn(
        "w-64 h-full flex flex-col rounded-3xl shadow-2xl bg-gradient-to-br from-[#23272f] via-[#23272f] to-[#1a1d23] border border-[#23272f]",
        "py-8 px-4"
      )}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <img src="/images/logo-dark.png" alt="SmartOps Logo" className="w-36 h-12 object-contain mb-2" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {sidebarItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* Footer: Cerrar sesión */}
        <div className="mt-auto pt-8 flex flex-col gap-2 border-t border-gray-600">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-pink-600 hover:text-white transition-all duration-200 font-montserrat"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}
