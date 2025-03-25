import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const AddGoalModal = ({ isOpen, onClose, onGoalAdded }) => {
  const [goalName, setGoalName] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!goalName || !savedAmount || !targetAmount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to add a goal');
        return;
      }

      // Add new goal to Firestore
      const goalRef = await addDoc(collection(db, 'savingsGoals'), {
        userId: user.uid,
        name: goalName,
        saved: parseFloat(savedAmount),
        target: parseFloat(targetAmount),
        percentComplete: Math.round((parseFloat(savedAmount) / parseFloat(targetAmount)) * 100),
        createdAt: new Date()
      });

      // Reset form
      setGoalName('');
      setSavedAmount('');
      setTargetAmount('');

      // Call the callback to update parent component
      onGoalAdded();
      onClose();
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Savings Goal</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Goal Purpose</label>
            <input 
              type="text" 
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Emergency Fund, Vacation"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Amount Saved</label>
            <input 
              type="number" 
              value={savedAmount}
              onChange={(e) => setSavedAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="How much have you saved?"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Total Target Amount</label>
            <input 
              type="number" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What's your total savings goal?"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="flex justify-between">
            <button 
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;