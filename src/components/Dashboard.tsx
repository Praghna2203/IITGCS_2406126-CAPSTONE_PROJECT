import React from 'react';
import { Transaction, Budget } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  AlertCircle 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budgets }) => {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // Calculate monthly totals
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

  // Calculate budget progress
  const currentBudgets = budgets.filter(b => b.month === currentMonth);
  const totalBudget = currentBudgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get overspent categories
  const overspentCategories = currentBudgets.filter(budget => {
    const categorySpent = monthlyTransactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    return categorySpent > budget.limit;
  });

  // Recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const StatCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    color: string;
  }> = ({ title, amount, icon: Icon, trend, color }) => (
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
      {trend && (
        <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          {trend === 'up' ? 'Increased' : 'Decreased'} from last month
        </div>
      )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Income"
          amount={monthlyIncome}
          icon={TrendingUp}
          color="text-green-600"
          trend="up"
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
        <StatCard
          title="Budget Used"
          amount={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
          icon={DollarSign}
          color="text-blue-600"
        />
      </div>

      {/* Alerts */}
      {overspentCategories.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Budget Alerts</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            You've exceeded your budget in {overspentCategories.length} 
            {overspentCategories.length === 1 ? ' category' : ' categories'}: {' '}
            {overspentCategories.map(b => b.category).join(', ')}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
        <div className="space-y-4">
          {currentBudgets.map(budget => {
            const categorySpent = monthlyTransactions
              .filter(t => t.type === 'expense' && t.category === budget.category)
              .reduce((sum, t) => sum + t.amount, 0);
            const percentage = budget.limit > 0 ? (categorySpent / budget.limit) * 100 : 0;
            const isOverBudget = percentage > 100;

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{budget.category}</span>
                  <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    ${categorySpent.toFixed(2)} / ${budget.limit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(1)}% used
                  {isOverBudget && (
                    <span className="text-red-600 ml-2">
                      (${(categorySpent - budget.limit).toFixed(2)} over budget)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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