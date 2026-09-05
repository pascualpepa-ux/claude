---
title: User Stories — Messaging App (Username-only)
author: Business Analyst (Dispatcher)
created: 2026-09-05
---

# User Stories

## US-01 — Đăng ký bằng username
**Là** người dùng mới, **tôi muốn** tạo tài khoản chỉ bằng username + password,
**để** không phải cung cấp email.

- Given username chưa tồn tại và password ≥ 6 ký tự
  When tôi submit form đăng ký
  Then tài khoản được tạo, password được hash (bcrypt), tôi được đăng nhập tự động và nhận JWT
- Given username đã tồn tại
  When tôi submit form đăng ký
  Then hiển thị lỗi "Username đã tồn tại", không tạo tài khoản
- Given username để trống hoặc password < 6 ký tự
  When tôi submit
  Then hiển thị lỗi validate tương ứng, không gọi API

## US-02 — Đăng nhập
**Là** người dùng đã có tài khoản, **tôi muốn** đăng nhập bằng username + password.

- Given username tồn tại và password đúng
  When tôi submit đăng nhập
  Then nhận JWT, chuyển vào màn hình chat chính
- Given username không tồn tại hoặc password sai
  When tôi submit
  Then hiển thị lỗi "Sai username hoặc mật khẩu" (không tiết lộ cái nào sai — tránh username enumeration)

## US-03 — Thêm bạn theo username
**Là** người dùng đã đăng nhập, **tôi muốn** thêm bạn bằng username chính xác.

- Given username bạn tồn tại và khác username của tôi và chưa là bạn
  When tôi nhập username và bấm "Thêm bạn"
  Then bạn đó xuất hiện trong danh sách bạn bè của tôi (quan hệ 2 chiều)
- Given username không tồn tại
  When tôi bấm "Thêm bạn"
  Then hiển thị lỗi "Không tìm thấy username này"
- Given tôi nhập chính username của mình
  When tôi bấm "Thêm bạn"
  Then hiển thị lỗi "Không thể tự thêm chính mình"

## US-04 — Nhắn tin real-time 1:1
**Là** người dùng đã có bạn bè, **tôi muốn** gửi/nhận tin nhắn ngay lập tức.

- Given tôi chọn 1 bạn trong danh sách và đang kết nối socket
  When tôi gõ tin nhắn và bấm gửi
  Then tin nhắn xuất hiện ngay trong khung chat của tôi và được lưu vào DB
  And nếu bạn đó đang online, tin nhắn xuất hiện ngay trong khung chat của họ (không cần reload)
- Given bạn đó đang offline khi tôi gửi
  When họ đăng nhập lại và mở khung chat với tôi
  Then họ thấy tin nhắn tôi đã gửi trong lịch sử

## US-05 — Trạng thái online/offline
**Là** người dùng, **tôi muốn** biết bạn bè của mình có đang online không.

- Given bạn bè kết nối socket thành công
  When tôi mở danh sách bạn bè
  Then thấy chấm xanh "online" cạnh tên họ
- Given bạn bè ngắt kết nối (đóng tab/mất mạng)
  When socket server phát hiện disconnect
  Then trạng thái của họ chuyển thành "offline" ở phía tôi trong thời gian thực

## US-06 — Lịch sử tin nhắn
**Là** người dùng, **tôi muốn** thấy lại các tin nhắn cũ khi mở lại đoạn chat.

- Given tôi đã từng nhắn tin với 1 người bạn
  When tôi mở lại khung chat với người đó (kể cả sau khi đăng xuất/đăng nhập lại)
  Then thấy toàn bộ lịch sử tin nhắn theo thứ tự thời gian
