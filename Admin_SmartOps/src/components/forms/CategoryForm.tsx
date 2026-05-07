import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Category, createCategory, updateCategory } from '@/lib/categoryApi';
import { toast } from 'react-toastify';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  editingCategory?: Category | null;
  categories?: Category[];
}

export function CategoryForm({ isOpen, onClose, onSave, editingCategory, categories }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategory, setParentCategory] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(editingCategory?.name || '');
    setDescription(editingCategory?.description || '');
    setParentCategory(
      editingCategory?.parentCategory
        ? typeof editingCategory.parentCategory === 'string'
          ? editingCategory.parentCategory
          : editingCategory.parentCategory._id
        : undefined
    );
    setIsActive(editingCategory?.isActive ?? true);
  }, [isOpen, editingCategory]);

  const getDescendantIds = (categoryId: string, allCats: Category[]): string[] => {
    let descendants: string[] = [];
    const children = allCats.filter(cat =>
      (typeof cat.parentCategory === 'string' ? cat.parentCategory : cat.parentCategory?._id) === categoryId
    );
    children.forEach(child => {
      descendants.push(child._id);
      descendants = descendants.concat(getDescendantIds(child._id, allCats));
    });
    return descendants;
  };

  const blockedIds = editingCategory ? [editingCategory._id, ...getDescendantIds(editingCategory._id, categories || [])] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validaciones frontend
    if (!name.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }
  
    // Validación: no activar si el padre está inactivo
    if (parentCategory && isActive && categories) {
      const parent = categories.find(cat => cat._id === parentCategory);
      if (parent && !parent.isActive) {
        toast.error('No se puede activar una categoría mientras su padre está inactivo');
        return;
      }
    }
  
    setLoading(true);
    setError(null);
  
    // Construir datos a enviar
    const categoryData: Partial<Category> = {
      name: name.trim(),
      description: description?.trim() || '',
      isActive,
    };
  
    // Solo enviar parentCategory si es creación
    if (!editingCategory && parentCategory) {
      categoryData.parentCategory = parentCategory;
    }
  
    console.log('Datos enviados:', categoryData);
  
    try {
      let savedCategory: Category;
  
      if (editingCategory) {
        // Actualizar categoría (sin parentCategory)
        savedCategory = await updateCategory(editingCategory._id, categoryData);
      } else {
        // Crear nueva categoría (con parentCategory si existe)
        savedCategory = await createCategory(categoryData);
      }
  
      onSave(savedCategory);
      toast.success('Categoría guardada exitosamente');
      onClose();
    } catch (err: any) {
      console.error('Error Axios completo:', err);
  
      const status = err.response?.status;
      const data = err.response?.data;
      const message = err.response?.data?.message || err.message || 'Error al guardar la categoría';
  
      setError(message);
  
      toast.error(
        <>
          <div>Error: {message}</div>
          {status && <div>Status: {status}</div>}
          {data && <div>Data: {JSON.stringify(data)}</div>}
        </>,
        { autoClose: 8000 }
      );
    } finally {
      setLoading(false);
    }
  };
  
  
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}>
      <div className="overflow-visible">
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-smartops-gray rounded-lg bg-smartops-white shadow-md">
          {error && <div className="text-red-500 text-sm font-montserrat">{error}</div>}

          <div>
            <Label htmlFor="name" className="font-montserrat text-smartops-dark">Nombre *</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="font-montserrat mt-1" />
          </div>

          <div>
            <Label htmlFor="description" className="font-montserrat text-smartops-dark">Descripción</Label>
            <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="font-montserrat mt-1" />
          </div>

          <div className="relative z-50"> {/* Contenedor con z-index relativo */}
            <Label htmlFor="parentCategory" className="font-montserrat text-smartops-dark">Categoría Padre</Label>
            <Select value={parentCategory ?? 'no-parent'} onValueChange={(value) => setParentCategory(value === 'no-parent' ? undefined : value)}>
              <SelectTrigger className="font-montserrat mt-1">
                <SelectValue placeholder="Seleccionar categoría padre" />
              </SelectTrigger>

              <SelectContent 
                className="z-[100] max-h-60 overflow-auto bg-white shadow-lg rounded-md border" 
                position="popper"
                style={{ zIndex: 9999 }} // Estilo inline para forzar z-index alto
              >
                <SelectItem value="no-parent">Ninguna</SelectItem>
                {categories && categories
                  .filter(cat => !blockedIds.includes(cat._id))
                  .map(cat => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive" className="font-montserrat text-smartops-dark">Activo</Label>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="smartopsOutline" onClick={onClose} className="font-montserrat">Cancelar</Button>
            <Button type="submit" variant="smartops" disabled={loading} className="font-montserrat">{loading ? 'Guardando...' : 'Guardar Categoría'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}