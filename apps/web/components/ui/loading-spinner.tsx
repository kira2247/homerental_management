'use client';

import React from 'react';
import { BeatLoader, ClipLoader, PulseLoader, RingLoader } from 'react-spinners';

interface LoadingSpinnerProps {
  type?: 'beat' | 'clip' | 'pulse' | 'ring';
  size?: number;
  color?: string;
  loading?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  type = 'beat',
  size = 15,
  color = '#3b82f6',
  loading = true,
  className = '',
}) => {
  if (!loading) return null;

  const spinnerProps = {
    color,
    loading,
    size,
    className,
  };

  switch (type) {
    case 'beat':
      return <BeatLoader {...spinnerProps} />;
    case 'clip':
      return <ClipLoader {...spinnerProps} />;
    case 'pulse':
      return <PulseLoader {...spinnerProps} />;
    case 'ring':
      return <RingLoader {...spinnerProps} />;
    default:
      return <BeatLoader {...spinnerProps} />;
  }
};
