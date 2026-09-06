import { getApiUrl } from './config';

const API_BASE_URL = getApiUrl();

// Types
export interface Template {
  _id: string
  name: string
  description: string
  category: 'basic' | 'ai-agent' | 'ecommerce' | 'appointment' | 'support' | 'lead-generation' | 'healthcare' | 'finance'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  n8nWorkflowId: string
  
  aiConfig: {
    enabled: boolean
    model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku'
    systemPrompt: string
    temperature: number
    maxTokens: number
    features: Array<'conversation-memory' | 'sentiment-analysis' | 'intent-recognition' | 'entity-extraction'>
  }
  
  platforms: Array<'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'webchat'>
  
  variables: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
    required: boolean
    defaultValue?: any
    options?: string[]
    description?: string
  }>
  
  features: Array<'ai-powered' | 'multi-platform' | 'appointment-booking' | 'lead-capture' | 'order-processing' | 'customer-support' | 'faq-automation' | 'context-aware' | 'multilingual'>
  
  usage: {
    totalClones: number
    activeInstances: number
    rating: number
    reviews: Array<{
      user: string
      rating: number
      comment: string
      date: string
    }>
  }
  
  preview: {
    thumbnail?: string
    screenshots: string[]
    demoUrl?: string
    videoUrl?: string
  }
  
  tags: string[]
  isPublic: boolean
  isActive: boolean
  createdBy?: string
  version: string
  
  createdAt: string
  updatedAt: string
}

export interface Automation {
  _id: string
  name: string
  description: string
  tenantId: string
  type: 'chatbot' | 'social_media' | 'email' | 'workflow' | 'trigger'
  status: 'active' | 'inactive' | 'draft'
  config: {
    platforms: Array<'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'website'>
    n8nWorkflowId?: string
    n8nWebhookUrl?: string
    defaultResponse?: string
    fallbackResponse?: string
    workingHours?: {
      enabled: boolean
      timezone: string
      schedule: Array<{
        day: string
        startTime: string
        endTime: string
        enabled: boolean
      }>
    }
    socialMediaConfig?: {
      autoResponse: boolean
      responseDelay: number
      maxResponsesPerUser: number
      blacklistedWords: string[]
      whitelistedUsers: string[]
    }
  }
  metrics: {
    totalInteractions: number
    successfulResponses: number
    failedResponses: number
    avgResponseTime: number
    lastExecution?: string
  }
  advanced: {
    retryAttempts: number
    timeout: number
    rateLimiting: {
      enabled: boolean
      maxRequests: number
      windowMs: number
    }
    logging: {
      enabled: boolean
      level: 'error' | 'warn' | 'info' | 'debug'
    }
  }
  createdBy: string
  tags: string[]
  createdAt: string
  updatedAt: string
  
  // Propiedades virtuales calculadas
  isActive: boolean
  platforms: Array<'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'website'>
}

export interface QAFlow {
  _id: string
  automation: string
  userId: string
  platform: string
  conversation: Array<{
    type: 'user' | 'bot'
    message: string
    timestamp: string
    metadata?: Record<string, any>
  }>
  status: 'active' | 'completed' | 'abandoned'
  createdAt: string
  updatedAt: string
}

export interface TemplateCloneInput {
  name: string
  clientConfig?: {
    businessHours?: {
      enabled: boolean
      [key: string]: any // monday, tuesday, etc.
    }
    companyInfo?: {
      name: string
      description: string
    }
    [key: string]: any
  }
  aiConfig?: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt?: string
  }
  variables?: Record<string, any>
  platforms?: Array<'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'webchat'>
  tools?: Array<{
    name: string
    description: string
  }>
}

// API Functions
export const automationApi = {
  // Templates
  async getTemplates(category?: string, search?: string, page = 1, limit = 20): Promise<{ data: Template[], pagination: any }> {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (search) params.append('search', search)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await fetch(`${API_BASE_URL}/automation/templates?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    const response = await fetch(`${API_BASE_URL}/automation/templates/category/${category}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getAITemplates(): Promise<Template[]> {
    const response = await fetch(`${API_BASE_URL}/automation/templates/ai`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getTemplate(id: string): Promise<Template> {
    const response = await fetch(`${API_BASE_URL}/automation/templates/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async cloneTemplate(templateId: string, data: TemplateCloneInput): Promise<Automation> {
    const response = await fetch(`${API_BASE_URL}/automation/templates/${templateId}/clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async addTemplateReview(templateId: string, rating: number, review?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/automation/templates/${templateId}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rating, review })
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
  },

  /**
   * Obtener preview de un template antes de clonar
   */
  getTemplatePreview: async (templateId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/automation/templates/${templateId}/preview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Error getting template preview: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error getting template preview:', error);
      throw error;
    }
  },

  // Automations
  async getAutomations(): Promise<Automation[]> {
    const response = await fetch(`${API_BASE_URL}/automation`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getAutomation(id: string): Promise<Automation> {
    const response = await fetch(`${API_BASE_URL}/automation/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async createAutomation(data: Partial<Automation>): Promise<Automation> {
    const response = await fetch(`${API_BASE_URL}/automation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async updateAutomation(id: string, data: Partial<Automation>): Promise<Automation> {
    const response = await fetch(`${API_BASE_URL}/automation/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async deleteAutomation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/automation/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
  },

  async toggleAutomation(id: string, active?: boolean): Promise<Automation> {
    const response = await fetch(`${API_BASE_URL}/automation/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active })
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getAutomationDashboard() {
    const response = await fetch(`${API_BASE_URL}/automation/dashboard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  // QA Flows
  async getQAFlows(automationId?: string, status?: string, page = 1, limit = 20): Promise<{ flows: QAFlow[], total: number }> {
    const params = new URLSearchParams()
    if (automationId) params.append('automation', automationId)
    if (status) params.append('status', status)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await fetch(`${API_BASE_URL}/automation/qa-flows?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getQAFlow(id: string): Promise<QAFlow> {
    const response = await fetch(`${API_BASE_URL}/automation/qa-flows/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  },

  async getQAFlowStats(automationId?: string) {
    const params = automationId ? `?automation=${automationId}` : ''
    const response = await fetch(`${API_BASE_URL}/automation/qa-flows/stats${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.json()
  }
} 