---
name: deploy-react-github
description: >-
  Tự động hóa hoàn toàn quy trình dọn sạch Git, sinh .gitignore an toàn và force push mã nguồn React/Next.js lên GitHub để chuẩn bị deploy Vercel. Kích hoạt khi người dùng cung cấp link GitHub repo hoặc yêu cầu đẩy code/deploy dự án React/Next.js lên GitHub hoặc Vercel.
---

# Quy trình Tự động Đẩy Mã Nguồn React / Next.js lên GitHub & Vercel

Skill này hoạt động như một nút bấm 1-click tự động hóa 100% việc chuẩn bị và đưa mã nguồn React/Next.js lên GitHub mà không bao giờ gặp các lỗi Git phổ biến (lỗi file kẹt > 100MB, rác cache .next, node_modules, lỗi xung đột commit, lỗi mã hóa UTF-16LE của .gitignore trên Windows).

## Khi nào sử dụng (Trigger)?
Kích hoạt skill này ngay lập tức khi:
1. Người dùng cung cấp đường link GitHub repo (VD: `https://github.com/cum3hoctoan-netizen/integra-testing-web`) kèm yêu cầu "đẩy code", "push lên GitHub", "deploy Vercel".
2. Người dùng muốn dọn sạch lịch sử Git và khởi tạo lại repo mới tinh để đưa lên GitHub.
3. Người dùng gặp lỗi file quá nặng (>100MB) bị kẹt trong Git hoặc muốn chuẩn bị mã nguồn để Vercel import.

---

## Chuỗi Hành Động Chuẩn Của Agent

Khi người dùng cung cấp đường link GitHub repo `<URL_REPO>`:

### Bước 1: Chạy Script Tự Động Hóa
Agent sử dụng công cụ `run_command` để thực thi script:
```powershell
node deploy-github.mjs "<URL_REPO>"
```
*(Hoặc `node .agents/skills/deploy-react-github/scripts/deploy-github.mjs "<URL_REPO>"` nếu gọi từ thư mục skill)*

### Bước 2: Script sẽ tự động thực hiện 5 bước triệt để:
1. **Dọn dẹp thư mục `.git` cũ**: Xóa hoàn toàn thư mục ẩn `.git` (dọn sạch file rác & lịch sử file kẹt > 100MB, giải phóng lock file trên Windows).
2. **Khởi tạo Git mới tinh**: Thực hiện `git init`, thiết lập cấu hình cơ bản (`user.name`, `user.email`, `core.autocrlf false`).
3. **Tạo `.gitignore` an toàn chuẩn UTF-8**: Tự động loại trừ:
   - `node_modules/`
   - `.next/`
   - `package-lock.json`
   - `.env` & `.env*.local`
   - `*.tsbuildinfo`, `.vercel/`, `out/`, `build/`
4. **Staging & Commit gốc**: Thực hiện `git add .`, tạo commit gốc `'Auto-deploy từ Antigravity'`, gán nhánh `main`, thiết lập `remote origin`.
5. **Push ép buộc (-f)**: Chạy `git push -f -u origin main` đưa mã nguồn sạch 100% lên GitHub bất chấp trạng thái trước đó.

---

## Báo Cáo Kết Quả Cho Người Dùng

Sau khi lệnh kết thúc thành công, Agent phản hồi cho người dùng theo mẫu sau:

```markdown
### 🚀 Đã đẩy mã nguồn React/Next.js lên GitHub thành công!

- **Thư mục dự án**: `<Đường dẫn>`
- **GitHub Repository**: [<URL_REPO>](<URL_REPO>)
- **Trạng thái**: Đã dọn sạch .git cũ, loại trừ node_modules/.next/package-lock.json, commit gốc nhánh `main` và Force Push thành công.

---

### 👉 Bước tiếp theo để kích hoạt web trên Vercel:
1. Truy cập: [Vercel Dashboard - New Project](https://vercel.com/new)
2. Chọn repo **`<tên-repo>`** vừa được đẩy và bấm **Import**.
3. Giữ nguyên cấu hình mặc định (Framework Preset: **Next.js**) và nhấn **Deploy**.
4. Website của bạn sẽ hoàn tất build và online toàn cầu chỉ sau ~1 phút!
```
