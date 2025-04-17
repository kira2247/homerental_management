# Hướng dẫn sử dụng Brevo Email API trong Rental Management System

## 1. Giới thiệu

Brevo (trước đây là Sendinblue) là một nền tảng marketing all-in-one cung cấp nhiều dịch vụ như email marketing, SMS marketing, chat, CRM và automation. Trong dự án Rental Management System, chúng ta sử dụng Brevo API để gửi các loại email khác nhau như email xác thực, đặt lại mật khẩu, thông báo và email hàng loạt.

## 2. Cài đặt và Cấu hình

### 2.1. Cài đặt thư viện

Hệ thống sử dụng hai thư viện để làm việc với Brevo API:

```bash
# Thư viện chính thức của Brevo
npm install @sendinblue/client

# Thư viện hỗ trợ gửi request HTTP
npm install axios
```

### 2.2. Cấu hình môi trường

Thêm các biến môi trường sau vào file `.env`:

```
# API key của Brevo
BREVO_API_KEY=your_brevo_api_key

# Địa chỉ email người gửi (đã được xác minh trong Brevo)
MAIL_FROM=your_verified_email@example.com

# Tên hiển thị của người gửi
MAIL_FROM_NAME=Rental Management System

# URL của frontend (dùng cho các liên kết trong email)
FRONTEND_URL=http://localhost:3000
```

### 2.3. Lấy API Key từ Brevo

1. Đăng nhập vào tài khoản Brevo tại [https://app.brevo.com/](https://app.brevo.com/)
2. Vào **Settings** > **SMTP & API**
3. Trong tab **API Keys**, tạo một key mới hoặc sử dụng key hiện có
4. Sao chép API key và thêm vào file `.env`

### 2.4. Xác minh địa chỉ email người gửi

Để gửi email thành công với Brevo, bạn phải xác minh địa chỉ email người gửi:

1. Đăng nhập vào tài khoản Brevo
2. Vào **Senders & IPs** > **Senders**
3. Nhấp vào **Add a New Sender**
4. Điền thông tin và nhấp vào **Save**
5. Brevo sẽ gửi email xác minh đến địa chỉ email của bạn
6. Nhấp vào liên kết trong email để xác minh

**Lưu ý quan trọng**: Địa chỉ email trong `MAIL_FROM` phải đúng với địa chỉ email đã được xác minh trong Brevo.

## 3. Các loại email được hỗ trợ

### 3.1. Email xác thực (Verification Email)

Gửi email xác thực cho người dùng mới đăng ký.

```typescript
await mailService.sendVerificationEmail(
  'user@example.com',
  'User Name',
  'verification-token-123'
);
```

### 3.2. Email đặt lại mật khẩu (Password Reset Email)

Gửi email đặt lại mật khẩu khi người dùng quên mật khẩu.

```typescript
await mailService.sendPasswordResetEmail(
  'user@example.com',
  'User Name',
  'reset-token-456'
);
```

### 3.3. Email thông báo (Notification Email)

Gửi email thông báo cho người dùng, có thể kèm theo tệp đính kèm.

```typescript
const recipient = {
  email: 'user@example.com',
  name: 'User Name'
};

// Không có tệp đính kèm
await mailService.sendNotificationEmail(
  recipient,
  'Thông báo quan trọng',
  '<p>Đây là nội dung thông báo.</p>'
);

// Có tệp đính kèm
const attachments = [
  {
    name: 'invoice.pdf',
    content: 'base64_encoded_content', // Nội dung file được mã hóa base64
    contentType: 'application/pdf'
  }
];

await mailService.sendNotificationEmail(
  recipient,
  'Thông báo kèm tệp đính kèm',
  '<p>Đây là thông báo kèm theo hóa đơn.</p>',
  attachments
);
```

### 3.4. Email sử dụng template (Template Email)

Gửi email sử dụng template đã được tạo trên Brevo.

```typescript
const recipients = [
  { email: 'user1@example.com', name: 'User One' },
  { email: 'user2@example.com', name: 'User Two' }
];

// templateId là ID của template trên Brevo
await mailService.sendTemplateEmail(
  recipients,
  templateId,
  {
    name: 'User Name',
    property_name: 'Property Name',
    confirmation_link: 'https://example.com/confirm'
  }
);
```

### 3.5. Email hàng loạt (Bulk Email)

Gửi cùng một email cho nhiều người nhận.

```typescript
const recipients = [
  { email: 'user1@example.com', name: 'User One' },
  { email: 'user2@example.com', name: 'User Two' },
  { email: 'user3@example.com', name: 'User Three' }
];

const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
    <h2 style="color: #0070f3; text-align: center;">Thông báo</h2>
    <p>Xin chào,</p>
    <p>Đây là email hàng loạt từ Rental Management System.</p>
    <p>Trân trọng,<br>The Rental Management Team</p>
  </div>
`;

await mailService.sendBulkEmails(
  recipients,
  'Thông báo từ Rental Management',
  htmlContent
);
```

## 4. Tạo và quản lý template trên Brevo

### 4.1. Tạo template mới

1. Đăng nhập vào tài khoản Brevo
2. Vào **Campaigns** > **Email Templates**
3. Nhấp vào **New Template**
4. Chọn một trong các tùy chọn thiết kế (Responsive, HTML, hoặc Text)
5. Thiết kế template và thêm các biến động bằng cú pháp `{{% variable_name %}}`
6. Lưu template

### 4.2. Sử dụng template trong code

Sau khi tạo template, bạn sẽ nhận được một ID template. Sử dụng ID này trong phương thức `sendTemplateEmail`:

```typescript
await mailService.sendTemplateEmail(
  recipients,
  templateId, // ID của template từ Brevo
  {
    // Các biến được sử dụng trong template
    variable_name1: 'value1',
    variable_name2: 'value2'
  }
);
```

## 5. Theo dõi và phân tích

### 5.1. Xem báo cáo email

1. Đăng nhập vào tài khoản Brevo
2. Vào **Campaigns** > **Statistics**
3. Xem các chỉ số như tỷ lệ mở, tỷ lệ nhấp chuột, tỷ lệ phản hồi, v.v.

## 6. Kiểm tra gửi email

Bạn có thể sử dụng script sau để kiểm tra việc gửi email:

```javascript
// Tạo file test-mail-service.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function testMailService() {
  console.log('=== BẮT ĐẦU KIỂM TRA MAIL SERVICE ===');
  
  // Lấy thông tin từ biến môi trường
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM;
  const fromName = process.env.MAIL_FROM_NAME;
  
  if (!apiKey || !fromEmail || !fromName) {
    throw new Error('Thiếu thông tin cấu hình email trong file .env');
  }
  
  console.log('Thông tin cấu hình:');
  console.log('- API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
  console.log('- Người gửi:', fromName, `<${fromEmail}>`);
  
  // Thông tin người nhận
  const toEmail = 'recipient@example.com'; // Thay đổi email người nhận
  const toName = 'Recipient Name';
  
  console.log('Người nhận:', toName, `<${toEmail}>`);
  
  // Tạo nội dung email
  const subject = 'Kiểm Tra MailService - ' + new Date().toISOString();
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #0070f3; text-align: center;">Kiểm Tra MailService</h2>
      <p>Xin chào ${toName},</p>
      <p>Đây là email kiểm tra từ MailService.</p>
      <p>Email này được gửi lúc ${new Date().toLocaleString()}.</p>
      <p>Trân trọng,<br>Đội ngũ Quản Lý Cho Thuê</p>
    </div>
  `;
  
  // Chuẩn bị dữ liệu cho API request
  const data = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: toEmail, name: toName }],
    subject: subject,
    htmlContent: htmlContent,
    tags: ['test']
  };
  
  console.log('Đang gửi email kiểm tra...');
  
  try {
    // Gửi email sử dụng axios
    const response = await axios({
      method: 'post',
      url: 'https://api.sendinblue.com/v3/smtp/email',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      data: data
    });
    
    console.log('✅ Email đã được gửi thành công!');
    console.log('Status:', response.status);
    console.log('MessageId:', response.data.messageId || 'unknown');
  } catch (error) {
    console.error('❌ LỖI KHI GỬI EMAIL:');
    console.error(error.response?.data || error.message);
  }
  
  console.log('=== KẾT THÚC KIỂM TRA ===');
}

testMailService().catch(error => {
  console.error('❌ LỖI KHÔNG XÁC ĐỊNH:', error);
});
```

Chạy script kiểm tra với lệnh:

```bash
node src/modules/mail/test-mail-service.js
```

## 7. Xử lý sự cố

### 7.1. Lỗi thường gặp

| Mã lỗi | Mô tả | Cách xử lý |
|--------|-------|------------|
| 401 Unauthorized | API key không hợp lệ hoặc đã hết hạn | Kiểm tra và cập nhật API key trong file .env |
| 400 Bad Request | Thông tin gửi email không đầy đủ hoặc không hợp lệ | Kiểm tra dữ liệu gửi đi, đảm bảo email người gửi và người nhận đều hợp lệ |
| 403 Forbidden | Địa chỉ email người gửi chưa được xác minh | Xác minh địa chỉ email người gửi trong tài khoản Brevo |
| 429 Too Many Requests | Vượt quá giới hạn gửi | Đợi một thời gian hoặc nâng cấp gói dịch vụ |

### 7.2. Kiểm tra cấu hình

Nếu gặp vấn đề khi gửi email, hãy kiểm tra các điểm sau:

1. **API Key**: Đảm bảo API key đúng và còn hiệu lực
2. **Email người gửi**: Xác minh email người gửi đã được xác thực trong Brevo
3. **Giới hạn gửi**: Kiểm tra xem đã vượt quá giới hạn gửi của gói dịch vụ chưa
4. **Nội dung email**: Đảm bảo nội dung email không vi phạm chính sách chống spam

### 7.3. Xem logs

Khi gặp lỗi, kiểm tra logs để biết thêm chi tiết:

```typescript
try {
  await mailService.sendVerificationEmail(email, name, token);
  logger.info(`Đã gửi email xác minh đến ${email}`);
} catch (error) {
  logger.error(`Lỗi gửi email đến ${email}:`, error.response?.data || error.message);
  // Xử lý lỗi tùy theo trường hợp
}
```

## 8. Tài liệu tham khảo

- [Tài liệu API Brevo](https://developers.brevo.com/docs)
- [Thư viện Node.js cho Brevo](https://github.com/sendinblue/APIv3-nodejs-library)
- [Hướng dẫn SMTP Brevo](https://help.brevo.com/hc/en-us/articles/360007666479-Configure-SMTP-parameters)

### 5.2. Theo dõi sự kiện email

Brevo cung cấp webhook để theo dõi các sự kiện email như đã gửi, đã mở, đã nhấp, v.v. Để cài đặt webhook:

1. Đăng nhập vào tài khoản Brevo
2. Vào **Settings** > **Webhooks**
3. Nhấp vào **Create a new webhook**
4. Nhập URL của webhook và chọn các sự kiện cần theo dõi

## 6. Xử lý lỗi và debug

### 6.1. Xử lý lỗi

```typescript
try {
  await mailService.sendVerificationEmail(email, name, token);
} catch (error) {
  console.error('Failed to send verification email:', error);
  // Xử lý lỗi tại đây
}
```

### 6.2. Logging

Dịch vụ mail của chúng ta sử dụng `mailLogger` để ghi log các hoạt động gửi email. Kiểm tra log để debug các vấn đề liên quan đến email.

## 7. Kiểm thử

Sử dụng file `mail.test.ts` để kiểm thử các chức năng gửi email:

```bash
# Chạy file test
npx ts-node src/modules/mail/mail.test.ts
```

## 8. Tài liệu tham khảo

- [Brevo API Documentation](https://developers.brevo.com/docs)
- [Brevo Node.js SDK](https://github.com/sendinblue/APIv3-nodejs-library)
- [Brevo SMTP API](https://developers.brevo.com/docs/send-transactional-emails)
