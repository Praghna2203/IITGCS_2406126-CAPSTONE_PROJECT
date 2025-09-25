import React from 'react';
import { Transaction } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // Filter transactions for current month
  const monthlyTransactions = transactions.filter(t => 
    t.date >= format(monthStart, 'yyyy-MM-dd') && 
    t.date <= format(monthEnd, 'yyyy-MM-dd')
  );

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = monthlyIncome - monthlyExpenses;

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const StatCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ElementType;
    color: string;
  }> = ({ title, amount, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            ${Math.abs(amount).toFixed(2)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color === 'text-green-600' ? 'bg-green-100' : color === 'text-red-600' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Monthly Income"
          amount={monthlyIncome}
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="Monthly Expenses"
          amount={monthlyExpenses}
          icon={TrendingDown}
          color="text-red-600"
        />
        <StatCard
          title="Savings"
          amount={savings}
          icon={PiggyBank}
          color={savings >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{transaction.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(transaction.date), 'MMM dd')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
