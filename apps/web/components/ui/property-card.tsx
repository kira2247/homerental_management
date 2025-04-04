import React from 'react';
import { Property } from '@/lib/api/types';

interface PropertyCardImageProps {
  property: Property;
}

export function PropertyCardImage({ property }: PropertyCardImageProps) {
  return (
    <div className="aspect-video overflow-hidden rounded-t-md">
      <img
        src={property.thumbnail || '/images/WMallingshowhome-67-720x479.jpg'}
        alt={property.name}
        className="h-full w-full object-cover transition-all hover:scale-105"
        onError={(e) => {
          // Fallback nếu ảnh không load được
          (e.target as HTMLImageElement).src = '/images/default-property.jpg';
        }}
      />
    </div>
  );
} 