import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Quote,
  Save,
  X
} from 'lucide-react';
import { Testimonial, getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/testimonialsApi';

interface TestimonialsEditorProps {
  onTestimonialsChange?: (testimonials: Testimonial[]) => void;
}

export function TestimonialsEditor({ onTestimonialsChange }: TestimonialsEditorProps) {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Testimonial, '_id'>>({
    name: '',
    role: '',
    content: [],
    rating: 5,
    avatar: ''
  });



  useEffect(() => {
    if (auth.tenantId) {
      loadTestimonials();
    }
  }, [auth.tenantId]);

  const loadTestimonials = async () => {
    if (!auth.tenantId) return;
    
    setLoading(true);
    try {
      const response = await getTestimonials(auth.tenantId);
      if (response.success) {
        setTestimonials(response.data || []);
        if (onTestimonialsChange) {
          onTestimonialsChange(response.data || []);
        }
      } else {
        // Si no hay testimonios, inicializar con array vacío
        setTestimonials([]);
        if (onTestimonialsChange) {
          onTestimonialsChange([]);
        }
        console.log('No hay testimonios guardados o error al cargar:', response.message);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      // En caso de error, inicializar con array vacío
      setTestimonials([]);
      if (onTestimonialsChange) {
        onTestimonialsChange([]);
      }
      // No mostrar toast de error para evitar spam
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.tenantId) return;

    if (!formData.name || !formData.role || !formData.content) {
      toast.error('❌ Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (editingIndex !== null) {
        // Actualizar testimonio existente
        const testimonialId = testimonials[editingIndex]._id;
        if (!testimonialId) {
          toast.error('❌ ID de testimonio no válido');
          return;
        }
        response = await updateTestimonial(auth.tenantId, testimonialId, formData);
      } else {
        // Crear nuevo testimonio
        response = await addTestimonial(auth.tenantId, formData);
      }

      if (response.success) {
        toast.success('✅ Testimonio guardado exitosamente');
        await loadTestimonials();
        setShowForm(false);
        setEditingIndex(null);
        resetForm();
      } else {
        toast.error(`❌ ${response.message || 'Error al guardar testimonio'}`);
      }
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = (index: number) => {
    const testimonial = testimonials[index];
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      content: Array.isArray(testimonial.content) 
        ? testimonial.content.length > 0 ? testimonial.content : ['']
        : [testimonial.content || ''],
      rating: testimonial.rating,
      avatar: testimonial.avatar || ''
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = async (index: number) => {
    if (!auth.tenantId) return;

    const testimonial = testimonials[index];
    if (!testimonial._id) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este testimonio?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteTestimonial(auth.tenantId, testimonial._id);
      if (response.success) {
        toast.success('🗑️ Testimonio eliminado exitosamente');
        await loadTestimonials();
      } else {
        toast.error(`❌ ${response.message || 'Error al eliminar testimonio'}`);
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      content: [''],
      rating: 5,
      avatar: ''
    });
  };

  const handleAddNew = () => {
    resetForm();
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndex(null);
    resetForm();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Testimonios</h3>
          <Badge variant="secondary">{testimonials.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Testimonio
          </Button>
        </div>
      </div>



      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingIndex !== null ? 'Editar Testimonio' : 'Nuevo Testimonio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="role">Cargo/Rol *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="CEO, Director, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">Testimonio *</Label>
              <Textarea
                id="content"
                value={Array.isArray(formData.content) ? formData.content[0] || '' : formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: [e.target.value] })}
                placeholder="Escribe el testimonio del cliente..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="rating">Calificación</Label>
              <div className="flex items-center gap-2 mt-2">
                {renderStars(formData.rating)}
                <span className="text-sm text-gray-600 ml-2">
                  {formData.rating}/5
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, rating })}
                    className={`p-1 ${formData.rating === rating ? 'bg-blue-100' : ''}`}
                  >
                    <Star className={`w-4 h-4 ${rating <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="avatar">URL de Avatar (opcional)</Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://ejemplo.com/avatar.jpg"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de testimonios */}
      <div className="space-y-4">
        {loading && testimonials.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando testimonios...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Quote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay testimonios aún</p>
              <p className="text-sm text-gray-400">Agrega testimonios para mostrar la confianza de tus clientes</p>
            </CardContent>
          </Card>
        ) : (
          testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                        <p className="text-xs text-gray-500">{testimonial.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">
                      "{Array.isArray(testimonial.content) ? testimonial.content[0] || '' : testimonial.content || ''}"
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}