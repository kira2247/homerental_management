import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ id, checked, disabled, onCheckedChange }) => {
  return (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="h-3 w-3 text-blue-600" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
