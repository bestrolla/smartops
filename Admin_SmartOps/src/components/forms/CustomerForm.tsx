import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { createCustomer, updateCustomer, type Customer } from '../../lib/crmApi';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    status: 'lead' as Customer['status']
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
        company: customer.company || '',
        notes: customer.notes || '',
        status: customer.status
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer) {
        await updateCustomer(customer._id, formData);
      } else {
        await createCustomer(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error al guardar el cliente. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-smartops-white border-smartops-gray shadow-md">
      <CardHeader>
        <CardTitle className="text-smartops-dark text-xl font-semibold font-montserrat">
          {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-smartops-dark font-montserrat">
                Nombre *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="Ej. Juan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-smartops-dark font-montserrat">
                Apellido *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="Ej. Pérez"
              />
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-smartops-dark font-montserrat">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-smartops-dark font-montserrat">
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="+34 600 123 456"
              />
            </div>
          </div>

          {/* Empresa y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-smartops-dark font-montserrat">
                Empresa
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                placeholder="Nombre de la empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-smartops-dark font-montserrat">
                Estado *
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value as Customer['status'])}>
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  <SelectItem value="lead" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Lead
                  </SelectItem>
                  <SelectItem value="prospect" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Prospecto
                  </SelectItem>
                  <SelectItem value="customer" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Cliente
                  </SelectItem>
                  <SelectItem value="inactive" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                    Inactivo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              placeholder="Información adicional sobre el cliente..."
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
              {loading ? 'Guardando...' : customer ? 'Actualizar' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 