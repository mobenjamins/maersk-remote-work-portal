import React, { useEffect, useState } from 'react';
import { User, getSIRWAnnualBalance, AnnualBalanceResponse } from '../services/api';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [balance, setBalance] = useState<AnnualBalanceResponse | null>(null);

  useEffect(() => {
    if (user) {
      getSIRWAnnualBalance()
        .then(setBalance)
        .catch(() => null);
    }
  }, [user]);

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email || 'User';

  const daysLeft = balance?.days_remaining ?? user?.days_remaining ?? 20;

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#42b0d5] text-white shadow-md">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl text-white">★</span>
            <span className="font-bold text-xl tracking-tighter">MAERSK</span>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            {user && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm"
              >
                <Calendar size={14} strokeWidth={2.5} className="text-white/80" />
                <span className="font-bold text-[11px] uppercase tracking-wider">
                  {daysLeft} Days Remaining
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
              </motion.div>
            )}

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white text-[#42b0d5] flex items-center justify-center text-xs font-bold">
                {getInitials()}
              </div>
              <span className="font-medium hidden sm:inline">{displayName}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
