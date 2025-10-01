'use client';

import { useMemo } from 'react';

interface ChartData {
  date: string;
  clicks: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
  title: string;
  color?: string;
}

export default function AnalyticsChart({ data, title, color = 'blue' }: AnalyticsChartProps) {
  const maxClicks = useMemo(() => {
    return Math.max(...data.map(d => d.clicks), 1);
  }, [data]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full bg-${color}-500 rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group`}
                style={{
                  height: `${(item.clicks / maxClicks) * 100}%`,
                  minHeight: item.clicks > 0 ? '4px' : '0px'
                }}
                title={`${formatDate(item.date)}: ${item.clicks} clicks`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.clicks} clicks
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                {formatDate(item.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Total clicks: {data.reduce((sum, item) => sum + item.clicks, 0)}
      </div>
    </div>
  );
}
