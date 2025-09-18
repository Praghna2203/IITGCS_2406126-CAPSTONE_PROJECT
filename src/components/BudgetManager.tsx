import React, { useState, useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { Plus, Edit, Trash2, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '../utils/storage';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onSave: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ 
  budgets, 
  transactions, 
  onSave, 
  onDelete 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // Get budgets for selected month
  const monthBudgets = budgets.filter(b => b.month === selectedMonth);

  // Calculate spending for each budget
  const budgetsWithSpending = useMemo(() => {
    return monthBudgets.map(budget => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' && 
          t.category === budget.category &&
          t.date >= format(monthStart, 'yyyy-MM-dd') &&
          t.date <= format(monthEnd, 'yyyy-MM-dd')
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    });
  }, [monthBudgets, transactions, monthStart, monthEnd]);

  // Calculate totals
  const totalBudget = budgetsWithSpending.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleSubmit = (formData: {
    category: string;
    limit: number;
  }) => {
    const currentUser = getCurrentUser();
    
    const budget: Budget = {
      id: editingBudget?.id || uuidv4(),
      userId: currentUser.id,
      category: formData.category,
      limit: formData.limit,
      spent: editingBudget?.spent || 0,
      month: selectedMonth
    };

    onSave(budget);
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              setEditingBudget(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </button>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalBudget.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full mr-3 flex items-center justify-center ${
              totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className={`text-sm font-bold ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalRemaining >= 0 ? '+' : '-'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(totalRemaining).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        {budgetsWithSpending.map(budget => {
          const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
          const isOverBudget = percentage > 100;
          const remaining = budget.limit - budget.spent;

          return (
            <div key={budget.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                  <p className="text-sm text-gray-600">
                    ${budget.spent.toFixed(2)} of ${budget.limit.toFixed(2)} spent
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {isOverBudget && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {percentage.toFixed(1)}% used
                  </span>
                  <span className={`font-medium ${
                    remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${remaining >= 0 ? remaining.toFixed(2) : Math.abs(remaining).toFixed(2)} 
                    {remaining >= 0 ? ' remaining' : ' over budget'}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                  {isOverBudget && (
                    <div
                      className="h-3 bg-red-300 rounded-full -mt-3"
                      style={{ 
                        width: '100%',
                        opacity: 0.5
                      }}
                    />
                  )}
                </div>
              </div>

              {isOverBudget && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    You're ${(budget.spent - budget.limit).toFixed(2)} over budget this month
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {budgetsWithSpending.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No budgets set for this month</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first budget to start tracking your spending
            </p>
          </div>
        )}
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          month={selectedMonth}
          onSave={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(null);
          }}
        />
      )}
    </div>
  );
};

// Budget Form Component
interface BudgetFormProps {
  budget: Budget | null;
  month: string;
  onSave: (data: { category: string; limit: number }) => void;
  onCancel: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ budget, month, onSave, onCancel }) => {
  const [category, setCategory] = useState(budget?.category || '');
  const [limit, setLimit] = useState(budget?.limit?.toString() || '');

  const categories = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare',
    'Education', 'Travel', 'Investment', 'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !limit) return;
    
    onSave({
      category,
      limit: parseFloat(limit)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {budget ? 'Edit Budget' : 'Add Budget'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            For {format(new Date(month + '-01'), 'MMMM yyyy')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Limit
            </label>
            <input
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {budget ? 'Update' : 'Create'} Budget
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetManager;