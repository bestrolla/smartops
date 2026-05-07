import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { createOpportunity, updateOpportunity, type Opportunity, type Customer } from '../../lib/crmApi';

interface OpportunityFormProps {
  opportunity?: Opportunity;
  customers: Customer[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OpportunityForm({ opportunity, customers, onSuccess, onCancel }: OpportunityFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    description: '',
    stage: 'new' as Opportunity['stage'],
    value: 0,
    currency: 'EUR',
    probability: 0,
    expectedCloseDate: '',
    notes: '',
    status: 'open' as Opportunity['status']
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opportunity) {
      setFormData({
        customerId: typeof opportunity.customerId === 'string' ? opportunity.customerId : opportunity.customerId._id,
        name: opportunity.name,
        description: opportunity.description || '',
        stage: opportunity.stage,
        value: opportunity.value,
        currency: opportunity.currency,
        probability: opportunity.probability,
        expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.split('T')[0] : '',
        notes: opportunity.notes || '',
        status: opportunity.status
      });
    }
  }, [opportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        expectedCloseDate: formData.expectedCloseDate || undefined
      };

      if (opportunity) {
        await updateOpportunity(opportunity._id, submitData);
      } else {
        await createOpportunity(submitData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Error al guardar la oportunidad. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-smartops-white border-smartops-gray shadow-md">
      <CardHeader>
        <CardTitle className="text-smartops-dark text-xl font-semibold font-montserrat">
          {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente y Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId" className="text-smartops-dark font-montserrat">
                Cliente *
              </Label>
              <Select value={formData.customerId} onValueChange={(value) => handleChange('customerId', value)}>
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  {customers.map((customer) => (
                    <SelectItem 
                      key={customer._id} 
                      value={customer._id}
                      className="text-smartops-dark font-montserrat hover:bg-smartops-gray"
                    >
                      {customer.firstName} {customer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-smartops-dark font-montserrat">
                Nombre de la Oportunidad *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="Ej. Venta de software"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-smartops-dark font-montserrat">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
              placeholder="Describe la oportunidad..."
            />
          </div>

          {/* Etapa y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-smartops-dark font-montserrat">
                Etapa *
              </Label>
              <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value as Opportunity['stage'])}>
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Selecciona una etapa" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  <SelectItem value="new" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Nuevo
                  </SelectItem>
                  <SelectItem value="qualified" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Calificado
                  </SelectItem>
                  <SelectItem value="proposition" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Propuesta
                  </SelectItem>
                  <SelectItem value="won" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Ganado
                  </SelectItem>
                  <SelectItem value="lost" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Perdido
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-smartops-dark font-montserrat">
                Estado *
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value as Opportunity['status'])}>
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  <SelectItem value="open" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Abierto
                  </SelectItem>
                  <SelectItem value="closed" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Cerrado
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Cancelado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor y Probabilidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value" className="text-smartops-dark font-montserrat">
                Valor (€) *
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                required
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability" className="text-smartops-dark font-montserrat">
                Probabilidad (%)
              </Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleChange('probability', parseInt(e.target.value) || 0)}
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="0"
              />
            </div>
          </div>

          {/* Fecha de Cierre */}
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate" className="text-smartops-dark font-montserrat">
              Fecha Esperada de Cierre
            </Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
              className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-smartops-dark font-montserrat">
              Notas
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="font-montserrat"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-smartops-blue to-smartops-purple text-white hover:from-smartops-blue/90 hover:to-smartops-purple/90 font-montserrat"
            >
              {loading ? 'Guardando...' : opportunity ? 'Actualizar' : 'Crear Oportunidad'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 