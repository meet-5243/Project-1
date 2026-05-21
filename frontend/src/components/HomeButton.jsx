import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-emerald-500/10 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:bg-emerald-500 hover:scale-110 transition-all duration-300 group flex items-center justify-center cursor-pointer"
      title="Back to Dashboard"
    >
      <Home size={22} className="text-emerald-400 group-hover:text-white transition-colors duration-300" />
    </button>
  );
};

export default HomeButton;
