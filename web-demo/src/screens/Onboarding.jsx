// ============================================
// ExpensAI — Onboarding Screen
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowForward, IoSparkles, IoShieldCheckmark, IoFlash } from 'react-icons/io5';

const slides = [
  {
    icon: <IoSparkles />,
    title: 'Smart Expense Tracking',
    subtitle: 'Upload receipts and let AI extract details automatically. No more manual data entry.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: <IoShieldCheckmark />,
    title: 'Instant Approvals',
    subtitle: 'Submit expenses on the go. Get real-time updates on approvals and rejections.',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: <IoFlash />,
    title: 'Stay Within Budget',
    subtitle: 'Track spending limits, get alerts, and keep your expenses compliant effortlessly.',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate('/login');
  };

  return (
    <div className="onboarding-screen">
      {/* Background gradient */}
      <div className="onboarding-bg" style={{ background: slides[current].gradient }} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="onboarding-content"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="onboarding-icon-circle">
            {slides[current].icon}
          </div>
          <h1 className="onboarding-title">{slides[current].title}</h1>
          <p className="onboarding-subtitle">{slides[current].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* Logo at top */}
      <div className="onboarding-logo">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">ExpensAI</span>
      </div>

      {/* Dots */}
      <div className="onboarding-dots">
        {slides.map((_, i) => (
          <div key={i} className={`dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
        ))}
      </div>

      {/* Action */}
      <div className="onboarding-actions">
        {current < slides.length - 1 ? (
          <>
            <button className="btn-text" onClick={() => navigate('/login')}>Skip</button>
            <button className="btn btn-white" onClick={next}>
              Next <IoArrowForward />
            </button>
          </>
        ) : (
          <button className="btn btn-white btn-full" onClick={() => navigate('/login')}>
            Get Started <IoArrowForward />
          </button>
        )}
      </div>
    </div>
  );
}
