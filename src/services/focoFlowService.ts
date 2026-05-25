/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Types representing the different entities in our system
export interface Task {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  timeSpent: number; // in minutes
  createdAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  category: string;
  clicks: number;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
  completed: boolean;
  isImportant: boolean; // True for "Important Reminders" tab
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

// LocalStorage Keys
const KEYS = {
  TASKS: 'focoflow_tasks',
  TRANSACTIONS: 'focoflow_transactions',
  GOALS: 'focoflow_goals',
  LINKS: 'focoflow_links',
  REMINDERS: 'focoflow_reminders',
  NOTES: 'focoflow_notes',
  DISABLE_SEEDING: 'focoflow_disable_seeding'
};

// Seed initial high-fidelity cyberpunk data if not already present
function initializeDemoData() {
  // Demo data disabled by user request to keep panel zeroed
  return;
}

// Run initializer immediately
if (typeof window !== 'undefined') {
  // One-time clear if requested by the user to "leave it zeroed"
  if (!localStorage.getItem('focoflow_fresh_start_v2')) {
    localStorage.clear();
    localStorage.setItem('focoflow_fresh_start_v2', 'true');
  }
  initializeDemoData();
}

// API functions requested by FocoFlowDashboard
export async function getFinancialSummary(userId: string): Promise<any> {
  const txs = getLocalData<Transaction>(KEYS.TRANSACTIONS);
  const receipts = txs.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const balance = receipts - expenses;
  
  // Calculate category breakdown
  const categoryMap: { [key: string]: number } = {};
  txs.forEach(t => {
    if (t.type === 'despesa') {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  });

  const categories = Object.keys(categoryMap).map(name => ({
    name,
    value: categoryMap[name]
  }));

  return {
    totalRevenue: receipts,
    totalExpense: expenses,
    balance: balance,
    categories: categories,
    timeframe: 'Maio/2026'
  };
}

export async function getFocoFlowData(userId: string, type: string, limit?: number): Promise<any[]> {
  // Map requested types
  if (type === 'transacoes_financeiras_focoflow') {
    const data = getLocalData<Transaction>(KEYS.TRANSACTIONS);
    // Sort transactions by date descending
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  if (type === 'tasks') {
    const data = getLocalData<Task>(KEYS.TASKS);
    return limit ? data.slice(0, limit) : data;
  }

  if (type === 'financial_goals' || type === 'goals') {
    const data = getLocalData<FinancialGoal>(KEYS.GOALS);
    return limit ? data.slice(0, limit) : data;
  }

  if (type === 'links') {
    const data = getLocalData<QuickLink>(KEYS.LINKS);
    const sorted = [...data].sort((a,b) => b.clicks - a.clicks);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  if (type === 'reminders' || type === 'important_reminders') {
    const data = getLocalData<Reminder>(KEYS.REMINDERS);
    return limit ? data.slice(0, limit) : data;
  }

  if (type === 'notes') {
    const data = getLocalData<Note>(KEYS.NOTES);
    const sorted = [...data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  return [];
}

// Generic localStorage helper functions
function getLocalData<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalData<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a global storage modification event for live updating across tabs/renders
  window.dispatchEvent(new CustomEvent('focoflow_data_updated', { detail: { key } }));
}

// MUTATION ENDPOINTS (to make our cyberpunk workstation fully operational)

// Tasks Management
export function addTask(title: string, category: string, priority: 'low' | 'medium' | 'high'): Task {
  const tasks = getLocalData<Task>(KEYS.TASKS);
  const newTask: Task = {
    id: `task_${Date.now()}`,
    title,
    category: category.toUpperCase() || 'GERAL',
    priority,
    completed: false,
    timeSpent: 0,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(newTask);
  saveLocalData(KEYS.TASKS, tasks);
  return newTask;
}

export function toggleTaskCompleted(id: string): void {
  const tasks = getLocalData<Task>(KEYS.TASKS);
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index].completed = !tasks[index].completed;
    saveLocalData(KEYS.TASKS, tasks);
  }
}

export function addFocusTime(id: string, minutes: number): void {
  const tasks = getLocalData<Task>(KEYS.TASKS);
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index].timeSpent = (tasks[index].timeSpent || 0) + minutes;
    saveLocalData(KEYS.TASKS, tasks);
  }
}

export function deleteTask(id: string): void {
  const tasks = getLocalData<Task>(KEYS.TASKS).filter(t => t.id !== id);
  saveLocalData(KEYS.TASKS, tasks);
}

// Transaction Management
export function addTransaction(description: string, amount: number, type: 'receita' | 'despesa', category: string, date: string): Transaction {
  const txs = getLocalData<Transaction>(KEYS.TRANSACTIONS);
  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    description,
    amount,
    type,
    category,
    date: date || new Date().toISOString().split('T')[0]
  };
  txs.unshift(newTx);
  saveLocalData(KEYS.TRANSACTIONS, txs);
  return newTx;
}

export function deleteTransaction(id: string): void {
  const txs = getLocalData<Transaction>(KEYS.TRANSACTIONS).filter(t => t.id !== id);
  saveLocalData(KEYS.TRANSACTIONS, txs);
}

// Goals Management
export function addFinancialGoal(title: string, targetAmount: number, currentAmount: number, deadline: string): FinancialGoal {
  const goals = getLocalData<FinancialGoal>(KEYS.GOALS);
  const newGoal: FinancialGoal = {
    id: `goal_${Date.now()}`,
    title,
    targetAmount,
    currentAmount: currentAmount || 0,
    deadline
  };
  goals.unshift(newGoal);
  saveLocalData(KEYS.GOALS, goals);
  return newGoal;
}

export function updateGoalContribution(id: string, amount: number): void {
  const goals = getLocalData<FinancialGoal>(KEYS.GOALS);
  const index = goals.findIndex(g => g.id === id);
  if (index !== -1) {
    goals[index].currentAmount = Math.max(0, goals[index].currentAmount + amount);
    saveLocalData(KEYS.GOALS, goals);
  }
}

export function deleteGoal(id: string): void {
  const goals = getLocalData<FinancialGoal>(KEYS.GOALS).filter(g => g.id !== id);
  saveLocalData(KEYS.GOALS, goals);
}

// Links Management
export function addQuickLink(title: string, url: string, category: string): QuickLink {
  const links = getLocalData<QuickLink>(KEYS.LINKS);
  let formattedUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    formattedUrl = `https://${url}`;
  }
  const newLink: QuickLink = {
    id: `link_${Date.now()}`,
    title,
    url: formattedUrl,
    category: category.toUpperCase() || 'GERAL',
    clicks: 0
  };
  links.push(newLink);
  saveLocalData(KEYS.LINKS, links);
  return newLink;
}

export function trackLinkClick(id: string): void {
  const links = getLocalData<QuickLink>(KEYS.LINKS);
  const index = links.findIndex(l => l.id === id);
  if (index !== -1) {
    links[index].clicks += 1;
    saveLocalData(KEYS.LINKS, links);
  }
}

export function deleteLink(id: string): void {
  const links = getLocalData<QuickLink>(KEYS.LINKS).filter(l => l.id !== id);
  saveLocalData(KEYS.LINKS, links);
}

// Reminders Management
export function addReminder(title: string, datetime: string, isImportant: boolean = false): Reminder {
  const reminders = getLocalData<Reminder>(KEYS.REMINDERS);
  const newReminder: Reminder = {
    id: `reminder_${Date.now()}`,
    title,
    datetime,
    completed: false,
    isImportant
  };
  reminders.unshift(newReminder);
  saveLocalData(KEYS.REMINDERS, reminders);
  return newReminder;
}

export function toggleReminderCompleted(id: string): void {
  const reminders = getLocalData<Reminder>(KEYS.REMINDERS);
  const index = reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    reminders[index].completed = !reminders[index].completed;
    saveLocalData(KEYS.REMINDERS, reminders);
  }
}

export function deleteReminder(id: string): void {
  const reminders = getLocalData<Reminder>(KEYS.REMINDERS).filter(r => r.id !== id);
  saveLocalData(KEYS.REMINDERS, reminders);
}

// Notes Management
export function addNote(title: string, content: string): Note {
  const notes = getLocalData<Note>(KEYS.NOTES);
  const newNote: Note = {
    id: `note_${Date.now()}`,
    title: title || 'Sem título',
    content: content || '',
    updatedAt: new Date().toISOString()
  };
  notes.unshift(newNote);
  saveLocalData(KEYS.NOTES, notes);
  return newNote;
}

export function updateNote(id: string, title: string, content: string): void {
  const notes = getLocalData<Note>(KEYS.NOTES);
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    notes[index].title = title;
    notes[index].content = content;
    notes[index].updatedAt = new Date().toISOString();
    saveLocalData(KEYS.NOTES, notes);
  }
}


export function deleteNote(id: string): void {
  const notes = getLocalData<Note>(KEYS.NOTES).filter(n => n.id !== id);
  saveLocalData(KEYS.NOTES, notes);
}

export function resetAllData(): void {
  localStorage.clear();
  window.dispatchEvent(new CustomEvent('focoflow_data_updated'));
  window.location.href = window.location.origin + window.location.pathname; // Hard reload
}
