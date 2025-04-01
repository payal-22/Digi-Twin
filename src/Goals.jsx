import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import AddGoalModal from './AddGoalModal';
import EditGoalModal from './EditGoalModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const Goals = () => {
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [celebratingGoalId, setCelebratingGoalId] = useState(null);

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
      
      // Check for any goals that reached 100%
      const newlyCompletedGoal = fetchedGoals.find(goal => 
        goal.percentComplete === 100 && !goal.celebrated
      );
      
      if (newlyCompletedGoal) {
        setCelebratingGoalId(newlyCompletedGoal.id);
        // Mark as celebrated in Firestore
        updateDoc(doc(db, 'savingsGoals', newlyCompletedGoal.id), {
          celebrated: true
        });
      }
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    }
  };

  // Fetch goals when component mounts
  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  // Handle edit goal
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setIsEditGoalModalOpen(true);
  };

  // Handle delete goal
  const handleDeleteGoal = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  // Function to delete a goal from Firestore
  const confirmDeleteGoal = async (reason) => {
    try {
      await deleteDoc(doc(db, 'savingsGoals', selectedGoal.id));
      fetchSavingsGoals(); // Refresh goals list
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Function to dismiss celebration
  const dismissCelebration = () => {
    setCelebratingGoalId(null);
  };

  // Determine which goals to display
  const displayedGoals = showAllGoals ? savingsGoals : savingsGoals.slice(0, 4);

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Celebration Modal */}
      {celebratingGoalId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md text-center relative overflow-hidden">
            <div className="confetti absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i}
                  className="confetti-piece"
                  style={{
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    background: ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'][i % 6],
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: Math.random(),
                    animation: `fall-${i} 3s linear infinite`
                  }}
                />
              ))}
            </div>
            
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-green-600">Goal Completed!</h2>
            <p className="text-xl mb-6">
              Congratulations! You've reached your savings goal:
              <br />
              <span className="font-bold mt-2 block">
                {savingsGoals.find(g => g.id === celebratingGoalId)?.name}
              </span>
            </p>
            <button 
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all"
              onClick={dismissCelebration}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedGoals.map((goal) => (
              <div 
                key={goal.id} 
                className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{goal.name}</h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditGoal(goal)}
                      className="text-gray-500 hover:text-indigo-600 transition-colors"
                      title="Edit Goal"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteGoal(goal)}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete Goal"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-gray-200">
                    <div
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full ${
                        goal.percentComplete >= 100 ? 'bg-green-500' :
                        goal.percentComplete > 66 ? 'bg-green-500' :
                        goal.percentComplete > 33 ? 'bg-yellow-500' : 'bg-red-400'
                      } transition-all duration-500`}
                      style={{ width: `${Math.min(goal.percentComplete, 100)}%` }}>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Saved: ₹{goal.saved.toFixed(2)}</span>
                    <span>Target: ₹{goal.target.toFixed(2)}</span>
                  </div>
                  
                  {goal.percentComplete >= 100 && (
                    <div className="mt-2 text-green-600 font-medium text-center">
                      <span className="inline-block animate-bounce mr-1">🎉</span>
                      Goal Reached!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {savingsGoals.length > 4 && (
            <div className="mt-6 text-center">
              <button 
                className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
                onClick={() => setShowAllGoals(!showAllGoals)}
              >
                {showAllGoals ? 'Show Less' : `View All Goals (${savingsGoals.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal 
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onGoalAdded={fetchSavingsGoals}
      />
      
      {/* Edit Goal Modal */}
      {selectedGoal && (
        <EditGoalModal 
          isOpen={isEditGoalModalOpen}
          onClose={() => setIsEditGoalModalOpen(false)}
          onGoalUpdated={fetchSavingsGoals}
          goal={selectedGoal}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {selectedGoal && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteGoal}
          goalName={selectedGoal.name}
        />
      )}
      
      {/* Add this style for the confetti animation */}
      <style jsx>{`
        @keyframes fall-0 { to { transform: translateY(100vh) rotate(720deg); } }
        @keyframes fall-1 { to { transform: translateY(100vh) rotate(720deg); } }
        /* Add more keyframes as needed */
      `}</style>
    </div>
  );
};

export default Goals;