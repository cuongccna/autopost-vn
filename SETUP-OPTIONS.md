# 🔀 Chọn Setup Method

## Bạn chưa cài Docker! Chọn 1 trong 2 options:

### ⭐ Option 1: Docker (RECOMMENDED - Dễ nhất)

**Ưu điểm:**
- ✅ Setup 1 lệnh
- ✅ Tự động cài PostgreSQL + pgAdmin
- ✅ Dễ backup/restore
- ✅ Tách biệt với hệ thống

**Bước thực hiện:**
1. Cài Docker Desktop: https://www.docker.com/products/docker-desktop
2. Khởi động Docker Desktop
3. Chạy: `.\scripts\setup-postgres.ps1`
4. Chạy: `.\scripts\run-migrations.ps1`
5. Done! ✅

---

### Option 2: PostgreSQL Native (Không cần Docker)

**Ưu điểm:**
- ✅ Không cần Docker
- ✅ PostgreSQL chạy như Windows service
- ✅ Nhẹ hơn

**Nhược điểm:**
- ⚠️ Phải cài PostgreSQL thủ công
- ⚠️ Không có pgAdmin tự động
- ⚠️ Phức tạp hơn

**Bước thực hiện:**
1. Chạy: `.\scripts\setup-postgres-native.ps1` (xem hướng dẫn)
2. Download PostgreSQL: https://www.postgresql.org/download/windows/
3. Cài đặt PostgreSQL (port 5432, password: autopost_vn_secure_2025)
4. Tạo database và user theo hướng dẫn
5. Import schema: `psql -U autopost_admin -d autopost_vn -f supabase\schema.sql`
6. Chạy migrations: `.\scripts\run-migrations-native.ps1`

---

## 💡 Khuyến nghị:

**Nếu máy bạn đủ mạnh (8GB+ RAM):** → Dùng **Docker** (Option 1)

**Nếu máy yếu hoặc không muốn Docker:** → Dùng **Native** (Option 2)

---

## 📞 Scripts Available:

### Docker Setup:
- `.\scripts\setup-postgres.ps1` - Setup PostgreSQL với Docker
- `.\scripts\run-migrations.ps1` - Run migrations (Docker)

### Native Setup:
- `.\scripts\setup-postgres-native.ps1` - Hướng dẫn setup native
- `.\scripts\run-migrations-native.ps1` - Run migrations (Native)

---

**Recommendation: Cài Docker Desktop cho đơn giản! 🚀**
