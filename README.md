# QR Code Manager

QR Code Manager - Tạo, quản lý, và tùy chỉnh QR code cho marketing, thanh toán, và social media.

## 🚀 Deploy Lên Vercel (3 Bước)

### **Bước 1: Chuẩn bị**
- Tạo tài khoản **Vercel** (miễn phí): https://vercel.com
- Tạo tài khoản **GitHub** (miễn phí): https://github.com

### **Bước 2: Upload lên GitHub**

#### Cách A: Dùng GitHub Desktop (Dễ nhất)
```bash
1. Tải GitHub Desktop: https://desktop.github.com
2. Mở ứng dụng → Đăng nhập GitHub
3. File → New Repository
   - Name: qr-manager
   - Local Path: chọn folder chứa files
4. Chọn "Initialize with README" → Create
5. Copy tất cả files từ outputs vào folder này
6. Quay về GitHub Desktop:
   - Bên dưới: nhập message "Initial commit"
   - Bấm "Commit to main"
   - Bấm "Publish repository" (góc phải trên)
7. Đợi sync, xong!
```

#### Cách B: Dùng Git Command (Nhanh)
```bash
# Mở Terminal/Command Prompt tại folder chứa files này
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/qr-manager.git
git push -u origin main
```

### **Bước 3: Deploy Lên Vercel**

1. Vào https://vercel.com → Sign up
2. Bấm "Import Project"
3. Chọn "Import Git Repository"
4. Paste URL repo GitHub: `https://github.com/YOUR-USERNAME/qr-manager`
5. Bấm "Import"
6. Vercel tự detect React project
7. Bấm "Deploy"
8. Chờ ~2-3 phút → Có link website! 🎉

**Ví dụ link sẽ như:** `https://qr-manager-abc123.vercel.app`

---

## 💻 Chạy Trên Máy (Local Development)

### **Yêu cầu:**
- Node.js 16+ (tải: https://nodejs.org)

### **Hướng dẫn:**

```bash
# 1. Mở Terminal tại folder chứa project
# 2. Cài dependencies
npm install

# 3. Chạy app (sẽ mở http://localhost:3000)
npm start

# 4. Để build production
npm run build
```

---

## 📋 Cấu trúc Files

```
qr-manager/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── index.js            # React entry
│   ├── index.css           # Tailwind CSS
│   ├── App.js              # Main component
│   └── qr-manager.jsx      # QR Manager logic
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind config
├── vercel.json             # Vercel config
└── README.md               # File này
```

---

## 🎯 Tính Năng

✅ Tạo QR code với URL
✅ Chèn logo PNG/JPG vào giữa
✅ Chỉnh sửa link, tên, mô tả
✅ Download QR thành ảnh
✅ Copy URL nhanh
✅ Lưu tự động (localStorage)

---

## 📊 Backup Dữ Liệu Vào Google Sheets

**Cách Manual:**
1. Mở app → F12 (Developer Console)
2. Tab "Console"
3. Paste:
```javascript
console.log(JSON.stringify(JSON.parse(localStorage.getItem('qrData')), null, 2))
```
4. Copy output → Paste vào Google Sheet

---

## ❓ Troubleshooting

**"npm: command not found"**
→ Node.js chưa cài. Tải tại https://nodejs.org

**"Port 3000 already in use"**
```bash
npm start -- --port 3001
```

**Deploy thất bại?**
1. Kiểm tra GitHub repo có public không
2. Kiểm tra vercel.json config
3. Xem Vercel deployment logs

---

## 🛠️ Tùy Chỉnh

**Thay đổi tên app:**
- Sửa `<title>` trong `public/index.html`

**Thay đổi màu sắc:**
- Mở `src/qr-manager.jsx`
- Tìm class `bg-blue-600` → đổi sang màu khác
- Xem: https://tailwindcss.com/docs/customizing-colors

**Thêm tính năng:**
- Sửa `src/qr-manager.jsx` → Save → Vercel auto rebuild

---

## 📞 Cần Giúp?

- Kiểm tra logs Vercel: https://vercel.com → Dashboard → Select project → Deployments
- Đọc docs Vercel: https://vercel.com/docs

---

Chúc bạn thành công! 🚀
