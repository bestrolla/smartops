import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Category, createCategory, updateCategory, getCategories, deleteCategory } from '@/lib/categoryApi';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  editingCategory?: Category | null;
  categories: Category[];
}

export function CategoryForm({ isOpen, onClose, onSave, editingCategory, categories }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategory, setParentCategory] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(editingCategory?.name || '');
    setDescription(editingCategory?.description || '');
    setParentCategory(
      editingCategory?.parentCategory
        ? typeof editingCategory.parentCategory === 'string'
          ? editingCategory.parentCategory
          : editingCategory.parentCategory?._id
        : undefined
    );
    setIsActive(editingCategory?.isActive ?? true);
    setValidationError(null);
    setError(null);
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

  // Función para verificar si algún padre en la jerarquía está inactivo
  const checkInactiveParentInHierarchy = (parentId: string | undefined | null): boolean => {
    if (!parentId) return false;
    
    const parent = categories.find(cat => cat._id === parentId);
    if (!parent) return false;
    
    // Si el padre directo está inactivo
    if (!parent.isActive) return true;
    
    // Verificar recursivamente los padres superiores
    const grandParentId = typeof parent.parentCategory === 'string' 
      ? parent.parentCategory 
      : parent.parentCategory?._id;
    
    return checkInactiveParentInHierarchy(grandParentId);
  };

  const blockedIds = editingCategory ? [editingCategory._id, ...getDescendantIds(editingCategory._id, categories)] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationError(null);
    
    if (!name.trim()) {
      setValidationError('El nombre de la categoría es obligatorio');
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }

    // Validar si estamos intentando activar una categoría con padre inactivo
    if (isActive && parentCategory) {
      const hasInactiveParent = checkInactiveParentInHierarchy(parentCategory);
      if (hasInactiveParent) {
        setValidationError('No se puede activar una categoría mientras su padre está inactivo');
        toast.error('No se puede activar una categoría mientras su padre está inactivo');
        return;
      }
    }

    setLoading(true);

    // Preparar los datos para enviar al servidor
    const categoryData: any = {
      name: name.trim(),
      description: description.trim(),
      isActive,
    };

    // Solo incluir parentCategory si tiene un valor, de lo contrario enviar null
    if (parentCategory) {
      categoryData.parentCategory = parentCategory;
    } else {
      categoryData.parentCategory = null;
    }

    console.log('Enviando datos al servidor:', categoryData);

    try {
      let savedCategory: Category;
      if (editingCategory) {
        // Para actualización, solo enviamos los campos que pueden cambiar
        savedCategory = await updateCategory(editingCategory._id, categoryData);
      } else {
        // Para creación, enviamos todos los datos
        savedCategory = await createCategory(categoryData);
      }
      onSave(savedCategory);
      toast.success('Categoría guardada exitosamente');
      onClose();
    } catch (err: any) {
      console.error('Error detallado:', err);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al guardar la categoría';
      
      if (err.response) {
        // El servidor respondió con un código de error
        if (err.response.status === 400) {
          // Intentar obtener el mensaje de error del servidor
          if (err.response.data && typeof err.response.data === 'object') {
            // Si es un objeto de validación de MongoDB/Mongoose
            if (err.response.data.errors) {
              const firstError = Object.values(err.response.data.errors)[0] as any;
              errorMessage = firstError.message || 'Error de validación en los datos';
            } else {
              errorMessage = err.response.data.message || 'Datos inválidos. Por favor verifica la información.';
            }
          } else {
            errorMessage = err.response.data || 'Datos inválidos. Por favor verifica la información.';
          }
        } else if (err.response.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor intenta más tarde.';
        } else {
          errorMessage = err.response.data?.message || `Error ${err.response.status} al procesar la solicitud`;
        }
      } else if (err.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        // Otro tipo de error
        errorMessage = err.message || 'Error inesperado al guardar la categoría';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en el switch de activo
  const handleActiveChange = (checked: boolean) => {
    if (checked && parentCategory) {
      const hasInactiveParent = checkInactiveParentInHierarchy(parentCategory);
      if (hasInactiveParent) {
        setValidationError('No se puede activar una categoría mientras su padre está inactivo');
        return;
      }
    }
    setValidationError(null);
    setIsActive(checked);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}>
      <div className="overflow-visible">
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-smartops-gray rounded-lg bg-smartops-white shadow-md">
          {(error || validationError) && (
            <div className="text-red-500 text-sm font-montserrat p-3 bg-red-50 rounded-md">
              {error || validationError}
            </div>
          )}

          <div>
            <Label htmlFor="name" className="font-montserrat text-smartops-dark">Nombre *</Label>
            <Input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="font-montserrat mt-1" 
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description" className="font-montserrat text-smartops-dark">Descripción</Label>
            <Input 
              id="description" 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="font-montserrat mt-1" 
              disabled={loading}
            />
          </div>

          <div className="relative z-50">
            <Label htmlFor="parentCategory" className="font-montserrat text-smartops-dark">Categoría Padre</Label>
            <Select 
              value={parentCategory ?? 'no-parent'} 
              onValueChange={(value) => {
                setParentCategory(value === 'no-parent' ? undefined : value);
                setValidationError(null);
              }}
              disabled={loading}
            >
              <SelectTrigger className="font-montserrat mt-1">
                <SelectValue placeholder="Seleccionar categoría padre" />
              </SelectTrigger>

              <SelectContent 
                className="z-[100] max-h-60 overflow-auto bg-white shadow-lg rounded-md border" 
                position="popper"
                style={{ zIndex: 9999 }}
              >
                <SelectItem value="no-parent">Ninguna</SelectItem>
                {categories
                  .filter(cat => !blockedIds.includes(cat._id))
                  .map(cat => (
                    <SelectItem 
                      key={cat._id} 
                      value={cat._id}
                      className={!cat.isActive ? 'text-gray-400' : ''}
                    >
                      {cat.name} {!cat.isActive && "(Inactiva)"}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              checked={isActive} 
              onCheckedChange={handleActiveChange} 
              disabled={loading || (isActive && parentCategory ? checkInactiveParentInHierarchy(parentCategory) : false)}
            />
            <Label htmlFor="isActive" className="font-montserrat text-smartops-dark">
              Activo
            </Label>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="smartopsOutline" 
              onClick={onClose} 
              className="font-montserrat"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="smartops" 
              disabled={loading || (isActive && parentCategory ? checkInactiveParentInHierarchy(parentCategory) : false)} 
              className="font-montserrat"
            >
              {loading ? 'Guardando...' : 'Guardar Categoría'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// Componente principal Categories
export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Filtrar categorías cuando cambie el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      setDeleteLoading(categoryId);
      await deleteCategory(categoryId);
      toast.success('Categoría eliminada exitosamente');
      loadCategories(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      toast.error('Error al eliminar la categoría');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSaveCategory = (savedCategory: Category) => {
    if (editingCategory) {
      // Actualizar categoría existente
      setCategories(prev => 
        prev.map(cat => cat._id === savedCategory._id ? savedCategory : cat)
      );
    } else {
      // Agregar nueva categoría
      setCategories(prev => [...prev, savedCategory]);
    }
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Sin categoría padre';
    const parent = categories.find(cat => cat._id === categoryId);
    return parent ? parent.name : 'Categoría no encontrada';
  };

  const renderCategoriesTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                  Categoría Padre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-montserrat">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 font-montserrat">
                        {category.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 font-montserrat max-w-xs truncate">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-montserrat">
                      {category.parentCategory 
                        ? getCategoryName(
                            typeof category.parentCategory === 'string' 
                              ? category.parentCategory 
                              : category.parentCategory?._id
                          )
                        : 'Sin categoría padre'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-montserrat ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-montserrat">
                    {new Date(category.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="smartopsOutline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="font-montserrat"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="smartopsOutline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category._id)}
                        disabled={deleteLoading === category._id}
                        className="font-montserrat text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteLoading === category._id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-smartops-gray font-montserrat">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-montserrat mb-2">
              Gestión de Categorías
            </h1>
            <p className="text-blue-100 font-montserrat text-lg">
              Administra las categorías de productos y servicios
              {filteredCategories.length > 0 && (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                  {filteredCategories.length} categoría{filteredCategories.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleCreateCategory}
            variant="smartops"
            className="font-montserrat bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-gray w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 font-montserrat"
        />
      </div>

      {/* Categories Table */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-montserrat mb-2">
                {searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas'}
              </h3>
              <p className="text-gray-500 font-montserrat mb-6">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Comienza creando tu primera categoría para organizar tus productos'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleCreateCategory}
                  variant="smartops"
                  className="font-montserrat shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Categoría
                </Button>
              )}
            </div>
          </div>
        ) : (
          renderCategoriesTable()
        )}
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        categories={categories}
      />
    </div>
  );
}