import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PipelinesTabProps {
  onDataChange?: () => void;
}

export function PipelinesTab({ onDataChange }: PipelinesTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-smartops-dark font-montserrat">
          Gestión de Pipelines
        </h2>
        <Button
          variant="smartopsGradient"
          className="font-montserrat"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pipeline
        </Button>
      </div>

      {/* Contenido placeholder */}
      <Card className="bg-smartops-white border-smartops-gray shadow-md">
        <CardHeader>
          <CardTitle className="text-smartops-dark font-montserrat flex items-center gap-2">
            <FileText className="w-5 h-5 text-smartops-purple" />
            Pipelines de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto text-smartops-gray mb-4" />
            <p className="text-smartops-dark/60 font-montserrat">
              El módulo de pipelines estará disponible próximamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 