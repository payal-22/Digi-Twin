import React, { useState, useEffect } from 'react';
import PieChart from './PieChart.jsx';
import Sidebar from './SideBar.jsx';
import SIPCaluclator from './SIPCalculator.jsx';
import ToDoList from './ToDoList.jsx';
import Settings from './Settings.jsx';
import Expenses from './Expenses.jsx'; 
import BudgetComparison from './BudgetComparison.jsx';
import Goals from './Goals.jsx';
import AddGoalModal from './AddGoalModal.jsx';
import EditGoalModal from './EditGoalModal.jsx';
import AddExpenseModal from './ExpenseModal.jsx';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [monthlyData, setMonthlyData] = useState({
    spent: 0,
    budget: 0,
    remaining: 0,
    percentSpent: 0
  });
  const [expenses, setExpenses] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = [
    "#44FF07", "#FED60A", "#FB0007", "#3700FF", "#FB13F3", 
    "#00C6FF", "#FF8A00", "#A200FF", "#FF006A", "#00FF88"
  ];

  // Check if user has completed setup
  useEffect(() => {
    const checkUserSetup = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          // User hasn't completed setup - redirect to setup page
          navigate('/setup');
        } else {
          setUserProfile(profileSnap.data());
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };

    checkUserSetup();
  }, [navigate]);

  // Fetch current month's budget data
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const monthYear = `${month}-${year}`;
        
        const budgetRef = doc(db, 'budgets', `${user.uid}_${monthYear}`);
        const budgetSnap = await getDoc(budgetRef);
        
        if (budgetSnap.exists()) {
          const data = budgetSnap.data();
          setMonthlyData({
            spent: data.spent || 0,
            budget: data.budget || 0,
            remaining: data.remaining || data.budget || 0,
            percentSpent: data.budget ? Math.round((data.spent / data.budget) * 100) : 0
          });
        } else if (userProfile) {
          // Create default using user's monthly budget
          setMonthlyData({
            spent: 0,
            budget: userProfile.monthlyBudget || 0,
            remaining: userProfile.monthlyBudget || 0,
            percentSpent: 0
          });
        }
      } catch (error) {
        console.error('Error fetching budget data:', error);
      }
    };

    if (userProfile) {
      fetchBudgetData();
    }
  }, [userProfile]);

  // Fetch expense category data for current month
  const fetchCategoryData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        where('month', '==', currentMonth),
        where('year', '==', currentYear)
      );
      
      const querySnapshot = await getDocs(expensesQuery);
      
      // Group expenses by category
      const categoryMap = {};
      querySnapshot.forEach(doc => {
        const expenseData = doc.data();
        const category = expenseData.category;
        
        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }
        categoryMap[category] += expenseData.amount;
      });
      
      // Convert to array format for pie chart
      const categoryData = Object.keys(categoryMap).map((category, index) => ({
        category: category,
        value: categoryMap[category],
        color: colors[index % colors.length]
      }));
      
      setExpenses(categoryData);
    } catch (error) {
      console.error('Error fetching category data:', error);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchCategoryData();
    }
  }, [userProfile]);

  // Fetch recent expenses - limit to 4 for dashboard display
  const fetchRecentExpenses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Modified to explicitly order by date descending to ensure most recent are at top
      const recentQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(4)
      );
      
      const querySnapshot = await getDocs(recentQuery);
      const recentData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Find the color assigned to this category
        const categoryObj = expenses.find(e => e.category === data.category);
        const color = categoryObj ? categoryObj.color : colors[0];
        
        return {
          id: doc.id,
          name: data.name,
          amount: data.amount,
          category: data.category,
          date: data.date.toDate(),
          color: color
        };
      });
      
      setRecentExpenses(recentData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent expenses:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0) {
      fetchRecentExpenses();
    }
  }, [expenses]);

  // Fetch savings goals - limited to 4 for dashboard display
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  // Handle Add Expense button click (from Sidebar)
  const handleAddExpense = () => {
    setIsAddExpenseModalOpen(true);
  };

  // Function to handle the "Add New Goal" button click
  const handleAddNewGoal = () => {
    setIsAddGoalModalOpen(true);
  };

  // Navigate to Goals page
  const navigateToGoals = () => {
    setActiveTab('goals');
  };

  // Function to refresh data after adding expense
  const handleExpenseAdded = () => {
    // Refetch all data
    if (userProfile) {
      // Fetch budget data
      const fetchBudgetData = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
  
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          const monthYear = `${month}-${year}`;
          
          const budgetRef = doc(db, 'budgets', `${user.uid}_${monthYear}`);
          const budgetSnap = await getDoc(budgetRef);
          
          if (budgetSnap.exists()) {
            const data = budgetSnap.data();
            setMonthlyData({
              spent: data.spent || 0,
              budget: data.budget || 0,
              remaining: data.remaining || data.budget || 0,
              percentSpent: data.budget ? Math.round((data.spent / data.budget) * 100) : 0
            });
          }
        } catch (error) {
          console.error('Error fetching budget data:', error);
        }
      };
  
      fetchBudgetData();
      fetchCategoryData();
      // Immediately fetch recent expenses to show new additions
      fetchRecentExpenses();
    }
  };
  
  // Get current month name and year for display
  const getCurrentMonthYear = () => {
    const date = new Date();
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with Add Expense button handler */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddExpenseClick={handleAddExpense}
      />
     
      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-bold text-gray-800">
            {getCurrentMonthYear()}
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg">
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-medium">
              {userProfile?.initials || "U"}
            </div>
          </div>
        </div>
       
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Month Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📅</span>
                Month Overview
              </div>
              <div className="text-green-600 text-2xl font-bold mb-2">
                ${monthlyData.remaining.toFixed(2)} left to spend
              </div>
              <div className="text-gray-600 mb-2 flex justify-between">
                <span>Spent:</span>
                <span className="font-medium">${monthlyData.spent.toFixed(2)}</span>
              </div>
              <div className="text-gray-600 mb-4 flex justify-between">
                <span>Budget:</span>
                <span className="font-medium">${monthlyData.budget.toFixed(2)}</span>
              </div>
              <div className="pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {monthlyData.percentSpent}% Spent
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${monthlyData.percentSpent}%` }}>
                  </div>
                </div>
              </div>
            </div>
           
            {/* Category Spending */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Category Spending
              </div>
              <div className="flex mb-4">
                <div className="w-1/2">
                  <div className="flex flex-col items-center">
                    <h2 className="text-lg font-semibold">Expense Breakdown</h2>
                    {expenses.length > 0 ? (
                      <PieChart data={expenses} />
                    ) : (
                      <div className="text-gray-500 mt-4">No expenses yet</div>
                    )}
                  </div>
                </div>
                <div className="w-1/2 flex flex-col justify-center">
                  {expenses.length > 0 ? (
                    expenses.map((item, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <div className="flex justify-between w-full">
                          <span>{item.category}</span>
                          <span className="font-medium">${item.value.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">Add expenses to see your spending breakdown</div>
                  )}
                </div>
              </div>
            </div>
           
            {/* Recent Expenses */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">💸</span>
                Recent Expenses
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-gray-500 py-4">
                    Loading recent expenses...
                  </div>
                ) : recentExpenses.length > 0 ? (
                  recentExpenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: expense.color }}></div>
                        <div>
                          <div className="font-medium">{expense.name}</div>
                          <div className="text-xs text-gray-500">{expense.category}</div>
                        </div>
                      </div>
                      <div className="text-gray-700 font-medium">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No recent expenses. Add your first expense!
                  </div>
                )}
              </div>
              {recentExpenses.length > 0 && (
                <div 
                  className="text-indigo-600 mt-4 cursor-pointer font-medium hover:underline flex items-center justify-center text-center pt-2" 
                  onClick={() => setActiveTab('expenses')}
                >
                  View All Expenses →
                </div>
              )}
              <button 
                className="bg-green-500 hover:bg-green-600 text-white w-full py-2 rounded-lg mt-4 transition-colors flex items-center justify-center" 
                onClick={handleAddExpense}
              >
                <span className="mr-2">+</span> Add New Expense
              </button>
            </div>
           
           {/* Savings Goals - Limited to 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Savings Goals
              </div>
              <div className="space-y-6">
                {savingsGoals.length > 0 ? (
                  savingsGoals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{goal.name}</div>
                        <div className="text-gray-700">
                          ${goal.saved.toFixed(0)}/${goal.target.toFixed(0)}
                        </div>
                      </div>
                      <div className="pt-1">
                        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-gray-200">
                          <div
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full ${
                              goal.percentComplete >= 100 ? 'bg-green-500' :
                              goal.percentComplete > 66 ? 'bg-green-500' :
                              goal.percentComplete > 33 ? 'bg-yellow-500' : 'bg-red-400'
                            } transition-all duration-500`}
                            style={{ width: `${Math.min(goal.percentComplete, 100)}%` }}>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {goal.percentComplete}% complete
                          </span>
                          {goal.percentComplete >= 100 && (
                            <span className="text-xs text-green-600 font-medium flex items-center">
                              <span className="animate-bounce mr-1">🎉</span> Complete!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No savings goals yet. Create your first goal!
                  </div>
                )}
                {savingsGoals.length > 4 ? (
                  <div className="flex gap-2">
                    <button 
                      className="bg-indigo-100 text-indigo-700 w-full py-2 rounded-lg hover:bg-indigo-200 transition-colors" 
                      onClick={navigateToGoals}
                    >
                      View All Goals ({savingsGoals.length})
                    </button>
                    <button 
                      className="bg-indigo-600 text-white w-1/3 py-2 rounded-lg hover:bg-indigo-700 transition-colors" 
                      onClick={handleAddNewGoal}
                    >
                      + Add
                    </button>
                  </div>
                ) : (
                  <button 
                    className="bg-indigo-100 text-indigo-700 w-full py-2 rounded-lg hover:bg-indigo-200 transition-colors" 
                    onClick={handleAddNewGoal}
                  >
                    + Add New Goal
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
              
       
        {/* Tasks Tab View */}
        {activeTab === 'tasks' && (
          <ToDoList />
        )}
        
        {/* Settings Tab View */}
        {activeTab === 'settings' && (
          <Settings />
        )}
        
        {/* SIP Calculator Tab View */}
        {activeTab === 'SIPCalculator' && (
          <SIPCaluclator />
        )}
        
        {/* Expenses Tab View */}
        {activeTab === 'expenses' && (
          <Expenses
            onAddExpenseClick={handleAddExpense}
            expenseColors={colors}
            onExpenseAdded={handleExpenseAdded}
          />
        )}
        
        {/* Budget Tab View */}
        {activeTab === 'budget' && (
          <BudgetComparison />
        )}

        {/* Goals Tab View */}
        {activeTab === 'goals' && (
          <Goals />
        )}
        
        {/* Modals */}
        <AddGoalModal 
          isOpen={isAddGoalModalOpen}
          onClose={() => setIsAddGoalModalOpen(false)}
          onGoalAdded={fetchSavingsGoals}
        />
        
        <AddExpenseModal 
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          onExpenseAdded={handleExpenseAdded}
        />
       
        {activeTab !== 'dashboard' && 
         activeTab !== 'SIPCalculator' && 
         activeTab !== 'tasks' && 
         activeTab !== 'settings' &&
         activeTab !== 'expenses' &&
         activeTab !== 'budget' &&
         activeTab !== 'goals' && (
          <div className="bg-white p-10 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🚧</div>
            <div className="text-2xl font-bold mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View</div>
            <div className="text-gray-600">This section is under construction. Please check back later!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;