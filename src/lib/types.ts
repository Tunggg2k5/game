export const roles = [
  "patient",
  "dentist",
  "receptionist",
  "nurse",
  "admin",
] as const;

export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  patient: "Bệnh nhân",
  dentist: "Nha sĩ",
  receptionist: "Lễ tân",
  nurse: "Y tá",
  admin: "Quản lý",
};

export const appointmentStatuses = [
  "pending",
  "confirmed",
  "checked_in",
  "in_treatment",
  "completed",
  "cancelled",
  "rejected",
  "no_show",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_treatment: "Đang điều trị",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
  no_show: "Không đến",
};

export type SessionPayload = {
  userId: string;
  role: Role;
  email: string;
  fullName: string;
};

export type UseCase = {
  id: string;
  workflow: string;
  actor: string;
  name: string;
  description: string;
};
