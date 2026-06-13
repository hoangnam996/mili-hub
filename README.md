# MILI-HUB

**Nền tảng Số hóa & Tiện ích Đời sống Quân sự**
*"Một chạm kết nối – Trọn vẹn mùa quân sự"*

Ứng dụng web full-stack (Node.js + Express + PostgreSQL + HTML/CSS/JS thuần) gồm 4 phân hệ:

1. **Military Wiki** — Danh bạ Ban chỉ huy (đại đội trưởng, chính trị viên...)
2. **Mili-Operation** — Lịch trực cơm/gác đêm + Chấm điểm nội vụ chống gian lận (ảnh có dấu thời gian + GPS do server tự gán, sinh viên không sửa được)
3. **Mili-Support** — Báo hỏng thiết bị phòng theo dạng to-do list (S.O.S Room)
4. **Mili-Community** — Sàn thanh lý nội khu (Mili-Market) + Hộp tìm đồ thất lạc (Lost & Found)

Có sẵn 2 vai trò: **student** (sinh viên) và **admin** (Ban quản lý / Ban thi đua).

---

## 0. Trước khi bắt đầu — chuẩn bị máy (macOS)

Bạn chưa có Git và Node, mình sẽ cài qua **Homebrew**. Mở app **Terminal** (hoặc terminal trong VS Code: menu `Terminal > New Terminal`).

### Cài Homebrew (nếu máy chưa có)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Làm theo hướng dẫn trên màn hình (có thể cần nhập mật khẩu máy Mac).

### Cài Git và Node.js
```bash
brew install git node
```

Kiểm tra đã cài thành công:
```bash
git --version
node --version
npm --version
```

---

## 1. Giải nén & mở project trong VS Code

1. Giải nén file `mili-hub.zip` ra một thư mục, ví dụ `~/Documents/mili-hub`.
2. Mở VS Code → `File > Open Folder...` → chọn thư mục `mili-hub`.
3. Mở Terminal trong VS Code (`Ctrl + ` ` hoặc menu `Terminal > New Terminal`), đảm bảo đang ở đúng thư mục `mili-hub`.

---

## 2. Chạy thử ở máy local (khuyến nghị, để kiểm tra trước khi deploy)

### 2.1. Cài thư viện
```bash
npm install
```

### 2.2. Cài PostgreSQL local (để test)

Cách nhanh nhất trên macOS là dùng Postgres.app: tải tại https://postgresapp.com (kéo vào Applications, mở app, bấm "Initialize").

Hoặc dùng Homebrew:
```bash
brew install postgresql@16
brew services start postgresql@16
createdb milihub
```

### 2.3. Tạo file `.env`

Copy file mẫu rồi sửa lại:
```bash
cp .env.example .env
```

Mở file `.env` trong VS Code và sửa `DATABASE_URL` cho đúng với Postgres local của bạn, ví dụ:
```
DATABASE_URL=postgresql://localhost:5432/milihub
JWT_SECRET=mot-chuoi-bi-mat-bat-ky
PORT=3000
NODE_ENV=development
```

### 2.4. Khởi tạo bảng + tài khoản admin mẫu
```bash
npm run seed
```
Lệnh này tạo toàn bộ bảng dữ liệu và tài khoản:
- **admin / admin123** (Ban quản lý)

### 2.5. Chạy server
```bash
npm start
```
Mở trình duyệt: http://localhost:3000

---

## 3. Đưa code lên GitHub (vì Render deploy từ GitHub)

Bạn đã có tài khoản Render nhưng chưa có Git/GitHub repo cho project này — làm theo các bước sau.

### 3.1. Tạo repo mới trên GitHub
1. Vào https://github.com → đăng nhập (hoặc tạo tài khoản nếu chưa có).
2. Bấm nút **"+"** ở góc trên phải → **New repository**.
3. Đặt tên ví dụ `mili-hub`, để **Public** hoặc **Private** đều được, **không** tick "Add a README" (vì code đã có sẵn).
4. Bấm **Create repository**. GitHub sẽ hiện cho bạn vài dòng lệnh — giữ tab này lại.

### 3.2. Đẩy code từ máy lên GitHub

Trong Terminal (VS Code), tại thư mục `mili-hub`:

```bash
git init
git add .
git commit -m "Khởi tạo MILI-HUB"
git branch -M main
git remote add origin https://github.com/TEN-CUA-BAN/mili-hub.git
git push -u origin main
```

> Thay `TEN-CUA-BAN/mili-hub` bằng đúng URL repo bạn vừa tạo ở bước 3.1.
> Lần đầu push, GitHub sẽ yêu cầu đăng nhập — chọn đăng nhập qua trình duyệt (Sign in with your browser) là dễ nhất.

File `.env` của bạn **sẽ không** được đẩy lên (đã được loại trừ trong `.gitignore`) — đây là điều tốt, vì nó chứa thông tin bí mật.

---

## 4. Deploy lên Render

### 4.1. Tạo PostgreSQL Database trên Render

1. Vào Render Dashboard → **New +** → **PostgreSQL**.
2. Đặt tên (ví dụ `mili-hub-db`), chọn region gần Việt Nam (Singapore nếu có).
3. Chọn plan **Free** → **Create Database**.
4. Sau khi tạo xong, vào trang database vừa tạo, kéo xuống mục **Connections** và copy giá trị **Internal Database URL** (sẽ dùng ở bước 4.2).

### 4.2. Tạo Web Service

1. Render Dashboard → **New +** → **Web Service**.
2. Chọn **Build and deploy from a Git repository** → kết nối GitHub → chọn repo `mili-hub` bạn vừa tạo.
3. Điền thông tin:
   - **Name**: `mili-hub` (hoặc tên bạn muốn)
   - **Region**: chọn cùng region với database ở bước 4.1
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Kéo xuống mục **Environment Variables**, bấm **Add Environment Variable** và thêm:

   | Key            | Value                                                        |
   |----------------|---------------------------------------------------------------|
   | `DATABASE_URL` | dán **Internal Database URL** đã copy ở bước 4.1              |
   | `JWT_SECRET`   | một chuỗi bí mật bất kỳ, ví dụ `milihub-2026-bi-mat-doi-quan` |
   | `NODE_ENV`     | `production`                                                   |

   (Không cần thêm `PORT` — Render tự cấp.)

5. Bấm **Create Web Service**. Render sẽ tự `npm install` và `npm start`. Theo dõi log đến khi thấy dòng `MILI-HUB server đang chạy tại cổng ...`.

### 4.3. Khởi tạo bảng dữ liệu trên database Render (chạy seed 1 lần)

Sau khi service deploy thành công lần đầu, bạn cần tạo bảng + tài khoản admin trên database Render (database mới luôn rỗng).

Cách dễ nhất — dùng **Shell** của Render:
1. Vào trang Web Service vừa tạo trên Render → tab **Shell** (ở menu bên trái).
2. Chạy lệnh:
   ```bash
   npm run seed
   ```
3. Thấy dòng `Hoàn tất khởi tạo cơ sở dữ liệu MILI-HUB` là xong.

> Nếu Render bản bạn dùng không có tab Shell (một số gói Free có thể hạn chế), cách thay thế: chạy `npm run seed` ở máy local với `DATABASE_URL` trong `.env` là **External Database URL** (lấy ở trang database Render, mục Connections), rồi chạy `npm run seed` từ Terminal VS Code.

### 4.4. Truy cập ứng dụng

Mở URL Render cấp cho bạn, dạng `https://mili-hub.onrender.com`.

Đăng nhập với:
- **Ban quản lý**: `admin` / `admin123` (hãy đổi mật khẩu/tạo tài khoản admin khác và xoá tài khoản này nếu dùng thật)
- **Sinh viên**: bấm tab "Đăng ký" để tạo tài khoản mới

---

## 5. Cấu trúc project

```
mili-hub/
├── server.js              # Entry point — Express app + static frontend
├── package.json
├── .env.example            # Mẫu biến môi trường (copy thành .env khi chạy local)
├── config/
│   └── db.js               # Kết nối PostgreSQL (pg Pool)
├── middleware/
│   └── auth.js             # Xác thực JWT, kiểm tra quyền admin
├── routes/
│   ├── auth.js             # /api/auth — đăng ký, đăng nhập, lấy thông tin user
│   ├── wiki.js              # /api/wiki — danh bạ Ban chỉ huy
│   ├── operation.js         # /api/operation — lịch trực, chấm điểm nội vụ
│   ├── support.js           # /api/support — báo hỏng SOS Room
│   └── community.js         # /api/community — Mili-Market, Lost & Found
├── db/
│   ├── schema.sql           # Toàn bộ câu lệnh tạo bảng
│   └── seed.js              # Script tạo bảng + dữ liệu mẫu (chạy: npm run seed)
└── public/                  # Frontend tĩnh (HTML/CSS/JS thuần)
    ├── index.html           # Trang đăng nhập / đăng ký
    ├── dashboard.html        # Tổng quan 4 phân hệ
    ├── wiki.html              # Phân hệ 1
    ├── operation.html         # Phân hệ 2
    ├── support.html           # Phân hệ 3
    ├── community.html         # Phân hệ 4
    ├── css/style.css          # Giao diện "học viện số" (navy + gold + sage)
    └── js/                    # Logic từng trang (api.js là helper chung)
```

---

## 6. Lưu ý quan trọng

- **Ảnh (chấm điểm nội vụ, báo hỏng, Mili-Market, Lost&Found)** được lưu dưới dạng **base64** trực tiếp trong PostgreSQL để đơn giản hoá việc deploy (không cần cấu hình storage riêng). Phù hợp cho mục đích học tập / demo. Nếu triển khai thật với nhiều người dùng, nên chuyển sang lưu ảnh ở dịch vụ object storage (ví dụ Cloudinary, AWS S3, Supabase Storage) để tránh database phình to quá nhanh.
- **Render Free Plan**: service sẽ "ngủ" sau ~15 phút không có truy cập, lần truy cập đầu tiên sau đó sẽ load chậm hơn (cold start). Database Free cũng có giới hạn dung lượng (1GB) và sẽ bị xoá sau 90 ngày không hoạt động (theo chính sách hiện tại của Render — kiểm tra lại trên trang Render khi deploy).
- **Đổi `JWT_SECRET`**: hãy đặt một chuỗi ngẫu nhiên, khó đoán cho biến `JWT_SECRET` trên Render — đây là chìa khoá ký token đăng nhập.
- **Tài khoản admin mẫu** (`admin` / `admin123`) chỉ nên dùng để test. Khi dùng thật, đổi mật khẩu hoặc tạo admin khác rồi xoá tài khoản này trực tiếp trong database (qua Render Shell + `psql`).

---

## 7. Cập nhật code sau khi deploy

Mỗi khi sửa code, chỉ cần:
```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```
Render sẽ tự động phát hiện commit mới trên GitHub và deploy lại (Auto-Deploy bật theo mặc định).
