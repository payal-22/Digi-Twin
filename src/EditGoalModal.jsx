import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const EditGoalModal = ({ isOpen, onClose, onGoalUpdated, goal }) => {
  const [goalName, setGoalName] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Set initial form values when the goal prop changes
  useEffect(() => {
    if (goal) {
      setGoalName(goal.name || '');
      setSavedAmount(goal.saved ? goal.saved.toString() : '');
      setTargetAmount(goal.target ? goal.target.toString() : '');
    }
  }, [goal]);

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
        alert('You must be logged in to update a goal');
        return;
      }

      // Calculate the new percentage complete
      const newSaved = parseFloat(savedAmount);
      const newTarget = parseFloat(targetAmount);
      const percentComplete = Math.round((newSaved / newTarget) * 100);

      // Determine if this update completes the goal
      const isNewlyCompleted = percentComplete >= 100 && goal.percentComplete < 100;

      // Update the goal in Firestore
      await updateDoc(doc(db, 'savingsGoals', goal.id), {
        name: goalName,
        saved: newSaved,
        target: newTarget,
        percentComplete: percentComplete,
        // Only reset the 'celebrated' flag if the goal wasn't previously completed
        ...(isNewlyCompleted && { celebrated: false })
      });

      // Show success message with appropriate text
      if (newSaved > goal.saved) {
        const difference = (newSaved - goal.saved).toFixed(2);
        setUpdateMessage(`You've added $${difference} to your savings! 💰`);
      } else if (isNewlyCompleted) {
        setUpdateMessage("Congratulations! You've reached your goal! 🎉");
      } else {
        setUpdateMessage("Goal updated successfully!");
      }
      
      setShowSuccess(true);
      
      // Hide success message after a delay and close the modal
      setTimeout(() => {
        setShowSuccess(false);
        onGoalUpdated();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg w-96 max-w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-4">Success!</h2>
          <p className="mb-6">{updateMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Update Savings Goal</h2>
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
              placeholder="How much have you saved so far?"
              min="0"
              step="0.01"
              required
            />
            {goal && parseFloat(savedAmount) > goal.saved && (
              <div className="text-green-600 text-sm mt-1">
                +${(parseFloat(savedAmount) - goal.saved).toFixed(2)} from previous amount
              </div>
            )}
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
          {savedAmount && targetAmount && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700 mb-2">
                Progress: {Math.round((parseFloat(savedAmount) / parseFloat(targetAmount)) * 100)}%
              </div>
              <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-gray-200">
                <div
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full ${
                    parseFloat(savedAmount) >= parseFloat(targetAmount) ? 'bg-green-500' :
                    parseFloat(savedAmount) / parseFloat(targetAmount) > 0.66 ? 'bg-green-500' :
                    parseFloat(savedAmount) / parseFloat(targetAmount) > 0.33 ? 'bg-yellow-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(Math.round((parseFloat(savedAmount) / parseFloat(targetAmount)) * 100), 100)}%` }}>
                </div>
              </div>
            </div>
          )}
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
              Update Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;