import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI. Create .env.local or set the env before running seed.");
}

function model(name) {
  return (
    mongoose.models[name] ||
    mongoose.model(name, new mongoose.Schema({}, { strict: false, timestamps: true }))
  );
}

function dateOffset(days) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

async function upsertBy(modelRef, filter, payload) {
  await modelRef.updateOne(
    filter,
    {
      $set: payload,
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  return modelRef.findOne(filter);
}

await mongoose.connect(uri);

const User = model("User");
const DentalService = model("DentalService");
const ClinicInfo = model("ClinicInfo");
const WorkSchedule = model("WorkSchedule");
const Appointment = model("Appointment");
const TreatmentRecord = model("TreatmentRecord");
const VitalSign = model("VitalSign");
const NurseTask = model("NurseTask");
const InventoryItem = model("InventoryItem");

const passwordHash = await bcrypt.hash("123456", 10);

const users = [
  {
    fullName: "Nguyễn Quang Admin",
    email: "admin@dental.local",
    phone: "0901000001",
    role: "admin",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
    bio: "Quản lý vận hành phòng khám.",
  },
  {
    fullName: "Trần Minh Lễ",
    email: "receptionist@dental.local",
    phone: "0901000002",
    role: "receptionist",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    bio: "Phụ trách xác nhận lịch hẹn và check-in.",
  },
  {
    fullName: "BS. Lê Hoàng Anh",
    email: "dentist.anh@dental.local",
    phone: "0901000003",
    role: "dentist",
    specialty: "Nha khoa tổng quát, phục hình",
    experienceYears: 9,
    licenseNo: "DAS-DEN-001",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
    bio: "Chuyên điều trị phục hồi răng và thẩm mỹ nụ cười.",
  },
  {
    fullName: "BS. Phạm Gia Bình",
    email: "dentist.binh@dental.local",
    phone: "0901000004",
    role: "dentist",
    specialty: "Chỉnh nha, niềng răng",
    experienceYears: 7,
    licenseNo: "DAS-DEN-002",
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
    bio: "Tư vấn chỉnh nha và lập kế hoạch điều trị dài hạn.",
  },
  {
    fullName: "Y tá Nguyễn Thị Lan",
    email: "nurse.lan@dental.local",
    phone: "0901000005",
    role: "nurse",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    bio: "Phụ trách sinh hiệu, chuẩn bị phòng và hỗ trợ ghế nha.",
  },
  {
    fullName: "Phạm Minh Khang",
    email: "patient.minh@dental.local",
    phone: "0901000006",
    role: "patient",
    address: "Quận 1, TP. Hồ Chí Minh",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    bio: "Bệnh nhân demo.",
  },
  {
    fullName: "Võ Thu Hà",
    email: "patient.ha@dental.local",
    phone: "0901000007",
    role: "patient",
    address: "Thủ Đức, TP. Hồ Chí Minh",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    bio: "Bệnh nhân demo tái khám.",
  },
];

for (const user of users) {
  await upsertBy(
    User,
    { email: user.email },
    {
      ...user,
      email: user.email.toLowerCase(),
      passwordHash,
      active: true,
      demoKey: user.email,
    },
  );
}

const savedUsers = Object.fromEntries(
  (await User.find({ demoKey: { $exists: true } })).map((user) => [user.email, user]),
);

const services = [
  {
    name: "Cạo vôi răng",
    category: "Phòng ngừa",
    description: "Làm sạch cao răng, đánh bóng và tư vấn vệ sinh răng miệng.",
    durationMinutes: 30,
    price: 350000,
  },
  {
    name: "Trám răng thẩm mỹ",
    category: "Điều trị",
    description: "Trám composite phục hồi răng sâu hoặc mẻ nhẹ.",
    durationMinutes: 45,
    price: 600000,
  },
  {
    name: "Tẩy trắng răng",
    category: "Thẩm mỹ",
    description: "Tẩy trắng tại ghế nha bằng công nghệ đèn lạnh.",
    durationMinutes: 60,
    price: 1800000,
  },
  {
    name: "Niềng răng tư vấn",
    category: "Chỉnh nha",
    description: "Khám, chụp phim và lập kế hoạch chỉnh nha ban đầu.",
    durationMinutes: 60,
    price: 500000,
  },
  {
    name: "Nhổ răng khôn",
    category: "Phẫu thuật",
    description: "Khám và nhổ răng khôn theo chỉ định nha sĩ.",
    durationMinutes: 75,
    price: 2200000,
  },
];

for (const service of services) {
  await upsertBy(DentalService, { name: service.name }, { ...service, active: true, demoKey: service.name });
}

const savedServices = Object.fromEntries(
  (await DentalService.find({ demoKey: { $exists: true } })).map((service) => [service.name, service]),
);

await upsertBy(
  ClinicInfo,
  { demoKey: "clinic" },
  {
    name: "DAS Dental Clinic",
    slogan: "Nụ cười khỏe, lịch hẹn gọn.",
    phone: "028 3822 2026",
    email: "hello@dasdental.vn",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    openingHours: "Thứ 2 - Chủ nhật, 08:00 - 20:00",
    coverImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    notes: "Dữ liệu demo được tạo bằng npm run seed.",
    demoKey: "clinic",
  },
);

const scheduleRows = [];
for (const weekday of [1, 2, 3, 4, 5]) {
  scheduleRows.push({
    demoKey: `anh-${weekday}-morning`,
    dentist: savedUsers["dentist.anh@dental.local"]._id,
    weekday,
    startTime: "08:00",
    endTime: "12:00",
    slotMinutes: 30,
    room: "P.01",
    active: true,
  });
  scheduleRows.push({
    demoKey: `binh-${weekday}-afternoon`,
    dentist: savedUsers["dentist.binh@dental.local"]._id,
    weekday,
    startTime: "13:30",
    endTime: "18:00",
    slotMinutes: 30,
    room: "P.02",
    active: true,
  });
}

for (const row of scheduleRows) {
  await upsertBy(WorkSchedule, { demoKey: row.demoKey }, row);
}

const appointments = [
  {
    demoKey: "appt-confirmed",
    patient: savedUsers["patient.minh@dental.local"]._id,
    dentist: savedUsers["dentist.anh@dental.local"]._id,
    nurse: savedUsers["nurse.lan@dental.local"]._id,
    service: savedServices["Trám răng thẩm mỹ"]._id,
    appointmentDate: dateOffset(1),
    startTime: "09:00",
    endTime: "09:45",
    status: "confirmed",
    price: savedServices["Trám răng thẩm mỹ"].price,
    symptoms: "Ê buốt răng hàm dưới.",
    notes: "Đã gọi nhắc lịch.",
  },
  {
    demoKey: "appt-checked-in",
    patient: savedUsers["patient.ha@dental.local"]._id,
    dentist: savedUsers["dentist.binh@dental.local"]._id,
    nurse: savedUsers["nurse.lan@dental.local"]._id,
    service: savedServices["Tẩy trắng răng"]._id,
    appointmentDate: dateOffset(0),
    startTime: "14:00",
    endTime: "15:00",
    status: "checked_in",
    price: savedServices["Tẩy trắng răng"].price,
    symptoms: "Muốn cải thiện màu răng.",
    checkInAt: new Date(),
  },
  {
    demoKey: "appt-pending",
    patient: savedUsers["patient.minh@dental.local"]._id,
    dentist: savedUsers["dentist.binh@dental.local"]._id,
    service: savedServices["Niềng răng tư vấn"]._id,
    appointmentDate: dateOffset(3),
    startTime: "15:30",
    endTime: "16:30",
    status: "pending",
    price: savedServices["Niềng răng tư vấn"].price,
    symptoms: "Tư vấn niềng răng.",
  },
  {
    demoKey: "appt-completed",
    patient: savedUsers["patient.ha@dental.local"]._id,
    dentist: savedUsers["dentist.anh@dental.local"]._id,
    nurse: savedUsers["nurse.lan@dental.local"]._id,
    service: savedServices["Cạo vôi răng"]._id,
    appointmentDate: dateOffset(-2),
    startTime: "10:00",
    endTime: "10:30",
    status: "completed",
    price: savedServices["Cạo vôi răng"].price,
    symptoms: "Tái khám định kỳ.",
    completedAt: dateOffset(-2),
  },
  {
    demoKey: "appt-no-show",
    patient: savedUsers["patient.minh@dental.local"]._id,
    dentist: savedUsers["dentist.anh@dental.local"]._id,
    service: savedServices["Tẩy trắng răng"]._id,
    appointmentDate: dateOffset(-3),
    startTime: "16:00",
    endTime: "17:00",
    status: "no_show",
    price: savedServices["Tẩy trắng răng"].price,
    noShowReason: "Không nghe máy khi lễ tân gọi lại.",
    noShowAt: dateOffset(-3),
  },
];

for (const appointment of appointments) {
  await upsertBy(Appointment, { demoKey: appointment.demoKey }, appointment);
}

const completedAppointment = await Appointment.findOne({ demoKey: "appt-completed" });
const checkedInAppointment = await Appointment.findOne({ demoKey: "appt-checked-in" });

await upsertBy(
  TreatmentRecord,
  { demoKey: "treatment-completed" },
  {
    demoKey: "treatment-completed",
    appointment: completedAppointment._id,
    patient: completedAppointment.patient,
    dentist: completedAppointment.dentist,
    nurse: completedAppointment.nurse,
    diagnosis: "Cao răng mức độ nhẹ, viêm nướu nhẹ.",
    procedures: "Cạo vôi, đánh bóng, hướng dẫn dùng chỉ nha khoa.",
    prescription: "Không kê thuốc.",
    dentistNotes: "Tái khám sau 6 tháng.",
    nurseNotes: "Bệnh nhân hợp tác tốt.",
    careInstructions: "Không ăn uống thực phẩm quá nóng trong 2 giờ sau điều trị.",
    nextVisitDate: dateOffset(180),
  },
);

await upsertBy(
  VitalSign,
  { demoKey: "vital-checked-in" },
  {
    demoKey: "vital-checked-in",
    appointment: checkedInAppointment._id,
    patient: checkedInAppointment.patient,
    nurse: checkedInAppointment.nurse,
    bloodPressure: "118/76",
    pulse: 74,
    temperature: 36.7,
    weight: 52,
    allergies: "Không ghi nhận",
    chiefComplaint: "Tẩy trắng răng trước sự kiện.",
  },
);

const tasks = [
  {
    demoKey: "task-room",
    nurse: savedUsers["nurse.lan@dental.local"]._id,
    appointment: checkedInAppointment._id,
    title: "Chuẩn bị phòng tẩy trắng",
    checklist: ["Kiểm tra đèn", "Chuẩn bị gel", "Che nướu", "Kính bảo hộ"],
    status: "doing",
    dueAt: new Date(),
    notes: "Ưu tiên ca đã check-in.",
  },
  {
    demoKey: "task-sterile",
    nurse: savedUsers["nurse.lan@dental.local"]._id,
    title: "Checklist vô trùng cuối ngày",
    checklist: ["Khử khuẩn tay khoan", "Đóng gói dụng cụ", "Ghi log tủ hấp"],
    status: "todo",
    dueAt: dateOffset(0),
    notes: "UCA24.",
  },
];

for (const task of tasks) {
  await upsertBy(NurseTask, { demoKey: task.demoKey }, task);
}

const inventory = [
  {
    name: "Găng tay nitrile",
    category: "Bảo hộ",
    stock: 120,
    unit: "hộp",
    reorderLevel: 30,
    notes: "Size M.",
    active: true,
    demoKey: "gloves",
  },
  {
    name: "Gel tẩy trắng",
    category: "Vật tư điều trị",
    stock: 8,
    unit: "ống",
    reorderLevel: 10,
    notes: "Cần đặt thêm.",
    active: true,
    demoKey: "whitening-gel",
  },
  {
    name: "Composite A2",
    category: "Vật tư điều trị",
    stock: 18,
    unit: "tuýp",
    reorderLevel: 8,
    notes: "Dùng cho trám thẩm mỹ.",
    active: true,
    demoKey: "composite-a2",
  },
];

for (const item of inventory) {
  await upsertBy(InventoryItem, { name: item.name }, item);
}

console.log("Seed completed for DAS Dental.");
console.log("Demo password for all accounts: 123456");
console.log("Accounts:");
for (const user of users) {
  console.log(`- ${user.email} (${user.role})`);
}

await mongoose.disconnect();
