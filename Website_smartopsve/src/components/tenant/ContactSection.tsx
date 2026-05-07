import { TenantProfile } from '@/types';
import { MessageCircle, Mail, Phone, Globe } from 'lucide-react';

interface Theme {
  id?: string;
  name?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  layout?: {
    header?: string;
    stats?: string;
    services?: string;
    testimonials?: string;
  };
}

export function ContactSection({ profile, theme }: { profile: TenantProfile; theme?: Theme | null }) {
  const contact = profile.profile?.contact;

  // Helpers y tipos locales para limpieza y claves
  const sanitizeUrl = (url?: string) =>
    typeof url === 'string' ? url.replace(/[`"]/g, '').trim() : '';
  const normalizePhone = (raw?: string) =>
    typeof raw === 'string' ? raw.replace(/[^\d+]/g, '') : '';

  type EmailItem = { email: string; type?: string; _id?: string };
  type PhoneItem = { phone: string; type?: string; _id?: string };
  const getEmailKey = (item: EmailItem, i: number) =>
    item._id ?? (item.email ? `email-${item.email}` : `email-${i}`);
  const getPhoneKey = (item: PhoneItem, i: number) =>
    item._id ?? (item.phone ? `phone-${item.phone}` : `phone-${i}`);

  // Normaliza formato de datos del API sin usar non-null assertion
  const emails: EmailItem[] = Array.isArray(contact?.emails)
    ? (contact?.emails ?? []).map((item: string | EmailItem) =>
        typeof item === 'string' ? { email: item } : item
      )
    : [];
  const phones: PhoneItem[] = Array.isArray(contact?.phones)
    ? (contact?.phones ?? []).map((item: string | PhoneItem) =>
        typeof item === 'string' ? { phone: item } : item
      )
    : [];
  const website = sanitizeUrl(contact?.website);

  const hasContactInfo =
    emails.length > 0 ||
    phones.length > 0 ||
    !!website ||
    !!(contact?.email && contact.email.trim()) ||
    !!(contact?.phone && contact.phone.trim());

  return (
    <div className="px-4 sm:px-6 py-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-gray-700" />
        <h3 className="font-bold text-gray-900 font-montserrat text-sm">
          Contacto
        </h3>
      </div>
      
      {hasContactInfo ? (
        <div className="space-y-2 sm:space-y-3">
          {/* Emails (array del API) */}
          {emails.map((item, i) => (
            <div
              key={getEmailKey(item, i)}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200"
            >
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <a
                href={`mailto:${item.email}`}
                className="text-xs sm:text-sm text-gray-700 break-all hover:text-blue-700 transition-colors"
              >
                {item.email}
              </a>
              {item.type && (
                <span className="ml-auto text-[10px] sm:text-xs text-gray-500">
                  {item.type}
                </span>
              )}
            </div>
          ))}

          {/* Fallback legacy: string único */}
          {typeof contact?.email === 'string' && contact.email.trim() && (
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <a
                href={`mailto:${contact.email.trim()}`}
                className="text-xs sm:text-sm text-gray-700 break-all hover:text-blue-700 transition-colors"
              >
                {contact.email.trim()}
              </a>
            </div>
          )}

          {/* Teléfonos (array del API) */}
          {phones.map((item, i) => (
            <div
              key={getPhoneKey(item, i)}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200"
            >
              <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
              <a
                href={`tel:${normalizePhone(item.phone)}`}
                className="text-xs sm:text-sm text-gray-700 hover:text-green-700 transition-colors"
              >
                {item.phone}
              </a>
              {item.type && (
                <span className="ml-auto text-[10px] sm:text-xs text-gray-500">
                  {item.type}
                </span>
              )}
            </div>
          ))}

          {/* Fallback legacy: string único */}
          {typeof contact?.phone === 'string' && contact.phone.trim() && (
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
              <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
              <a
                href={`tel:${normalizePhone(contact.phone.trim())}`}
                className="text-xs sm:text-sm text-gray-700 hover:text-green-700 transition-colors"
              >
                {contact.phone.trim()}
              </a>
            </div>
          )}

          {/* Sitio web (sanitizado sin backticks/comillas) */}
          {!!website && (
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
              <Globe className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
              >
                {website}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 sm:py-6">
          <div className="text-gray-400 mb-2">
            <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" />
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            No hay información de contacto disponible
          </p>
        </div>
      )}
    </div>
  );
}