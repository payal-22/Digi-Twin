import React, { useState } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ManualTransactionModal = ({ isOpen, onClose, onTransactionAdded }) => {
  const [transaction, setTransaction] = useState({
    type: 'expense',
    name: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paymentMethod: 'Other',
    isRecurring: false,
    recurringFrequency: 'monthly'
  });

  const [error, setError] = useState('');

  const categories = {
    expense: [
      'Housing', 'Food', 'Transport', 'Shopping', 
      'Entertainment', 'Utilities', 'Healthcare', 
      'Education', 'Other'
    ],
    income: [
      'Salary', 'Freelance', 'Investment', 
      'Rental', 'Other'
    ]
  };

  const paymentMethods = [
    'Cash', 'Credit Card', 'Debit Card', 
    'Bank Transfer', 'Digital Wallet', 'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTransaction(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!transaction.name || !transaction.amount || !transaction.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Process amount based on transaction type
      const processedAmount = transaction.type === 'expense' 
        ? -Math.abs(parseFloat(transaction.amount)) 
        : Math.abs(parseFloat(transaction.amount));

      // Prepare transaction object
      const transactionToSave = {
        ...transaction,
        amount: processedAmount,
        date: new Date(transaction.date),
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      // Save to Firestore
      await addDoc(collection(db, 'users', user.uid, 'transactions'), transactionToSave);

      // Reset and close
      onTransactionAdded && onTransactionAdded();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-[500px] max-w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Add Manual Transaction</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Transaction Type
            </label>
            <div className="flex">
              <button
                type="button"
                className={`w-1/2 py-2 ${transaction.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setTransaction(prev => ({...prev, type: 'expense', category: 'Other'}))}
              >
                Expense
              </button>
              <button
                type="button"
                className={`w-1/2 py-2 ${transaction.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setTransaction(prev => ({...prev, type: 'income', category: 'Salary'}))}
              >
                Income
              </button>
            </div>
          </div>

          {/* Transaction Name */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Transaction Name
            </label>
            <input
              type="text"
              name="name"
              value={transaction.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g. Grocery Shopping"
              required
              maxLength={100}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={transaction.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Category
            </label>
            <select
              name="category"
              value={transaction.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              {categories[transaction.type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={transaction.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={transaction.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={transaction.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Additional transaction details"
              maxLength={500}
            />
          </div>

          {/* Recurring Transaction */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isRecurring"
              checked={transaction.isRecurring}
              onChange={handleChange}
              className="mr-2"
            />
            <label>Is this a recurring transaction?</label>
          </div>

          {transaction.isRecurring && (
            <div>
              <label className="block mb-2 text-sm font-medium">
                Recurring Frequency
              </label>
              <select
                name="recurringFrequency"
                value={transaction.recurringFrequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualTransactionModal;