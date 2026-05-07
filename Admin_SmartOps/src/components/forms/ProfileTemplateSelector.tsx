import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Eye, Palette } from 'lucide-react';

interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  image: string;
  profession: string;
  style: string;
  colors: { primary: string; secondary: string; accent: string };
  preview_url: string;
}

interface ProfileTemplateSelectorProps {
  templates: ProfileTemplate[];
  selectedTemplate: ProfileTemplate | null;
  onTemplateSelect: (template: ProfileTemplate) => void;
}

export function ProfileTemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect
}: ProfileTemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2">
          Elige tu Template de Perfil
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Selecciona el diseño que mejor represente tu profesión y estilo personal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                isSelected 
                  ? 'ring-2 ring-smartops-blue shadow-xl border-smartops-blue' 
                  : 'hover:shadow-lg border-gray-200'
              }`}
              onClick={() => onTemplateSelect(template)}
            >
              <CardHeader className="text-center relative">
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-smartops-blue text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                <div className="mx-auto mb-4 relative">
                  {/* Imagen de perfil */}
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                  />
                  
                  {/* Preview del diseño móvil */}
                  <div 
                    className="mt-4 w-32 h-48 mx-auto rounded-lg shadow-md border-4 border-gray-300 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})`
                    }}
                  >
                    {/* Simulación del header */}
                    <div className="h-16 relative">
                      <div 
                        className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white"
                        style={{
                          backgroundImage: `url(${template.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                    
                    {/* Simulación del contenido */}
                    <div className="p-2 mt-2 text-center">
                      <div className="h-1 bg-white/80 rounded mb-1 mx-2"></div>
                      <div className="h-1 bg-white/60 rounded mb-2 mx-4"></div>
                      
                      {/* Tabs simulados */}
                      <div className="flex justify-around mt-3 mb-2">
                        <div className="w-4 h-1 bg-white/70 rounded"></div>
                        <div className="w-4 h-1 bg-white/70 rounded"></div>
                        <div className="w-4 h-1 bg-white/70 rounded"></div>
                      </div>
                      
                      {/* Contenido simulado */}
                      <div className="space-y-1">
                        <div className="h-1 bg-white/50 rounded mx-3"></div>
                        <div className="h-1 bg-white/50 rounded mx-2"></div>
                        <div className="h-1 bg-white/50 rounded mx-4"></div>
                      </div>
                    </div>
                    
                    {/* Indicador de estilo */}
                    <div className="absolute bottom-2 right-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/50"
                        style={{ backgroundColor: template.colors.accent }}
                      />
                    </div>
                  </div>
                </div>
                
                <CardTitle className="text-lg font-montserrat">
                  {template.name}
                </CardTitle>
                <CardDescription className="font-montserrat">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Información del template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-smartops-dark/70 font-montserrat">Profesión:</span>
                    <Badge variant="outline" className="font-montserrat">
                      {template.profession}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-smartops-dark/70 font-montserrat">Estilo:</span>
                    <span className="text-smartops-dark font-montserrat">
                      {template.style}
                    </span>
                  </div>
                </div>

                {/* Paleta de colores */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-smartops-dark/70" />
                    <span className="text-sm text-smartops-dark/70 font-montserrat">
                      Paleta de colores
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                      style={{ backgroundColor: template.colors.primary }}
                      title="Color primario"
                    />
                    <div
                      className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                      style={{ backgroundColor: template.colors.secondary }}
                      title="Color secundario"
                    />
                    <div
                      className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                      style={{ backgroundColor: template.colors.accent }}
                      title="Color de acento"
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-montserrat"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Abrir preview en nueva ventana/modal
                      window.open(`/profiles${template.preview_url}`, '_blank');
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Vista Previa
                  </Button>
                  
                  <Button
                    size="sm"
                    className={`flex-1 font-montserrat ${
                      isSelected 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-smartops-blue hover:bg-smartops-blue-hover'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplateSelect(template);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Seleccionado
                      </>
                    ) : (
                      'Seleccionar'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje de ayuda */}
      <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-montserrat">
          <strong>💡 Consejo:</strong> Puedes personalizar completamente los colores, contenido y estructura 
          después de seleccionar un template. El template es solo el punto de partida.
        </p>
      </div>
    </div>
  );
}