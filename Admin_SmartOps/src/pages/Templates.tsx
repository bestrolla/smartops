import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TemplateCard } from '@/components/automation/TemplateCard'
import TemplatePreviewModal from '@/components/automation/TemplatePreviewModal';
import WorkflowCreateForm from '@/components/forms/WorkflowCreateForm';
import { 
  Sparkles, 
  Search,
  Filter,
  Plus,
  Bot,
  MessageSquare,
  Calendar,
  ShoppingCart,
  HeadphonesIcon,
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Template, automationApi } from '@/lib/automationApi'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const categoryFilters = [
  { value: 'all', label: 'Todas las Categorías', icon: Filter },
  { value: 'basic', label: 'Básicos', icon: MessageSquare },
  { value: 'ai-agent', label: 'IA Avanzada', icon: Bot },
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { value: 'appointment', label: 'Citas', icon: Calendar },
  { value: 'support', label: 'Soporte', icon: HeadphonesIcon },
  { value: 'lead-generation', label: 'Generación de Leads', icon: UserPlus }
]

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAIOnly, setShowAIOnly] = useState(false)
  
  // Modals
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Estado para el modal de creación de workflow
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowTemplateData, setWorkflowTemplateData] = useState<any>(null);

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [templates, searchQuery, selectedCategory, showAIOnly])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await automationApi.getTemplates()
      setTemplates(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...templates]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // AI filter
    if (showAIOnly) {
      filtered = filtered.filter(template => template.aiConfig?.enabled)
    }

    setFilteredTemplates(filtered)
  }

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleCloneSuccess = () => {
    // Refresh templates or show success message
    fetchTemplates()
  }

  const handleUseTemplate = (template: Template) => {
    setWorkflowTemplateData({
      name: template.name,
      description: template.description,
      type: (template as any).type || 'chatbot', // fallback seguro
      platforms: template.platforms || []
    });
    setIsWorkflowModalOpen(true);
  };

  const getStatsCards = () => {
    const totalTemplates = templates.length
    const aiTemplates = templates.filter(t => t.aiConfig?.enabled).length
    const avgRating =
  templates.length > 0
      ? templates.reduce((acc, t) => acc + (t.usage?.rating || 0), 0) / templates.length
      : 0;

  const totalClones = templates.reduce((acc, t) => acc + (t.usage?.totalClones || 0), 0);


    return [
      {
        title: 'Templates Disponibles',
        value: totalTemplates.toString(),
        icon: Sparkles,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Con IA Avanzada',
        value: aiTemplates.toString(),
        icon: Bot,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Rating Promedio',
        value: avgRating.toFixed(1),
        icon: MessageSquare,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'Total Usos',
        value: totalClones.toString(),
        icon: Calendar,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    ]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-smartops-blue" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-smartops-dark mb-2">Error al cargar templates</h3>
              <p className="text-smartops-dark/60 mb-4">{error}</p>
              <Button onClick={fetchTemplates} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sparkles className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">Templates de Automatización</h1>
                <p className="text-blue-100 font-montserrat">
                  Elige un template y personalízalo para tu negocio en minutos
                </p>
              </div>
            </div>
            <Button 
              className="bg-white text-smartops-blue hover:bg-gray-50 font-montserrat shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Template Personalizado
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStatsCards().map((stat, index) => (
            <Card key={index} className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium font-montserrat text-smartops-dark/70 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold font-montserrat text-smartops-dark">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="font-montserrat text-smartops-dark">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-montserrat"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64 font-montserrat">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryFilters.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="font-montserrat">
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AI Filter */}
              <Button
                variant={showAIOnly ? "default" : "outline"}
                onClick={() => setShowAIOnly(!showAIOnly)}
                className="font-montserrat"
              >
                <Bot className="w-4 h-4 mr-2" />
                Solo IA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              onPreview={handlePreview}
              onUseTemplate={handleUseTemplate}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-smartops-dark/40 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-smartops-dark mb-2 font-montserrat">
              No se encontraron templates
            </h3>
            <p className="text-smartops-dark/60 font-montserrat mb-4">
              Intenta ajustar los filtros o buscar con otros términos
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setShowAIOnly(false)
              }}
              variant="outline"
              className="font-montserrat"
            >
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <TemplatePreviewModal
          template={selectedTemplate ? {
            name: selectedTemplate.name,
            description: selectedTemplate.description,
            platforms: selectedTemplate.platforms || [],
            variables: selectedTemplate.variables || []
          } : undefined}

        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onClone={async (cloneData) => {
          if (selectedTemplate) {
            await automationApi.cloneTemplate(selectedTemplate._id, cloneData);
            setIsPreviewOpen(false);
          }
        }}
      />
      {isWorkflowModalOpen && workflowTemplateData && (
        <WorkflowCreateForm
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
          onSuccess={() => {
            setIsWorkflowModalOpen(false);
            fetchTemplates();
          }}
          templateData={workflowTemplateData}
        />
      )}
    </div>
  )
} 