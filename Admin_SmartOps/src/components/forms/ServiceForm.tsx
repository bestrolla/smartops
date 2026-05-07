import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Service, ServiceCategory, createService, updateService, getServiceCategories, createServiceCategory } from '@/lib/servicesApi';
import { Professional, getProfessionals } from '@/lib/professionalsApi';

interface CustomField {
  key: string;
  value: string;
}

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  editingService?: Service | null;
}

export function ServiceForm({ isOpen, onClose, onSave, editingService }: ServiceFormProps) {
  const [name, setName] = useState(editingService?.name || '');
  const [description, setDescription] = useState(editingService?.description || '');
  const [categoryId, setCategoryId] = useState(editingService?.categoryId || '');
  const [duration, setDuration] = useState(editingService?.duration?.toString() || '');
  const [price, setPrice] = useState(editingService?.price?.toString() || '');
  const [currency, setCurrency] = useState(editingService?.currency || 'USD');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(editingService?.professionals || []);
  const [requirements, setRequirements] = useState(editingService?.requirements?.join('\n') || '');
  const [isActive, setIsActive] = useState(editingService?.isActive ?? true);
  const [isPackage, setIsPackage] = useState(editingService?.isPackage ?? false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para crear nueva categoría
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingNewCategory, setCreatingNewCategory] = useState(false);

  // Cargar datos necesarios
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    setLoadingData(true);
    try {
      const [categoriesData, professionalsData] = await Promise.all([
        getServiceCategories(),
        getProfessionals({ limit: 100 }) // Obtener más profesionales para el selector
      ]);
      setCategories(categoriesData);
      setProfessionals(professionalsData.professionals);
    } catch (err) {
      console.error('Error al cargar datos del formulario:', err);
      setError('Error al cargar datos del formulario');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(editingService?.name || '');
      setDescription(editingService?.description || '');
      setCategoryId(editingService?.categoryId || '');
      setDuration(editingService?.duration?.toString() || '');
      setPrice(editingService?.price?.toString() || '');
      setCurrency(editingService?.currency || 'USD');
      setSelectedProfessionals(editingService?.professionals || []);
      setRequirements(editingService?.requirements?.join('\n') || '');
      setIsActive(editingService?.isActive ?? true);
      setIsPackage(editingService?.isPackage ?? false);
      
      // Convertir customFields de objeto a array de key-value pairs
      const fieldsArray: CustomField[] = [];
      if (editingService?.customFields) {
        Object.entries(editingService.customFields).forEach(([key, value]) => {
          fieldsArray.push({ key, value: String(value) });
        });
      }
      setCustomFields(fieldsArray);
      
      // Resetear formulario de nueva categoría
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      
      setError(null);
    }
  }, [isOpen, editingService]);

  const handleCategoryChange = (value: string) => {
    if (value === 'CREATE_NEW') {
      setShowNewCategoryForm(true);
      setCategoryId('');
    } else {
      setShowNewCategoryForm(false);
      setCategoryId(value === 'none' ? '' : value);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }

    setCreatingNewCategory(true);
    try {
      const newCategory = await createServiceCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      });

      // Actualizar la lista de categorías
      setCategories(prev => [...prev, newCategory]);
      
      // Seleccionar la nueva categoría creada
      setCategoryId(newCategory._id);
      
      // Ocultar el formulario de nueva categoría
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la categoría');
    } finally {
      setCreatingNewCategory(false);
    }
  };

  const cancelNewCategory = () => {
    setShowNewCategoryForm(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setError(null);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', newValue: string) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = newValue;
    setCustomFields(updatedFields);
  };

  const handleProfessionalToggle = (professionalId: string) => {
    setSelectedProfessionals(prev => 
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Convertir customFields array a objeto
    const customFieldsObject: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.key.trim() && field.value.trim()) {
        customFieldsObject[field.key.trim()] = field.value.trim();
      }
    });

    const serviceData: Partial<Service> = {
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId?.trim() ? categoryId : undefined,  // evita string vacío
      duration: duration ? parseInt(duration) : undefined,
      price: price ? parseFloat(price) : undefined,
      currency,
      professionals: selectedProfessionals.length > 0 ? selectedProfessionals : undefined,
      requirements: requirements.trim()
        ? requirements.split('\n').map(r => r.trim()).filter(r => r !== '')
        : undefined,
      isActive,
      isPackage,
      customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : undefined,
    };
    

    try {
      let savedService: Service;
      if (editingService) {
        savedService = await updateService(editingService._id, serviceData);
      } else {
        savedService = await createService(serviceData);
      }
      onSave(savedService);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}>
      <form onSubmit={handleSubmit} className="space-y-6 p-6 border border-smartops-gray rounded-lg bg-smartops-white shadow-md">
        {error && <div className="text-red-500 text-sm font-montserrat mb-4">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="font-montserrat text-smartops-dark">Nombre del Servicio *</Label>
            <Input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="font-montserrat mt-1" 
              placeholder="Ej. Consulta Médica General"
            />
          </div>
          <div>
            <Label htmlFor="category" className="font-montserrat text-smartops-dark">Categoría</Label>
            <Select value={showNewCategoryForm ? 'CREATE_NEW' : (categoryId || 'none')} onValueChange={handleCategoryChange}>
              <SelectTrigger className="font-montserrat mt-1">
                <SelectValue placeholder={loadingData ? "Cargando categorías..." : "Seleccionar categoría"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
                <SelectItem value="CREATE_NEW" className="text-smartops-blue font-medium">
                  + Crear nueva categoría...
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Formulario para crear nueva categoría */}
            {showNewCategoryForm && (
              <div className="mt-3 p-4 border border-smartops-blue/30 rounded-md bg-smartops-blue/5">
                <h4 className="font-montserrat font-medium text-smartops-dark mb-3">Crear Nueva Categoría</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newCategoryName" className="font-montserrat text-smartops-dark text-sm">Nombre de la categoría *</Label>
                    <Input 
                      id="newCategoryName"
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej. Consultas Médicas, Servicios de Belleza..."
                      className="font-montserrat text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryDescription" className="font-montserrat text-smartops-dark text-sm">Descripción (opcional)</Label>
                    <Input 
                      id="newCategoryDescription"
                      value={newCategoryDescription} 
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Descripción de la categoría"
                      className="font-montserrat text-sm mt-1"
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      type="button" 
                      variant="smartops" 
                      onClick={handleCreateNewCategory}
                      disabled={creatingNewCategory || !newCategoryName.trim()}
                      className="font-montserrat text-sm"
                    >
                      {creatingNewCategory ? 'Creando...' : 'Crear Categoría'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="smartopsOutline" 
                      onClick={cancelNewCategory}
                      className="font-montserrat text-sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="duration" className="font-montserrat text-smartops-dark">Duración (minutos) *</Label>
            <Input 
              id="duration" 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              required 
              min="5" 
              max="1440"
              className="font-montserrat mt-1" 
              placeholder="30"
            />
          </div>
          <div>
            <Label htmlFor="price" className="font-montserrat text-smartops-dark">Precio *</Label>
            <div className="flex space-x-2 mt-1">
              <Input 
                id="price" 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required 
                min="0" 
                step="0.01"
                className="font-montserrat flex-1" 
                placeholder="50.00"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="font-montserrat w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="font-montserrat text-smartops-dark">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-montserrat mt-1 min-h-[80px]"
            placeholder="Descripción detallada del servicio..."
          />
        </div>

        <div>
          <Label className="font-montserrat text-smartops-dark">Profesionales Asignados</Label>
          <div className="mt-2 max-h-40 overflow-y-auto border border-smartops-gray/30 rounded-md p-3">
            {loadingData ? (
              <p className="text-smartops-dark/60 text-sm font-montserrat">Cargando profesionales...</p>
            ) : professionals.length === 0 ? (
              <p className="text-smartops-dark/60 text-sm font-montserrat">No hay profesionales disponibles</p>
            ) : (
              <div className="space-y-2">
                {professionals.map(professional => (
                  <div key={professional._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`prof-${professional._id}`}
                      checked={selectedProfessionals.includes(professional._id)}
                      onChange={() => handleProfessionalToggle(professional._id)}
                      className="rounded border-smartops-gray"
                    />
                    <Label 
                      htmlFor={`prof-${professional._id}`} 
                      className="font-montserrat text-sm text-smartops-dark cursor-pointer"
                    >
                      {professional.user?.firstName} {professional.user?.lastName} - {professional.specialties?.join(', ')}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="requirements" className="font-montserrat text-smartops-dark">Requisitos (uno por línea)</Label>
          <Textarea
            id="requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="font-montserrat mt-1 min-h-[80px]"
            placeholder="Requisito 1&#10;Requisito 2&#10;Requisito 3..."
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive" className="font-montserrat text-smartops-dark">Activo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isPackage" checked={isPackage} onCheckedChange={setIsPackage} />
            <Label htmlFor="isPackage" className="font-montserrat text-smartops-dark">Es un paquete</Label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="font-montserrat text-smartops-dark">Campos Personalizados</Label>
            <Button 
              type="button" 
              variant="smartopsGradient" 
              onClick={addCustomField}
              className="font-montserrat text-sm px-3 py-1"
            >
              + Agregar Campo
            </Button>
          </div>
          
          {customFields.length === 0 ? (
            <p className="text-smartops-dark/60 text-sm font-montserrat italic">
              No hay campos personalizados. Haz clic en "Agregar Campo" para añadir uno.
            </p>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border border-smartops-gray/30 rounded-md bg-smartops-gray/5">
                  <div className="flex-1">
                    <Input
                      placeholder="Nombre del campo"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      className="font-montserrat text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Valor del campo"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      className="font-montserrat text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="smartopsOutline"
                    onClick={() => removeCustomField(index)}
                    className="font-montserrat text-sm px-3 py-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="smartopsOutline" onClick={onClose} className="font-montserrat">
            Cancelar
          </Button>
          <Button type="submit" variant="smartops" disabled={loading || loadingData} className="font-montserrat">
            {loading ? 'Guardando...' : 'Guardar Servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}