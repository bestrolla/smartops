import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Phone,
  Mail,
  Loader2,
  Save,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPhoneNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface Contact {
  phones: Array<{
    phone: string;
    type: 'mobile' | 'landline' | 'whatsapp' | 'other';
    label?: string;
  }>;
  emails: Array<{
    email: string;
    type: 'personal' | 'business' | 'other';
    label?: string;
  }>;
  website: string;
}

interface Props {
  initialContact: Contact;
  onSave: (updated: Contact) => Promise<void>;
  redirectOnSave?: boolean;
}

export function ProfileContactEditor({
  initialContact,
  onSave,
  redirectOnSave = true,
}: Props) {
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact>(initialContact);
  const [currentPhone, setCurrentPhone] = useState<{ type: 'mobile' | 'landline' | 'whatsapp' | 'other'; phone: string }>({ type: 'mobile', phone: '' });
  const [currentEmail, setCurrentEmail] = useState<{ type: 'personal' | 'business' | 'other'; email: string }>({ type: 'personal', email: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Validaciones
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  // Normalizar URL (acepta con o sin protocolo)
  const normalizeUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('www.')) return `https://${url}`;
    if (url.includes('.')) return `https://${url}`;
    return url; // deja strings tipo "tel:" o "mailto:" tal cual si aparecen
  };

  // Sanea el payload para que coincida con el esquema del backend
  const buildSanitizedPayload = (): Contact => {
    const phones = (contact.phones || [])
      .filter(p => p && p.phone && validatePhone(p.phone))
      .map(p => ({
        phone: formatPhoneNumber(p.phone),
        type: p.type,
        label: p.label?.trim() || undefined
      }));

    const emails = (contact.emails || [])
      .filter(e => e && e.email && validateEmail(e.email))
      .map(e => ({
        email: e.email.trim(),
        type: e.type,
        label: e.label?.trim() || undefined
      }));

    return {
      phones,
      emails,
      website: normalizeUrl(contact.website || '')
    };
  };

  useEffect(() => {
    setHasChanges(JSON.stringify(contact) !== JSON.stringify(initialContact));
  }, [contact, initialContact]);

  // Teléfonos
  const addPhone = () => {
    if (validatePhone(currentPhone.phone)) {
      setContact({
        ...contact,
        phones: [...contact.phones, { ...currentPhone, phone: formatPhoneNumber(currentPhone.phone) }],
      });
      setCurrentPhone({ type: 'mobile' as 'mobile' | 'landline' | 'whatsapp' | 'other', phone: '' });
      setHasChanges(true);
    } else {
      toast.error('❌ Teléfono inválido');
    }
  };

  const removePhone = (index: number) => {
    setContact({
      ...contact,
      phones: contact.phones.filter((_, i) => i !== index),
    });
  };

  // Emails
  const addEmail = () => {
    if (validateEmail(currentEmail.email)) {
      setContact({
        ...contact,
        emails: [...contact.emails, currentEmail],
      });
      setCurrentEmail({ type: 'personal' as 'personal' | 'business' | 'other', email: '' });
      setHasChanges(true);
    } else {
      toast.error('❌ Email inválido');
    }
  };

  const removeEmail = (index: number) => {
    setContact({
      ...contact,
      emails: contact.emails.filter((_, i) => i !== index),
    });
  };

  // Reset y Guardado
  const handleReset = () => {
    setContact(initialContact);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildSanitizedPayload();
      await onSave(payload);
      setHasChanges(false);
      toast.success('📞 Contacto guardado correctamente');
      if (redirectOnSave) navigate('/profile');
    } catch (err) {
      console.error('Error saving contact info:', err);
      toast.error('❌ Error al guardar contacto');
    } finally {
      setSaving(false);
    }
  };

  const isValid =
    contact.phones.every((p) => validatePhone(p.phone)) &&
    contact.emails.every((e) => validateEmail(e.email));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Contacto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Teléfonos */}
        <div>
          <Label>Teléfonos</Label>
          <div className="flex gap-2 mt-1">
            <select
              className="border rounded p-2 text-sm"
              value={currentPhone.type}
              onChange={(e) => setCurrentPhone({ ...currentPhone, type: e.target.value as 'mobile' | 'landline' | 'whatsapp' | 'other' })}
            >
              <option value="mobile">Móvil</option>
              <option value="landline">Fijo</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Otro</option>
            </select>
            <Input
              value={currentPhone.phone}
              onChange={(e) => setCurrentPhone({ ...currentPhone, phone: e.target.value })}
              placeholder="Ej: +584121234567"
              className="flex-grow"
            />
            <Button
              onClick={addPhone}
              disabled={!validatePhone(currentPhone.phone)}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <ul className="mt-2 space-y-1">
            {contact.phones.map((p, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span>
                  <Phone className="inline w-4 h-4 mr-1" />
                  {p.phone} ({p.type})
                </span>
                <Button variant="ghost" size="icon" onClick={() => removePhone(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Emails */}
        <div>
          <Label>Correos</Label>
          <div className="flex gap-2 mt-1">
            <select
              className="border rounded p-2 text-sm"
              value={currentEmail.type}
              onChange={(e) => setCurrentEmail({ ...currentEmail, type: e.target.value as 'personal' | 'business' | 'other' })}
            >
              <option value="personal">Personal</option>
              <option value="business">Trabajo</option>
              <option value="other">Otro</option>
            </select>
            <Input
              type="email"
              value={currentEmail.email}
              onChange={(e) => setCurrentEmail({ ...currentEmail, email: e.target.value })}
              placeholder="ejemplo@email.com"
              className="flex-grow"
            />
            <Button
              onClick={addEmail}
              disabled={!validateEmail(currentEmail.email)}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <ul className="mt-2 space-y-1">
            {contact.emails.map((e, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span>
                  <Mail className="inline w-4 h-4 mr-1" />
                  {e.email} ({e.type})
                </span>
                <Button variant="ghost" size="icon" onClick={() => removeEmail(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Website */}
        <div>
          <Label>Sitio Web</Label>
          <Input
            type="url"
            value={contact.website || ''}
            onChange={(e) => setContact({ ...contact, website: e.target.value })}
            placeholder="https://tu-sitio-web.com"
            className="mt-1"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges || !isValid}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};