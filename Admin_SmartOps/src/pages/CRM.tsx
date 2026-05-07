import React, { useState, useEffect } from 'react';
import { Users, Target, Calendar, FileText, Tag, BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { CustomersTab } from '../components/crm/CustomersTab';
import { OpportunitiesTab } from '../components/crm/OpportunitiesTab';
import { ActivitiesTab } from '../components/crm/ActivitiesTab';
import { PipelinesTab } from '../components/crm/PipelinesTab';
import { getCrmStats, type Activity as CrmActivity } from '../lib/crmApi';

interface CrmStats {
  totalCustomers: number;
  totalOpportunities: number;
  totalValue: number;
  conversionRate: number;
  customersByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
  recentActivities: CrmActivity[];
}

export default function CRM() {
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getCrmStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading CRM stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-blue-500 text-white';
      case 'prospect':
        return 'bg-yellow-500 text-white';
      case 'customer':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new':
        return 'bg-blue-500 text-white';
      case 'qualified':
        return 'bg-purple-500 text-white';
      case 'proposition':
        return 'bg-orange-500 text-white';
      case 'won':
        return 'bg-green-500 text-white';
      case 'lost':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Users className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold font-montserrat">CRM</h1>
              <p className="text-blue-100 font-montserrat">Gestiona tus clientes, oportunidades y actividades</p>
            </div>
          </div>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-smartops-gray/20 rounded-lg font-montserrat">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-smartops-blue data-[state=active]:to-smartops-purple data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-smartops-blue data-[state=active]:to-smartops-purple data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-smartops-blue data-[state=active]:to-smartops-purple data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Oportunidades
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-smartops-blue data-[state=active]:to-smartops-purple data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Actividades
          </TabsTrigger>
          <TabsTrigger value="pipelines" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-smartops-blue data-[state=active]:to-smartops-purple data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-smartops-dark/60 font-montserrat">
              Cargando estadísticas...
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 font-montserrat">Total Clientes</p>
                        <p className="text-3xl font-bold font-montserrat text-smartops-dark">{stats.totalCustomers}</p>
                      </div>
                      <div className="p-3 rounded-full bg-gradient-to-br from-smartops-blue to-smartops-blue-hover">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-smartops-white border-smartops-gray shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-smartops-dark font-montserrat">
                      Oportunidades
                    </CardTitle>
                    <Target className="h-4 w-4 text-smartops-purple" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-smartops-dark font-montserrat">
                      {stats.totalOpportunities}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-smartops-white border-smartops-gray shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-smartops-dark font-montserrat">
                      Valor Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-smartops-dark font-montserrat">
                      {formatCurrency(stats.totalValue)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-smartops-white border-smartops-gray shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-smartops-dark font-montserrat">
                      Tasa de Conversión
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-smartops-dark font-montserrat">
                      {stats.conversionRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clientes por Estado */}
                <Card className="bg-smartops-white border-smartops-gray shadow-md">
                  <CardHeader>
                    <CardTitle className="text-smartops-dark font-montserrat">Clientes por Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.customersByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(status)}>
                              {status === 'lead' ? 'Lead' : 
                               status === 'prospect' ? 'Prospecto' :
                               status === 'customer' ? 'Cliente' : 'Inactivo'}
                            </Badge>
                          </div>
                          <span className="text-smartops-dark font-medium font-montserrat">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Oportunidades por Etapa */}
                <Card className="bg-smartops-white border-smartops-gray shadow-md">
                  <CardHeader>
                    <CardTitle className="text-smartops-dark font-montserrat">Oportunidades por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.opportunitiesByStage).map(([stage, count]) => (
                        <div key={stage} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStageColor(stage)}>
                              {stage === 'new' ? 'Nuevo' :
                               stage === 'qualified' ? 'Calificado' :
                               stage === 'proposition' ? 'Propuesta' :
                               stage === 'won' ? 'Ganado' : 'Perdido'}
                            </Badge>
                          </div>
                          <span className="text-smartops-dark font-medium font-montserrat">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actividades Recientes */}
              <Card className="bg-smartops-white border-smartops-gray shadow-md">
                <CardHeader>
                  <CardTitle className="text-smartops-dark font-montserrat">Actividades Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentActivities.length === 0 ? (
                    <div className="text-center py-4 text-smartops-dark/60 font-montserrat">
                      No hay actividades recientes
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentActivities.slice(0, 5).map((activity) => (
                        <div key={activity._id} className="flex items-center justify-between p-3 border border-smartops-gray rounded-lg">
                          <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-smartops-blue" />
                            <div>
                              <p className="font-medium text-smartops-dark font-montserrat">{activity.title}</p>
                              <p className="text-sm text-smartops-dark/60 font-montserrat">
                                {activity.type === 'call' ? 'Llamada' :
                                 activity.type === 'meeting' ? 'Reunión' :
                                 activity.type === 'task' ? 'Tarea' :
                                 activity.type === 'email' ? 'Email' : 'Otro'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getPriorityColor(activity.priority)}>
                              {activity.priority === 'high' ? 'Alta' :
                               activity.priority === 'medium' ? 'Media' : 'Baja'}
                            </Badge>
                            <p className="text-xs text-smartops-dark/60 font-montserrat mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-smartops-dark/60 font-montserrat">
              Error al cargar las estadísticas
            </div>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <CustomersTab />
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <OpportunitiesTab />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <ActivitiesTab onDataChange={loadStats} />
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines">
          <PipelinesTab onDataChange={loadStats} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 