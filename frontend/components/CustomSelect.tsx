'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
};

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export function CustomSelect({ value, onChange, options, icon, ariaLabel }: CustomSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full sm:w-auto">
        <Listbox.Button 
          aria-label={ariaLabel}
          className="relative flex w-full min-w-45 items-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {icon && <span className="text-emerald-500 shrink-0">{icon}</span>}
          <span className="block truncate">{selectedOption?.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-50 mt-1.5 max-h-60 w-full min-w-50 overflow-auto rounded-xl bg-white p-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active, selected }) =>
                  `relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-10 pr-4 transition-colors ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                  } ${selected ? 'font-semibold' : 'font-normal'}`
                }
                value={option.value}
              >
                {({ selected, active }) => (
                  <>
                    <span className="block truncate">{option.label}</span>
                    {selected ? (
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-emerald-700' : 'text-emerald-600'
                        }`}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}