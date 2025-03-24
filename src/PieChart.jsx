import React from "react";

const PieChart = ({ data, size = 200, innerRadius = 40, outerRadius = 90 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativeAngle = -90; // Start from the top

  const generateSlicePath = (value) => {
    const angle = (value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + angle;
    cumulativeAngle += angle; // Update cumulative angle for next slice

    const startOuter = polarToCartesian(size / 2, size / 2, outerRadius, startAngle);
    const endOuter = polarToCartesian(size / 2, size / 2, outerRadius, endAngle);
    const startInner = polarToCartesian(size / 2, size / 2, innerRadius, startAngle);
    const endInner = polarToCartesian(size / 2, size / 2, innerRadius, endAngle);

    const largeArcFlag = angle > 180 ? 1 : 0; // SVG arc flag (for large slices)

    return [
      `M ${startInner.x},${startInner.y}`, // Move to inner start
      `L ${startOuter.x},${startOuter.y}`, // Line to outer start
      `A ${outerRadius},${outerRadius} 0 ${largeArcFlag},1 ${endOuter.x},${endOuter.y}`, // Arc outer edge
      `L ${endInner.x},${endInner.y}`, // Line to inner end
      `A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${startInner.x},${startInner.y}`, // Arc inner edge
      "Z", // Close path
    ].join(" ");
  };

  const polarToCartesian = (cx, cy, radius, angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians),
    };
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Pie Slices */}
      {data.map((item, index) => (
        <path key={index} d={generateSlicePath(item.value)} fill={item.color} stroke="white" strokeWidth="2" />
      ))}
    </svg>
  );
};


export default PieChart;
