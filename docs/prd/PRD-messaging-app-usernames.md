---
title: PRD — Messaging App (Username-only)
author: Product Manager (Dispatcher)
created: 2026-09-05
status: approved-for-mvp
---

# PRD — Ứng dụng nhắn tin bằng Username

## 1. Vấn đề
Người dùng muốn nhắn tin với bạn bè mà không cần đăng ký bằng email — chỉ cần chọn
một **username** duy nhất và mật khẩu để đăng nhập.

## 2. Mục tiêu (Goals)
- Cho phép tạo tài khoản chỉ với `username` + `password`, không thu thập email/số điện thoại.
- Tìm và thêm bạn bè bằng username chính xác.
- Nhắn tin 1:1 theo thời gian thực, lưu lại lịch sử hội thoại.
- Hiển thị trạng thái online/offline của bạn bè.

## 3. Non-goals (Ngoài phạm vi MVP)
- Chat nhóm (group chat)
- Gửi ảnh/file/voice
- Thông báo đẩy (push notification) khi app đóng
- Ứng dụng di động native
- Khôi phục mật khẩu qua email/SMS (vì không thu thập các kênh này ở MVP — user tự đặt lại
  qua liên hệ hỗ trợ thủ công, ghi rõ trong UI)

## 4. Đối tượng người dùng
Người dùng cá nhân muốn một kênh nhắn tin riêng tư, tối giản, không ràng buộc danh tính thật.

## 5. User flow chính
1. User mở app → chọn "Đăng ký" → nhập username (duy nhất) + password → tạo tài khoản → tự động đăng nhập.
2. User đăng nhập bằng username + password ở các lần sau.
3. User tìm bạn bằng ô "Thêm bạn theo username" → nếu username tồn tại → thêm vào danh sách bạn bè.
4. User chọn 1 bạn trong danh sách → mở khung chat → gõ tin nhắn → gửi real-time.
5. Người nhận (nếu đang online) nhận tin nhắn ngay lập tức; nếu offline, thấy khi đăng nhập lại.

## 6. Acceptance Criteria (mức PRD — chi tiết ở User Stories)
- [ ] Đăng ký thất bại nếu username đã tồn tại hoặc để trống.
- [ ] Mật khẩu không lưu plaintext (bắt buộc hash).
- [ ] Không có trường email/số điện thoại ở bất kỳ form nào.
- [ ] Tin nhắn gửi đi hiển thị ngay ở khung chat người gửi (optimistic hoặc ack từ server).
- [ ] Lịch sử tin nhắn được giữ lại sau khi đăng xuất/đăng nhập lại.

## 7. Metric đo lường (định tính cho MVP nội bộ)
- Luồng đăng ký → thêm bạn → nhắn tin thành công không lỗi trong 1 lần thử qua trình duyệt.

## 8. Rủi ro
- Username-only auth không có kênh khôi phục mật khẩu → mất tài khoản nếu quên password.
  Chấp nhận được ở MVP, ghi rõ trong UI đăng ký ("Hãy nhớ mật khẩu — không có khôi phục qua email ở phiên bản này").
