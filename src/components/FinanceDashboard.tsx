/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  X,
  PlusCircle,
  Clock
} from 'lucide-react';
import { addTransaction, deleteTransaction } from '../services/focoFlowService';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
}

interface FinanceDashboardProps {
  summary: {
    totalRevenue: number;
    totalExpense: number;
    balance: number;
    categories: Array<{ name: string; value: number }>;
    timeframe: string;
  } | null;
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  theme: {
    primary: string;
    primaryRgb: string;
    glow: string;
    overlay: string;
  };
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ summary, transactions, onDeleteTransaction, theme }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('Geral');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    
    addTransaction(
      description,
      parseFloat(amount),
      type,
      category,
      date
    );

    // Reset Form
    setDescription('');
    setAmount('');
    setCategory('Geral');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    onDeleteTransaction(id);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' ? true : t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Calculate local live statistics to keep it responsive if summary list is loading
  const localRevenue = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const localExpense = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const localBalance = localRevenue - localExpense;

  const currentRevenue = summary ? summary.totalRevenue : localRevenue;
  const currentExpense = summary ? summary.totalExpense : localExpense;
  const currentBalance = summary ? summary.balance : localBalance;

  return (
    <div className="flex flex-col gap-8 p-1 h-full overflow-y-auto animate-fadeIn font-sans">
      {/* HUD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-1000"
            style={{ backgroundColor: theme.primary }}
          />
          <span className="text-[11px] tracking-[0.3em] text-white/30 uppercase font-bold block mb-4">Saldo Total</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold tracking-tight text-white">
              R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            <span>Fluxo de Caixa Atlas</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-1000"
            style={{ backgroundColor: '#10b981' }}
          />
          <span className="text-[11px] tracking-[0.3em] text-emerald-500/40 uppercase font-bold block mb-4 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Receitas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold tracking-tight text-emerald-500/80">
              R$ {currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-6 text-[10px] text-white/10 font-bold uppercase tracking-widest">
            Registro de Entradas
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-1000"
            style={{ backgroundColor: '#ef4444' }}
          />
          <span className="text-[11px] tracking-[0.3em] text-rose-500/40 uppercase font-bold block mb-4 flex items-center gap-3">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Despesas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold tracking-tight text-rose-500/80">
              R$ {currentExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-6 text-[10px] text-white/10 font-bold uppercase tracking-widest">
            Controle de Saídas
          </div>
        </div>
      </div>

      {/* Control Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="Pesquisar registros..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-white/10 bg-black/40 text-sm text-white rounded-2xl focus:outline-none focus:border-white/30 transition-all font-medium"
            />
          </div>
          
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="px-4 py-3.5 border border-white/10 bg-black/40 text-xs text-slate-400 rounded-2xl focus:outline-none focus:border-white/30 cursor-pointer font-bold uppercase tracking-widest"
          >
            <option value="all">Filtro: Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 text-black hover:opacity-90 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl cursor-pointer"
          style={{ backgroundColor: theme.primary }}
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancelar' : 'Novo Lançamento'}
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-8 border border-white/5 bg-white/[0.03] backdrop-blur-3xl rounded-3xl flex flex-col gap-6 animate-fadeIn shadow-2xl">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">Novo Registro Operacional</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Descrição</label>
              <input 
                type="text" 
                required
                placeholder="Ex. Consultoria Cloud"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="px-5 py-3 border border-white/10 bg-black/40 text-sm text-white rounded-2xl focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="px-5 py-3 border border-white/10 bg-black/40 text-sm text-white rounded-2xl focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Categoria</label>
                <input 
                  type="text" 
                  placeholder="Ex. Operações"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-5 py-3 border border-white/10 bg-black/40 text-sm text-white rounded-2xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Tipo</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('receita')}
                  className={`py-3 text-[11px] font-bold uppercase tracking-widest rounded-2xl border transition-all cursor-pointer ${type === 'receita' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'border-white/5 bg-transparent text-slate-500'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType('despesa')}
                  className={`py-3 text-[11px] font-bold uppercase tracking-widest rounded-2xl border transition-all cursor-pointer ${type === 'despesa' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'border-white/5 bg-transparent text-slate-500'}`}
                >
                  Despesa
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Data</label>
              <input 
                type="date" 
                value={date}
                required
                onChange={e => setDate(e.target.value)}
                className="px-5 py-3 border border-white/10 bg-black/40 text-sm text-white rounded-2xl focus:outline-none dark-calendar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-white/5">
            <button
              type="submit"
              className="px-10 py-3.5 text-black hover:opacity-90 font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-xl cursor-pointer"
              style={{ backgroundColor: theme.primary }}
            >
              Confirmar Registro
            </button>
          </div>
        </form>
      )}

      {/* Transactions Table/Ledger */}
      <div className="flex-1 min-h-[350px] border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-md overflow-hidden flex flex-col shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">Livro de Lançamentos</span>
          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{filteredTransactions.length} REGISTROS</span>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar pb-6">
          {filteredTransactions.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center p-12 text-center text-slate-600">
              <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
              <span className="text-[11px] font-bold tracking-widest uppercase">Nenhum registro encontrado</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold tracking-widest text-white/20 uppercase">
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Descrição</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                  <th className="px-8 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[13px] text-white">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-5 font-bold text-[11px] text-white/40 uppercase tracking-widest whitespace-nowrap">
                      {tx.date.split('-').reverse().join('/')}
                    </td>
                    <td className="px-8 py-5 font-semibold tracking-tight">
                      {tx.description}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase border border-white/5 bg-white/[0.05] text-white/60 rounded-lg">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap font-bold">
                      <span className={tx.type === 'receita' ? 'text-emerald-500' : 'text-rose-500'}>
                        {tx.type === 'receita' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2.5 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
