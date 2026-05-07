import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { 
  Check, 
  X, 
  CreditCard, 
  Users, 
  Package, 
  ShoppingCart, 
  Calendar,
  ClipboardList,
  UserCheck,
  Wrench,
  Globe,
  Loader2,
  Upload,
  FileImage,
  AlertCircle
} from 'lucide-react';
import { Plan, getPlans } from '@/lib/plansApi';
import { changePlan, createSubscriptionWithPayment, Subscription } from '@/lib/subscriptionsApi';

interface PlanChangeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubscription: Subscription) => void;
  currentPlan?: Plan;
  preselectedPlanId?: string; // NUEVO: permitir preselección de plan
}

const featureIcons = {
  appointments: Calendar,
  crm: Users,
  ecommerce: ShoppingCart,
  inventory: Package,
  orders: ClipboardList,
  products: Package,
  professionals: UserCheck,
  services: Wrench,
  customDomain: Globe
};

const featureLabels = {
  appointments: 'Citas',
  crm: 'CRM',
  ecommerce: 'E-commerce',
  inventory: 'Inventario',
  orders: 'Órdenes',
  products: 'Productos',
  professionals: 'Profesionales',
  services: 'Servicios',
  customDomain: 'Dominio Personalizado'
};

export function PlanChangeForm({ isOpen, onClose, onSuccess, currentPlan, preselectedPlanId }: PlanChangeFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans(preselectedPlanId);
      // Reset form state cuando abre el modal
      if (!preselectedPlanId) {
        setSelectedPlan(null);
        setShowPaymentForm(false);
      }
      setPaymentProof(null);
      setError(null);
    }
  }, [isOpen, preselectedPlanId]);

  const loadPlans = async (preselectId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPlans();
      const activePlans = response.plans.filter(plan => plan.isActive);
      setPlans(activePlans);

      // Si tenemos un plan a preseleccionar (p.ej., suscripción pendiente), mostrar el formulario de pago directamente
      if (preselectId) {
        const found = activePlans.find(p => p._id === preselectId);
        if (found) {
          setSelectedPlan(found);
          setShowPaymentForm(true);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar planes:', err);
      let errorMessage = err.response?.data?.message || 'Error al cargar los planes';
      if (process.env.NODE_ENV === 'development') {
        if (err.response?.data) {
          errorMessage += `\n\nDatos del error: ${JSON.stringify(err.response.data, null, 2)}`;
        }
        if (err.stack) {
          errorMessage += `\n\nStack trace: ${err.stack}`;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (plan._id === currentPlan?._id) {
      return; // No hacer nada si es el mismo plan
    }

    setSelectedPlan(plan);
    
    // SIEMPRE mostrar formulario de pago - el backend decidirá qué hacer
    setShowPaymentForm(true);
  };

  const handleFreePlanChange = async (plan: Plan) => {
    setSelecting(true);
    setError(null);
    try {
      const newSubscription = await changePlan(plan._id);
      onSuccess(newSubscription);
      onClose();
    } catch (err: any) {
      console.error('Error al cambiar plan:', err);
      
      let errorMessage = err.response?.data?.message || 'Error al cambiar el plan';
      
      // En desarrollo, agregar información adicional
      if (process.env.NODE_ENV === 'development') {
        if (err.response?.data) {
          errorMessage += `\n\nDatos del error: ${JSON.stringify(err.response.data, null, 2)}`;
        }
        if (err.stack) {
          errorMessage += `\n\nStack trace: ${err.stack}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSelecting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Por favor selecciona una imagen (JPG, PNG, GIF, WebP) o PDF');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 5MB');
        return;
      }
      
      setPaymentProof(file);
      setError(null);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan) {
      setError('Plan no seleccionado');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // SIEMPRE usar el endpoint integrado - el backend decidirá si requiere comprobante
      const formData = new FormData();
      formData.append('planId', selectedPlan._id);
      formData.append('amount', selectedPlan.price.toString());
      formData.append('method', paymentMethod);
      formData.append('type', 'subscription');
      formData.append('currency', selectedPlan.currency || 'USD');
      
      // Solo agregar comprobante si existe
      if (paymentProof) {
        formData.append('proof', paymentProof);
      }
      
      const result = await createSubscriptionWithPayment(formData);
      
      // Mostrar mensaje de éxito
      console.log('Cambio de plan procesado exitosamente:', result);
      
      // Notificar éxito
      onSuccess(result.subscription);
      onClose();
      
    } catch (err: any) {
      console.error('Error completo:', err);
      
      // Mostrar mensaje detallado para debug
      let errorMessage = err.message || 'Error al procesar el cambio de plan';
      
      // En desarrollo, agregar información adicional
      if (process.env.NODE_ENV === 'development') {
        if (err.response?.data) {
          errorMessage += `\n\nDatos del error: ${JSON.stringify(err.response.data, null, 2)}`;
        }
        if (err.stack) {
          errorMessage += `\n\nStack trace: ${err.stack}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const renderFeaturesList = (plan: Plan) => {
    return Object.entries(plan.features).map(([feature, enabled]) => {
      const Icon = featureIcons[feature as keyof typeof featureIcons];
      const label = featureLabels[feature as keyof typeof featureLabels];
      
      return (
        <div key={feature} className="flex items-center gap-3 py-2">
          {enabled ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <X className="w-5 h-5 text-red-400" />
          )}
          <Icon className="w-4 h-4 text-smartops-dark/60" />
          <span className={`font-montserrat text-sm ${enabled ? 'text-smartops-dark' : 'text-smartops-dark/40'}`}>
            {label}
          </span>
        </div>
      );
    });
  };

  const isCurrentPlan = (plan: Plan) => plan._id === currentPlan?._id;

  // Renderizar formulario de pago
  if (showPaymentForm && selectedPlan) {
    return (
      <Modal isOpen={isOpen} onClose={() => {
        setShowPaymentForm(false);
        setSelectedPlan(null);
        setPaymentProof(null);
        setError(null);
      }} title="Confirmar Cambio de Plan" size="lg">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold font-montserrat text-smartops-dark mb-2">
              Plan Seleccionado: {selectedPlan.name}
            </h3>
            <p className="text-smartops-dark/60 font-montserrat">
              Precio: <span className="font-semibold">${selectedPlan.price} {selectedPlan.currency || 'USD'}/mes</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium font-montserrat text-smartops-dark mb-2">
                Método de Pago
              </label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value as 'transfer' | 'cash')}
                className="w-full px-3 py-2 border border-smartops-gray rounded-lg font-montserrat focus:outline-none focus:ring-2 focus:ring-smartops-blue"
              >
                <option value="transfer">Transferencia Bancaria</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>

                         <div>
               <label className="block text-sm font-medium font-montserrat text-smartops-dark mb-2">
                 Comprobante de Pago {selectedPlan && currentPlan && selectedPlan.price > currentPlan.price ? <span className="text-red-500">*</span> : <span className="text-gray-500">(Opcional para downgrades)</span>}
               </label>
                             <div className="border-2 border-dashed border-smartops-gray rounded-lg p-6 text-center hover:border-smartops-blue hover:bg-smartops-blue/5 transition-colors duration-200 relative">
                 {paymentProof ? (
                   <div className="flex items-center justify-center space-x-2">
                     <FileImage className="w-8 h-8 text-smartops-blue" />
                     <span className="font-montserrat text-smartops-dark">
                       {paymentProof.name}
                     </span>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => setPaymentProof(null)}
                       className="text-smartops-dark hover:text-red-600"
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                 ) : (
                   <div>
                     <Upload className="w-12 h-12 text-smartops-blue mx-auto mb-2" />
                     <p className="font-montserrat text-smartops-dark mb-2 font-medium">
                       Haz clic para subir tu comprobante de pago
                     </p>
                     <p className="font-montserrat text-sm text-smartops-dark/60">
                       Formatos: JPG, PNG, GIF, WebP, PDF (máx. 5MB)
                     </p>
                   </div>
                 )}
                 <input
                   type="file"
                   accept="image/*,.pdf"
                   onChange={handleFileChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
               </div>
            </div>

                         <div className={`border rounded-lg p-4 ${
               selectedPlan && currentPlan && selectedPlan.price > currentPlan.price 
                 ? 'bg-blue-50 border-blue-200' 
                 : 'bg-green-50 border-green-200'
             }`}>
               <div className="flex items-start space-x-2">
                 {selectedPlan && currentPlan && selectedPlan.price > currentPlan.price ? (
                   <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                 ) : (
                   <Check className="w-5 h-5 text-green-600 mt-0.5" />
                 )}
                 <div>
                   <h4 className={`font-semibold font-montserrat mb-1 ${
                     selectedPlan && currentPlan && selectedPlan.price > currentPlan.price
                       ? 'text-blue-800'
                       : 'text-green-800'
                   }`}>
                     {selectedPlan && currentPlan && selectedPlan.price > currentPlan.price 
                       ? 'Upgrade - Comprobante Requerido'
                       : 'Activación Automática'
                     }
                   </h4>
                   <p className={`font-montserrat text-sm ${
                     selectedPlan && currentPlan && selectedPlan.price > currentPlan.price
                       ? 'text-blue-700'
                       : 'text-green-700'
                   }`}>
                     {selectedPlan && currentPlan && selectedPlan.price > currentPlan.price 
                       ? 'Este es un upgrade que requiere comprobante de pago para activarse.'
                       : 'Tu plan se activará automáticamente. El comprobante es opcional para downgrades.'
                     }
                   </p>
                 </div>
               </div>
             </div>
          </div>

                     {error && (
             <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
               <div className="font-semibold mb-2">Error:</div>
               <pre className="whitespace-pre-wrap text-sm font-mono max-h-60 overflow-y-auto">
                 {error}
               </pre>
             </div>
           )}

                     <div className="flex space-x-3 mt-6">
             <Button
               variant="smartopsOutline"
               onClick={() => {
                 setShowPaymentForm(false);
                 setSelectedPlan(null);
                 setPaymentProof(null);
                 setError(null);
               }}
               disabled={uploading}
               className="font-montserrat"
             >
               Cancelar
             </Button>
             <Button
               variant="smartops"
               onClick={handlePaymentSubmit}
               disabled={uploading || (selectedPlan && currentPlan && selectedPlan.price > currentPlan.price && !paymentProof)}
               className="flex-1 font-montserrat"
             >
               {uploading ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Procesando...
                 </>
               ) : (
                 <>
                   <CreditCard className="w-4 h-4 mr-2" />
                   {selectedPlan && currentPlan && selectedPlan.price > currentPlan.price 
                     ? 'Confirmar Upgrade'
                     : 'Confirmar Cambio de Plan'
                   }
                 </>
               )}
             </Button>
           </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Plan de Suscripción" size="full">
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <div className="font-semibold mb-2">Error:</div>
            <pre className="whitespace-pre-wrap text-sm font-mono max-h-60 overflow-y-auto">
              {error}
            </pre>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-smartops-blue" />
            <span className="ml-3 font-montserrat text-smartops-dark">Cargando planes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan._id} 
                className={`relative shadow-lg border-0 transition-all duration-200 hover:shadow-xl ${
                  isCurrentPlan(plan) ? 'ring-2 ring-smartops-blue' : ''
                }`}
              >
                {isCurrentPlan(plan) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-smartops-blue text-white font-montserrat">
                      Plan Actual
                    </Badge>
                  </div>
                )}

                <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
                  <CardTitle className="flex items-center justify-between font-montserrat">
                    <span>{plan.name}</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${plan.price}
                      </div>
                      <div className="text-sm opacity-90">
                        /{plan.currency === 'USD' ? 'mes' : plan.currency}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                  <p className="text-smartops-dark/80 font-montserrat mb-6 text-sm">
                    {plan.description || 'Plan completo para tu negocio'}
                  </p>

                  <div className="space-y-1 mb-6">
                    <h4 className="font-semibold font-montserrat text-smartops-dark mb-3">
                      Características incluidas:
                    </h4>
                    {renderFeaturesList(plan)}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={selecting || isCurrentPlan(plan)}
                    variant={isCurrentPlan(plan) ? "smartopsSecondary" : "smartops"}
                    className={`w-full font-montserrat ${
                      isCurrentPlan(plan) ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                  >
                    {selecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : isCurrentPlan(plan) ? (
                      'Plan Actual'
                    ) : plan.price === 0 ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Seleccionar Plan Gratuito
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Seleccionar Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold font-montserrat text-smartops-dark mb-2">
            💡 Información importante:
          </h4>
          <ul className="text-sm font-montserrat text-smartops-dark/80 space-y-1">
            <li>• El cambio de plan será efectivo inmediatamente</li>
            <li>• Las características se activarán automáticamente</li>
            <li>• El período de facturación se ajustará según el nuevo plan</li>
            <li>• Puedes cambiar de plan en cualquier momento</li>
          </ul>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="font-montserrat">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}