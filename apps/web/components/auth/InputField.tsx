import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
}

export default function InputField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = true,
  disabled = false,
  icon: Icon
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine the actual input type
  const inputType = type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type;
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2 group">
      <Label 
        htmlFor={id} 
        className="text-gray-700 font-medium text-sm transition-colors group-hover:text-blue-600"
      >
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 transition-colors group-hover:text-blue-500 pointer-events-none">
          <Icon className="h-5 w-5" />
        </div>
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
          required={required}
          disabled={disabled}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-500 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
} 