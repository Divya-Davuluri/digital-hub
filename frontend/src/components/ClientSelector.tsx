'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Users } from 'lucide-react';

interface ClientSelectorProps {
  onSelect: (clientId: string) => void;
  className?: string;
}

export default function ClientSelector({ onSelect, className = '' }: ClientSelectorProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await apiCall('/clients');
        setClients(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          onSelect(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    onSelect(id);
  };

  if (loading) return <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl" />;

  return (
    <div className={`relative ${className}`}>
      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <select
        value={selectedId}
        onChange={handleChange}
        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer shadow-sm"
      >
        <option value="">Select Client</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.companyName || client.name}
          </option>
        ))}
      </select>
    </div>
  );
}
