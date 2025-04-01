import { useState } from "react";

const Sidebar = ({ activeTab, setActiveTab, onAddExpenseClick }) => {
  const [isOpen, setIsOpen] = useState(false); // Keeps track of mobile sidebar state

  return (
    <>
      {/* Menu Button (Only on Small Screens) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-2 left-2 p-2 bg-gray-800 text-white rounded z-50"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`bg-gray-900 text-white w-64 space-y-6 py-7 px-2 h-full fixed transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:block`}
      >
        {/* Sidebar Header */}
        <div className="text-3xl font-bold text-center text-indigo-400 mb-8">
          ExpenseTracker
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {[
            { name: "Dashboard", id: "dashboard", icon: "📊", path: "/dashboard" },
            { name: "Expenses", id: "expenses", icon: "💰", path: "/expenses" },
            { name: "Tasks", id: "tasks", icon: "📋", path: "/tasks" },
            // { name: "Reports", id: "reports", icon: "📝", path: "/reports" },
            { name: "Goals", id: "goals", icon: "🎯", path: "/goals" },
            { name: "Budget", id: "budget", icon: "💵", path: "/BudgetComparison" },
            { name: "SIP Calculator", id: "SIPCalculator", icon: "💲", path: "/SIPCalculator" },
            { name: "Settings", id: "settings", icon: "⚙️", path: "/Settings" }
          ].map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full py-3 px-4 rounded transition duration-200 hover:bg-indigo-700 ${
                activeTab === item.id ? "bg-indigo-700 font-medium" : ""
              }`}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false); // Close sidebar on mobile when a tab is selected
              }}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        {/* Add Expense Button */}
        <button 
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full w-full mt-6 transition duration-200 flex items-center justify-center"
          onClick={() => {
            if (onAddExpenseClick) {
              onAddExpenseClick();
              setIsOpen(false); // Close sidebar on mobile when button is clicked
            }
          }}
        >
          <span className="mr-2">+</span> Add Expense
        </button>
      </div>

      {/* Overlay (Closes Sidebar When Clicked on Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;