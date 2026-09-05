---
step: 6
agent: qa-engineer
status: done
completed_at: "2026-09-05 18:00"
---

## Đã làm
Chạy app thật (server `localhost:4000` + client `localhost:5173`), dùng
Playwright (Chromium thật, không mock) điều khiển 2 trình duyệt độc lập (2 user
"uiAlice"/"uiBob"):

1. Đăng ký uiAlice → vào thẳng màn Chat (empty state).
2. uiAlice thêm uiBob làm bạn qua ô "Thêm bạn theo username" → xuất hiện ngay
   trong sidebar với chấm trạng thái.
3. uiBob thêm uiAlice làm bạn (quan hệ 2 chiều).
4. uiAlice mở chat với uiBob, gửi "Xin chao Bob!" → hiển thị ngay bubble bên
   phải (màu tím, của mình).
5. uiBob mở chat với uiAlice → thấy "Xin chao Bob!" xuất hiện REAL-TIME (không
   reload trang) ở bubble bên trái.
6. uiBob trả lời → uiAlice nhận real-time, đúng thứ tự, đúng chiều bubble.

Toàn bộ PASS, có screenshot bằng chứng (`/tmp/1..5-*.png`, đã xem trực tiếp
qua Read tool để xác nhận UI không bị vỡ layout/overlap).

## Kết quả
| Test case | Kết quả |
|---|---|
| Đăng ký username-only, không có trường email | ✅ PASS |
| Trùng username → lỗi rõ ràng (verify qua curl ở Step 4) | ✅ PASS |
| Thêm bạn theo username, 2 chiều | ✅ PASS |
| Chấm trạng thái online hiển thị đúng | ✅ PASS |
| Gửi/nhận tin nhắn real-time không cần reload | ✅ PASS |
| Bubble chat căn đúng chiều (mình=phải, bạn=trái) | ✅ PASS |
| TypeScript build sạch, không lỗi | ✅ PASS |

Không phát hiện bug P0/P1. Không cần QA Lead sign-off (P2, không phải P0/P1
theo §11 bảng artifact WF-BUGFIX — áp dụng tương tự vì đây không phải hotfix
sản xuất mà là feature mới demo/local).

## Handoff Payload — bước sau đọc phần này
- do_not_redo: Luồng chính đã verify PASS bằng browser thật — không cần test lại thủ công.
- watch_out: Chưa test edge case mất kết nối mạng giữa chừng (offline/reconnect socket) — ghi nhận là gap, không block MVP vì ngoài phạm vi PRD (không có yêu cầu offline-first).
- next_inputs: Không có — chuyển thẳng sang hướng dẫn chạy local (Step 7), không có bước deploy staging/production vì đây là app demo trong workspace, không có hạ tầng deploy thật.
