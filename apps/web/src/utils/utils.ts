/**
 * Transforme des ticks (secondes) en format lisible pour l'UI
 * @param ticks nombre de ticks (secondes)
 * @param style 'hh:mm:ss' | 'short' | 'seconds'
 * @returns string formaté
 */
export function formatTicks(ticks: number, style: 'hh:mm:ss' | 'short' | 'seconds' = 'hh:mm:ss'): string {
  const hours = Math.floor(ticks / 3600);
  const minutes = Math.floor((ticks % 3600) / 60);
  const seconds = ticks % 60;
  
  switch (style) {
    case 'hh:mm:ss':
      return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    case 'short':
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    case 'seconds':
      return `${ticks}s`;
  }
}