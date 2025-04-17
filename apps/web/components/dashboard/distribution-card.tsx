'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/lib/i18n/client';

/**
 * Represents a property distribution item for visualization
 * @property name - Name of the property category
 * @property value - Numeric value representing the size/amount of this category
 * @property color - Color code for visual representation in charts
 */
interface PropertyDistribution {
  name: string;
  value: number;
  color: string;
}

/**
 * Props for the DistributionCard component
 * @property data - Array of property distribution data to visualize
 * @property loading - Whether the data is currently loading
 * @property className - Optional additional CSS classes
 */
interface DistributionCardProps {
  data: PropertyDistribution[];
  loading?: boolean;
  className?: string;
}

export const DistributionCard: React.FC<DistributionCardProps> = ({ 
  data, 
  loading = false,
  className = ''
}) => {
  const { t } = useLocale();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  // Xử lý dọn dẹp timeout khi component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const getTotal = () => {
    return data.reduce((total, item) => total + item.value, 0);
  };
  
  const calculatePercentage = (value: number) => {
    const total = getTotal();
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };
  
  // Xử lý debounce khi hover
  const handleMouseEnter = (index: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setHoveredIndex(index);
      setIsTooltipVisible(true);
    }, 100); // 100ms delay để tránh nhấp nháy
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setHoveredIndex(null);
      setIsTooltipVisible(false);
    }, 100);
  };
  
  if (loading) {
    return (
      <div className={`rounded-lg border bg-white text-card-foreground shadow-sm h-[460px] ${className}`}>
        <div className="p-6 pb-2">
          <div className="text-md font-medium">
            <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 pt-0">
          <div className="h-[300px] w-full rounded-xl bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Kiểm tra có dữ liệu không
  const hasData = data.some(item => item.value > 0);
  
  return (
    <div className={`rounded-lg border bg-white text-card-foreground shadow-sm min-h-[460px] flex flex-col ${className}`}>
      <div className="p-6 pb-2">
        <div className="text-lg font-semibold">
          {t('dashboard.propertyDistribution')}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('dashboard.propertyDistributionDesc')}
        </div>
      </div>
      <div className="p-6 pt-0 flex-grow">
        {hasData ? (
          <div className="relative flex flex-col h-full">
            <div className="flex justify-center mb-6 relative">
              <div className="relative w-56 h-56 md:w-60 md:h-60 rounded-full overflow-visible bg-gray-100">
                <svg className="w-full h-full" viewBox="0 0 100 100" overflow="visible">
                  {/* Thêm một vòng tròn ở tâm để tạo deadzone, tránh hiện tượng nhấp nháy */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="15" 
                    fill="rgba(255,255,255,0.01)" 
                    pointerEvents="none"
                  />
                  
                  {data.map((item, index) => {
                    const total = getTotal();
                    let startAngle = 0;
                    
                    // Calculate start angle based on previous segments
                    for (let i = 0; i < index; i++) {
                      startAngle += (data[i].value / total) * 360;
                    }
                    
                    const endAngle = startAngle + (item.value / total) * 360;
                    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
                    
                    // Convert angles to radians and calculate points
                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;
                    
                    const x1 = 50 + 50 * Math.cos(startRad);
                    const y1 = 50 + 50 * Math.sin(startRad);
                    const x2 = 50 + 50 * Math.cos(endRad);
                    const y2 = 50 + 50 * Math.sin(endRad);
                    
                    // Tạo đường dẫn SVG từ tâm đến viền và vẽ cung
                    const d = `
                      M 50 50
                      L ${x1} ${y1}
                      A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}
                      Z
                    `;
                    
                    // Tính toán vị trí giữa của cung để hiển thị tooltip
                    const midAngle = (startAngle + endAngle) / 2;
                    const midRad = (midAngle - 90) * Math.PI / 180;
                    
                    // Không áp dụng offset khi có tooltip, tránh gây thay đổi kích thước
                    return (
                      <path
                        key={index}
                        d={d}
                        fill={item.color}
                        className="cursor-pointer transition-all duration-300 hover:opacity-80"
                        style={{ 
                          transform: hoveredIndex === index ? `translate(${3 * Math.cos(midRad)}px, ${3 * Math.sin(midRad)}px)` : 'none',
                          filter: hoveredIndex === index ? 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' : 'none'
                        }}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}
                </svg>
              </div>
              
              {/* Tooltip khi hover - thêm transition để tránh nhấp nháy */}
              {hoveredIndex !== null && (
                <div 
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-lg shadow-xl border text-sm z-10 transition-opacity duration-200 ${isTooltipVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="font-medium">
                    {t(`dashboard.propertyTypes.${data[hoveredIndex].name}`)}
                  </div>
                  <div className="text-muted-foreground">
                    {data[hoveredIndex].value} {t('dashboard.units')} ({calculatePercentage(data[hoveredIndex].value)}%)
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 px-2">
              {data.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-2 rounded-md transition-all duration-200 hover:bg-gray-100 cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className="w-4 h-4 mr-2 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="text-sm truncate">
                    {t(`dashboard.propertyTypes.${item.name}`)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-sm font-medium text-center text-muted-foreground mt-auto mb-2">
              {t('dashboard.totalProperties')}: {getTotal()} {t('dashboard.units')}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="text-base">{t('dashboard.noDataToShow')}</div>
            <div className="text-sm text-center text-muted-foreground mt-auto">
              {t('dashboard.totalProperties')}: 0 {t('dashboard.units')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 