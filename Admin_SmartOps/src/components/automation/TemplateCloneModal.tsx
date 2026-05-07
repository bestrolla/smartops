import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bot, 
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Calendar,
  ShoppingCart,
  HeadphonesIcon,
  UserPlus,
  Sparkles,
  Heart,
  DollarSign
} from 'lucide-react'
import { Template, TemplateCloneInput, automationApi } from '@/lib/automationApi'
import { toast } from 'react-toastify';

interface TemplateCloneModalProps {
  template: Template | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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

const platformLabels = {
  'whatsapp': 'WhatsApp',
  'telegram': 'Telegram',
  'instagram': 'Instagram',
  'facebook': 'Facebook'
}

export function TemplateCloneModal({ template, isOpen, onClose, onSuccess }: TemplateCloneModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<TemplateCloneInput>({
    name: '',
    platforms: []
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: `Mi ${template.name}`,
        platforms: [...template.platforms]
      })
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return

    setIsLoading(true)
    setError(null)

    try {
      await automationApi.cloneTemplate(template._id, formData)
      toast.success('Automatización creada exitosamente');
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al crear la automatización')
      toast.error(err.message || 'Error al crear la automatización');
    } finally {
      setIsLoading(false)
    }
  }

  if (!template) return null

  const IconComponent = categoryIcons[template.category]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-montserrat text-xl">
            <div className="w-12 h-12 rounded-lg bg-smartops-blue/10 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-smartops-blue" />
            </div>
            Configurar Template: {template.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                <Zap className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium font-montserrat">
                  Nombre de la Automatización *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Mi Asistente de Ventas"
                  required
                  className="font-montserrat"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium font-montserrat">
                  Descripción del Template
                </Label>
                <Textarea
                  id="description"
                  value={template.description}
                  readOnly
                  placeholder="Descripción del template..."
                  className="font-montserrat bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600 font-montserrat">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-smartops-gray">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="font-montserrat"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name}
              className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover font-montserrat"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Crear Automatización
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 