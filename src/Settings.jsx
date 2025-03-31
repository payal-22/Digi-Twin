import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [taskPreferences, setTaskPreferences] = useState({
    hasHomeLoan: false,
    usesCard: false,
    creditCardType: [],
    paysRent: true,
    utilityBills: {
      electricity: true,
      internet: true,
      water: false,
      gas: false
    },
    savingsGoal: 0,
    hasSavingsGoalReminder: false
  });
  const [hasSaved, setHasSaved] = useState(false);

  // Fetch user preferences on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setUserProfile(profileData);
          
          // Set task preferences based on the user profile
          setTaskPreferences({
            hasHomeLoan: profileData.hasHomeLoan || false,
            usesCard: profileData.usesCard || false,
            creditCardType: profileData.creditCardType || [],
            paysRent: profileData.paysRent !== undefined ? profileData.paysRent : true,
            utilityBills: profileData.utilityBills || {
              electricity: true,
              internet: true,
              water: false,
              gas: false
            },
            savingsGoal: profileData.savingsGoal || 0,
            hasSavingsGoalReminder: profileData.hasSavingsGoalReminder !== undefined 
              ? profileData.hasSavingsGoalReminder 
              : Boolean(profileData.savingsGoal)
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle credit card selection
  const handleCreditCardToggle = (cardType) => {
    setTaskPreferences(prev => {
      const updatedCards = [...prev.creditCardType];
      
      if (updatedCards.includes(cardType)) {
        // Remove card if it exists
        const index = updatedCards.indexOf(cardType);
        updatedCards.splice(index, 1);
      } else {
        // Add card if it doesn't exist
        updatedCards.push(cardType);
      }

      return {
        ...prev,
        creditCardType: updatedCards,
        usesCard: updatedCards.length > 0
      };
    });
  };

  // Handle utility bill toggle
  const handleUtilityToggle = (utilityType) => {
    setTaskPreferences(prev => ({
      ...prev,
      utilityBills: {
        ...prev.utilityBills,
        [utilityType]: !prev.utilityBills[utilityType]
      }
    }));
  };

  // Handle general toggle inputs
  const handleToggleChange = (field) => {
    setTaskPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle savings goal input
  const handleSavingsGoalChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTaskPreferences(prev => ({
      ...prev,
      savingsGoal: value
    }));
  };

  // Save preferences to Firestore
  const savePreferences = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const profileRef = doc(db, 'userProfiles', user.uid);
      
      // Update user profile with task preferences
      await updateDoc(profileRef, {
        hasHomeLoan: taskPreferences.hasHomeLoan,
        usesCard: taskPreferences.usesCard,
        creditCardType: taskPreferences.creditCardType,
        paysRent: taskPreferences.paysRent,
        utilityBills: taskPreferences.utilityBills,
        savingsGoal: taskPreferences.savingsGoal,
        hasSavingsGoalReminder: taskPreferences.hasSavingsGoalReminder
      });
      
      setSaving(false);
      setHasSaved(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setHasSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <span className="mr-2">⚙️</span>
          Account Settings
        </h2>
        
        <form onSubmit={savePreferences}>
          {/* Task Notification Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Financial Task Notifications</h3>
            <p className="text-gray-600 mb-4">
              Customize which financial task reminders you'd like to see in your monthly to-do list.
            </p>
            
            <div className="space-y-4 pl-1">
              {/* Home Loan */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">Home Loan EMI Reminders</p>
                  <p className="text-sm text-gray-500">Notify me about home loan payment dates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={taskPreferences.hasHomeLoan}
                    onChange={() => handleToggleChange('hasHomeLoan')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              {/* Credit Cards */}
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Credit Card Bill Reminders</p>
                    <p className="text-sm text-gray-500">Notify me about credit card payment due dates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={taskPreferences.usesCard}
                      onChange={() => handleToggleChange('usesCard')}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                {taskPreferences.usesCard && (
                  <div className="ml-6 mt-3 space-y-2">
                    <p className="text-sm text-gray-600 mb-2">Select your credit cards:</p>
                    {['Visa', 'Mastercard', 'American Express', 'Discover'].map(card => (
                      <div key={card} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`card-${card}`} 
                          checked={taskPreferences.creditCardType.includes(card)}
                          onChange={() => handleCreditCardToggle(card)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor={`card-${card}`} className="ml-2 text-gray-700">
                          {card}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Rent */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">Rent Payment Reminders</p>
                  <p className="text-sm text-gray-500">Notify me about monthly rent due dates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={taskPreferences.paysRent}
                    onChange={() => handleToggleChange('paysRent')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              {/* Utilities */}
              <div className="py-2 border-b border-gray-100">
                <div className="mb-3">
                  <p className="font-medium">Utility Bill Reminders</p>
                  <p className="text-sm text-gray-500">Notify me about utility bill payment dates</p>
                </div>
                
                <div className="ml-6 space-y-2">
                  {Object.keys(taskPreferences.utilityBills).map(utility => (
                    <div key={utility} className="flex items-center justify-between">
                      <label htmlFor={`utility-${utility}`} className="text-gray-700 flex-1">
                        {utility.charAt(0).toUpperCase() + utility.slice(1)} bill
                      </label>
                      <div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            id={`utility-${utility}`}
                            checked={taskPreferences.utilityBills[utility]}
                            onChange={() => handleUtilityToggle(utility)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Savings Goal */}
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Savings Goal Reminders</p>
                    <p className="text-sm text-gray-500">Notify me to transfer money to my savings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={taskPreferences.hasSavingsGoalReminder}
                      onChange={() => handleToggleChange('hasSavingsGoalReminder')}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                {taskPreferences.hasSavingsGoalReminder && (
                  <div className="ml-6 mt-3">
                    <label htmlFor="savings-goal" className="block text-sm text-gray-600 mb-2">
                      Monthly savings target:
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">$</span>
                      <input 
                        type="number" 
                        id="savings-goal"
                        min="0"
                        step="1"
                        value={taskPreferences.savingsGoal}
                        onChange={handleSavingsGoalChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Save Changes Button */}
          <div className="flex items-center justify-end mt-6">
            {hasSaved && (
              <span className="text-green-600 mr-4">
                <span className="mr-1">✓</span> Settings saved!
              </span>
            )}
            <button 
              type="submit" 
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Other Settings</h2>
        <p className="text-gray-600">More settings will be available in future updates.</p>
      </div>
    </div>
  );
};

export default Settings;