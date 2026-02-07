import React, { useState, Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover className="relative inline-block">
      {({ open }) => (
        <>
          <Popover.Button
            className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full bg-[#e2f3fb] text-[#42b0d5] text-[10px] font-bold hover:bg-[#42b0d5] hover:text-white focus:outline-none transition-colors cursor-help"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
          >
            i
          </Popover.Button>

          <Transition
            as={Fragment}
            show={isOpen || open}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel 
              static
              className="absolute z-50 w-64 px-3 py-2.5 mt-2 text-xs text-gray-200 bg-[#1a1f35] rounded-sm shadow-lg left-0 top-full leading-relaxed"
            >
              <div className="relative">
                {/* Arrow */}
                <div className="absolute -top-[6px] left-2 w-2 h-2 bg-[#1a1f35] transform rotate-45" />
                <p className="relative z-10">{content}</p>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

// Inline help text component as an alternative
interface HelpTextProps {
  children: React.ReactNode;
}

export const HelpText: React.FC<HelpTextProps> = ({ children }) => (
  <p className="mt-1 text-xs text-gray-400">{children}</p>
);

// Label with tooltip component for convenience
interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
}

export const LabelWithTooltip: React.FC<LabelWithTooltipProps> = ({ 
  label, 
  tooltip, 
  required = false 
}) => (
  <label className="flex items-center text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
    {label}
    {required && <span className="text-red-400 ml-0.5">*</span>}
    <Tooltip content={tooltip} />
  </label>
);
