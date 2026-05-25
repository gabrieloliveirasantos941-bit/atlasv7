/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Activity, 
  TrendingUp, 
  Award, 
  Layers, 
  Clock, 
  CheckSquare 
} from 'lucide-react';
import { getFocoFlowData, getFinancialSummary, Task } from '../services/focoFlowService';

interface AdvancedReportsProps {
  userId: string;
  theme: {
    primary: string;
    primaryRgb: string;
    glow: string;
    overlay: string;
  };
}

export const AdvancedReports: React.FC<AdvancedReportsProps> = ({ userId, theme }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      Promise.all([
        getFocoFlowData(userId, 'tasks'),
        getFinancialSummary(userId)
      ]).then(([taskData, finSummary]) => {
        setTasks(taskData as Task[]);
        setFinancialSummary(finSummary);
        setIsLoading(false);
      });
    };

    loadData();

    window.addEventListener('focoflow_data_updated', loadData);
    return () => window.removeEventListener('focoflow_data_updated', loadData);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-white/10 text-[10px] font-bold tracking-[0.3em] uppercase">
        <Clock className="w-6 h-6 animate-spin mr-4 opacity-20" />
        <span>Cruzando Informações de Desempenho...</span>
      </div>
    );
  }

  // Calculate stats from tasks list
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

  // Group task hours by category
  const categoryHours: { [key: string]: number } = {};
  tasks.forEach(t => {
    const cat = t.category || 'GERAL';
    categoryHours[cat] = (categoryHours[cat] || 0) + (t.timeSpent || 0);
  });

  const categoryList = Object.keys(categoryHours).map(catName => ({
    name: catName,
    minutes: categoryHours[catName]
  })).sort((a,b) => b.minutes - a.minutes);

  // Compute maximum category focus to scale the bar lengths correctly
  const maxCategoryMinutes = Math.max(...categoryList.map(c => c.minutes), 1);

  return (
    <div className="flex flex-col gap-8 p-1 h-full overflow-y-auto font-sans">
      
      {/* HUD metrics ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-white/40" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Taxa Conclusão</span>
            <span className="text-2xl font-bold text-white tracking-tighter">{completionRate}%</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white/40" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Tempo Total Foco</span>
            <span className="text-2xl font-bold text-white tracking-tighter">{(totalFocusMinutes / 60).toFixed(1)}h</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center">
            <Award className="w-6 h-6 text-white/40" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Ações Feitas</span>
            <span className="text-2xl font-bold text-white tracking-tighter">{completedTasks}</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white/40" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Produtividade</span>
            <span className="text-2xl font-bold text-white tracking-tighter">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Focus hours by Category card */}
        <div className="lg:col-span-12 p-8 border border-white/5 bg-white/[0.02] rounded-3xl shadow-2xl">
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase flex items-center gap-3">
              <Layers className="w-4 h-4" /> Alocação de Tempo por Categoria
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {categoryList.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-600 text-[11px] uppercase font-bold tracking-widest">
                Sem dados operacionais registrados.
              </div>
            ) : (
              categoryList.map(c => {
                const pct = Math.round((c.minutes / maxCategoryMinutes) * 100);
                return (
                  <div key={c.name} className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-white/60">{c.name}</span>
                      <span className="text-white/20">{Math.round(c.minutes / 60 * 10) / 10}h</span>
                    </div>

                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden relative">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${pct}%`, backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.glow}` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Status Circular Block */}
        <div className="lg:col-span-12 p-8 border border-white/5 bg-white/[0.02] rounded-3xl shadow-2xl flex flex-col items-center">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase flex items-center gap-3 mb-8 self-start">
              <Activity className="w-4 h-4" /> Status Operacional Global
            </span>

            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="96" cy="96" r="80" 
                  stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="transparent" 
                />
                <circle 
                  cx="96" cy="96" r="80" 
                  strokeWidth="12" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - completionRate / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ stroke: theme.primary, filter: `drop-shadow(0 0 8px ${theme.primary}40)` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-display font-light text-white tracking-tighter">{completionRate}%</span>
                <span className="text-[9px] text-white/20 tracking-[0.4em] uppercase font-bold mt-2">Concluído</span>
              </div>
            </div>

            <div className="mt-8 text-center max-w-sm">
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Sua saúde de produção operacional está <span className="text-white">Estável</span> baseado nos últimos fluxos de dados analisados pelo sistema.
                </p>
            </div>
        </div>
      </div>

      {/* Finance Metrics Summary block */}
      {financialSummary && (
        <div className="p-8 border border-white/5 bg-white/[0.02] rounded-3xl shadow-2xl">
          <span className="text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase flex items-center gap-3 mb-8">
            <BarChart className="w-4 h-4" /> Visão Financeira Consolidada
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Fluxo Líquido</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                R$ {financialSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Total Saídas</span>
              <span className="text-2xl font-bold text-rose-500/80 tracking-tight">
                R$ {financialSummary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Total Entradas</span>
              <span className="text-2xl font-bold text-emerald-500/80 tracking-tight">
                R$ {financialSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
