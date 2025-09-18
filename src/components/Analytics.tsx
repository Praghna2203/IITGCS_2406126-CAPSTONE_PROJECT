import React, { useMemo } from 'react';
import { Transaction, Budget } from '../types';
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsProps {
  transactions: Transaction[];
  budgets: Budget[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, budgets }) => {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => 
    format(subMonths(new Date(), i), 'yyyy-MM')
  ).reverse();

  // Calculate monthly trends
  const monthlyData = useMemo(() => {
    return lastSixMonths.map(month => {
      const monthStart = format(new Date(month + '-01'), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date(month + '-01')), 'yyyy-MM-dd');
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        income,
        expenses,
        savings: income - expenses
      };
    });
  }, [transactions, lastSixMonths]);

  // Category breakdown for current month
  const categoryData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    const monthTransactions = transactions.filter(t => 
      t.type === 'expense' &&
      t.date >= format(monthStart, 'yyyy-MM-dd') && 
      t.date <= format(monthEnd, 'yyyy-MM-dd')
    );

    const categoryTotals: { [category: string]: number } = {};
    
    monthTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [transactions]);

  // Budget vs Actual comparison
  const budgetComparisonData = useMemo(() => {
    const currentBudgets = budgets.filter(b => b.month === currentMonth);
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    return currentBudgets.map(budget => {
      const actualSpent = transactions
        .filter(t => 
          t.type === 'expense' && 
          t.category === budget.category &&
          t.date >= format(monthStart, 'yyyy-MM-dd') &&
          t.date <= format(monthEnd, 'yyyy-MM-dd')
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        category: budget.category,
        budget: budget.limit,
        actual: actualSpent
      };
    });
  }, [budgets, transactions, currentMonth]);

  // Chart configurations
  const monthlyTrendChart = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(d => d.income),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      }
    ]
  };

  const categoryPieChart = {
    labels: categoryData.map(([category]) => category),
    datasets: [
      {
        data: categoryData.map(([, amount]) => amount),
        backgroundColor: [
          '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
          '#6B7280', '#14B8A6', '#F97316', '#84CC16', '#06B6D4'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    ]
  };

  const budgetComparisonChart = {
    labels: budgetComparisonData.map(d => d.category),
    datasets: [
      {
        label: 'Budget',
        data: budgetComparisonData.map(d => d.budget),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Actual',
        data: budgetComparisonData.map(d => d.actual),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      }
    ]
  };

  const savingsTrendChart = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Savings',
        data: monthlyData.map(d => d.savings),
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
          }
        }
      },
    }
  };

  // Calculate key metrics
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData = monthlyData[monthlyData.length - 2];
  
  const incomeChange = previousMonthData ? 
    ((currentMonthData.income - previousMonthData.income) / previousMonthData.income * 100) : 0;
  const expenseChange = previousMonthData ? 
    ((currentMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses * 100) : 0;

  const totalBudget = budgetComparisonData.reduce((sum, d) => sum + d.budget, 0);
  const totalSpent = budgetComparisonData.reduce((sum, d) => sum + d.actual, 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Insights into your spending patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${currentMonthData.income.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className={`flex items-center mt-2 text-sm ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {incomeChange >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(incomeChange).toFixed(1)}% from last month
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${currentMonthData.expenses.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className={`flex items-center mt-2 text-sm ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {expenseChange <= 0 ? (
              <TrendingDown className="h-4 w-4 mr-1" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-1" />
            )}
            {Math.abs(expenseChange).toFixed(1)}% from last month
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Savings</p>
              <p className={`text-2xl font-bold ${currentMonthData.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(currentMonthData.savings).toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${currentMonthData.savings >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                currentMonthData.savings >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentMonthData.savings >= 0 ? '+' : '-'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {currentMonthData.savings >= 0 ? 'Positive cash flow' : 'Deficit spending'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Usage</p>
              <p className={`text-2xl font-bold ${budgetUtilization <= 100 ? 'text-blue-600' : 'text-red-600'}`}>
                {budgetUtilization.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            ${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Income vs Expenses Trend
          </h3>
          <div className="h-80">
            <Bar data={monthlyTrendChart} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-purple-600" />
            Expense Categories (This Month)
          </h3>
          {categoryData.length > 0 ? (
            <div className="h-80">
              <Pie data={categoryPieChart} options={pieChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No expense data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Budget vs Actual Spending
          </h3>
          {budgetComparisonData.length > 0 ? (
            <div className="h-80">
              <Bar data={budgetComparisonChart} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No budget data available
            </div>
          )}
        </div>

        {/* Savings Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Savings Trend
          </h3>
          <div className="h-80">
            <Line data={savingsTrendChart} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryData.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Top Spending Category</h4>
              <p className="text-sm text-blue-700">
                <strong>{categoryData[0][0]}</strong> accounts for ${categoryData[0][1].toFixed(2)} 
                of your monthly expenses
              </p>
            </div>
          )}

          {budgetComparisonData.some(d => d.actual > d.budget) && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Budget Alerts</h4>
              <p className="text-sm text-red-700">
                You're over budget in {budgetComparisonData.filter(d => d.actual > d.budget).length} categories
              </p>
            </div>
          )}

          {currentMonthData.savings > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Great Job!</h4>
              <p className="text-sm text-green-700">
                You saved ${currentMonthData.savings.toFixed(2)} this month
              </p>
            </div>
          )}

          {currentMonthData.savings < 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Consider</h4>
              <p className="text-sm text-yellow-700">
                Review your spending to reduce the deficit of ${Math.abs(currentMonthData.savings).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;