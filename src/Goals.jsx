import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AddGoalModal from './AddGoalModal';

const Goals = () => {
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);

  // Function to fetch savings goals from Firestore
  const fetchSavingsGoals = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const goalsQuery = query(
        collection(db, 'savingsGoals'), 
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(goalsQuery);
      const fetchedGoals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSavingsGoals(fetchedGoals);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    }
  };

  // Fetch goals when component mounts
  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Savings Goals</h1>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          onClick={() => setIsAddGoalModalOpen(true)}
        >
          + Add New Goal
        </button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-2xl font-bold mb-2">No Savings Goals Yet</div>
          <div className="text-gray-600">
            Start tracking your financial dreams by adding a new goal!
          </div>
          <button 
            className="mt-4 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200"
            onClick={() => setIsAddGoalModalOpen(true)}
          >
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsGoals.map((goal) => (
            <div 
              key={goal.id} 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{goal.name}</h2>
                <span className="text-sm text-gray-500">
                  {goal.percentComplete}% Complete
                </span>
              </div>
              <div className="mb-4">
                <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-gray-200">
                  <div
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full ${
                      goal.percentComplete > 66 ? 'bg-green-500' :
                      goal.percentComplete > 33 ? 'bg-yellow-500' : 'bg-red-400'
                    } transition-all duration-500`}
                    style={{ width: `${goal.percentComplete}%` }}>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Saved: ${goal.saved.toFixed(2)}</span>
                  <span>Target: ${goal.target.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal 
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onGoalAdded={fetchSavingsGoals}
      />
    </div>
  );
};

export default Goals;