import React, { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { countries, Country } from '../data/countries';
import { isCountryBlocked, getBlockReason, getBlockMessage } from '../data/blockedCountries';

interface CountryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
  showBlockedWarning?: boolean;  // Show warning for blocked countries (destination field)
  allowBlocked?: boolean;  // Allow selecting blocked countries (for display purposes)
}

export const CountryAutocomplete: React.FC<CountryAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a country...',
  required = false,
  name,
  showBlockedWarning = false,
  allowBlocked = true,
}) => {
  const [query, setQuery] = useState('');

  // Find the selected country object
  const selectedCountry = countries.find(c => c.name === value) || null;

  // Check if selected country is blocked
  const isSelectedBlocked = value ? isCountryBlocked(value) : false;
  const blockReason = value ? getBlockReason(value) : null;
  const blockMessage = value ? getBlockMessage(value) : null;

  // Filter countries based on query
  const filteredCountries = query === ''
    ? countries
    : countries.filter((country) =>
        country.name.toLowerCase().includes(query.toLowerCase()) ||
        country.code.toLowerCase().includes(query.toLowerCase())
      );

  const handleChange = (country: Country | null) => {
    onChange(country?.name || '');
  };

  return (
    <Combobox value={selectedCountry} onChange={handleChange}>
      <div className="relative">
        <div className="relative w-full">
          <Combobox.Input
            className={`w-full bg-white border rounded-sm p-3 text-sm focus:ring-1 outline-none transition-colors pr-10 ${
              showBlockedWarning && isSelectedBlocked
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                : 'border-gray-300 focus:ring-[#42b0d5] focus:border-[#42b0d5]'
            }`}
            displayValue={(country: Country | null) => country?.name || ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            required={required}
            name={name}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Combobox.Button>
        </div>
        
        {/* Blocked Country Warning */}
        {showBlockedWarning && isSelectedBlocked && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {blockReason === 'sanctions' ? 'Sanctioned Country' : 'No Maersk Entity'}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {blockMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {filteredCountries.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-500">
                No countries found.
              </div>
            ) : (
              filteredCountries.slice(0, 50).map((country) => {
                const countryIsBlocked = isCountryBlocked(country.name);
                const countryBlockReason = getBlockReason(country.name);
                
                return (
                  <Combobox.Option
                    key={country.code}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-4 pr-10 ${
                        active 
                          ? countryIsBlocked && showBlockedWarning
                            ? 'bg-red-100 text-red-900'
                            : 'bg-[#42b0d5] text-white' 
                          : countryIsBlocked && showBlockedWarning
                            ? 'text-red-600 bg-red-50'
                            : 'text-[#141414]'
                      }`
                    }
                    value={country}
                    disabled={!allowBlocked && countryIsBlocked}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {country.name}
                          {countryIsBlocked && showBlockedWarning && (
                            <span className={`ml-2 text-xs font-medium ${
                              active ? 'text-red-700' : 'text-red-500'
                            }`}>
                              ({countryBlockReason === 'sanctions' ? 'Sanctioned' : 'No Entity'})
                            </span>
                          )}
                        </span>
                        {selected && (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                              active ? 'text-white' : 'text-[#42b0d5]'
                            }`}
                          >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                );
              })
            )}
            {filteredCountries.length > 50 && (
              <div className="py-2 px-4 text-xs text-gray-400 text-center border-t border-gray-100">
                Type to filter more results...
              </div>
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
};
