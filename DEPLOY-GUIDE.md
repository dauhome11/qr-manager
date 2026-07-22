# 🚀 Hướng Dẫn Deploy QR Manager Lên Vercel (5 Phút)

## **Tóm Tắt:**
Bạn sẽ có website riêng để dùng QR Manager ngay lập tức. Không cần code, chỉ cần 3 bước.

---

## **Bước 1: Chuẩn Bị Tài Khoản (2 phút)**

### A. Tạo Tài Khoản Vercel (Nếu Chưa Có)
1. Vào: https://vercel.com
2. Bấm "Sign Up"
3. Chọn "Continue with GitHub"
4. GitHub sẽ yêu cầu authorize → Bấm "Authorize Vercel"
5. Xong!

### B. Tạo Tài Khoản GitHub (Nếu Chưa Có)
1. Vào: https://github.com/signup
2. Điền email, password, username
3. Xác nhận email
4. Xong!

---

## **Bước 2: Upload Files Lên GitHub (2 phút)**

### **Cách Dễ Nhất (Dùng GitHub Website):**

1. **Tạo repo mới:**
   - Vào https://github.com/new
   - Repository name: `qr-manager`
   - Description: `QR Code Manager App`
   - Public
   - Bấm "Create repository"

2. **Upload files:**
   - Bấm "Add file" → "Upload files"
   - Kéo-thả tất cả files từ outputs folder (trừ .gitignore)
   - Scroll xuống → "Commit changes"

3. **Upload src files:**
   - Bấm "Add file" → "Create new file"
   - Tên: `src/qr-manager.jsx`
   - Copy-paste nội dung từ file `qr-manager.jsx`
   - Commit
   - Làm lại cho `src/App.js` và `src/index.js`, `src/index.css`

4. **Upload public:**
   - Tạo file `public/index.html` (giống cách trên)

---

## **Bước 3: Deploy Lên Vercel (1 phút)**

1. **Vào Vercel:**
   - https://vercel.com/dashboard
   - Bấm "+ New Project"

2. **Import GitHub Repo:**
   - Chọn "Import Git Repository"
   - Tìm `qr-manager` repo vừa tạo
   - Bấm "Import"

3. **Deploy:**
   - Vercel sẽ auto-detect React
   - Bấm "Deploy"
   - Chờ ~2-3 phút

4. **Done! 🎉**
   - Vercel cho link: `https://qr-manager-XXX.vercel.app`
   - Bấm link → Dùng ngay!

---

## **Cách Cập Nhật Code**

Nếu sau này muốn thay đổi:

1. Sửa file trên GitHub (bấm file → Edit → Commit)
2. Vercel tự động rebuild (1-2 phút)
3. Website update ngay

---

## **Không Muốn Dùng GitHub? (Cách Khác)**

### **Dùng GitHub Desktop (Nhanh hơn):**

1. Tải: https://desktop.github.com
2. Mở → Sign in GitHub
3. File → New Repository
   - Name: `qr-manager`
   - Create
4. Copy tất cả files vào folder đó
5. Quay GitHub Desktop:
   - Commit → Publish repository
6. Vào https://vercel.com → Import → Select repo → Deploy

---

## **Nếu Gặp Lỗi:**

**"Deployment failed"**
→ Kiểm tra tất cả files có đúng structure không
→ Xem Vercel logs (Dashboard → Deployments)

**"Cannot find module"**
→ Đảm bảo npm dependencies đúng trong package.json
→ Vercel sẽ tự cài (npm install)

**"Blank page"**
→ F12 → Console → Xem có lỗi gì
→ Kiểm tra public/index.html có `<div id="root"></div>` không

---

## **Các File Cần Thiết:**

```
qr-manager/
├── package.json
├── tailwind.config.js
├── vercel.json
├── .gitignore
├── README.md
├── public/
│   └── index.html
└── src/
    ├── index.js
    ├── index.css
    ├── App.js
    └── qr-manager.jsx
```

---

## **Xong Rồi!**

Anh sẽ có URL như:
```
https://qr-manager-abc123.vercel.app
```

Dùng ngay trên desktop, mobile, tablet. Tất cả dữ liệu lưu tự động trong trình duyệt.

**Chia sẻ link với ai tùy muốn!** 📱

---

**Nếu cần help:** Gọi/chat em, em hỗ trợ setup! 💪
