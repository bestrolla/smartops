import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Calendar, Users, ShoppingCart, Package, FileText, Settings, Zap, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'react-toastify'
import { getPlans, type Plan } from '@/lib/plansApi'
import api from '@/lib/api'

export function SignUp() {
  const navigate = useNavigate()
  
  // User data
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Tenant data
  const [organizationName, setOrganizationName] = useState('')
  const [domain, setDomain] = useState('')
  
  // Profile data
  const [publicName, setPublicName] = useState('')
  const [bio, setBio] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactWebsite, setContactWebsite] = useState('')
  
  // Form state
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

  // NUEVO: selección de plan o prueba
  const [plans, setPlans] = useState<Plan[]>([])
  const [isTrial, setIsTrial] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  useEffect(() => {
    (async () => {
      try {
        const { plans } = await getPlans({ limit: 50 })
        setPlans(plans.filter(p => p.isActive))
      } catch (e) {
        console.error('Error cargando planes', e)
      }
    })()
  }, [])

  // Module features
  const [features, setFeatures] = useState({
    appointments: false,
    crm: false,
    ecommerce: false,
    inventory: false,
    orders: false,
    products: false,
    professionals: false,
    services: false,
    automation: false,
    nfc: false
  })

  // Validaciones del lado del cliente
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'El nombre es requerido'
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
        break
      case 'lastName':
        if (!value.trim()) return 'El apellido es requerido'
        if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres'
        break
      case 'username':
        if (!value.trim()) return 'El nombre de usuario es requerido'
        if (value.trim().length < 2) return 'El nombre de usuario debe tener al menos 2 caracteres'
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Solo letras, números, guiones y guiones bajos'
        break
      case 'email':
        if (!value.trim()) return 'El email es requerido'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato de email inválido'
        break
      case 'password':
        if (!value.trim()) return 'La contraseña es requerida'
        if (value.length < 6) return 'Mínimo 6 caracteres'
        // Requisito: mayúscula, minúscula, número y carácter especial
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(value)) {
          return 'Debe incluir mayúscula, minúscula, número y un carácter especial'
        }
        break
      case 'organizationName':
        if (!value.trim()) return 'El nombre de la organización es requerido'
        if (value.trim().length < 2) return 'Mínimo 2 caracteres'
        break
      case 'domain':
        if (value.trim() && !/^[a-z0-9-]*$/.test(value)) return 'Solo letras minúsculas, números y guiones'
        break
      case 'contactWebsite':
        if (value.trim() && !/^https?:\/\/.+/.test(value)) return 'Debe comenzar con http:// o https://'
        break
    }
    return ''
  }

  const validateForm = () => {
    const errors: string[] = []
    const newFieldErrors: { [key: string]: string } = {}

    // Mapa seguro de valores del formulario (evita eval)
    const formValues = {
      firstName,
      lastName,
      username,
      email,
      password,
      organizationName
    } as const

    const fields = ['firstName', 'lastName', 'username', 'email', 'password', 'organizationName'] as const
    fields.forEach((field) => {
      const value = formValues[field] ?? ''
      const error = validateField(field, value)
      if (error) {
        errors.push(error)
        newFieldErrors[field] = error
      }
    })

    // Campos opcionales
    const optionalValues = {
      domain,
      contactWebsite
    } as const

    const optionalFields = ['domain', 'contactWebsite'] as const
    optionalFields.forEach((field) => {
      const value = optionalValues[field] ?? ''
      const error = validateField(field, value)
      if (error) {
        newFieldErrors[field] = error
      }
    })

    setFieldErrors(newFieldErrors)
    return errors
  }

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature as keyof typeof prev]
    }))
  }

  // NUEVO: sincroniza features al elegir un plan (si no es prueba)
  useEffect(() => {
    if (!isTrial && selectedPlanId) {
      const plan = plans.find(p => p._id === selectedPlanId)
      if (plan && (plan as any).features) {
        setFeatures(prev => ({
          ...prev,
          ...(plan as any).features
        }))
      }
    }
  }, [isTrial, selectedPlanId, plans])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join('; '))
      return
    }

    if (!agreeTerms) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }
    if (!isTrial && !selectedPlanId) {
      toast.error('Selecciona un plan para continuar')
      return
    }

    setIsLoading(true)

    try {
      const signUpData = {
        username: username.trim(),
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organizationName: organizationName.trim(),
        ...(domain.trim() && { domain: domain.trim() }), // Enviar exactamente uno: trial o planId (según selección)
        ...(isTrial ? { trial: true } : { planId: selectedPlanId }),
        profile: {
          public_name: publicName.trim() || organizationName.trim(),
          bio: bio.trim(),
          contact: {
            email: contactEmail.trim() || email.trim(),
            phone: contactPhone.trim(),
            website: contactWebsite.trim()
          }
        }
      }

      const response = await api.post('/auth/signup', signUpData)
      const result = response.data

      toast.success('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...')

      setTimeout(() => {
        navigate('/sign-in', { 
          state: { message: '¡Registro exitoso! Por favor inicia sesión.' }
        })
      }, 2000)

    } catch (error: any) {
      console.error('Registration error:', error)
      let errorMessage = 'Error en el registro'
      const data = error?.response?.data
      if (data?.message) errorMessage = data.message
      else if (data?.error) errorMessage = data.error
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-smartops-blue to-smartops-blue-hover flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Back to Dashboard Link */}
      <Link
        to="/dashboard"
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-smartops-blue-hover transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium font-montserrat">Volver al Dashboard</span>
      </Link>

      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="SmartOps Logo" className="mx-auto mb-4 w-40 h-14 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">Únete a SmartOps</h1>
          <p className="text-white/80 font-montserrat">Crea tu cuenta y comienza a gestionar tu negocio</p>
        </div>

        {/* Sign Up Card */}
        <Card className="shadow-2xl border border-smartops-gray bg-white/90">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-center text-gray-900 font-montserrat">
              Crear cuenta
            </CardTitle>
            <p className="text-center text-gray-600 mt-2 font-montserrat">
              Configura tu organización y comienza a gestionar tu negocio
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>



            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 font-montserrat">Información del Usuario</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Nombre *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Tu nombre"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value)
                        if (fieldErrors.firstName) {
                          setFieldErrors(prev => ({ ...prev, firstName: '' }))
                        }
                      }}
                      className={`h-12 focus:ring-green-500 ${
                        fieldErrors.firstName 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-300 focus:border-green-500'
                      }`}
                      required
                    />
                    {fieldErrors.firstName && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Apellido *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Tu apellido"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Nombre de usuario *
                    </Label>
                <Input
                      id="username"
                  type="text"
                      placeholder="Elige un nombre de usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Email *
                    </Label>
                <Input
                  id="email"
                  type="email"
                      placeholder="Tu dirección de email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
                  </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-smartops-dark font-montserrat">
                    Contraseña *
                  </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                      placeholder="Tu contraseña (mínimo 8 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  </div>
                </div>
              </div>

              {/* Organization Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 font-montserrat">Información de la Organización</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Nombre de la Organización *
                    </Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Nombre de tu organización"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Dominio (Opcional)
                    </Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="your-domain.smartopsve.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500">Déjalo vacío para usar el dominio por defecto</p>
                  </div>
                </div>
              </div>

              {/* Profile Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 font-montserrat">Perfil Público</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="publicName" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Nombre Público
                    </Label>
                    <Input
                      id="publicName"
                      type="text"
                      placeholder="Nombre para mostrar públicamente"
                      value={publicName}
                      onChange={(e) => setPublicName(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500">Se usará el nombre de la organización si está vacío</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Email de Contacto
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500">Se usará tu email si está vacío</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold text-smartops-dark font-montserrat">
                    Biografía
                  </Label>
                  <Textarea
                    id="bio"
                                          placeholder="Cuéntanos sobre tu organización, servicios o misión..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[100px] border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500">Breve descripción de tu organización (opcional)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Teléfono
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1234567890"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactWebsite" className="text-sm font-semibold text-smartops-dark font-montserrat">
                      Sitio Web
                    </Label>
                    <Input
                      id="contactWebsite"
                      type="url"
                      placeholder="https://example.com"
                      value={contactWebsite}
                      onChange={(e) => setContactWebsite(e.target.value)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* SUSCRIPCIÓN: Prueba o Plan */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">4</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 font-montserrat">Suscripción</h3>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Plan y Prueba</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="subscription_choice"
                            checked={isTrial}
                            onChange={() => { setIsTrial(true); setSelectedPlanId('') }}
                          />
                          <span>Prueba de 7 días</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="subscription_choice"
                            checked={!isTrial}
                            onChange={() => setIsTrial(false)}
                          />
                          <span>Seleccionar un plan</span>
                        </label>
                      </div>

                      {!isTrial && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          {plans.map((plan) => (
                            <div
                              key={plan._id}
                              className={`border rounded p-4 cursor-pointer ${selectedPlanId === plan._id ? 'border-blue-600' : 'border-gray-200'}`}
                              onClick={() => setSelectedPlanId(plan._id)}
                              role="button"
                              aria-label={`Seleccionar plan ${plan.name}`}
                            >
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{plan.name}</h4>
                                <span className="text-sm">
                                  {plan.currency || 'USD'} {plan.price.toFixed(2)}
                                </span>
                              </div>
                              {plan.description && (
                                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                              )}
                              <div className="mt-3">
                                <Label className="text-xs">Incluye</Label>
                                <ul className="text-xs mt-1 grid grid-cols-2 gap-1">
                                  {Object.entries(plan.features)
                                    .filter(([_, enabled]) => !!enabled)
                                    .map(([feat]) => (
                                      <li key={feat} className="text-gray-700">• {feat}</li>
                                    ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                          {plans.length === 0 && (
                            <p className="text-sm text-gray-600">No hay planes activos disponibles.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3 py-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                  required
                  aria-label="Acepto los términos y condiciones"
                />
                <div className="text-sm text-gray-600 font-montserrat">
                  <span>Acepto los{' '}</span>
                  <Link to="/terms" className="text-green-600 hover:text-green-700 font-medium underline">
                    Términos y Condiciones
                  </Link>
                  <span> y la{' '}</span>
                  <Link to="/privacy" className="text-green-600 hover:text-green-700 font-medium underline">
                    Política de Privacidad
                  </Link>
                </div>
              </div>

              {/* Sign Up Button */}
              <div className="pt-4">
              <Button
                type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-lg disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creando tu cuenta...</span>
                    </div>
                  ) : (
                    'Crear Cuenta y Comenzar'
                  )}
              </Button>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-6">
                <span className="text-sm text-gray-600 font-montserrat">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/sign-in"
                    className="text-green-600 hover:text-green-700 font-medium underline"
                  >
                    Inicia sesión aquí
                  </Link>
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-blue-200">
            © 2025, made with ❤️ by{' '}
            <a
              href="https://www.creative-tim.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-200 font-medium"
            >
              Creative Tim
            </a>{' '}
            for a better web.
          </p>
        </div>
      </div>
    </div>
  )
}

const actions = {
  showTerms: () => alert('Términos y condiciones: Aquí se mostrarían los términos completos.'),
  applyDiscount: () => { /* setDiscount not available in this scope */ },
} as const;

function runActionSafe(actionName: keyof typeof actions) {
  const fn = actions[actionName];
  if (fn) fn();
}

// Antes: eval(actionName)
// Ahora: runActionSafe(actionName)