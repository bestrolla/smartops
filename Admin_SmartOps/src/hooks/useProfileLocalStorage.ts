import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/config';

interface ProfileChange {
  type: 'testimonial' | 'location' | 'contact' | 'colors' | 'general' | 'appointments';
  data: any;
  timestamp: number;
}

interface UseProfileLocalStorageOptions {
  tenantId: string;
  autoSaveInterval?: number; // en milisegundos
}



// Funciones auxiliares
function getChangeDescription(type: ProfileChange['type']): string {
  switch (type) {
    case 'testimonial': return 'Testimonio';
    case 'location': return 'Ubicación';
    case 'contact': return 'Información de contacto';
    case 'colors': return 'Colores del tema';
    case 'general': return 'Información general';
    case 'appointments': return 'Configuración de citas';
    default: return 'Cambio';
  }
}

function getSavedSections(changes: ProfileChange[]): string[] {
  const sections = new Set<string>();
  changes.forEach(change => {
    sections.add(getChangeDescription(change.type));
  });
  return Array.from(sections);
}


export function useProfileLocalStorage(tenantId: string) {
    const DRAFT_KEY = `profile_draft_${tenantId}`;

    function getDraft(): any {
        const raw = localStorage.getItem(DRAFT_KEY);
        try {
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function setDraft(step: string, data: any) {
        const current = getDraft();
        const next = { ...current, [step]: { ...(current[step] || {}), ...data } };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        return next;
    }

    function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
    }

    function buildFinalPayload(): any {
        const draft = getDraft();
        // Consolidar “steps” en un solo payload para PUT final
        return {
            public_name: draft.basic?.public_name,
            title: draft.basic?.title,
            specialty: draft.basic?.specialty,
            bio: draft.basic?.bio,
            profileImage: draft.images?.profileImage,
            contact: draft.contact,
            social_links: draft.social?.links,
            stats: draft.stats,
            testimonials: draft.testimonials,
            location: draft.location,
            profile_sections: draft.sections?.visibility,
            section_order: draft.sections?.order,
            theme: draft.theme, // { primary_color, secondary_color, accent_color, font_family, layout_style }
            custom_fields: draft.custom_fields
        };
    }

    return { getDraft, setDraft, clearDraft, buildFinalPayload };
}