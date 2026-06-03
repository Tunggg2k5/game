# DAS Dental Clinic

Hệ thống đặt lịch phòng khám nha khoa dùng React, Next.js API routes chạy Node.js và MongoDB Atlas.

## Actors

- Guest: xem thông tin phòng khám, dịch vụ, nha sĩ và đăng ký tài khoản.
- Patient: đặt lịch, xem lịch sử khám, hủy hoặc dời lịch trước 24 giờ.
- Dentist: quản lý lịch làm việc, xem bệnh nhân, ghi kết quả điều trị.
- Receptionist: xác nhận hoặc từ chối lịch hẹn, check-in, no-show, nhắc lịch.
- Nurse: ghi sinh hiệu, chuẩn bị phòng, checklist vô trùng, ghi chú hỗ trợ, quản lý vật tư.
- Admin/Manager: quản lý master data, nhân sự, phòng khám, dashboard, báo cáo doanh thu.

## Main use cases

Project có 30 use case từ UCA01 đến UCA30, gồm authentication, CRUD master data, đặt lịch, xác nhận, check-in, hủy/dời lịch, điều trị, module y tá, tồn kho, báo cáo và audit log. Danh sách này nằm trong `src/lib/use-cases.ts` và hiển thị trong tab Use case của app.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- MongoDB Atlas + Mongoose
- Cookie JWT auth với `jose`
- Password hashing với `bcryptjs`
- Playwright e2e

## Setup local

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

`.env.local` cần có:

```bash
MONGODB_URI=...
JWT_SECRET=...
NEXT_PUBLIC_APP_NAME=DAS Dental
```

## Demo accounts

Sau khi chạy `npm run seed`, mọi tài khoản demo dùng mật khẩu `123456`.

- `admin@dental.local`
- `receptionist@dental.local`
- `dentist.anh@dental.local`
- `dentist.binh@dental.local`
- `nurse.lan@dental.local`
- `patient.minh@dental.local`
- `patient.ha@dental.local`

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run seed
npm run test:e2e
```

## Vercel

Trên Vercel cần đặt biến môi trường server-only:

```bash
MONGODB_URI=<MongoDB Atlas URI>
JWT_SECRET=<long random secret>
```

Không commit `.env.local` vì chứa secret.
