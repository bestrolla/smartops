import { TrendingUp, Users, Award, Clock } from 'lucide-react';

interface Stat {
  value: string | number;
  label: string;
}

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

interface StatsSectionProps {
  stats?: Stat[];
  theme?: Theme | null;
}

export function StatsSection({ stats, theme }: StatsSectionProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  // Determinar el estilo de las estadísticas basado en el tema
  const getStatsStyle = () => {
    if (!theme || !theme.layout) return 'bg-white';
    
    switch (theme.layout.stats) {
      case 'gradient':
        return 'bg-gradient-to-r from-indigo-50 to-purple-50';
      case 'cards':
        return 'bg-gray-50';
      default:
        return 'bg-white';
    }
  };

  // Iconos para las estadísticas
  const getStatIcon = (index: number) => {
    const icons = [TrendingUp, Users, Award, Clock];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />;
  };

  return (
    <div className={`py-8 sm:py-12 px-4 sm:px-6 ${getStatsStyle()}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-3 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-center mb-2 sm:mb-3">
                {getStatIcon(index)}
              </div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}