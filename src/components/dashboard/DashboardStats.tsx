'use client';

import { BarChart3, Link, MousePointer, Globe } from 'lucide-react';

interface StatsProps {
  stats: {
    totalUrls: number;
    totalClicks: number;
    urlsToday: number;
    clicksToday: number;
    monthlyUsage: number;
    monthlyLimit: number;
  };
}

export default function DashboardStats({ stats }: StatsProps) {
  const usagePercentage = stats.monthlyLimit > 0 
    ? (stats.monthlyUsage / stats.monthlyLimit) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total URLs */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total URLs</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalUrls}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Total Clicks */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MousePointer className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Clicks</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalClicks}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* URLs Today */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">URLs Today</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.urlsToday}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Usage */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Monthly Usage</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.monthlyUsage} / {stats.monthlyLimit > 0 ? stats.monthlyLimit : '∞'}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  usagePercentage > 90 ? 'bg-red-500' : 
                  usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
