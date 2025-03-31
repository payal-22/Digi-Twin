import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { toast } from 'react-hot-toast';

const DeleteGoalModal = ({ isOpen, onClose, goal, onGoalDeleted }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!reason) {
      toast.error('Please provide a reason for deleting this goal');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const goalRef = doc(db, 'savingsGoals', goal.id);
      await deleteDoc(goalRef);
      
      // Show different toast based on progress
      if (goal.percentComplete === 100) {
        toast.success('Congratulations on achieving your goal! 🎉');
      } else if (goal.percentComplete > 50) {
        toast.success('You made good progress! Remember, every step counts.');
      } else {
        toast.success('Goal deleted. Don\'t worry, you can set new goals anytime!');
      }
      
      onGoalDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Delete Goal</h2>
        
        <p className="mb-4">
          Are you sure you want to delete <strong>{goal.name}</strong>?
        </p>

        <p className="mb-4 text-sm text-gray-700">
          Help us understand why you're deleting this goal. This feedback helps us improve your experience.
        </p>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
            Reason for deleting *
          </label>
          <select
            id="reason"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="">Select a reason...</option>
            <option value="completed">I completed this goal</option>
            <option value="not-relevant">This goal is no longer relevant</option>
            <option value="too-ambitious">This goal was too ambitious</option>
            <option value="changed-priorities">My priorities have changed</option>
            <option value="duplicate">This is a duplicate goal</option>
            <option value="other">Other reason</option>
          </select>
        </div>

        {/* Show encouraging message */}
        {goal.percentComplete > 0 && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
            <p className="text-sm">
              {goal.percentComplete === 100 ? (
                <span>🎉 Congratulations on achieving this goal! You've proven your commitment to your financial well-being.</span>
              ) : goal.percentComplete > 50 ? (
                <span>👏 You've made great progress on this goal! Remember that every step forward matters.</span>
              ) : (
                <span>💪 Every journey begins with a single step. Your progress matters, even if the goal changes.</span>
              )}
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGoalModal;