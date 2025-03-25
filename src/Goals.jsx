import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";  // Ensure correct import path
import { collection, query, where, getDocs } from "firebase/firestore";

const Goals = () => {
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavingsGoals = async () => {
      if (!auth.currentUser) return;  // Ensure user is logged in
      setLoading(true);

      try {
        const q = query(
          collection(db, "savingsGoals"),
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const goals = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavingsGoals(goals);
      } catch (error) {
        console.error("Error fetching savings goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavingsGoals();
  }, [auth.currentUser]); // Runs when user changes

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Savings Goals</h2>

      {loading ? (
        <p>Loading savings goals...</p>
      ) : savingsGoals.length === 0 ? (
        <p>No savings goals found. Start adding one!</p>
      ) : (
        <ul>
          {savingsGoals.map((goal) => (
            <li key={goal.id} className="border p-3 rounded mb-2">
              <strong>{goal.name}</strong>: ${goal.amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Goals;
