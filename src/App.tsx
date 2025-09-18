import React, { useState, useEffect } from 'react';
import { Transaction, Budget, Group, GroupExpense, Settlement, ViewType } from './types';
import { 
  getTransactions, 
  saveTransaction, 
  deleteTransaction,
  getBudgets,
  saveBudget,
  deleteBudget,
  getGroups,
  saveGroup,
  deleteGroup,
  getGroupExpenses,
  saveGroupExpense,
  deleteGroupExpense,
  getSettlements,
  saveSettlement,
  initializeSampleData
} from './utils/storage';

import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import BudgetManager from './components/BudgetManager';
import GroupManager from './components/GroupManager';
import Analytics from './components/Analytics';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Initialize data on first load
  useEffect(() => {
    initializeSampleData();
    setTransactions(getTransactions());
    setBudgets(getBudgets());
    setGroups(getGroups());
  }, []);

  // Transaction handlers
  const handleSaveTransaction = (transaction: Transaction) => {
    saveTransaction(transaction);
    setTransactions(getTransactions());
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
      setTransactions(getTransactions());
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  // Budget handlers
  const handleSaveBudget = (budget: Budget) => {
    saveBudget(budget);
    setBudgets(getBudgets());
  };

  const handleDeleteBudget = (id: string) => {
    deleteBudget(id);
    setBudgets(getBudgets());
  };

  // Group handlers
  const handleSaveGroup = (group: Group) => {
    saveGroup(group);
    setGroups(getGroups());
  };

  const handleDeleteGroup = (id: string) => {
    deleteGroup(id);
    setGroups(getGroups());
  };

  const handleSaveGroupExpense = (expense: GroupExpense) => {
    saveGroupExpense(expense);
  };

  const handleSaveSettlement = (settlement: Settlement) => {
    saveSettlement(settlement);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} budgets={budgets} />;
      case 'transactions':
        return (
          <TransactionList
            transactions={transactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onAdd={handleAddTransaction}
          />
        );
      case 'budgets':
        return (
          <BudgetManager
            budgets={budgets}
            transactions={transactions}
            onSave={handleSaveBudget}
            onDelete={handleDeleteBudget}
          />
        );
      case 'groups':
        return (
          <GroupManager
            groups={groups}
            onSave={handleSaveGroup}
            onDelete={handleDeleteGroup}
            onSaveExpense={handleSaveGroupExpense}
            onSaveSettlement={handleSaveSettlement}
          />
        );
      case 'analytics':
        return <Analytics transactions={transactions} budgets={budgets} />;
      default:
        return <Dashboard transactions={transactions} budgets={budgets} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderCurrentView()}
      </main>

      {/* Transaction Form Modal */}
      <TransactionForm
        transaction={editingTransaction}
        isOpen={showTransactionForm}
        onClose={() => {
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}

export default App;