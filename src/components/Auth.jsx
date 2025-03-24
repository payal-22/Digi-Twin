import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebase";
import "./Auth.css";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in successfully");
      } else {
        // Signup
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("User signed up successfully");
      }
    } catch (error) {
      console.error("Authentication error:", error.message);
      alert(error.message); // Show error message to the user
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("User signed in with Google successfully");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="auth-container bg-white">
        <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
          <button type="submit" className="w-full bg-indigo-600 text-white">
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        
        <div className="my-4 text-center text-sm text-gray-500">OR</div>
        
        <button 
          onClick={signInWithGoogle} 
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded py-2 px-4 hover:bg-gray-50"
        >
          <span className="text-xl">G</span>
          <span>Sign in with Google</span>
        </button>
        
        <p className="mt-4 text-center">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;