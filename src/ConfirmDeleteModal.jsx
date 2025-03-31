import React, { useState } from 'react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, goalName }) => {
  const [reason, setReason] = useState('');
  const [showEncouragement, setShowEncouragement] = useState(false);
  const encouragementMessages = [
    "That's alright! Financial priorities change, and it's smart to adapt.",
    "No worries! Setting new goals is part of the financial journey.",
    "It's okay to change course. What matters is staying committed to your financial wellbeing.",
    "Sometimes we need to realign our goals. You're still making great progress!"
  ];
  
  const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];

  const handleDelete = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deleting this goal');
      return;
    }
    
    setShowEncouragement(true);
    setTimeout(() => {
      onConfirm(reason);
      setReason('');
      setShowEncouragement(false);
    }, 3000);
  };

  if (!isOpen) return null;

  if (showEncouragement) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg w-96 max-w-full text-center">
          <div className="text-4xl mb-4">💪</div>
          <h2 className="text-xl font-bold mb-4">That's okay!</h2>
          <p className="mb-6">{randomEncouragement}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4 text-center">Delete Goal</h2>
        <p className="mb-4">
          Are you sure you want to delete the goal: <span className="font-semibold">{goalName}</span>?
        </p>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Why are you removing this goal? (required)
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select a reason...</option>
            <option value="completed">Goal was completed!</option>
            <option value="changed-priorities">Changed my financial priorities</option>
            <option value="no-longer-needed">No longer needed</option>
            <option value="created-by-mistake">Created by mistake</option>
            <option value="other">Other reason</option>
          </select>
          
          {reason === 'other' && (
            <textarea
              placeholder="Please specify..."
              className="w-full px-3 py-2 border rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="2"
              onChange={(e) => setReason(e.target.value !== 'other' ? e.target.value : reason)}
            ></textarea>
          )}
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
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Delete Goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;