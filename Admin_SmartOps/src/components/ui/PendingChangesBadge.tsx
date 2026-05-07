import React from 'react';
import { Badge } from '@/components/ui/badge';
import { HardDrive } from 'lucide-react';

interface PendingChangesBadgeProps {
  show: boolean;
}

export function PendingChangesBadge({ show }: PendingChangesBadgeProps) {
  if (!show) return null;

  return (
    <Badge variant="outline" className="text-orange-600 border-orange-600">
      <HardDrive className="w-3 h-3 mr-1" />
      Cambios pendientes
    </Badge>
  );
}
