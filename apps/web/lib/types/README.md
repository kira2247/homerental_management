# Types Management

Thư mục này chứa các định nghĩa types tập trung cho toàn bộ ứng dụng Rental Management System. Việc tổ chức types theo cấu trúc này giúp:

- Giảm trùng lặp code
- Đảm bảo tính nhất quán
- Dễ dàng bảo trì và cập nhật
- Tăng cường type safety

## Cấu trúc

```
lib/types/
├── index.ts              # Re-export tất cả types
├── model-types.ts        # Model interfaces (Property, Unit, etc.)
├── api-types.ts          # API-related types (Request/Response)
├── api-helpers.ts        # API helper functions và type guards
├── auth-types.ts         # Authentication và user-related types
├── financial-types.ts    # Financial-related types
├── form-types.ts         # Form-related types
├── notification-types.ts # Notification-related types
├── utility-types.ts      # Utility types (generic helpers)
└── README.md             # Tài liệu hướng dẫn
```

## Sử dụng

Khi cần sử dụng types, import từ thư mục này thay vì từ các module cụ thể:

```typescript
// ✅ Nên sử dụng
import { Property, PropertyStatus } from '@/lib/types';

// ❌ Không nên sử dụng
import { Property } from '@/lib/api/types';
```

## Quy tắc

1. **Tất cả types chung** nên được đặt trong thư mục này
2. **Types chỉ dùng cho một component** nên được đặt trong file component đó
3. **Re-export types** từ thư viện bên ngoài khi cần sử dụng rộng rãi
4. **Export type** khi làm việc với TypeScript modules

## Lộ trình Migration

Việc chuyển đổi sang cấu trúc types mới đang được thực hiện theo các bước:

1. ✅ Tạo cấu trúc thư mục và files cơ bản
2. ✅ Re-export types từ `/lib/api/types.ts` để đảm bảo tương thích ngược
3. ✅ Cập nhật một số components để sử dụng types mới
4. 🔄 Di chuyển các types từ các modules cụ thể vào thư mục này
5. 🔄 Cập nhật toàn bộ codebase để sử dụng types mới

## Type Safety

Dự án đang sử dụng mode strict TypeScript (`strict: true`) với các cấu hình:

- noImplicitAny
- noImplicitThis
- strictFunctionTypes
- strictBindCallApply
- noImplicitReturns

Đảm bảo các types được định nghĩa đầy đủ và không có any ngầm định.
