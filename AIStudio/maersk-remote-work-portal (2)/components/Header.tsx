import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="flex flex-col">
        {/* GLOBAL TOP BAR (Maersk Blue) */}
        <header className="bg-[#42b0d5] text-white h-[48px] flex items-center justify-between px-4 z-50">
          
          {/* Left: Branding */}
          <div className="flex items-center space-x-4">
            {/* App Launcher / Waffle Icon */}
            <button className="p-2 hover:bg-[#3298bd] rounded-sm transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM11 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </button>
            
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
               <div className="flex items-center font-bold text-lg tracking-wide">
                  <span className="text-xl mr-2">★</span>
                  <span className="tracking-tighter">MAERSK</span>
               </div>
               <span className="text-sm font-light opacity-90 pt-0.5">SharePoint</span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl px-4 hidden md:block">
              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-[#42b0d5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input 
                      type="text" 
                      placeholder="Search across Maersk..." 
                      className="block w-full pl-10 pr-3 py-1.5 border-none rounded-sm leading-5 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-0 sm:text-sm shadow-sm text-center group-focus-within:text-left transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
              </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center space-x-1">
             <button className="p-2 hover:bg-[#3298bd] rounded-sm text-white" title="Notifications">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
             </button>
             <button className="p-2 hover:bg-[#3298bd] rounded-sm text-white" title="Settings">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             </button>
             <button className="p-2 hover:bg-[#3298bd] rounded-sm text-white" title="Help">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </button>
             
             {/* Profile */}
             <button className="ml-2 w-8 h-8 rounded-full bg-white text-[#42b0d5] flex items-center justify-center text-xs font-bold border-2 border-transparent hover:border-white/50 transition-all">
                JD
             </button>
          </div>
        </header>

        {/* SECONDARY NAV (Global Hub Links) */}
        <div className="bg-white border-b border-gray-200 text-sm text-gray-500 font-medium h-[40px] flex items-center px-4 shadow-sm z-40">
           <div className="flex space-x-6">
              <a href="#" className="hover:text-[#42b0d5] hover:underline decoration-2 underline-offset-8 decoration-[#42b0d5]">One Maersk Home</a>
              
              <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-800">
                  <span>ABOUT A.P. MOLLER - MAERSK</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              
              <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-800">
                  <span>NEWS & EVENTS</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              
              <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-800">
                  <span>QUICK LINKS</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
           </div>
        </div>
    </div>
  );
};