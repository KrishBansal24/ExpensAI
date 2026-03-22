// ============================================
// ExpensAI — Budget Ring Component
// ============================================
// Circular progress ring that visualizes budget usage.
import { motion } from 'framer-motion';

export default function BudgetRing({ spent, total, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min((spent / total) * 100, 100);
  const offset = circumference - (percent / 100) * circumference;

  // Color based on usage
  let color = '#10B981'; // green
  if (percent >= 90) color = '#EF4444'; // red
  else if (percent >= 75) color = '#F59E0B'; // amber
  else if (percent >= 50) color = '#3B82F6'; // blue

  return (
    <div className="budget-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="budget-ring-text">
        <span className="budget-ring-percent" style={{ color }}>{percent.toFixed(0)}%</span>
        <span className="budget-ring-label">used</span>
      </div>
    </div>
  );
}
