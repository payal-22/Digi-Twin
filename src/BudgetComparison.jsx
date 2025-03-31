import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const BudgetComparison = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for different months
  const monthColors = {
    current: "#4F46E5", // Indigo
    previous: "#8B5CF6", // Purple
    twoMonthsAgo: "#C4B5FD" // Light purple
  };

  useEffect(() => {
    const fetchMonthlyComparisonData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Get current date and previous months
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Calculate previous months
        const months = [];
        for (let i = 0; i < 3; i++) {
          let month = currentMonth - i;
          let year = currentYear;
          
          if (month < 0) {
            month += 12;
            year -= 1;
          }
          
          months.push({
            month: month + 1, // Convert to 1-12 format
            year,
            label: i === 0 ? 'current' : i === 1 ? 'previous' : 'twoMonthsAgo',
            name: new Date(year, month).toLocaleString('default', { month: 'short' })
          });
        }

        // Create category spending data for each month
        const monthlySpendingData = [];
        
        for (const monthInfo of months) {
          const expensesQuery = query(
            collection(db, 'expenses'),
            where('userId', '==', user.uid),
            where('month', '==', monthInfo.month),
            where('year', '==', monthInfo.year)
          );
          
          // If user is using transactions collection instead
          const transactionsQuery = query(
            collection(db, 'users', user.uid, 'transactions'),
            where('type', '==', 'expense')
          );
          
          const [expensesSnapshot, transactionsSnapshot] = await Promise.all([
            getDocs(expensesQuery),
            getDocs(transactionsQuery)
          ]);
          
          // Process both expenses and transactions
          const categoryMap = {};
          
          // Process expenses
          expensesSnapshot.forEach(doc => {
            const data = doc.data();
            const category = data.category || 'Other';
            
            if (!categoryMap[category]) {
              categoryMap[category] = 0;
            }
            categoryMap[category] += data.amount;
          });
          
          // Process transactions
          transactionsSnapshot.forEach(doc => {
            const data = doc.data();
            const transactionDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
            
            // Only include transactions from the specific month/year
            if (transactionDate.getMonth() + 1 === monthInfo.month && 
                transactionDate.getFullYear() === monthInfo.year) {
              const category = data.category || 'Other';
              
              if (!categoryMap[category]) {
                categoryMap[category] = 0;
              }
              categoryMap[category] += Math.abs(data.amount);
            }
          });
          
          const totalSpent = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0);
          
          monthlySpendingData.push({
            month: monthInfo.name,
            label: monthInfo.label,
            color: monthColors[monthInfo.label],
            categories: categoryMap,
            totalSpent
          });
        }
        
        setMonthlyData(monthlySpendingData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching budget comparison data:', error);
        setError("Failed to load comparison data");
        setLoading(false);
      }
    };

    fetchMonthlyComparisonData();
  }, []);

  // Get all unique categories across all months
  const getAllCategories = () => {
    const categories = new Set();
    monthlyData.forEach(month => {
      Object.keys(month.categories).forEach(category => {
        categories.add(category);
      });
    });
    return Array.from(categories);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Budget Comparison
        </div>
        <div className="animate-pulse flex flex-col">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Budget Comparison
        </div>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Handle case when user has no previous data
  const hasCurrentMonthData = monthlyData.length > 0 && monthlyData[0].totalSpent > 0;
  const hasPreviousMonthData = monthlyData.length > 1 && monthlyData[1].totalSpent > 0;
  const hasTwoMonthsAgoData = monthlyData.length > 2 && monthlyData[2].totalSpent > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Budget Comparison
      </div>
      
      {!hasCurrentMonthData && !hasPreviousMonthData && !hasTwoMonthsAgoData ? (
        <div className="text-center text-gray-500 py-4">
          No expense data available yet. Add expenses to see budget comparisons.
        </div>
      ) : (
        <>
          {/* Bar chart for total spending comparison */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Monthly Spending</h3>
            <div className="flex items-end h-40 gap-4">
              {monthlyData.map((data, index) => (
                data.totalSpent > 0 && (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full rounded-t transition-all"
                      style={{ 
                        backgroundColor: data.color, 
                        height: `${(data.totalSpent / Math.max(...monthlyData.map(m => m.totalSpent))) * 100}%`,
                        minHeight: '10px'
                      }}
                    ></div>
                    <div className="text-xs font-medium mt-1">{data.month}</div>
                    <div className="text-xs mt-1">${data.totalSpent.toFixed(2)}</div>
                  </div>
                )
              ))}
            </div>
          </div>
          
          {/* Category comparison */}
          <div>
            <h3 className="text-md font-medium mb-2">Category Breakdown</h3>
            <div className="space-y-4">
              {getAllCategories().map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{category}</span>
                  </div>
                  <div className="flex gap-2">
                    {monthlyData.map((monthData, monthIndex) => {
                      const amount = monthData.categories[category] || 0;
                      if (amount === 0) return null;
                      
                      return (
                        <div key={monthIndex} className="flex-1">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: monthData.color }}></div>
                            <span className="text-xs">{monthData.month}</span>
                          </div>
                          <div className="text-xs font-medium">${amount.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-end mt-4 gap-4">
            {monthlyData.map((data, index) => (
              data.totalSpent > 0 && (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: data.color }}></div>
                  <span className="text-xs">{data.month}</span>
                </div>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetComparison;