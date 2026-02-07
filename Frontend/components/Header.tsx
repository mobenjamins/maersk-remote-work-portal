import React from 'react';
import { User } from '../services/api';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email || 'User';

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#42b0d5] text-white shadow-md">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl text-white">★</span>
            <span className="font-bold text-xl tracking-tighter">MAERSK</span>
          </div>

          <div className="flex items-center space-x-4 text-sm">
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
