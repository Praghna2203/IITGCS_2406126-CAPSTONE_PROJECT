import React, { useState, useMemo } from 'react';
import { Group, GroupExpense, Settlement, GroupMember } from '../types';
import { Plus, Users, Edit, Trash2, DollarSign, Calculator, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser, getGroupExpenses, getSettlements } from '../utils/storage';
import { getDetailedBalances, getSettlementSuggestions } from '../utils/groupCalculations';
import { format } from 'date-fns';
import GroupForm from './GroupForm';
import GroupExpenseForm from './GroupExpenseForm';
import SettlementForm from './SettlementForm';

interface GroupManagerProps {
  groups: Group[];
  onSave: (group: Group) => void;
  onDelete: (id: string) => void;
  onSaveExpense: (expense: GroupExpense) => void;
  onSaveSettlement: (settlement: Settlement) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ 
  groups, 
  onSave, 
  onDelete, 
  onSaveExpense, 
  onSaveSettlement 
}) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSettlementForm, setShowSettlementForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const currentUser = getCurrentUser();
  const allExpenses = getGroupExpenses();
  const allSettlements = getSettlements();

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupForm(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowGroupForm(true);
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Are you sure you want to delete this group? All expenses and settlements will be lost.')) {
      onDelete(id);
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
    }
  };

  const handleGroupSave = (group: Group) => {
    onSave(group);
    setShowGroupForm(false);
    setEditingGroup(null);
  };

  const handleExpenseSave = (expense: GroupExpense) => {
    onSaveExpense(expense);
    setShowExpenseForm(false);
  };

  const handleSettlementSave = (settlement: Settlement) => {
    onSaveSettlement(settlement);
    setShowSettlementForm(false);
  };

  if (selectedGroup) {
    return (
      <GroupDetails
        group={selectedGroup}
        expenses={allExpenses.filter(e => e.groupId === selectedGroup.id)}
        settlements={allSettlements.filter(s => s.groupId === selectedGroup.id)}
        onBack={() => setSelectedGroup(null)}
        onAddExpense={() => setShowExpenseForm(true)}
        onAddSettlement={() => setShowSettlementForm(true)}
        onEditGroup={() => handleEditGroup(selectedGroup)}
        onDeleteGroup={() => handleDeleteGroup(selectedGroup.id)}
        showExpenseForm={showExpenseForm}
        showSettlementForm={showSettlementForm}
        onExpenseSave={handleExpenseSave}
        onSettlementSave={handleSettlementSave}
        onCloseExpenseForm={() => setShowExpenseForm(false)}
        onCloseSettlementForm={() => setShowSettlementForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
        <button
          onClick={handleCreateGroup}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No groups yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first group to start sharing expenses
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const groupExpenses = allExpenses.filter(e => e.groupId === group.id);
            const groupSettlements = allSettlements.filter(s => s.groupId === group.id);
            const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
            const balances = getDetailedBalances(group.members, groupExpenses, groupSettlements);
            const userBalance = balances.find(b => b.userId === currentUser.id)?.netBalance || 0;

            return (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroup(group);
                      }}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Members</span>
                    <span className="font-medium">{group.members.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-medium">${totalExpenses.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your Balance</span>
                    <span className={`font-medium ${
                      userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {userBalance > 0 && '+'}${userBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {group.members.slice(0, 3).map(m => m.name.split(' ')[0]).join(', ')}
                    {group.members.length > 3 && ` +${group.members.length - 3} more`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group Form Modal */}
      {showGroupForm && (
        <GroupForm
          group={editingGroup}
          onSave={handleGroupSave}
          onCancel={() => {
            setShowGroupForm(false);
            setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
};

// Group Details Component
interface GroupDetailsProps {
  group: Group;
  expenses: GroupExpense[];
  settlements: Settlement[];
  onBack: () => void;
  onAddExpense: () => void;
  onAddSettlement: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  showExpenseForm: boolean;
  showSettlementForm: boolean;
  onExpenseSave: (expense: GroupExpense) => void;
  onSettlementSave: (settlement: Settlement) => void;
  onCloseExpenseForm: () => void;
  onCloseSettlementForm: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  expenses,
  settlements,
  onBack,
  onAddExpense,
  onAddSettlement,
  onEditGroup,
  onDeleteGroup,
  showExpenseForm,
  showSettlementForm,
  onExpenseSave,
  onSettlementSave,
  onCloseExpenseForm,
  onCloseSettlementForm
}) => {
  const currentUser = getCurrentUser();
  
  const detailedBalances = getDetailedBalances(group.members, expenses, settlements);
  const settlementSuggestions = getSettlementSuggestions(group.members, expenses, settlements);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSettlements = settlements.reduce((sum, s) => s.fromUserId === currentUser.id ? sum + s.amount : s.toUserId === currentUser.id ? sum - s.amount : sum, 0);
  
  const userBalance = detailedBalances.find(b => b.userId === currentUser.id);

  const getMemberName = (userId: string) => {
    return group.members.find(m => m.userId === userId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Groups
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onEditGroup}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={onDeleteGroup}
            className="text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Group Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-bold text-blue-600">{group.members.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-green-600">${totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Settlements</p>
              <p className="text-2xl font-bold text-purple-600">{settlements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full mr-3 flex items-center justify-center ${
              (userBalance?.netBalance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className={`text-sm font-bold ${
                (userBalance?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(userBalance?.netBalance || 0) >= 0 ? '+' : '-'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Your Balance</p>
              <p className={`text-2xl font-bold ${
                (userBalance?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(userBalance?.netBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onAddExpense}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </button>
        <button
          onClick={onAddSettlement}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Record Settlement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balances */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Balances</h3>
          <div className="space-y-4">
            {detailedBalances.map(balance => (
              <div key={balance.userId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{balance.name}</p>
                  {balance.userId === currentUser.id && (
                    <p className="text-xs text-blue-600">You</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    balance.netBalance > 0 ? 'text-green-600' : 
                    balance.netBalance < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {balance.netBalance > 0 ? '+' : balance.netBalance < 0 ? '-' : ''}
                    ${Math.abs(balance.netBalance).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {balance.netBalance > 0 ? 'owed' : balance.netBalance < 0 ? 'owes' : 'settled'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement Suggestions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlement Suggestions</h3>
          {settlementSuggestions.length > 0 ? (
            <div className="space-y-3">
              {settlementSuggestions.slice(0, 5).map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.fromName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.toName}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    ${suggestion.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">All settled up! 🎉</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.slice(-5).reverse().map(expense => (
                <div key={expense.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">
                      Paid by {getMemberName(expense.paidBy)} • {expense.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(expense.date), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No expenses yet</p>
          )}
        </div>

        {/* Recent Settlements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Settlements</h3>
          {settlements.length > 0 ? (
            <div className="space-y-3">
              {settlements.slice(-5).reverse().map(settlement => (
                <div key={settlement.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{settlement.description}</p>
                    <p className="text-xs text-gray-500">
                      {getMemberName(settlement.fromUserId)} → {getMemberName(settlement.toUserId)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${settlement.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(settlement.date), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No settlements yet</p>
          )}
        </div>
      </div>

      {/* Forms */}
      {showExpenseForm && (
        <GroupExpenseForm
          group={group}
          onSave={onExpenseSave}
          onCancel={onCloseExpenseForm}
        />
      )}

      {showSettlementForm && (
        <SettlementForm
          group={group}
          suggestions={settlementSuggestions}
          onSave={onSettlementSave}
          onCancel={onCloseSettlementForm}
        />
      )}
    </div>
  );
};

export default GroupManager;