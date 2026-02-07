import React from 'react';
import { User } from '../services/api';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
  currentPageTitle?: string; // Kept for compatibility but ignored in UI
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  // Get initials from user name or email
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

  return (
    <header className="sticky top-0 z-50">
      {/* Main Bar */}
      <div className="bg-gradient-to-r from-[#42b0d5] to-[#3aa3c7] text-white shadow-lg relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Grid Menu Icon */}
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM11 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </button>
            
            <div className="font-bold text-xl tracking-wide flex items-center cursor-pointer">
              <span className="mr-2 text-2xl text-white">★</span> 
              <span className="tracking-tighter">MAERSK</span>
            </div>
            <div className="border-l border-white/20 h-8 mx-2 hidden md:block"></div>
            <div className="text-sm font-medium opacity-90 hidden md:block bg-white/10 px-3 py-1 rounded-full">SharePoint</div>
          </div>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative group">
                  <input 
                      type="text" 
                      placeholder="Search across Maersk..." 
                      className="w-full bg-white/10 border border-white/10 text-white placeholder-white/80 text-sm py-2 px-4 rounded-full focus:outline-none focus:bg-white focus:text-gray-800 focus:placeholder-gray-500 transition-all shadow-inner"
                  />
                  <svg className="w-5 h-5 absolute right-4 top-2 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
            
            {/* User Menu */}
            <div className="relative group">
              <button className="opacity-90 hover:opacity-100 ml-2 flex items-center space-x-2">
                <div className="w-9 h-9 rounded-full bg-white text-[#42b0d5] flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white/20">
                  {getInitials()}
                </div>
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.first_name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <div className="px-3 py-2 text-sm text-gray-600">
                    <span className="font-medium">{user?.days_remaining}</span> days remaining
                  </div>
                  {onLogout && (
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sub Navigation */}
      <div className="bg-white/95 backdrop-blur-sm text-gray-600 text-sm shadow-sm border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 flex space-x-1 py-3 overflow-x-auto no-scrollbar">
            <span className="font-semibold text-[#42b0d5] bg-blue-50 px-3 py-1.5 rounded-md">People Function</span>
            {['Home', 'Culture & Inclusion', 'Employee Relations', 'Engagement', 'Lead', 'Maersk Academy', 'MPACT'].map((item) => (
                <span key={item} className="hover:bg-gray-100 hover:text-gray-900 px-3 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap">
                    {item}
                </span>
            ))}
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="bg-gray-50/80 backdrop-blur border-b border-gray-200 text-xs font-medium text-gray-500">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center space-x-6">
             <button className="flex items-center space-x-1 hover:text-[#42b0d5] transition-colors">
                <span className="text-lg leading-none">+</span> <span>New</span>
             </button>
             <div className="h-4 border-l border-gray-300"></div>
             <button className="hover:text-[#42b0d5] transition-colors">Promote</button>
             <button className="hover:text-[#42b0d5] transition-colors">Page details</button>
             <span className="flex-1"></span>
             <span>Published 9/8/2025</span>
             <button className="hover:text-[#42b0d5] transition-colors">Share</button>
             <button className="hover:text-[#42b0d5] transition-colors">Edit</button>
        </div>
      </div>
    </header>
  );
};
