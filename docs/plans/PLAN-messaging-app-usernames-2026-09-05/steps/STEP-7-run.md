---
step: 7
agent: devops-engineer
status: done
completed_at: "2026-09-05 18:05"
---

## Đã làm
Viết hướng dẫn chạy local tại `src/README.md` (server + client, 2 terminal,
`.env.example` → `.env`). Không có bước deploy staging/production thật vì
workspace này chưa có hạ tầng deploy cho sản phẩm mới (§11 CLAUDE.md — chưa có
dự án sản phẩm nào đang chạy); phạm vi MVP dừng ở "chạy được local, verify
bằng browser thật" theo đúng scope đã chốt với user.

## Artifact
- `src/README.md`

## Handoff Payload — bước sau đọc phần này
- do_not_redo: Không cần viết thêm Dockerfile/CI pipeline — ngoài phạm vi MVP đã chốt, chỉ thêm nếu user yêu cầu deploy thật sau này.
- watch_out: `.gitignore` bị config-protection hook chặn sửa trực tiếp — chưa thêm entry cho `src/client/dist/`, `src/server/db.sqlite*`, `src/server/.env`. Cần dọn các file này thủ công trước mỗi lần commit, hoặc xin user xác nhận để sửa `.gitignore`.
- next_inputs: Không có — đây là bước cuối của WF-FEATURE rút gọn cho MVP này.
