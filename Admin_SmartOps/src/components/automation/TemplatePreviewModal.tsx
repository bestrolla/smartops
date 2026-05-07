import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Bot, MessageSquare, Copy } from 'lucide-react';

interface TemplateVariable {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  description?: string;
}

interface TemplatePreviewModalProps {
  template?: {
    name: string;
    description: string;
    platforms: string[];
    variables?: TemplateVariable[];
  };
  isOpen: boolean;
  onClose: () => void;
  onClone: (data: { name: string; clientConfig: Record<string, any> }) => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onClone
}) => {
  const [name, setName] = useState('');
  const [fields, setFields] = useState<Record<string, any>>(() => {
    if (!template?.variables) return {};
    const initial: Record<string, any> = {};
    template.variables.forEach(v => {
      initial[v.name] = v.defaultValue ?? '';
    });
    return initial;
  });

  React.useEffect(() => {
    if (template?.variables) {
      const initial: Record<string, any> = {};
      template.variables.forEach(v => {
        initial[v.name] = v.defaultValue ?? '';
      });
      setFields(initial);
    }
    setName('');
  }, [template, isOpen]);

  const handleFieldChange = (field: string, value: any) => {
    setFields(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = () => {
    if (!name) return; // podrías mostrar un error si quieres
    onClone({
      name,
      clientConfig: fields
    });
  };

  if (!isOpen || !template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-xl shadow-2xl border-2 border-smartops-blue">
        <DialogHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-white font-montserrat text-2xl">
            <Bot className="w-6 h-6" />
            {template.name}
          </DialogTitle>
        </DialogHeader>
        {/* Scrollable content area */}
        <div className="px-6 py-5 bg-white max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-smartops-blue/30 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
          <p className="text-smartops-dark mb-4 font-montserrat text-base leading-relaxed">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-4 h-4 text-smartops-blue" />
            {template.platforms.map((platform) => (
              <Badge key={platform} variant="secondary" className="bg-smartops-blue/10 text-smartops-blue font-montserrat">
                {platform}
              </Badge>
            ))}
          </div>
          <div className="mb-6">
            <label className="block font-semibold mb-1 text-smartops-dark font-montserrat">Nombre del clon <span className="text-red-500">*</span></label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Bot de ventas para Mi Empresa"
              className="mb-2 font-montserrat"
            />
          </div>
          {template.variables && template.variables.length > 0 && (
            <div className="mb-2 space-y-4">
              {template.variables.map(v => (
                <div key={v.name} className="mb-1">
                  <label className="block font-semibold mb-1 text-smartops-dark font-montserrat">
                    {v.label}{v.required && <span className="text-red-500"> *</span>}
                  </label>
                  {v.description && (
                    <div className="text-xs text-smartops-dark/60 mb-1 font-montserrat">{v.description}</div>
                  )}
                  {v.type === 'textarea' ? (
                    <Textarea
                      value={fields[v.name]}
                      onChange={e => handleFieldChange(v.name, e.target.value)}
                      placeholder={v.description || ''}
                      className="font-montserrat"
                    />
                  ) : v.type === 'select' && v.options ? (
                    <Select
                      value={fields[v.name]}
                      onValueChange={val => handleFieldChange(v.name, val)}
                    >
                      <SelectTrigger className="font-montserrat" >
                        <SelectValue placeholder={v.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {v.options.map(opt => (
                          <SelectItem key={opt} value={opt} className="font-montserrat">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={v.type === 'number' ? 'number' : v.type === 'boolean' ? 'checkbox' : 'text'}
                      value={v.type === 'boolean' ? undefined : fields[v.name]}
                      checked={v.type === 'boolean' ? Boolean(fields[v.name]) : undefined}
                      onChange={e => v.type === 'boolean' ? handleFieldChange(v.name, e.target.checked) : handleFieldChange(v.name, e.target.value)}
                      placeholder={v.description || ''}
                      className="font-montserrat"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 bg-smartops-gray/30 border-t border-smartops-gray">
          <Button variant="smartopsOutline" onClick={onClose} className="font-montserrat">
            Cancelar
          </Button>
          <Button variant="smartops" onClick={handleSubmit} className="flex items-center gap-2 font-montserrat">
            <Copy className="w-4 h-4" />
            Crear Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal; 