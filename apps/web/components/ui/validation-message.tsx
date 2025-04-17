"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, InfoIcon } from "lucide-react";

export type ValidationMessageType = "error" | "success" | "info" | "warning";

interface ValidationMessageProps {
  /**
   * Nội dung thông báo lỗi
   */
  message?: string;
  
  /**
   * Loại thông báo
   * @default "error"
   */
  type?: ValidationMessageType;
  
  /**
   * CSS classes thêm vào cho component
   */
  className?: string;
  
  /**
   * Hiện icon
   * @default true
   */
  showIcon?: boolean;
  
  /**
   * CSS classes thêm vào cho text
   */
  textClassName?: string;
  
  /**
   * CSS classes thêm vào cho icon
   */
  iconClassName?: string;
}

const iconMap: Record<ValidationMessageType, React.ReactNode> = {
  error: <AlertCircle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  info: <InfoIcon className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
};

const typeStyles: Record<ValidationMessageType, string> = {
  error: "text-destructive",
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
};

/**
 * Component hiển thị thông báo validation
 * 
 * @example
 * <ValidationMessage message="Email không hợp lệ" type="error" />
 * <ValidationMessage message="Đã lưu thành công" type="success" />
 */
export function ValidationMessage({
  message,
  type = "error",
  className,
  showIcon = true,
  textClassName,
  iconClassName,
}: ValidationMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        typeStyles[type],
        className
      )}
    >
      {showIcon && (
        <span className={cn("flex-shrink-0", iconClassName)}>
          {iconMap[type]}
        </span>
      )}
      <span className={cn("", textClassName)}>{message}</span>
    </div>
  );
} 