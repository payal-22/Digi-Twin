import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';

const ToDoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false);

  // Fetch user profile and tasks on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Set up a real-time listener for user profile changes
        const profileRef = doc(db, 'userProfiles', user.uid);
        const unsubscribe = onSnapshot(profileRef, (profileSnap) => {
          if (profileSnap.exists()) {
            const newProfileData = profileSnap.data();
            setUserProfile(newProfileData);
            setProfileUpdated(true);
          }
        });

        // Clean up the listener on component unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
    fetchTasks();
  }, []);

  // Set default due date for new task to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewTaskDueDate(formatDateForInput(tomorrow));
  }, []);

  // Automatically regenerate tasks when user profile is updated
  useEffect(() => {
    if (userProfile && profileUpdated) {
      // Reset the flag
      setProfileUpdated(false);
      
      // Automatically regenerate tasks based on updated profile without asking for confirmation
      resetMonthlyTasks();
    }
  }, [userProfile, profileUpdated]);

  // Generate default tasks based on user profile
  useEffect(() => {
    if (userProfile && tasks.length === 0 && !loading) {
      generateDefaultTasks();
    }
  }, [userProfile, loading]);

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Parse date from input to Date object
  const parseInputDate = (dateString) => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  // Fetch tasks from Firestore
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const tasksQuery = query(
        collection(db, 'financialTasks'),
        where('userId', '==', user.uid),
        where('month', '==', currentMonth),
        where('year', '==', currentYear)
      );
      
      const querySnapshot = await getDocs(tasksQuery);
      const tasksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTasks(tasksList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  // Generate default tasks based on user profile and preferences
  const generateDefaultTasks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const defaultTasks = [];

      // Add home loan task if user has a home loan
      if (userProfile.hasHomeLoan) {
        defaultTasks.push({
          userId: user.uid,
          task: 'Pay home loan EMI',
          completed: false,
          month: currentMonth,
          year: currentYear,
          createdAt: new Date(),
          dueDate: new Date(currentYear, currentMonth - 1, 5), // Due on 5th of month
          category: 'loan'
        });
      }

      // Add credit card payment task if user uses credit cards
      if (userProfile.usesCard && userProfile.creditCardType && userProfile.creditCardType.length > 0) {
        userProfile.creditCardType.forEach(cardType => {
          defaultTasks.push({
            userId: user.uid,
            task: `Pay ${cardType} credit card bill`,
            completed: false,
            month: currentMonth,
            year: currentYear,
            createdAt: new Date(),
            dueDate: new Date(currentYear, currentMonth - 1, 15), // Due on 15th of month
            category: 'credit'
          });
        });
      }

      // Add rent payment task if user pays rent
      if (userProfile.paysRent !== false) { // Default to true if undefined
        defaultTasks.push({
          userId: user.uid,
          task: 'Pay monthly rent',
          completed: false,
          month: currentMonth,
          year: currentYear,
          createdAt: new Date(),
          dueDate: new Date(currentYear, currentMonth - 1, 1), // Due on 1st of month
          category: 'housing'
        });
      }

      // Add utility bills tasks based on user preferences
      const utilityBills = userProfile.utilityBills || {
        electricity: true,
        internet: true,
        water: false,
        gas: false
      };

      // Utility bill due dates (arbitrary but spaced apart)
      const utilityDueDates = {
        electricity: 20,
        internet: 22,
        water: 25,
        gas: 28
      };

      Object.keys(utilityBills).forEach(utility => {
        if (utilityBills[utility]) {
          defaultTasks.push({
            userId: user.uid,
            task: `Pay ${utility} bill`,
            completed: false,
            month: currentMonth,
            year: currentYear,
            createdAt: new Date(),
            dueDate: new Date(currentYear, currentMonth - 1, utilityDueDates[utility]),
            category: 'utilities'
          });
        }
      });

      // Add savings reminder if enabled
      if (userProfile.hasSavingsGoalReminder && userProfile.savingsGoal > 0) {
        defaultTasks.push({
          userId: user.uid,
          task: `Transfer ₹${userProfile.savingsGoal} to savings account`,
          completed: false,
          month: currentMonth,
          year: currentYear,
          createdAt: new Date(),
          dueDate: new Date(currentYear, currentMonth - 1, 25), // Due on 25th of month
          category: 'savings'
        });
      }

      // Save default tasks to Firestore
      for (const task of defaultTasks) {
        await addDoc(collection(db, 'financialTasks'), task);
      }

      // Reload tasks from Firestore
      fetchTasks();
    } catch (error) {
      console.error('Error generating default tasks:', error);
    }
  };

  // Add a new task
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const dueDate = parseInputDate(newTaskDueDate);
      
      // Create new task document
      await addDoc(collection(db, 'financialTasks'), {
        userId: user.uid,
        task: newTask,
        completed: false,
        month: currentMonth,
        year: currentYear,
        createdAt: new Date(),
        dueDate: dueDate,
        category: 'custom' // Mark as custom task
      });
      
      setNewTask('');
      // Reset due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewTaskDueDate(formatDateForInput(tomorrow));
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      const taskRef = doc(db, 'financialTasks', taskId);
      await updateDoc(taskRef, {
        completed: !completed
      });
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'financialTasks', taskId);
      await deleteDoc(taskRef);
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Start editing a task
  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditText(task.task);
    
    // Format the date for the date input
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    setEditDueDate(formatDateForInput(dueDate));
  };

  // Save task edit
  const saveTaskEdit = async () => {
    if (!editText.trim()) return;
    
    try {
      const taskRef = doc(db, 'financialTasks', editingTask);
      const dueDate = parseInputDate(editDueDate);
      
      await updateDoc(taskRef, {
        task: editText,
        dueDate: dueDate
      });
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === editingTask ? { ...task, task: editText, dueDate: dueDate } : task
      ));
      
      setEditingTask(null);
      setEditText('');
      setEditDueDate('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Format the due date for display
  const formatDueDate = (date) => {
    if (!date) return 'No due date';
    
    const dueDate = date.toDate ? date.toDate() : new Date(date);
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate if task is overdue
  const isOverdue = (date) => {
    if (!date) return false;
    
    const dueDate = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return dueDate < today;
  };

  // Get category icon based on task category
  const getCategoryIcon = (task) => {
    // Try to identify category from task object first
    if (task.category) {
      switch (task.category) {
        case 'loan': return '🏦';
        case 'credit': return '💳';
        case 'housing': return '🏠';
        case 'utilities': return '💡';
        case 'savings': return '💰';
        case 'custom': return '✅';
        default: return '📌';
      }
    }
    
    // Fallback: Try to guess category from task text
    const taskText = task.task.toLowerCase();
    if (taskText.includes('loan') || taskText.includes('emi')) return '🏦';
    if (taskText.includes('credit') || taskText.includes('card')) return '💳';
    if (taskText.includes('rent') || taskText.includes('mortgage')) return '🏠';
    if (
      taskText.includes('electric') || 
      taskText.includes('water') || 
      taskText.includes('gas') || 
      taskText.includes('internet') || 
      taskText.includes('bill')
    ) return '💡';
    if (taskText.includes('saving') || taskText.includes('transfer')) return '💰';
    
    return '📌';
  };

  // Cancel task editing
  const cancelEditTask = () => {
    setEditingTask(null);
    setEditText('');
    setEditDueDate('');
  };

  // Reset all monthly tasks
  const resetMonthlyTasks = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Delete all current month's tasks
      const tasksQuery = query(
        collection(db, 'financialTasks'),
        where('userId', '==', user.uid),
        where('month', '==', currentMonth),
        where('year', '==', currentYear)
      );
      
      const querySnapshot = await getDocs(tasksQuery);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setTasks([]);
      
      // Generate new tasks based on current preferences
      await generateDefaultTasks();
      
    } catch (error) {
      console.error('Error resetting tasks:', error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-xl font-bold mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">📋</span>
          Financial Tasks
        </div>
        
        {!loading && (
          <button
            onClick={resetMonthlyTasks}
            className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors flex items-center"
          >
            <span className="mr-1">🔄</span> Refresh Tasks
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your tasks...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <form onSubmit={addTask} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new financial task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center">
                <label className="mr-2 text-gray-600">Due date:</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </form>
          </div>
          
          <div className="overflow-y-auto max-h-[60vh]">
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`border ${task.completed ? 'border-green-200 bg-green-50' : isOverdue(task.dueDate) ? 'border-red-200 bg-red-50' : 'border-gray-200'} rounded-md p-3 flex items-center justify-between group transition-all`}
                  >
                    {editingTask === task.id ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Due date:</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditTask}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveTaskEdit}
                            className="px-2 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id, task.completed)}
                            className="h-5 w-5 text-indigo-600 rounded"
                          />
                          <span className={`${task.completed ? 'line-through text-gray-500' : ''} flex-1`}>
                            {task.task}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isOverdue(task.dueDate) && !task.completed ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            Due: {formatDueDate(task.dueDate)}
                          </span>
                          
                          <button
                            onClick={() => startEditTask(task)}
                            className="text-gray-400 hover:text-indigo-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Edit task"
                            title="Edit task"
                          >
                            ✏️
                          </button>
                          
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete task"
                            title="Delete task"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No financial tasks for this month. Add your first task!</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <p className="mb-2">
              <span className="font-medium">Note:</span> Tasks will automatically reset at the start of each month.
            </p>
            <p>
              Visit the Settings page to customize your recurring financial tasks and due dates.
            </p>
            {tasks.length > 0 && (
              <p className="mt-2">
                <button
                  onClick={resetMonthlyTasks}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center mt-2"
                >
                  <span className="mr-1">🔄</span> Regenerate tasks based on current settings
                </button>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ToDoList;