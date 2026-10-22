import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  onSearch: (query: string) => Promise<Option[]>;
  onChange: (value: string | number) => void;
  value: string | number;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  onSearch,
  onChange,
  value,
  placeholder = "Rechercher...",
  label,
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial option label if value is set
  useEffect(() => {
    if (value && !selectedLabel) {
       onSearch('').then(initialOptions => {
           const selected = initialOptions.find(o => o.id === value || o.id.toString() === value.toString());
           if (selected) {
               setSelectedLabel(selected.label);
           }
       });
    }
  }, [value, onSearch, selectedLabel]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await onSearch(searchQuery);
      setOptions(results);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  }, [onSearch]);

  // Debounce search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch, isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      handleSearch('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setSelectedLabel(option.label);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedLabel('');
    setQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onClick={toggleDropdown}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <span className={`block truncate ${!selectedLabel ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
        {selectedLabel && (
          <span className="absolute inset-y-0 right-7 flex items-center pr-2">
            <XMarkIcon
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="sticky top-0 z-10 bg-white px-2 py-1 border-b">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Taper pour rechercher..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="mt-1">
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500 flex justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                Aucun résultat trouvé
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white ${
                    value === option.id ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{option.label}</span>
                    {option.subLabel && (
                      <span className="text-xs text-gray-400 group-hover:text-indigo-200 truncate">
                        {option.subLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
