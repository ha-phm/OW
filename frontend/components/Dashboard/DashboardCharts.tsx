'use client';

import { useMemo } from 'react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChartStatsResponse } from '../../hooks/useAdminChartStats';

const formatCardLabel = (code: string) => {
  const map: Record<string, string> = {
    'CARD_TRAINING01': 'TRAVEL',
    'CARD_TRAINING02': 'ECOMMERCE',
    'CARD_TRAINING03': 'VISA',
    'CARD_TRAINING04': 'CREDIT',
  };
  return map[code] || 'OTHER'; 
};

const CATEGORY_COLORS: Record<string, string> = {
  'TRAVEL': '#3b82f6',
  'ECOMMERCE': '#f97316',
  'VISA': '#10b981',
  'CREDIT': '#a855f7',
  'OTHER': '#94a3b8'
};

interface LegendPayloadItem {
  value: string;
  color: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
}

const CustomLegend = ({ payload }: CustomLegendProps) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 mt-2 sm:mt-4 px-2">
      {payload.map((entry: LegendPayloadItem, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-opacity hover:opacity-80">
          <div
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shadow-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs sm:text-[13px] font-bold text-slate-700 tracking-wide truncate">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface DashboardChartsProps {
  data?: ChartStatsResponse;
  isLoading: boolean;
}

export function DashboardCharts({ data, isLoading }: DashboardChartsProps) {
  
  const cardDistributionData = useMemo(() => {
    const rawData = data?.cardDistribution || [];
    
    return rawData.map(item => {
      const label = formatCardLabel(item.name);
      return {
        ...item,
        name: label,
        fill: CATEGORY_COLORS[label] || CATEGORY_COLORS['OTHER'] 
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-70 sm:h-87.5 lg:h-100 items-center justify-center rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-sm text-emerald-600 animate-pulse text-sm sm:text-base font-medium w-full">
        Đang tải biểu đồ...
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col items-center w-full">
      
      <div className="w-full text-left mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-800 line-clamp-1">
          Cơ cấu loại thẻ phát hành
        </h3>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
          Thống kê tỉ trọng các dòng sản phẩm trên hệ thống
        </p>
      </div>
      
      <div className="h-62.5 sm:h-80 lg:h-90 w-full max-w-125">
        {cardDistributionData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs sm:text-sm text-slate-400 text-center px-4">
            Chưa có dữ liệu thẻ nào trong hệ thống
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={cardDistributionData}
                cx="50%"
                cy="45%" 
                
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={4} 
                dataKey="count"
                stroke="none"
              />
              
              <Tooltip 
                formatter={(value) => [value, 'Số lượng thẻ']}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600
                }} 
              />
              
              <Legend content={<CustomLegend />} />
              
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}