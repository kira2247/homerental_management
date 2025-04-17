import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * VisuallyHidden component - Ẩn nội dung khỏi giao diện nhưng vẫn giữ cho trình đọc màn hình
 * Hữu ích cho accessibility khi cần cung cấp thông tin cho screen readers mà không hiển thị trên UI
 */
interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
          "clip-rect-0 not-sr-only",
          className
        )}
        {...props}
      />
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
