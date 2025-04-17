# Hướng dẫn Di chuyển Types

Tài liệu này cung cấp hướng dẫn chi tiết để hoàn thành việc chuyển đổi từ cấu trúc types cũ sang cấu trúc types mới trong dự án House Management.

## Tổng quan

Dự án đang tiến hành tái cấu trúc hệ thống types để đạt được các mục tiêu sau:

1. **Tập trung hóa**: Tập trung tất cả types vào một vị trí (`/lib/types`)
2. **Tổ chức theo domain**: Tổ chức types theo domain-driven design
3. **Cải thiện type safety**: Đảm bảo strict type checking
4. **Dễ bảo trì**: Giảm sự trùng lặp và cải thiện khả năng bảo trì

## Tiến độ hiện tại

✅ **Đã hoàn thành:**
- Tạo cấu trúc thư mục `/lib/types`
- Di chuyển và tổ chức types theo domain
- Cập nhật nhiều components để sử dụng types mới
- Thêm các type guards và helper functions
- Sửa lỗi TypeScript trong dashboard-content.tsx
- Hợp nhất các file trùng lặp
- Tạo các alias type để đảm bảo tương thích ngược
- Thêm các JSDoc comments
- Loại bỏ các file trùng lặp và dead code

⏳ **Đang thực hiện:**
- Di chuyển các types còn lại từ `/lib/api/types.ts`
- Cập nhật các modules còn lại để sử dụng cấu trúc types mới
- Xử lý các lỗi TypeScript liên quan đến enum và status

## Phương pháp di chuyển

Chúng tôi đang sử dụng phương pháp tiếp cận từng bước để đảm bảo tính tương thích ngược với mã hiện có:

### Giai đoạn 1: Thiết lập cấu trúc thư mục (Hoàn thành)

- ✅ Tạo thư mục `/lib/types`
- ✅ Tạo các file module types cơ bản:
  - `index.ts`
  - `model-types.ts`
  - `api-types.ts`
  - `utility-types.ts`
  - `form-types.ts`
  - `auth-types.ts`
  - `financial-types.ts`
  - `notification-types.ts`
  - `transaction-types.ts`
  - `api-helpers.ts`

### Giai đoạn 2: Di chuyển Types (Đang thực hiện)

- ✅ Di chuyển types từ `lib/api/types.ts` sang thư mục mới
- ✅ Di chuyển types từ `lib/hooks` sang thư mục mới
- ✅ Tạo các types mới và cải thiện những types hiện có
- ⏳ Cập nhật các enum và constants đang được sử dụng trong codebase

### Giai đoạn 3: Cập nhật Imports và References (Đang thực hiện)

- ✅ Cập nhật file `index.ts` để re-export tất cả types
- ✅ Cập nhật các imports trong các components và hooks
- ⏳ Cập nhật các imports trong các services API
- ⏳ Xóa các file types cũ khi không còn được sử dụng

### Giai đoạn 4: Kiểm tra và Hoàn thiện (Sắp tới)

- ⏳ Chạy TypeScript type-checking trên toàn bộ dự án
- ⏳ Kiểm tra lại các component để đảm bảo tính tương thích
- ⏳ Viết tests để kiểm tra tính tương thích của các types mới
- ⏳ Tạo tài liệu hướng dẫn sử dụng types mới

## Kế hoạch chi tiết

### 1. Di chuyển types còn lại

Các types hiện đang tồn tại trong file `/lib/api/types.ts` cần được phân loại và di chuyển vào các file tương ứng trong thư mục `/lib/types`. Dưới đây là kế hoạch di chuyển chi tiết:

#### Model Types

```typescript
// Trước: Trong /lib/api/types.ts
import { Property, PropertyStatus } from '@/lib/api/types';

// Sau: Trong các components và hooks
import { Property, PropertyStatus } from '@/lib/types';
```

#### API Types

```typescript
// Trước: Trong /lib/api/helpers.ts
import { ApiResponse } from '@/lib/api/types';
function isApiSuccess<T>(response: ApiResponse<T>): boolean {
  return response.success === true;
}

// Sau: Trong các components và hooks
import { ApiResponse, isApiSuccess } from '@/lib/types';
```

#### Utility Types

```typescript
// Trước: Không có cấu trúc rõ ràng
import { PaginatedData } from '@/lib/api/types';

// Sau: Sử dụng type từ utility-types
import { PaginatedData } from '@/lib/types';
```

### 2. Sử dụng cách tiếp cận cẩn thận

Để đảm bảo quá trình di chuyển diễn ra suôn sẻ và không làm hỏng code hiện có:

1. **Bước 1**: Tạo types mới trong thư mục `/lib/types`
2. **Bước 2**: Re-export cả types cũ và mới từ `index.ts`
3. **Bước 3**: Cập nhật từng component để sử dụng imports mới
4. **Bước 4**: Kiểm tra các lỗi TypeScript và sửa lỗi
5. **Bước 5**: Loại bỏ các exports cũ khi tất cả components đã được cập nhật

### 3. Xử lý trường hợp đặc biệt

#### Alias Types

Để đảm bảo tương thích ngược, chúng tôi đã tạo ra các alias types với hậu tố "Dto" cho các types được sử dụng trong API services:

```typescript
// Trong /lib/types/financial-types.ts
export type TransactionDto = Transaction;
export type TransactionFilterDto = TransactionFilter;
export type TransactionListDto = TransactionList;
```

#### Dealing with Conflicts

Khi có xung đột giữa các types, giải pháp là renames hoặc namespace:

```typescript
// Trong /lib/types/index.ts
export { Notification } from './notification-types';
export { NotificationPreferences as UserNotificationPreferences } from './notification-types';
```

## Ví dụ về di chuyển types

### Ví dụ 1: Property Type

```typescript
// Trước: Trong một component
import { Property, PropertyStatus } from '@/lib/api/types';

// Sau: Trong cùng component
import { Property, PropertyStatus } from '@/lib/types';
```

### Ví dụ 2: API Response Type

```typescript
// Trước
import { ApiResponse, Property, PaginatedData } from '@/lib/api/types';

// Sau
import { ApiResponse, Property, PaginatedData } from '@/lib/types';
```

## Mẹo khắc phục sự cố

1. **Lỗi TypeScript**: Khi gặp lỗi TypeScript, hãy kiểm tra xem type đã được export từ `index.ts` chưa
2. **Type không tương thích**: Sử dụng type assertion khi chuyển đổi giữa các version khác nhau của cùng một type
3. **Conflict**: Sử dụng alias hoặc namespace để giải quyết xung đột
4. **Missing Properties**: Cập nhật các interfaces để đảm bảo chúng có tất cả các thuộc tính cần thiết

## Tài liệu tham khảo

- [TypeScript Handbook - Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [TypeScript Handbook - Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
