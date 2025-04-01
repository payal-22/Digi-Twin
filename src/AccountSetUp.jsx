import React, { useState } from 'react';
import { db, auth } from './firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AccountSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    monthlyBudget: '',
    hasHomeLoan: false,
    homeLoanAmount: '',
    usesCard: false,
    creditCardType: [],
    savingsGoal: '',
    selectedCategories: ['Housing', 'Food', 'Transport', 'Shopping', 'Other']
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCategoryToggle = (category) => {
    const updatedCategories = formData.selectedCategories.includes(category)
      ? formData.selectedCategories.filter(c => c !== category)
      : [...formData.selectedCategories, category];
    
    setFormData({
      ...formData,
      selectedCategories: updatedCategories
    });
  };

  const handleCreditCardToggle = (cardType) => {
    const updatedCards = formData.creditCardType.includes(cardType)
      ? formData.creditCardType.filter(c => c !== cardType)
      : [...formData.creditCardType, cardType];
    
    setFormData({
      ...formData,
      creditCardType: updatedCards
    });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const submitSetup = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Create user profile document
      await setDoc(doc(db, 'userProfiles', user.uid), {
        monthlyIncome: parseFloat(formData.monthlyIncome),
        monthlyBudget: parseFloat(formData.monthlyBudget),
        hasHomeLoan: formData.hasHomeLoan,
        homeLoanAmount: formData.hasHomeLoan ? parseFloat(formData.homeLoanAmount) : 0,
        usesCard: formData.usesCard,
        creditCardType: formData.creditCardType,
        savingsGoal: parseFloat(formData.savingsGoal) || 0,
        expenseCategories: formData.selectedCategories,
        createdAt: new Date(),
        userId: user.uid
      });

      // Create initial budget document for current month
      const now = new Date();
      const monthYear = `₹{now.getMonth() + 1}-₹{now.getFullYear()}`;
      
      await setDoc(doc(db, 'budgets', `₹{user.uid}_₹{monthYear}`), {
        userId: user.uid,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        budget: parseFloat(formData.monthlyBudget),
        spent: 0,
        remaining: parseFloat(formData.monthlyBudget),
        createdAt: new Date()
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save your profile. Please try again.');
    }
  };

  // Render different steps based on current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Income & Budget</h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monthly Income
                <input
                  type="number"
                  name="monthlyIncome"
                  value={formData.monthlyIncome}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your monthly income"
                  required
                />
              </label>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monthly Budget
                <input
                  type="number"
                  name="monthlyBudget"
                  value={formData.monthlyBudget}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Set your monthly spending budget"
                  required
                />
              </label>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monthly Savings Goal (Optional)
                <input
                  type="number"
                  name="savingsGoal"
                  value={formData.savingsGoal}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="How much do you want to save each month?"
                />
              </label>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Loans & Credit</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasHomeLoan"
                  name="hasHomeLoan"
                  checked={formData.hasHomeLoan}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="hasHomeLoan" className="ml-2 block text-sm text-gray-700">
                  Do you have a home loan?
                </label>
              </div>
              
              {formData.hasHomeLoan && (
                <div className="mt-2 pl-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Monthly Loan Payment
                    <input
                      type="number"
                      name="homeLoanAmount"
                      value={formData.homeLoanAmount}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Monthly payment amount"
                    />
                  </label>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="usesCard"
                  name="usesCard"
                  checked={formData.usesCard}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="usesCard" className="ml-2 block text-sm text-gray-700">
                  Do you use credit cards?
                </label>
              </div>
              
              {formData.usesCard && (
                <div className="mt-2 pl-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Select card types you use:</p>
                  <div className="space-y-2">
                    {['Visa', 'Mastercard', 'American Express', 'Discover', 'Other'].map((card) => (
                      <div key={card} className="flex items-center">
                        <input
                          type="checkbox"
                          id={card}
                          checked={formData.creditCardType.includes(card)}
                          onChange={() => handleCreditCardToggle(card)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={card} className="ml-2 block text-sm text-gray-700">
                          {card}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Expense Categories</h2>
            <p className="text-sm text-gray-600">Select the expense categories you want to track:</p>
            
            <div className="grid grid-cols-2 gap-2">
              {['Housing', 'Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Personal Care', 'Subscriptions', 'Other'].map((category) => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={category}
                    checked={formData.selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={category} className="ml-2 block text-sm text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return <div>Error: Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-2xl font-extrabold text-gray-900">
            Set Up Your Account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step {step} of 3 - Let's get your finances organized
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `₹{(step / 3) * 100}%` }}></div>
          </div>
        </div>
        
        <form className="mt-8 space-y-6">
          {renderStep()}
          
          <div className="flex items-center justify-between pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-auto"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={submitSetup}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-auto"
              >
                Complete Setup
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSetup;