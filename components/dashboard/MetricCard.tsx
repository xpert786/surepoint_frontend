import { Card, CardContent } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          {/* {Icon && <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />} */}
          {trend && (
          <div className={`text-sm font-medium flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-base leading-none">↑</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{value}</div>
        {description && !trend && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </Card>
  );
}

