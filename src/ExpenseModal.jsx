import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const [userCategories, setUserCategories] = useState(['Housing', 'Food', 'Transport', 'Shopping', 'Other']);
  const [expense, setExpense] = useState({
    name: '',
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    note: ''
  });

  useEffect(() => {
    // Fetch user's expense categories
    const fetchCategories = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists() && profileSnap.data().expenseCategories) {
          setUserCategories(profileSnap.data().expenseCategories);
          // Set default category if none selected yet
          if (!expense.category) {
            setExpense(prev => ({
              ...prev,
              category: profileSnap.data().expenseCategories[0]
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpense({
      ...expense,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Add expense document
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();
      const monthYear = `${month}-${year}`;
      
      // Add the expense to Firestore
      await addDoc(collection(db, 'expenses'), {
        userId: user.uid,
        name: expense.name,
        amount: parseFloat(expense.amount),
        category: expense.category,
        date: expenseDate,
        note: expense.note,
        month,
        year,
        createdAt: new Date()
      });

      // Update the monthly budget
      const budgetDocId = `${user.uid}_${monthYear}`;
      const budgetRef = doc(db, 'budgets', budgetDocId);
      const budgetSnap = await getDoc(budgetRef);
      
      if (budgetSnap.exists()) {
        // Update existing budget
        const budgetData = budgetSnap.data();
        const newSpent = (budgetData.spent || 0) + parseFloat(expense.amount);
        const newRemaining = budgetData.budget - newSpent;
        
        await updateDoc(budgetRef, {
          spent: newSpent,
          remaining: newRemaining
        });
      } else {
        // Get user's monthly budget from profile
        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        let monthlyBudget = 0;
        
        if (profileSnap.exists() && profileSnap.data().monthlyBudget) {
          monthlyBudget = profileSnap.data().monthlyBudget;
        }
        
        // Create new budget document with specific ID
        await setDoc(budgetRef, {
          userId: user.uid,
          month,
          year,
          budget: monthlyBudget,
          spent: parseFloat(expense.amount),
          remaining: monthlyBudget - parseFloat(expense.amount),
          createdAt: new Date()
        });
      }

      // Reset form and close modal
      setExpense({
        name: '',
        amount: '',
        category: userCategories[0],
        date: new Date().toISOString().slice(0, 10),
        note: ''
      });
      
      if (onExpenseAdded) onExpenseAdded();
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Expense</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Expense Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Name
              </label>
              <input
                type="text"
                name="name"
                value={expense.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="E.g., Grocery shopping"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  value={expense.amount}
                  onChange={handleChange}
                  className="w-full p-2 pl-7 border border-gray-300 rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={expense.category}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded bg-white"
                required
              >
                <option value="">Select a category</option>
                {userCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={expense.date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            {/* Note (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <textarea
                name="note"
                value={expense.note}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Add any additional details"
                rows="2"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;