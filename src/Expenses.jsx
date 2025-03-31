import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import ManualTransactionModal from './ManualTransaction';

const Expenses = ({ onAddExpenseClick, expenseColors, onExpenseAdded }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'thisMonth', 'lastMonth'
  const [sortBy, setSortBy] = useState('dateDesc'); // 'dateDesc', 'dateAsc', 'amountDesc', 'amountAsc'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  // Fetch all expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      let expensesQuery;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Apply date filter
      if (filter === 'thisMonth') {
        expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        );
      } else if (filter === 'lastMonth') {
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid),
          where('month', '==', lastMonth),
          where('year', '==', lastMonthYear)
        );
      } else {
        // All expenses
        expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid)
        );
      }
      
      const querySnapshot = await getDocs(expensesQuery);
      
      let expensesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          amount: data.amount,
          category: data.category,
          date: data.date.toDate(),
          notes: data.notes || '',
          paymentMethod: data.paymentMethod || 'Other'
        };
      });
      
      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        expensesData = expensesData.filter(expense => expense.category === categoryFilter);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'dateAsc':
          expensesData.sort((a, b) => a.date - b.date);
          break;
        case 'amountDesc':
          expensesData.sort((a, b) => b.amount - a.amount);
          break;
        case 'amountAsc':
          expensesData.sort((a, b) => a.amount - b.amount);
          break;
        case 'dateDesc':
        default:
          expensesData.sort((a, b) => b.date - a.date);
          break;
      }
      
      // Assign colors to categories
      const uniqueCategories = [...new Set(expensesData.map(expense => expense.category))];
      setCategories(['all', ...uniqueCategories]);
      
      // Assign colors to expenses based on category
      expensesData = expensesData.map(expense => {
        const categoryIndex = uniqueCategories.indexOf(expense.category);
        const color = expenseColors[categoryIndex % expenseColors.length];
        return {
          ...expense,
          color
        };
      });
      
      setExpenses(expensesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filter, sortBy, categoryFilter]);

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        await deleteDoc(doc(db, 'expenses', expenseId));
        
        // Refresh expenses list
        fetchExpenses();
        
        // Notify parent component that expense was deleted
        if (onExpenseAdded) {
          onExpenseAdded();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleManualTransactionClick = () => {
    setIsAddTransactionModalOpen(true);
  };

  const handleTransactionAdded = () => {
    fetchExpenses();
    if (onExpenseAdded) {
      onExpenseAdded();
    }
  };

  // Calculate total expenses for the current filter
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={handleManualTransactionClick}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">+</span> Manual Transaction
          </button>
          <button
            onClick={onAddExpenseClick}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">+</span> Add Expense
          </button>
        </div>
      </div>
      
      {/* Summary Card */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">Total Expenses</h2>
            <p className="text-sm text-gray-600">
              {filter === 'thisMonth' ? 'This Month' : 
               filter === 'lastMonth' ? 'Last Month' : 'All Time'}
              {categoryFilter !== 'all' ? ` • ${categoryFilter}` : ''}
            </p>
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            ${Math.abs(totalExpenses).toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Time Period</label>
          <select
            className="border rounded-md px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select
            className="border rounded-md px-3 py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dateDesc">Newest First</option>
            <option value="dateAsc">Oldest First</option>
            <option value="amountDesc">Highest Amount</option>
            <option value="amountAsc">Lowest Amount</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="border rounded-md px-3 py-2"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Payment Method</th>
              <th className="py-3 px-4 text-left">Amount</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Loading expenses...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No expenses found. Add your first expense!
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{formatDate(expense.date)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: expense.color }}></div>
                      <span>{expense.name}</span>
                    </div>
                    {expense.notes && <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>}
                  </td>
                  <td className="py-3 px-4">{expense.category}</td>
                  <td className="py-3 px-4">{expense.paymentMethod}</td>
                  <td className="py-3 px-4 font-medium">${Math.abs(expense.amount).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination - Basic implementation */}
      {expenses.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              disabled={true} // Would be implemented with actual pagination logic
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              disabled={true} // Would be implemented with actual pagination logic
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Manual Transaction Modal */}
      <ManualTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />
    </div>
  );
};

export default Expenses;