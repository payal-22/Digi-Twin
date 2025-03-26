import React, { useState, useEffect } from 'react';
import PieChart from './PieChart';
import Sidebar from './SideBar';
import AddGoalModal from './AddGoalModal';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import PlaidLink from './components/PlaidLink';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isPlaidConnected, setIsPlaidConnected] = useState(false);

  // Sample data for the charts and displays
  const monthlyData = {
    spent: 1245.30,
    budget: 2000.00,
    remaining: 754.70,
    percentSpent: 62.3
  };

  // Helper function for category colors
  const getCategoryColor = (category) => {
    const colors = {
      'Housing': '#44FF07',
      'Food': '#FED60A',
      'Transport': '#FB0007',
      'Shopping': '#3700FF',
      'Other': '#FB13F3'
    };
    return colors[category] || '#CCCCCC';
  };

  // Function to fetch savings goals
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

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Check if Plaid is connected
      const plaidDoc = await getDocs(
        query(collection(db, 'users', user.uid, 'plaid'), 
        where('access_token', '!=', null))
      );
      setIsPlaidConnected(!plaidDoc.empty);

      // Get recent transactions
      const transactionsQuery = query(
        collection(db, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(transactionsQuery);
      const fetchedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      setRecentExpenses(fetchedTransactions);

      // Get transactions for pie chart
      const allTransactionsQuery = query(
        collection(db, 'users', user.uid, 'transactions')
      );
      const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
      
      // Group by category
      const categoryMap = {};
      allTransactionsSnapshot.forEach((doc) => {
        const transaction = doc.data();
        const category = transaction.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + Math.abs(transaction.amount); });

      // Convert to array for PieChart
      const categoryData = Object.keys(categoryMap).map((category) => ({
        category,
        value: categoryMap[category],
        color: getCategoryColor(category)
      }));
      setExpenses(categoryData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch goals and transactions when component mounts
  useEffect(() => {
    fetchSavingsGoals();
    fetchTransactions();
  }, []);

  // Function to handle the "Add New Goal" button click
  const handleAddNewGoal = () => {
    setIsAddGoalModalOpen(true);
  };
 
  return (
    <div className="flex h-screen bg-gray-100 ">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
     
      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-10 overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-bold text-gray-800">
            February 2025
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg">
              Last updated: Today, 9:45 AM
            </div>
            <div className="bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-medium">
              ISH
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
                    <PieChart data={expenses} />
                  </div>
                </div>
                <div className="w-1/2 flex flex-col justify-center">
                  {expenses.map((item, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                      <div className="flex justify-between w-full">
                        <span>{item.category}</span>
                        <span className="font-medium">${item.value.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
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
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3" 
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      ></div>
                      <div>
                        <div className="font-medium">{expense.name}</div>
                        <div className="text-xs text-gray-500">{expense.category}</div>
                      </div>
                    </div>
                    <div className="text-gray-700 font-medium">
                      ${Math.abs(expense.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-indigo-600 mt-4 cursor-pointer font-medium hover:underline flex items-center justify-center text-center pt-2" onClick={() => setActiveTab('expenses')}>
                View All Expenses →
              </div>
            </div>
           
            {/* Savings Goals */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Savings Goals
              </div>
              <div className="space-y-6">
                {savingsGoals.map((goal) => (
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
                            goal.percentComplete > 66 ? 'bg-green-500' :
                            goal.percentComplete > 33 ? 'bg-yellow-500' : 'bg-red-400'
                          } transition-all duration-500`}
                          style={{ width: `${goal.percentComplete}%` }}>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {goal.percentComplete}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  className="bg-indigo-100 text-indigo-700 w-full py-2 rounded-lg hover:bg-indigo-200 transition-colors mt-2" 
                  onClick={handleAddNewGoal}
                >
                  + Add New Goal
                </button>
              </div>
            </div>

            {/* Plaid Connection */}
            {!isPlaidConnected && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="text-lg font-semibold mb-4">Connect Your Bank</div>
                <p className="mb-4">Connect your bank account to automatically track transactions.</p>
                <PlaidLink onSuccess={fetchTransactions} />
              </div>
            )}
          </div>
        )}
        <AddGoalModal 
          isOpen={isAddGoalModalOpen}
          onClose={() => setIsAddGoalModalOpen(false)}
          onGoalAdded={fetchSavingsGoals}
        />
       
        {activeTab !== 'dashboard' && (
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