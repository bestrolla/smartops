interface Stat {
  label: string;
  value: string | number;
}

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout: {
    header: string;
    stats: string;
    services: string;
    testimonials: string;
  };
}

interface StatsSectionProps {
  stats: Stat[];
  theme?: Theme | null;
}

export default function StatsSection({ stats, theme }: { stats: Array<{ label: string; value: string }>; theme?: any }) {
  if (!stats || stats.length === 0) return null;

  // Determinar el estilo de las estadísticas basado en el tema
  const getStatsStyle = () => {
    if (!theme) return {
      container: 'px-6 pb-8 bg-white dark:bg-gray-900',
      grid: 'grid grid-cols-2 gap-4',
      statCard: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700',
      value: 'text-2xl font-bold text-gray-900 dark:text-white mb-2',
      label: 'text-sm text-gray-600 dark:text-gray-400 font-medium'
    };

    switch (theme.layout.stats) {
      case 'circles':
        return {
          container: 'px-6 py-8 bg-white dark:bg-gray-800',
          grid: 'grid grid-cols-2 gap-6',
          statCard: 'text-center',
          value: 'w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-gray-800 to-gray-600 dark:from-gray-600 dark:to-gray-400 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-lg',
          label: 'text-sm font-medium text-gray-700 dark:text-gray-300'
        };
      case 'cards':
        return {
          container: 'px-6 py-6 bg-white dark:bg-gray-800',
          grid: 'grid grid-cols-2 gap-4',
          statCard: 'text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800',
          value: 'text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1',
          label: 'text-xs text-blue-700 dark:text-blue-300 font-medium uppercase tracking-wide'
        };
      case 'gradient':
        return {
          container: 'px-6 py-8 bg-white dark:bg-gray-800 relative',
          grid: 'relative grid grid-cols-2 gap-4',
          statCard: 'text-center',
          value: 'w-20 h-20 mx-auto mb-3 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform text-white font-bold text-lg',
          label: 'text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide'
        };
      case 'enhanced':
        return {
          container: 'px-8 py-8 bg-white dark:bg-gray-900',
          grid: 'bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6 grid grid-cols-2 gap-6',
          statCard: 'text-center',
          value: 'text-3xl font-light text-gray-900 dark:text-white mb-2',
          label: 'text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide'
        };
      default:
        return {
          container: 'px-6 pb-8 bg-white dark:bg-gray-900',
          grid: 'grid grid-cols-2 gap-4',
          statCard: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700',
          value: 'text-2xl font-bold text-gray-900 dark:text-white mb-2',
          label: 'text-sm text-gray-600 dark:text-gray-400 font-medium'
        };
    }
  };

  const styles = getStatsStyle();

  // Colores para el tema gradient
  const gradientColors = [
    'from-purple-400 to-pink-400',
    'from-pink-400 to-orange-400',
    'from-orange-400 to-yellow-400',
    'from-purple-500 to-cyan-400'
  ];

  return (
    <div className={styles.container} suppressHydrationWarning>
      {/* Fondo artístico para tema gradient */}
      {theme?.layout.stats === 'gradient' && (
        <div className="absolute inset-0 opacity-5" suppressHydrationWarning>
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" suppressHydrationWarning></div>
        </div>
      )}

      <div className={styles.grid} suppressHydrationWarning>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard} suppressHydrationWarning>
            {theme?.layout.stats === 'circles' ? (
              <>
                <div className="relative" suppressHydrationWarning>
                  <div className={styles.value} suppressHydrationWarning>
                    {stat.value}
                  </div>
                  <div className="absolute -top-1 -left-1 w-22 h-22 border-2 border-gray-200 dark:border-gray-600 rounded-full opacity-50" suppressHydrationWarning></div>
                </div>
                <div className={styles.label} suppressHydrationWarning>
                  {stat.label}
                </div>
              </>
            ) : theme?.layout.stats === 'gradient' ? (
              <>
                <div className={`${styles.value} ${gradientColors[index % gradientColors.length]}`} suppressHydrationWarning>
                  {stat.value}
                </div>
                <div className={styles.label} suppressHydrationWarning>
                  {stat.label}
                </div>
              </>
            ) : (
              <>
                <div className={styles.value} suppressHydrationWarning>
                  {stat.value}
                </div>
                <div className={styles.label} suppressHydrationWarning>
                  {stat.label}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Elementos adicionales según el tema */}
      {theme?.layout.stats === 'cards' && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800" suppressHydrationWarning>
          <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300" suppressHydrationWarning>
            <span className="text-lg">🏆</span>
            <span className="text-sm font-medium">Certificado Profesional</span>
          </div>
        </div>
      )}

      {theme?.layout.stats === 'gradient' && (
        <div className="mt-8 flex justify-center space-x-2" suppressHydrationWarning>
          <div className="w-8 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" suppressHydrationWarning></div>
          <div className="w-8 h-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full" suppressHydrationWarning></div>
          <div className="w-8 h-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" suppressHydrationWarning></div>
          <div className="w-8 h-3 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full" suppressHydrationWarning></div>
          <div className="w-8 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" suppressHydrationWarning></div>
        </div>
      )}

      {theme?.layout.stats === 'enhanced' && (
        <div className="grid grid-cols-2 gap-4 mb-6" suppressHydrationWarning>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800" suppressHydrationWarning>
            <div className="flex items-center space-x-2" suppressHydrationWarning>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs font-medium text-green-700 dark:text-green-300">ACTIVO</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Disponible para nuevos proyectos
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800" suppressHydrationWarning>
            <div className="flex items-center space-x-2" suppressHydrationWarning>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">VERIFICADO</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Perfil profesional certificado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}