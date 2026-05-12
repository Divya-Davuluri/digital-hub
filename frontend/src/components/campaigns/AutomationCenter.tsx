'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, Plus, Shield, TrendingUp, AlertTriangle, 
  Play, Pause, Settings, BarChart3, Clock, ArrowRight 
} from 'lucide-react';
import { 
  getBudgetPools, getAutomationRules, toggleRule, 
  runAutomationChecks, getForecast, BudgetPool, AutomationRule, ForecastPoint 
} from '@/services/automationService';
import BudgetForecastChart from './BudgetForecastChart';

export default function AutomationCenter() {
  const [pools, setPools] = useState<BudgetPool[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchData = async () => {
    try {
      const [pData, rData, fData] = await Promise.all([
        getBudgetPools(),
        getAutomationRules(),
        getForecast('global')
      ]);
      setPools(pData);
      setRules(rData);
      setForecast(fData);
    } catch (err) {
      console.error("Failed to fetch automation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunChecks = async () => {
    setRunning(true);
    try {
      await runAutomationChecks();
      await fetchData();
    } finally {
      setRunning(false);
    }
  };

  const handleToggle = async (ruleId: string, currentState: number) => {
    try {
      await toggleRule(ruleId, currentState === 0);
      setRules(rules.map(r => r.id === ruleId ? { ...r, isActive: currentState === 0 ? 1 : 0 } : r));
    } catch (err) {
      alert("Failed to toggle rule");
    }
  };

  return (
    <div className="space-y-8">
      {/* Forecasting Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <TrendingUp size={20} />
              <span className="text-xs font-black uppercase tracking-widest">AI Forecasting</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">Spending Projections</h3>
            <p className="text-sm text-slate-500">Predicted spend for the next 7 days across all channels.</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Depletion</div>
              <div className="text-lg font-black text-amber-500">May 24, 2026</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Burn Rate</div>
              <div className="text-lg font-black text-slate-900">$124.50/day</div>
            </div>
          </div>
        </div>
        
        <BudgetForecastChart data={forecast} budgetLimit={100} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Budget Pools */}
        <div className="col-span-1 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} className="text-blue-500" /> Budget Pools
            </h4>
            <button className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Plus size={14} /></button>
          </div>
          
          <div className="space-y-3">
            {pools.length > 0 ? pools.map(pool => (
              <div key={pool.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-slate-900">{pool.name}</div>
                  <span className="text-[10px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 uppercase">
                    {pool.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">SPENT: ${pool.spent}</span>
                    <span className="text-slate-900">${pool.totalBudget}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(pool.spent / pool.totalBudget) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">No active pools</p>
                <button className="text-xs font-black text-indigo-600 hover:underline">Create First Pool</button>
              </div>
            )}
          </div>
        </div>

        {/* Automation Rules */}
        <div className="col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Active Rules
            </h4>
            <div className="flex gap-2">
              <button 
                onClick={handleRunChecks}
                disabled={running}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {running ? 'Running...' : 'Run Analysis Now'}
              </button>
              <button className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Plus size={14} /></button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Condition</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{rule.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{rule.targetType}: {rule.targetId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-600 uppercase">{rule.triggerMetric}</span>
                        <span className="text-slate-400 font-bold">{rule.operator}</span>
                        <span className="font-black text-slate-900">${rule.threshold}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <ArrowRight size={14} />
                        <span className="text-xs font-black uppercase">{rule.action}</span>
                        {rule.actionValue && <span className="text-[10px] font-bold">({rule.actionValue}%)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleToggle(rule.id, rule.isActive)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                          rule.isActive === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {rule.isActive === 1 ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{rule.isActive === 1 ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No automation rules created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
