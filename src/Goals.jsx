import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
  });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's goals from Firestore
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const goalsRef = collection(db, 'users', user.uid, 'goals');
        const goalsSnapshot = await getDocs(goalsRef);
        
        const goalsData = goalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGoals(goalsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching goals:", error);
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchGoals();
    }
  }, []);

  // Save new goal to Firestore
  const saveGoal = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const goalData = {
        name: newGoal.name,
        target: parseFloat(newGoal.target),
        saved: 0,
        percentComplete: 0,
        createdAt: serverTimestamp()
      };

      const goalsCollection = collection(db, 'users', user.uid, 'goals');
      const docRef = await addDoc(goalsCollection, goalData);
      
      setGoals([...goals, { id: docRef.id, ...goalData }]);
      setNewGoal({ name: '', target: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  // Delete a goal
  const deleteGoal = async (goalId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
      await deleteDoc(goalRef);

      setGoals(goals.filter(goal => goal.id !== goalId));
      setSelectedGoal(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Savings Goals</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Add New Goal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-2xl font-bold mb-2">No Savings Goals Yet</div>
          <div className="text-gray-600 mb-4">Create your first savings goal to start tracking!</div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            + Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goals List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Goals</h2>
            <div className="space-y-6">
              {goals.map((goal) => (
                <div 
                  key={goal.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedGoal && selectedGoal.id === goal.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedGoal(goal)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{goal.name}</div>
                    <div className="text-gray-700">
                      ${goal.saved?.toFixed(2) || '0.00'}/${goal.target?.toFixed(2)}
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-gray-200">
                      <div
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full ${
                          goal.percentComplete > 66 ? 'bg-green-500' :
                          goal.percentComplete > 33 ? 'bg-yellow-500' : 'bg-red-400'
                        } transition-all duration-500`}
                        style={{ width: `${goal.percentComplete || 0}%` }}>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {goal.percentComplete || 0}% complete
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Selected Goal Details */}
          {selectedGoal ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{selectedGoal.name}</h2>
                <button 
                  onClick={() => deleteGoal(selectedGoal.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors text-sm"
                >
                  Delete Goal
                </button>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-1">Target Amount</div>
                <div className="text-2xl font-bold">${selectedGoal.target?.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-3 mb-1">Saved So Far</div>
                <div className="text-xl font-semibold text-green-600">${selectedGoal.saved?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-gray-500 mt-3 mb-1">Remaining</div>
                <div className="text-lg font-medium">${(selectedGoal.target - (selectedGoal.saved || 0)).toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">👈</div>
                <div>Select a goal to view details</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Savings Goal</h2>
            <form onSubmit={saveGoal}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="New Shoes, Vacation, Laptop..."
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="700"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;