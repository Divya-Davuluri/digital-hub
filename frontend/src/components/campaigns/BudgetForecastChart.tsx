'use client';

import { 
  AreaChart as RechartsAreaChart, Area as RechartsArea, XAxis as RechartsXAxis, YAxis as RechartsYAxis, 
  CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer as RechartsResponsiveContainer, ReferenceLine as RechartsReferenceLine 
} from 'recharts';

const AreaChart = RechartsAreaChart as any;
const Area = RechartsArea as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const ResponsiveContainer = RechartsResponsiveContainer as any;
const ReferenceLine = RechartsReferenceLine as any;

interface ForecastData {
  date: string;
  predictedSpend: number;
  confidence: number;
}

export default function BudgetForecastChart({ data, budgetLimit }: { data: ForecastData[], budgetLimit: number }) {
  // Add some historical noise for visualization
  const chartData = data.map(d => ({
    ...d,
    upper: d.predictedSpend * (1 + (1 - d.confidence)),
    lower: d.predictedSpend * (1 - (1 - d.confidence)),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}
          />
          <ReferenceLine y={budgetLimit} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Limit', fill: '#ef4444', fontSize: 10 }} />
          <Area 
            type="monotone" 
            dataKey="predictedSpend" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorSpend)" 
          />
          <Area 
            type="monotone" 
            dataKey="upper" 
            stroke="transparent" 
            fill="#6366f1" 
            fillOpacity={0.1} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
