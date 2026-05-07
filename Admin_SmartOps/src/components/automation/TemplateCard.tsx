import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Star,
  Copy,
  Eye,
  MessageSquare,
  Calendar,
  ShoppingCart,
  HeadphonesIcon,
  UserPlus,
  Zap,
  Sparkles,
  Heart,
  DollarSign,
  Users,
  Settings,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import { Template } from '@/lib/automationApi'

interface TemplateCardProps {
  template: Template
  onPreview: (template: Template) => void
  onUseTemplate?: (template: Template) => void
}

const categoryIcons = {
  'basic': MessageSquare,
  'ai-agent': Bot,
  'ecommerce': ShoppingCart,
  'appointment': Calendar,
  'support': HeadphonesIcon,
  'lead-generation': UserPlus,
  'healthcare': Heart,
  'finance': DollarSign
}

const categoryColors = {
  'basic': 'bg-blue-50 text-smartops-blue border-blue-200',
  'ai-agent': 'bg-purple-50 text-purple-600 border-purple-200',
  'ecommerce': 'bg-green-50 text-green-600 border-green-200',
  'appointment': 'bg-orange-50 text-orange-600 border-orange-200',
  'support': 'bg-pink-50 text-pink-600 border-pink-200',
  'lead-generation': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'healthcare': 'bg-red-50 text-red-600 border-red-200',
  'finance': 'bg-emerald-50 text-emerald-600 border-emerald-200'
}

const categoryLabels = {
  'basic': 'Básico',
  'ai-agent': 'IA Avanzada',
  'ecommerce': 'E-commerce',
  'appointment': 'Citas',
  'support': 'Soporte',
  'lead-generation': 'Generación de Leads',
  'healthcare': 'Salud',
  'finance': 'Finanzas'
}

const difficultyColors = {
  'basic': 'bg-green-50 text-green-600 border-green-200',
  'intermediate': 'bg-yellow-50 text-yellow-600 border-yellow-200',
  'advanced': 'bg-red-50 text-red-600 border-red-200'
}

const difficultyLabels = {
  'basic': 'Fácil',
  'intermediate': 'Intermedio',
  'advanced': 'Avanzado'
}

const platformIcons = {
  'whatsapp': '💬',
  'telegram': '✈️',
  'instagram': '📷',
  'facebook': '👥',
  'webchat': '💻'
}

export function TemplateCard({ template, onPreview, onUseTemplate }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const IconComponent = categoryIcons[template.category] || Bot
  const categoryStyle = categoryColors[template.category] || 'bg-smartops-gray/20 text-smartops-dark border-smartops-gray'
  const categoryLabel = categoryLabels[template.category] || template.category
  const difficultyStyle = difficultyColors[template.difficulty] || 'bg-smartops-gray/20 text-smartops-dark border-smartops-gray'
  const difficultyLabel = difficultyLabels[template.difficulty] || template.difficulty

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-smartops-gray/40'
        }`}
      />
    ))
  }

  return (
    <Card 
      className={`group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border border-smartops-gray/20 hover:border-smartops-blue/30 ${
        isHovered ? 'transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header con acento de SmartOps */}
      <div className="h-1 bg-gradient-to-r from-smartops-blue to-smartops-blue-hover" />
      
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Icono principal */}
          <div className={`relative w-12 h-12 rounded-lg ${categoryStyle} flex items-center justify-center border shadow-sm group-hover:shadow-md transition-shadow`}>
            <IconComponent className="w-6 h-6" />
            {template.aiConfig?.enabled && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-smartops-blue rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Título y metadata */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold font-montserrat text-smartops-dark group-hover:text-smartops-blue transition-colors mb-2 leading-tight">
              {template.name}
            </CardTitle>
            
            {/* Badges de categoría y dificultad */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${categoryStyle} font-montserrat`}
              >
                {categoryLabel}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${difficultyStyle} font-montserrat`}
              >
                {difficultyLabel}
              </Badge>
              {template.aiConfig?.enabled && (
                <Badge 
                  className="text-xs font-medium bg-smartops-blue text-white border-0 shadow-sm font-montserrat"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Descripción */}
        <div>
          <p className="text-sm text-smartops-dark/70 font-montserrat leading-relaxed line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Rating */}
        {template.usage.rating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex">
                {renderStars(Math.round(template.usage.rating))}
              </div>
              <span className="text-sm font-medium text-smartops-dark font-montserrat">
                {template.usage.rating.toFixed(1)}
              </span>
              <span className="text-xs text-smartops-dark/60 font-montserrat">
                ({template.usage.reviews.length} reseñas)
              </span>
            </div>
          </div>
        )}

        {/* Características IA (si aplica) */}
        {template.aiConfig?.enabled && (
          <div className="bg-smartops-blue/5 rounded-lg p-3 border border-smartops-blue/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-smartops-blue rounded-md flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-smartops-blue font-montserrat">
                Inteligencia Artificial
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-md p-2">
                <div className="text-xs font-medium text-smartops-dark/60 mb-1 font-montserrat">Modelo</div>
                <div className="text-xs text-smartops-dark font-semibold font-montserrat">{template.aiConfig.model}</div>
              </div>
              <div className="bg-white rounded-md p-2">
                <div className="text-xs font-medium text-smartops-dark/60 mb-1 font-montserrat">Funciones</div>
                <div className="text-xs text-smartops-dark font-semibold font-montserrat">{template.aiConfig.features.length} disponibles</div>
              </div>
            </div>
          </div>
        )}

        {/* Plataformas */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-smartops-dark/60" />
            <span className="text-sm font-medium text-smartops-dark font-montserrat">Plataformas</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {template.platforms.map((platform) => (
              <div 
                key={platform} 
                className="flex items-center gap-1 bg-smartops-gray/10 hover:bg-smartops-gray/20 transition-colors rounded-md px-2 py-1 border border-smartops-gray/30"
              >
                <span className="text-sm">{platformIcons[platform] || '💬'}</span>
                <span className="text-xs font-medium text-smartops-dark capitalize font-montserrat">
                  {platform === 'webchat' ? 'Web' : platform}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-smartops-gray/10 rounded-lg p-3 border border-smartops-gray/20">
            <div className="flex items-center gap-2 mb-1">
              <Copy className="w-4 h-4 text-smartops-blue" />
              <span className="text-xs font-medium text-smartops-dark/70 font-montserrat">Instalaciones</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-smartops-dark font-montserrat">{template.usage.totalClones}</span>
              <TrendingUp className="w-3 h-3 text-green-500" />
            </div>
          </div>
          
          <div className="bg-smartops-gray/10 rounded-lg p-3 border border-smartops-gray/20">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-4 h-4 text-smartops-blue" />
              <span className="text-xs font-medium text-smartops-dark/70 font-montserrat">Variables</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-smartops-dark font-montserrat">{template.variables.length}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2 pt-3">
          <Button
            onClick={() => onUseTemplate ? onUseTemplate(template) : onPreview(template)}
            className="w-full h-11 bg-gradient-to-r from-smartops-blue to-smartops-blue-hover hover:from-smartops-blue-hover hover:to-smartops-blue text-white font-montserrat border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
          >
            <Zap className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Usar Template</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            className="w-full h-10 font-montserrat bg-white border-2 border-smartops-blue/20 text-smartops-blue hover:bg-smartops-blue hover:text-white hover:border-smartops-blue hover:shadow-lg transition-all duration-300 group"
          >
            <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Ver Detalles</span>
          </Button>
        </div>
      </CardContent>

      {/* Efecto de hover sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-smartops-blue/5 to-smartops-blue-hover/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  )
} 