import { Transaction, Budget, Group, GroupExpense, Settlement, User } from '../types';

// ----------------------
// Mock current user
// ----------------------
export const getCurrentUser = (): User => ({
  id: 'user-1',
  name: 'Praghna Manthena',
  email: 'praghna@gmail.com',
});

// ----------------------
// LocalStorage keys
// ----------------------
const KEYS = {
  TRANSACTIONS: 'budget-tracker-transactions',
  BUDGETS: 'budget-tracker-budgets',
  GROUPS: 'budget-tracker-groups',
  GROUP_EXPENSES: 'budget-tracker-group-expenses',
  SETTLEMENTS: 'budget-tracker-settlements',
};

// ----------------------
// Generic storage helpers
// ----------------------
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ----------------------
// Transactions
// ----------------------
export const getTransactions = (): Transaction[] => getFromStorage<Transaction>(KEYS.TRANSACTIONS);

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === transaction.id);
  if (index >= 0) transactions[index] = transaction;
  else transactions.push(transaction);
  saveToStorage(KEYS.TRANSACTIONS, transactions);
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions().filter(t => t.id !== id);
  saveToStorage(KEYS.TRANSACTIONS, transactions);
};

// ----------------------
// Budgets
// ----------------------
export const getBudgets = (): Budget[] => getFromStorage<Budget>(KEYS.BUDGETS);

export const saveBudget = (budget: Budget): void => {
  const budgets = getBudgets();
  const index = budgets.findIndex(b => b.id === budget.id);
  if (index >= 0) budgets[index] = budget;
  else budgets.push(budget);
  saveToStorage(KEYS.BUDGETS, budgets);
};

export const deleteBudget = (id: string): void => {
  const budgets = getBudgets().filter(b => b.id !== id);
  saveToStorage(KEYS.BUDGETS, budgets);
};

// ----------------------
// Groups
// ----------------------
export const getGroups = (): Group[] => getFromStorage<Group>(KEYS.GROUPS);

export const saveGroup = (group: Group): void => {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === group.id);
  if (index >= 0) groups[index] = group;
  else groups.push(group);
  saveToStorage(KEYS.GROUPS, groups);
};

export const deleteGroup = (id: string): void => {
  const groups = getGroups().filter(g => g.id !== id);
  saveToStorage(KEYS.GROUPS, groups);
};

// ----------------------
// Group Expenses
// ----------------------
export const getGroupExpenses = (): GroupExpense[] => getFromStorage<GroupExpense>(KEYS.GROUP_EXPENSES);

export const saveGroupExpense = (expense: GroupExpense): void => {
  const expenses = getGroupExpenses();
  const index = expenses.findIndex(e => e.id === expense.id);
  if (index >= 0) expenses[index] = expense;
  else expenses.push(expense);
  saveToStorage(KEYS.GROUP_EXPENSES, expenses);
};

export const deleteGroupExpense = (id: string): void => {
  const expenses = getGroupExpenses().filter(e => e.id !== id);
  saveToStorage(KEYS.GROUP_EXPENSES, expenses);
};

// ----------------------
// Settlements
// ----------------------
export const getSettlements = (): Settlement[] => getFromStorage<Settlement>(KEYS.SETTLEMENTS);

export const saveSettlement = (settlement: Settlement): void => {
  const settlements = getSettlements();
  const exists = settlements.find(s => s.id === settlement.id);
  if (!exists) settlements.push(settlement); // prevent duplicates
  saveToStorage(KEYS.SETTLEMENTS, settlements);
};

// ----------------------
// Initialize sample data (first load)
// ----------------------
export const initializeSampleData = (): void => {
  // Transactions
  if (getTransactions().length === 0) {
    const sampleTransactions: Transaction[] = [
      { id: 't1', userId: 'user-1', amount: 3500, type: 'income', category: 'Salary', description: 'Monthly salary', date: '2025-01-15' },
      { id: 't2', userId: 'user-1', amount: 50, type: 'expense', category: 'Food', description: 'Lunch at restaurant', date: '2025-01-16' },
      { id: 't3', userId: 'user-1', amount: 120, type: 'expense', category: 'Transport', description: 'Gas for car', date: '2025-01-16' },
    ];
    sampleTransactions.forEach(saveTransaction);
  }

  // Budgets
  if (getBudgets().length === 0) {
    const sampleBudgets: Budget[] = [
      { id: 'b1', userId: 'user-1', category: 'Food', limit: 500, spent: 50, month: '2025-01' },
      { id: 'b2', userId: 'user-1', category: 'Transport', limit: 300, spent: 120, month: '2025-01' },
      { id: 'b3', userId: 'user-1', category: 'Entertainment', limit: 200, spent: 0, month: '2025-01' },
    ];
    sampleBudgets.forEach(saveBudget);
  }



  // Settlements
  if (getSettlements().length === 0) {
    const sampleSettlements: Settlement[] = [];
    sampleSettlements.forEach(saveSettlement);
  }
};
