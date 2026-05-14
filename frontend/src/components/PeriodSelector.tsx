'use client';

import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  onSelect: (period: string) => void;
  className?: string;
}

export default function PeriodSelector({ onSelect, className = '' }: PeriodSelectorProps) {
  const options = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
    { label: 'This Month', value: 'month' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  return (
    <div className={`relative ${className}`}>
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <select
        defaultValue="30"
        onChange={(e) => onSelect(e.target.value)}
        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer shadow-sm"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
