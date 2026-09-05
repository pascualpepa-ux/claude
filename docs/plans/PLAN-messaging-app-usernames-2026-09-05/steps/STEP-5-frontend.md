---
step: 5
agent: senior-developer
status: done
completed_at: "2026-09-05 17:45"
---

## Đã làm
Implement frontend tại `src/client/` (React + Vite + TypeScript + Tailwind):
`api.ts` (REST client), `socket.ts` (Socket.IO client kèm JWT auth),
`context/AuthContext.tsx` (lưu session vào localStorage, tự reconnect socket
khi reload), `pages/Register.tsx`, `pages/Login.tsx`, `pages/Chat.tsx` (danh
sách bạn bè + trạng thái online, form thêm bạn, khung chat real-time), routing
trong `App.tsx` (guard `RequireAuth`/`PublicOnly`).

`npx tsc -b` pass sạch, `npx vite build` build production thành công
(215 KB / gzip 69 KB).

## Artifact
- `src/client/package.json`, `vite.config.ts`, `tsconfig.json`,
  `tailwind.config.js`, `postcss.config.js`, `index.html`,
  `src/{main.tsx,App.tsx,api.ts,socket.ts,index.css,vite-env.d.ts}`,
  `src/context/AuthContext.tsx`, `src/pages/{Register,Login,Chat}.tsx`

## Handoff Payload — bước sau đọc phần này
- do_not_redo: Typecheck + build đã pass — QA không cần chạy lại tsc/build trừ khi nghi ngờ regression.
- watch_out: Chưa có test unit/automation script riêng cho frontend (không có test runner cấu hình) — QA cần verify bằng cách chạy app thật (đã làm ở Step 6), không có `npm test` để chạy.
- next_inputs: Chạy `npm run dev` ở cả `src/server` và `src/client` (2 terminal riêng) để có app thật cho QA kiểm thử luồng chính.
