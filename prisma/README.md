# BRIX Server

## Database Workflow (Prisma)

Dự án sử dụng Prisma để quản lý Database. Dưới đây là quy trình khi bạn muốn thay đổi cấu trúc bảng (schema).

### 1. Bảng `_prisma_migrations` là gì?

Đây là bảng nội bộ của Prisma dùng để theo dõi lịch sử các bản cập nhật DB của bạn.

- Mỗi khi bạn chạy `prisma migrate dev`, Prisma sẽ lưu thông tin bản cập nhật vào bảng này.
- **TUYỆT ĐỐI KHÔNG** xóa hoặc sửa bảng này thủ công.

### 2. Quy trình thay đổi Schema (Thiết kế lại bảng)

Mỗi khi bạn thêm/sửa/xóa column hoặc tạo bảng mới, hãy làm theo các bước sau:

1.  **Chỉnh sửa file schema**: Mở `prisma/schema.prisma` và thay đổi thiết kế bảng.
2.  **Chạy Migration**:

    ```bash
    pnpm prisma:migrate
    ```

    - Prisma sẽ so sánh schema của bạn với DB hiện tại.
    - Nó sẽ hỏi bạn tên của migration (ví dụ: `add_user_avatar`).
    - Nó sẽ tạo ra 1 file SQL trong thư mục `prisma/migrations` và thực thi nó vào DB.

3.  **Tự động cập nhật Client**: Sau khi migrate thành công, lệnh này cũng tự động chạy `prisma generate` để bạn có code gợi ý (Intellisense) mới nhất trong VS Code.

### 3. Các lệnh Database hữu ích

| Lệnh                   | Mô tả                                                                     |
| :--------------------- | :------------------------------------------------------------------------ |
| `pnpm prisma:migrate`  | Tạo migration mới và áp dụng vào DB (Dùng khi code)                       |
| `pnpm prisma:generate` | Cập nhật Prisma Client (Code intellisense)                                |
| `pnpm prisma:studio`   | Mở giao diện Web để xem/sửa data nhanh                                    |
| `pnpm prisma:reset`    | **XÓA SẠCH DATA** và chạy lại toàn bộ migration từ đầu                    |
| `pnpm prisma:push`     | Đẩy trực tiếp schema lên DB không qua migration (Chỉ dùng khi test nhanh) |

---

> [!IMPORTANT]
> Luôn sử dụng `prisma:migrate` thay vì `prisma:push` để đảm bảo project có lịch sử thay đổi (migrations history) đồng nhất giữa các thành viên trong team.
