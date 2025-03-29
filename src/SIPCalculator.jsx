import React, { useState } from "react";

const COLORS = ["#2563eb", "#10b981"]; // Blue and Green colors

const SIPCalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(500);
  const [expectedRateOfReturn, setExpectedRateOfReturn] = useState(5);
  const [timePeriod, setTimePeriod] = useState(5);

  const monthlyRateOfReturn = expectedRateOfReturn / 100 / 12;
  const totalMonths = timePeriod * 12;
  const totalInvestedAmount = monthlyInvestment * totalMonths;

  const estimatedReturns =
    monthlyInvestment *
    ((Math.pow(1 + monthlyRateOfReturn, totalMonths) - 1) / monthlyRateOfReturn) *
    (1 + monthlyRateOfReturn) - totalInvestedAmount;

  const totalValue = totalInvestedAmount + estimatedReturns;

  const pieData = [
    { name: "Invested Amount", value: totalInvestedAmount },
    { name: "Estimated Returns", value: estimatedReturns },
  ];

  const total = pieData.reduce((acc, entry) => acc + entry.value, 0);
  let cumulativePercentage = 0;

  const pieCoordinates = pieData.map((entry, index) => {
    const startAngle =
      index === 0
        ? 0
        : pieData.slice(0, index).reduce((acc, item) => acc + (item.value / total) * 2 * Math.PI, 0);
    const endAngle = startAngle + (entry.value / total) * 2 * Math.PI;

    const startX = 150 + 100 * Math.cos(startAngle);
    const startY = 150 + 100 * Math.sin(startAngle);
    const endX = 150 + 100 * Math.cos(endAngle);
    const endY = 150 + 100 * Math.sin(endAngle);

    const largeArcFlag = entry.value / total > 0.5 ? 1 : 0;

    return {
      d: `M 150 150 L ${startX} ${startY} A 100 100 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
      fill: COLORS[index % COLORS.length],
    };
  });

  return (
    <div className="h-[600px] bg-gray-50 py-2 px-4 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-start mt-3 text-center gap-8 justify-center min-h-screen mx-auto">
          {/* Calculator Section */}
          <div className="w-[600px] h-[550px] flex flex-col bg-white rounded-xl shadow-lg p-6  justify-around">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">SIP Calculator</h2>

            {/* Sliders */}
            <div className="space-y-6">
              {[
                { 
                  label: "Monthly Investment",
                  value: monthlyInvestment,
                  setter: setMonthlyInvestment,
                  min: 1000,
                  max: 100000,
                  prefix: "₹"
                },
                { 
                  label: "Expected Rate of Return",
                  value: expectedRateOfReturn,
                  setter: setExpectedRateOfReturn,
                  min: 1,
                  max: 30,
                  suffix: "%"
                },
                { 
                  label: "Time Period",
                  value: timePeriod,
                  setter: setTimePeriod,
                  min: 1,
                  max: 30,
                  suffix: "Years"
                },
              ].map(({ label, value, setter, min, max, prefix, suffix }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}: {prefix}{value}{suffix}
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <style jsx>{`
                      input[type='range'] {
                        -webkit-appearance: none;
                        appearance: none;
                      }

                      input[type='range']::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 18px;
                        height: 18px;
                        background-color: #3b82f6;
                        border: 2px solid #ffffff;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                      }

                      input[type='range']::-moz-range-thumb {
                        width: 18px;
                        height: 18px;
                        background-color: #3b82f6;
                        border: 2px solid #ffffff;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                      }

                      input[type='range']::-webkit-slider-thumb:hover {
                        background-color: #2563eb;
                        transform: scale(1.1);
                      }

                      input[type='range']::-moz-range-thumb:hover {
                        background-color: #2563eb;
                        transform: scale(1.1);
                      }

                      input[type='range']::-webkit-slider-thumb:active {
                        transform: scale(0.95);
                      }

                      input[type='range']::-moz-range-thumb:active {
                        transform: scale(0.95);
                      }
                    `}</style>
                  </div>
                </div>
              ))}
  </div>



            {/* Results */}
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Invested Amount</p>
                <p className="text-xl font-bold text-blue-600">₹{Math.round(totalInvestedAmount).toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Returns</p>
                <p className="text-xl font-bold text-green-600">₹{Math.round(estimatedReturns).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="w-[600px] h-[550px] flex flex-col bg-white rounded-xl shadow-lg p-6 justify-around">
                <h3 className="text-2xl font-bold text-gray-800">
                  Investment Distribution
                </h3>
                <div className="relative mx-auto">
                  <svg width={400} height={400} viewBox="0 0 300 300" className="w-full h-auto mx-auto">
                    {pieCoordinates?.map((slice, index) => (
                      <path key={index} d={slice.d} fill={slice.fill} stroke="white" strokeWidth="2" />
                    ))}
                    {/* Hollow Center (Positioned Properly) */}
                    <circle cx="150" cy="150" r="70" fill="white" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                {/* Adjusted Flexbox for Labels */}
                <div className="flex flex-row justify-around px-4 text-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-sm"></div>
                    <span>Invested Amount</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-sm"></div>
                    <span>Expected Returns</span>
                  </div>
                </div>
          </div>
        </div>
    </div>
  );
};

export default SIPCalculator;

