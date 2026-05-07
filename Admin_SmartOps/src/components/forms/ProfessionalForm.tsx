import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Professional, ProfessionalType, createProfessional, updateProfessional, getProfessionalTypes, createProfessionalType } from '@/lib/professionalsApi';
import { toast } from 'react-toastify';
import { Loader2, Plus, Trash2, Info } from 'lucide-react';

interface CustomField {
  key: string;
  value: string;
}

interface ProfessionalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (professional: Professional) => void;
  editingProfessional?: Professional | null;
}

export function ProfessionalForm({ isOpen, onClose, onSave, editingProfessional }: ProfessionalFormProps) {
  // Estados del formulario principal
  const [formData, setFormData] = useState({
    userId: editingProfessional?.userId || '',
    professionalTypeId: editingProfessional?.professionalType || '',
    specialties: editingProfessional?.specialties?.join(', ') || '',
    licenseNumber: editingProfessional?.licenseNumber || '',
    experienceYears: editingProfessional?.experienceYears?.toString() || '',
    isActive: editingProfessional?.isActive ?? true,
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para crear nuevo tipo
  const [newTypeForm, setNewTypeForm] = useState({
    show: false,
    name: '',
    description: '',
    requiresLicense: false,
    creating: false,
  });

  // Cargar tipos de profesionales con useCallback para evitar recreaciones
  const loadProfessionalTypes = useCallback(async () => {
    if (!isOpen) return;
    
    setLoadingTypes(true);
    try {
      const types = await getProfessionalTypes();
      setProfessionalTypes(types);
      setError(null);
    } catch (err: any) {
      console.error('Error al cargar tipos de profesionales:', err);
      setError('Error al cargar tipos de profesionales');
      toast.error('No se pudieron cargar los tipos de profesionales');
    } finally {
      setLoadingTypes(false);
    }
  }, [isOpen]);

  // Efecto para cargar tipos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadProfessionalTypes();
    }
  }, [isOpen, loadProfessionalTypes]);

  // Efecto para resetear el formulario cuando se abre/cierra o cambia el profesional editado
  useEffect(() => {
    if (isOpen) {
      // Resetear formulario principal
      setFormData({
        userId: editingProfessional?.userId || '',
        professionalTypeId: editingProfessional?.professionalType || '',
        specialties: editingProfessional?.specialties?.join(', ') || '',
        licenseNumber: editingProfessional?.licenseNumber || '',
        experienceYears: editingProfessional?.experienceYears?.toString() || '',
        isActive: editingProfessional?.isActive ?? true,
      });

      // Convertir customFields de objeto a array
      const fieldsArray: CustomField[] = [];
      if (editingProfessional?.customFields) {
        Object.entries(editingProfessional.customFields).forEach(([key, value]) => {
          fieldsArray.push({ key, value: String(value) });
        });
      }
      setCustomFields(fieldsArray);
      
      // Resetear formulario de nuevo tipo
      setNewTypeForm({
        show: false,
        name: '',
        description: '',
        requiresLicense: false,
        creating: false,
      });
      
      setError(null);
    }
  }, [isOpen, editingProfessional]);

  // Manejador genérico para campos del formulario
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambio de tipo de profesional
  const handleProfessionalTypeChange = (value: string) => {
    if (value === 'CREATE_NEW') {
      setNewTypeForm(prev => ({ ...prev, show: true }));
      handleInputChange('professionalTypeId', '');
    } else {
      setNewTypeForm(prev => ({ ...prev, show: false }));
      handleInputChange('professionalTypeId', value);
    }
  };

  // Crear nuevo tipo de profesional
  const handleCreateNewType = async () => {
    if (!newTypeForm.name.trim()) {
      setError('El nombre del tipo es obligatorio');
      return;
    }

    setNewTypeForm(prev => ({ ...prev, creating: true }));
    setError(null);

    try {
      const newType = await createProfessionalType({
        name: newTypeForm.name.trim(),
        description: newTypeForm.description.trim() || undefined,
        requiresLicense: newTypeForm.requiresLicense
      });

      // Actualizar la lista de tipos
      setProfessionalTypes(prev => [...prev, newType]);
      
      // Seleccionar el nuevo tipo creado
      handleInputChange('professionalTypeId', newType._id);
      
      // Ocultar el formulario de nuevo tipo
      setNewTypeForm({
        show: false,
        name: '',
        description: '',
        requiresLicense: false,
        creating: false,
      });
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear el tipo de profesional';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setNewTypeForm(prev => ({ ...prev, creating: false }));
    }
  };

  // Cancelar creación de nuevo tipo
  const cancelNewType = () => {
    setNewTypeForm({
      show: false,
      name: '',
      description: '',
      requiresLicense: false,
      creating: false,
    });
    setError(null);
  };

  // Manejar campos personalizados
  const addCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', newValue: string) => {
    setCustomFields(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: newValue } : item)
    );
  };

  // Validar ObjectId
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.userId.trim()) {
      setError('El ID de usuario es obligatorio');
      return false;
    }

    if (!isValidObjectId(formData.userId)) {
      setError('El ID de usuario debe ser un ObjectId válido (24 caracteres hexadecimales)');
      return false;
    }

    if (!formData.professionalTypeId) {
      setError('Debe seleccionar un tipo de profesional');
      return false;
    }

    // Validar campos personalizados
    for (const field of customFields) {
      if (field.key.trim() && !field.value.trim()) {
        setError(`El campo "${field.key}" requiere un valor`);
        return false;
      }
      if (!field.key.trim() && field.value.trim()) {
        setError('Todos los campos personalizados deben tener un nombre');
        return false;
      }
    }

    setError(null);
    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    // Convertir customFields array a objeto
    const customFieldsObject: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.key.trim() && field.value.trim()) {
        customFieldsObject[field.key.trim()] = field.value.trim();
      }
    });

    const professionalData: Partial<Professional> = {
      userId: formData.userId.trim(),
      professionalType: formData.professionalTypeId,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s !== ''),
      licenseNumber: formData.licenseNumber || undefined,
      experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
      isActive: formData.isActive,
      customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : undefined,
    };

    try {
      let savedProfessional: Professional;
      if (editingProfessional) {
        savedProfessional = await updateProfessional(editingProfessional._id, professionalData);
        toast.success('Profesional actualizado correctamente');
      } else {
        savedProfessional = await createProfessional(professionalData);
        toast.success('Profesional creado correctamente');
      }
      onSave(savedProfessional);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar profesional:', err);
      const errorMessage = err.response?.data?.message || 'Error al guardar el profesional';
      
      // Mensaje específico para errores de userId
      if (errorMessage.includes('user') || errorMessage.includes('usuario')) {
        setError(`Error con el usuario: ${errorMessage}. Asegúrate de usar un ID de usuario válido.`);
      } else {
        setError(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Obtener nombre del tipo de profesional seleccionado
  const getSelectedProfessionalTypeName = () => {
    if (!formData.professionalTypeId || !professionalTypes.length) return '';
    const selectedType = professionalTypes.find(type => type._id === formData.professionalTypeId);
    return selectedType?.name || '';
  };

  // Verificar si el formulario está listo para enviar
  const isFormValid = formData.userId && 
                     isValidObjectId(formData.userId) && 
                     formData.professionalTypeId && 
                     !loading && 
                     !loadingTypes;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingProfessional ? 'Editar Profesional' : 'Crear Nuevo Profesional'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 flex items-start">
            <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User ID */}
          <div className="md:col-span-2">
            <Label htmlFor="userId" className="text-sm font-medium">
              ID de Usuario *
              <span className="text-muted-foreground ml-1">(ObjectId válido)</span>
            </Label>
            <Input 
              id="userId" 
              value={formData.userId} 
              onChange={(e) => handleInputChange('userId', e.target.value)} 
              required 
              className="mt-1" 
              placeholder="Ej: 507f1f77bcf86cd799439011"
              pattern="[0-9a-fA-F]{24}"
            />
            {formData.userId && !isValidObjectId(formData.userId) && (
              <p className="text-destructive text-xs mt-1 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                El formato no parece un ObjectId válido
              </p>
            )}
            {editingProfessional?.user && (
              <p className="text-muted-foreground text-xs mt-1">
                Usuario actual: {editingProfessional.user.firstName} {editingProfessional.user.lastName}
              </p>
            )}
          </div>

          {/* Tipo de Profesional */}
          <div className="md:col-span-2">
            <Label htmlFor="professionalType">Tipo de Profesional *</Label>
            <Select 
              value={newTypeForm.show ? 'CREATE_NEW' : formData.professionalTypeId} 
              onValueChange={handleProfessionalTypeChange}
              disabled={loadingTypes}
            >
              <SelectTrigger className="mt-1" id="professionalType">
                {loadingTypes ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando tipos...
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccionar tipo" />
                )}
              </SelectTrigger>
              <SelectContent>
                {professionalTypes.map(type => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                    {type.requiresLicense && ' (Requiere licencia)'}
                  </SelectItem>
                ))}
                <SelectItem value="CREATE_NEW" className="font-medium text-primary">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Crear nuevo tipo...
                </SelectItem>
              </SelectContent>
            </Select>
            
            {editingProfessional && getSelectedProfessionalTypeName() && !newTypeForm.show && (
              <p className="text-muted-foreground text-xs mt-1">
                Tipo actual: {getSelectedProfessionalTypeName()}
              </p>
            )}
            
            {/* Formulario para crear nuevo tipo */}
            {newTypeForm.show && (
              <div className="mt-3 p-4 border rounded-md bg-muted/30">
                <h4 className="font-medium mb-3">Crear Nuevo Tipo de Profesional</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newTypeName" className="text-xs">Nombre del tipo *</Label>
                    <Input 
                      id="newTypeName"
                      value={newTypeForm.name} 
                      onChange={(e) => setNewTypeForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Dentista, Veterinario..."
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newTypeDescription" className="text-xs">Descripción (opcional)</Label>
                    <Input 
                      id="newTypeDescription"
                      value={newTypeForm.description} 
                      onChange={(e) => setNewTypeForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción del tipo de profesional"
                      className="text-sm mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="newTypeRequiresLicense" 
                      checked={newTypeForm.requiresLicense} 
                      onCheckedChange={(checked) => setNewTypeForm(prev => ({ ...prev, requiresLicense: checked }))} 
                    />
                    <Label htmlFor="newTypeRequiresLicense" className="text-sm">
                      Requiere licencia
                    </Label>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      type="button" 
                      onClick={handleCreateNewType}
                      disabled={newTypeForm.creating || !newTypeForm.name.trim()}
                      className="text-sm"
                    >
                      {newTypeForm.creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : 'Crear Tipo'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelNewType}
                      className="text-sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Especialidades */}
          <div>
            <Label htmlFor="specialties">Especialidades (separadas por coma)</Label>
            <Input 
              id="specialties" 
              value={formData.specialties} 
              onChange={(e) => handleInputChange('specialties', e.target.value)} 
              className="mt-1" 
              placeholder="Ej. Cardiología, Pediatría"
            />
          </div>
          
          {/* Número de Licencia */}
          <div>
            <Label htmlFor="licenseNumber">Número de Licencia</Label>
            <Input 
              id="licenseNumber" 
              value={formData.licenseNumber} 
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)} 
              className="mt-1" 
            />
          </div>
          
          {/* Años de Experiencia */}
          <div>
            <Label htmlFor="experienceYears">Años de Experiencia</Label>
            <Input 
              id="experienceYears" 
              type="number" 
              value={formData.experienceYears} 
              onChange={(e) => handleInputChange('experienceYears', e.target.value)} 
              className="mt-1" 
              min="0" 
              max="50"
            />
          </div>
          
          {/* Estado Activo/Inactivo */}
          <div className="flex items-center space-x-2 pt-6">
            <Switch 
              id="isActive" 
              checked={formData.isActive} 
              onCheckedChange={(checked) => handleInputChange('isActive', checked)} 
            />
            <Label htmlFor="isActive">Profesional activo</Label>
          </div>
        </div>

        {/* Campos Personalizados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Campos Personalizados</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addCustomField}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Campo
            </Button>
          </div>
          
          {customFields.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              No hay campos personalizados
            </p>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-md bg-muted/5">
                  <div className="flex-1">
                    <Input
                      placeholder="Nombre del campo"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Valor del campo"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomField(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : editingProfessional ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}