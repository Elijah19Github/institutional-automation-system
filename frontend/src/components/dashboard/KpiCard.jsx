import React from 'react';

const KpiCard = ({ title, value, icon, color, trend, trendValue, loading, onClick }) => {
  const colorMap = {
    primary: 'bg-primary/20 text-primary border-primary/50',
    secondary: 'bg-secondary/20 text-secondary border-secondary/50',
    accent: 'bg-accent/20 text-accent border-accent/50',
    success: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50',
    danger: 'bg-rose-500/20 text-rose-500 border-rose-500/50',
    warning: 'bg-amber-500/20 text-amber-500 border-amber-500/50',
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div 
      onClick={onClick}
      className={`bg-surface/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-2xl transition-all duration-300 group relative overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:bg-surface/80 active:scale-[0.98]' : 'hover:scale-[1.01]'}`}
    >
      {/* Decorative background glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-colors`}></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-textSecondary text-sm font-medium tracking-wide uppercase">{title}</p>
          {loading ? (
            <div className="h-10 w-24 bg-secondary/50 animate-pulse rounded-lg mt-2"></div>
          ) : (
            <h3 className="text-4xl font-extrabold text-textPrimary mt-1 tabular-nums">
              {value}
            </h3>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl ${selectedColor.split(' ')[0]} ${selectedColor.split(' ')[1]} flex items-center justify-center text-3xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
          {icon}
        </div>
      </div>

      {trend && !loading && (
        <div className={`mt-4 flex items-center text-sm font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'} animate-fade-in`}>
          <span className="mr-1">{trend === 'up' ? '↑' : '↓'}</span>
          <span>{trendValue}</span>
          <span className="ml-2 text-textSecondary font-normal">vs last month</span>
        </div>
      )}

      {/* Interactive Tooltip Hint */}
      {onClick && (
        <div className="absolute bottom-2 right-4 text-[10px] text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view details
        </div>
      )}
    </div>
  );
};

export default KpiCard;
