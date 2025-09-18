import React, { useState } from 'react';
import { Group, GroupExpense, ExpenseSplit } from '../types';
import { X, DollarSign, Users, Calculator } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '../utils/storage';

interface GroupExpenseFormProps {
  group: Group;
  onSave: (expense: GroupExpense) => void;
  onCancel: () => void;
}

const categories = [
  'Food', 'Transport', 'Entertainment', 'Accommodation', 'Shopping', 
  'Bills', 'Healthcare', 'Travel', 'Other'
];

const GroupExpenseForm: React.FC<GroupExpenseFormProps> = ({ 
  group, 
  onSave, 
  onCancel 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState(getCurrentUser().id);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [splits, setSplits] = useState<{ [userId: string]: string }>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currentUser = getCurrentUser();
  const totalAmount = parseFloat(amount) || 0;

  // Initialize splits when amount or split type changes
  React.useEffect(() => {
    if (splitType === 'equal' && totalAmount > 0) {
      const equalAmount = (totalAmount / group.members.length).toFixed(2);
      const newSplits: { [userId: string]: string } = {};
      group.members.forEach(member => {
        newSplits[member.userId] = equalAmount;
      });
      setSplits(newSplits);
    } else if (splitType === 'custom' && Object.keys(splits).length === 0) {
      // Initialize custom splits with 0
      const newSplits: { [userId: string]: string } = {};
      group.members.forEach(member => {
        newSplits[member.userId] = '0.00';
      });
      setSplits(newSplits);
    }
  }, [amount, splitType, group.members.length, totalAmount]);

  const handleSplitChange = (userId: string, value: string) => {
    setSplits({ ...splits, [userId]: value });
  };

  const getTotalSplit = () => {
    return Object.values(splits).reduce((sum, split) => {
      return sum + (parseFloat(split) || 0);
    }, 0);
  };

  const getSplitBalance = () => {
    return totalAmount - getTotalSplit();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const totalSplit = getTotalSplit();
    if (Math.abs(totalAmount - totalSplit) > 0.01) {
      alert(`Split amounts don't match the total expense. Difference: $${Math.abs(totalAmount - totalSplit).toFixed(2)}`);
      return;
    }

    const expenseSplits: ExpenseSplit[] = Object.entries(splits).map(([userId, splitAmount]) => ({
      userId,
      amount: parseFloat(splitAmount) || 0,
      settled: false
    }));

    const expense: GroupExpense = {
      id: uuidv4(),
      groupId: group.id,
      amount: totalAmount,
      description: description.trim(),
      category,
      paidBy,
      splits: expenseSplits,
      date,
      createdAt: new Date().toISOString()
    };

    onSave(expense);
  };

  const distributeEvenly = () => {
    const equalAmount = (totalAmount / group.members.length).toFixed(2);
    const newSplits: { [userId: string]: string } = {};
    group.members.forEach(member => {
      newSplits[member.userId] = equalAmount;
    });
    setSplits(newSplits);
  };

  const adjustLastSplit = () => {
    const balance = getSplitBalance();
    if (Math.abs(balance) > 0.01 && group.members.length > 0) {
      const lastMember = group.members[group.members.length - 1];
      const currentAmount = parseFloat(splits[lastMember.userId]) || 0;
      const newAmount = (currentAmount + balance).toFixed(2);
      setSplits({ ...splits, [lastMember.userId]: newAmount });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Group Expense</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What was this expense for?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid by
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {group.members.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name} {member.userId === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How should this be split?
            </label>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="equal"
                    checked={splitType === 'equal'}
                    onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Split equally</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="custom"
                    checked={splitType === 'custom'}
                    onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Custom amounts</span>
                </label>
              </div>

              {totalAmount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Split Details ({group.members.length} members)
                    </h4>
                    {splitType === 'custom' && (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={distributeEvenly}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          Distribute evenly
                        </button>
                        {Math.abs(getSplitBalance()) > 0.01 && (
                          <button
                            type="button"
                            onClick={adjustLastSplit}
                            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
                          >
                            Auto-adjust
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {group.members.map(member => (
                      <div key={member.userId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {member.name}
                            {member.userId === currentUser.id && (
                              <span className="text-xs text-blue-600 ml-1">(You)</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={splits[member.userId] || ''}
                            onChange={(e) => handleSplitChange(member.userId, e.target.value)}
                            disabled={splitType === 'equal'}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Split:</span>
                      <span className={`text-sm font-bold ${
                        Math.abs(getSplitBalance()) < 0.01 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${getTotalSplit().toFixed(2)}
                      </span>
                    </div>
                    {Math.abs(getSplitBalance()) > 0.01 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">Balance:</span>
                        <span className="text-sm font-medium text-red-600">
                          ${getSplitBalance().toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={!amount || !description.trim() || Math.abs(getSplitBalance()) > 0.01}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Add Expense
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

export default GroupExpenseForm;