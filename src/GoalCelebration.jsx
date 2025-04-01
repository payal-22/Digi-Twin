import React, { useState, useEffect } from 'react';

const GoalCelebration = ({ isVisible, onComplete, goalName }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Set a timer to end the animation after 3 seconds
      const timer = setTimeout(() => {
        setAnimationComplete(true);
        if (onComplete) onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="celebration-container">
        {/* Party poppers at different angles */}
        <div className="popper popper-top-left">🎉</div>
        <div className="popper popper-top-right">🎊</div>
        <div className="popper popper-bottom-left">🎉</div>
        <div className="popper popper-bottom-right">🎊</div>
        
        {/* Celebratory message */}
        <div className="bg-white p-6 rounded-lg shadow-xl text-center pointer-events-auto animate-bounce">
          <div className="text-4xl mb-3">🎯 Goal Achieved! 🎯</div>
          <div className="text-xl font-bold text-green-600">Congratulations!</div>
          <div className="mt-2 text-gray-700">
            {goalName ? 
              `You've reached your "₹{goalName}" savings goal!` :
              "You've reached 100% of your savings goal!"}
          </div>
        </div>
      </div>
      
      {/* CSS for the animations */}
      <style jsx>{`
        .celebration-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .popper {
          position: absolute;
          font-size: 3rem;
          animation-duration: 2s;
          animation-fill-mode: both;
        }
        
        .popper-top-left {
          top: 20%;
          left: 20%;
          animation-name: popperTopLeft;
        }
        
        .popper-top-right {
          top: 20%;
          right: 20%;
          animation-name: popperTopRight;
        }
        
        .popper-bottom-left {
          bottom: 20%;
          left: 20%;
          animation-name: popperBottomLeft;
        }
        
        .popper-bottom-right {
          bottom: 20%;
          right: 20%;
          animation-name: popperBottomRight;
        }
        
        @keyframes popperTopLeft {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          50% { transform: translate(-50px, -50px) scale(1.5); opacity: 1; }
          100% { transform: translate(-100px, -100px) scale(1); opacity: 0; }
        }
        
        @keyframes popperTopRight {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          50% { transform: translate(50px, -50px) scale(1.5); opacity: 1; }
          100% { transform: translate(100px, -100px) scale(1); opacity: 0; }
        }
        
        @keyframes popperBottomLeft {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          50% { transform: translate(-50px, 50px) scale(1.5); opacity: 1; }
          100% { transform: translate(-100px, 100px) scale(1); opacity: 0; }
        }
        
        @keyframes popperBottomRight {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          50% { transform: translate(50px, 50px) scale(1.5); opacity: 1; }
          100% { transform: translate(100px, 100px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GoalCelebration;