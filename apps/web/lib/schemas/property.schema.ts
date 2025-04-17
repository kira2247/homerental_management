import { z } from "zod";
import { PropertyType, PropertyStatus } from "@/lib/types";

/**
 * Defines the validation schema for the Property form.
 * Includes descriptions for user guidance (tooltips/helper text).
 * Updated to match backend schema.
 */
export const propertySchema = z.object({
  // --- Basic Information ---
  name: z.string({ required_error: "Tên bất động sản không được để trống." })
    .min(3, "Tên bất động sản phải có ít nhất 3 ký tự.")
    .describe("Tên hiển thị chính của bất động sản (ví dụ: 'Chung cư ABC', 'Nhà mặt tiền XYZ')."), // Required

  type: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: "Vui lòng chọn loại bất động sản hợp lệ." })
  }).describe("Chọn loại hình bất động sản phù hợp nhất."), // Required

  status: z.nativeEnum(PropertyStatus, {
    errorMap: () => ({ message: "Vui lòng chọn trạng thái hợp lệ." })
  }).describe("Trạng thái hiện tại của bất động sản (ảnh hưởng đến việc hiển thị và cho thuê)."), // Required

  // --- Location ---
  address: z.string({ required_error: "Địa chỉ không được để trống." })
    .min(5, "Địa chỉ phải có ít nhất 5 ký tự và bao gồm số nhà, tên đường.")
    .describe("Nhập địa chỉ đầy đủ bao gồm số nhà, tên đường."), // Required

  city: z.string({ required_error: "Tên thành phố không được để trống." })
    .min(2, "Tên thành phố phải có ít nhất 2 ký tự.")
    .describe("Tên tỉnh/thành phố nơi bất động sản tọa lạc."), // Required

  district: z.string({ required_error: "Tên quận/huyện không được để trống." })
    .min(2, "Tên quận/huyện phải có ít nhất 2 ký tự.")
    .describe("Tên quận/huyện."), // Required

  ward: z.union([
    z.literal(""),
    z.string().min(2, "Tên phường/xã phải có ít nhất 2 ký tự.")
  ]).optional()
    .describe("Tên phường/xã (Không bắt buộc)."), // Optional

  // --- Rates & Utilities ---
  defaultElectricityRate: z.coerce.number({ // coerce handles string input from forms
    invalid_type_error: "Giá điện phải là một con số.",
    required_error: "Vui lòng nhập giá điện mặc định."
  })
    .min(0, "Giá điện không được là số âm.")
    .describe("Đơn giá điện mặc định áp dụng cho các căn hộ/phòng (VND/kWh)."), // Required

  defaultWaterRate: z.coerce.number({
    invalid_type_error: "Giá nước phải là một con số.",
    required_error: "Vui lòng nhập giá nước mặc định."
  })
    .min(0, "Giá nước không được là số âm.")
    .describe("Đơn giá nước mặc định (VND/m³ hoặc VND/người/tháng - tùy theo cách tính)."), // Required

  defaultInternetRate: z.coerce.number({ invalid_type_error: "Phí Internet phải là một con số." })
    .min(0, "Phí Internet không được là số âm.")
    .optional()
    .describe("Phí Internet cố định hàng tháng (nếu có, VND). Để trống nếu không áp dụng."), // Optional

  defaultGarbageRate: z.coerce.number({ invalid_type_error: "Phí rác phải là một con số." })
    .min(0, "Phí rác không được là số âm.")
    .optional()
    .describe("Phí thu gom rác cố định hàng tháng (nếu có, VND). Để trống nếu không áp dụng."), // Optional

  hasSecurity: z.boolean()
    .default(false)
    .describe("Đánh dấu nếu bất động sản có hệ thống an ninh hoặc bảo vệ."), // Optional (default: false)

  hasElevator: z.boolean()
    .default(false)
    .describe("Đánh dấu nếu bất động sản có thang máy."), // Optional (default: false)

  hasParking: z.boolean()
    .default(false)
    .describe("Đánh dấu nếu bất động sản có chỗ đậu xe (xe máy, ô tô)."), // Optional (default: false)

  parkingFee: z.coerce.number({ invalid_type_error: "Phí đỗ xe phải là một con số." })
    .min(0, "Phí đỗ xe không được là số âm.")
    .optional()
    .describe("Phí gửi xe hàng tháng (nếu có, VND). Thường chỉ nhập khi 'Có chỗ để xe' được chọn."), // Optional
  // --- Other Settings ---
  // Note: Record<string, any> is hard to validate strictly with Zod without more defined structure.
  // For now, we keep them optional and accept any object. Consider a JSON editor or specific fields later.
  defaultOtherFees: z.record(z.string(), z.any())
    .optional()
    .describe("Các loại phí mặc định khác không được liệt kê ở trên (ví dụ: phí quản lý tòa nhà). Nhập dưới dạng key-value (Không bắt buộc)."), // Optional

  additionalFacilities: z.record(z.string(), z.any())
    .optional()
    .describe("Các tiện nghi bổ sung khác (ví dụ: gym, hồ bơi, khu BBQ). Nhập dưới dạng key-value (Không bắt buộc)."), // Optional

  // Thêm các trường ID cần thiết cho API
  ownerId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  
  // Trường ảnh thumbnail
  thumbnail: z.string().url().nullable().optional()
    .describe("URL ảnh thumbnail của bất động sản."),
    
  // Flag đánh dấu việc xóa thumbnail
  deleteThumbnail: z.boolean().optional()
    .describe("Nếu true, thumbnail hiện tại sẽ bị xóa.")
});

// Export the inferred TypeScript type
export type PropertyFormData = z.infer<typeof propertySchema>; 