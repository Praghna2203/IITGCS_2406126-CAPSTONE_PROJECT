export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  groupId?: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: string; // YYYY-MM format
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  amount: number;
  description: string;
  category: string;
  paidBy: string;
  splits: ExpenseSplit[];
  date: string;
  createdAt: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  settled: boolean;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface GroupBalance {
  userId: string;
  name: string;
  balance: number; // positive means owed money, negative means owes money
  settlements: { [userId: string]: number };
}

export type ViewType = 'dashboard' | 'transactions' | 'budgets' | 'groups' | 'analytics';