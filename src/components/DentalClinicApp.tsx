"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Package,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { roleLabels, statusLabels, type AppointmentStatus, type Role, type UseCase } from "@/lib/types";

type AppUser = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  address?: string;
  specialty?: string;
  experienceYears?: number;
  licenseNo?: string;
  bio?: string;
  active?: boolean;
  createdAt?: string;
};

type DentalService = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
};

type ClinicInfo = {
  _id?: string;
  name: string;
  slogan?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  coverImageUrl?: string;
  notes?: string;
};

type WorkSchedule = {
  _id: string;
  dentist: AppUser | string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  room?: string;
  active: boolean;
};

type Appointment = {
  _id: string;
  patient: AppUser | string;
  dentist: AppUser | string;
  nurse?: AppUser | string;
  service: DentalService | string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  price: number;
  symptoms?: string;
  notes?: string;
  cancellationActorRole?: Role;
  patientRating?: number;
  patientReview?: string;
  reviewedAt?: string;
};

type Treatment = {
  _id: string;
  appointment: Appointment | string;
  patient: AppUser | string;
  dentist: AppUser | string;
  nurse?: AppUser | string;
  diagnosis?: string;
  procedures?: string;
  prescription?: string;
  dentistNotes?: string;
  nurseNotes?: string;
  careInstructions?: string;
  nextVisitDate?: string;
};

type Vital = {
  _id: string;
  appointment: Appointment | string;
  patient: AppUser | string;
  nurse: AppUser | string;
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  weight?: number;
  allergies?: string;
  chiefComplaint?: string;
};

type NurseTask = {
  _id: string;
  nurse: AppUser | string;
  appointment?: Appointment | string;
  title: string;
  checklist?: string[];
  status: "todo" | "doing" | "done";
  dueAt?: string;
  notes?: string;
};

type InventoryItem = {
  _id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  notes?: string;
  active?: boolean;
};

type ReportData = {
  summary?: {
    totalAppointments: number;
    completed: number;
    revenue: number;
    noShow: number;
    noShowRate: number;
    totalPatients: number;
    newPatientsThisMonth: number;
  };
  statusCounts?: Record<string, number>;
  revenueByService?: { label: string; count: number; revenue: number }[];
  revenueByDentist?: { label: string; count: number; revenue: number }[];
  audits?: {
    _id: string;
    action: string;
    entity: string;
    actorRole?: Role;
    createdAt: string;
  }[];
};

type ViewKey =
  | "overview"
  | "booking"
  | "appointments"
  | "clinicFlow"
  | "schedule"
  | "patients"
  | "treatments"
  | "nurse"
  | "inventory"
  | "master"
  | "reports"
  | "usecases"
  | "profile";

type ApiError = {
  message?: string;
};

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const weekdays = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

const receptionistStatusOptions: {
  value: AppointmentStatus;
  label: string;
}[] = [
  { value: "checked_in", label: "Có mặt" },
  { value: "no_show", label: "Vắng mặt" },
  { value: "in_treatment", label: "Đang khám" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

const patientSlotTimes = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

const demoAccounts: { email: string; role: Role; label: string }[] = [
  { email: "admin@dental.local", role: "admin", label: "Quản lý" },
  { email: "receptionist@dental.local", role: "receptionist", label: "Lễ tân" },
  { email: "dentist.anh@dental.local", role: "dentist", label: "Nha sĩ" },
  { email: "nurse.lan@dental.local", role: "nurse", label: "Y tá" },
  { email: "patient.minh@dental.local", role: "patient", label: "Bệnh nhân" },
];

const navItems: Record<Role, { key: ViewKey; label: string; icon: typeof LayoutDashboard }[]> = {
  patient: [
    { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { key: "booking", label: "Đặt lịch", icon: CalendarDays },
    { key: "appointments", label: "Lịch của tôi", icon: ClipboardList },
    { key: "treatments", label: "Hồ sơ khám", icon: NotebookPen },
    { key: "usecases", label: "Use case", icon: ClipboardCheck },
    { key: "profile", label: "Hồ sơ", icon: UserCog },
  ],
  dentist: [
    { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { key: "appointments", label: "Lịch khám", icon: ClipboardList },
    { key: "schedule", label: "Lịch làm việc", icon: Clock3 },
    { key: "patients", label: "Bệnh nhân", icon: Users },
    { key: "treatments", label: "Điều trị", icon: NotebookPen },
    { key: "usecases", label: "Use case", icon: ClipboardCheck },
    { key: "profile", label: "Hồ sơ", icon: UserCog },
  ],
  receptionist: [
    { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { key: "appointments", label: "Lịch hẹn", icon: ClipboardList },
    { key: "clinicFlow", label: "Điều phối", icon: ClipboardCheck },
    { key: "booking", label: "Tạo lịch", icon: CalendarDays },
    { key: "patients", label: "Bệnh nhân", icon: Users },
    { key: "reports", label: "Báo cáo", icon: BadgeDollarSign },
    { key: "usecases", label: "Use case", icon: ClipboardCheck },
    { key: "profile", label: "Hồ sơ", icon: UserCog },
  ],
  nurse: [
    { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { key: "appointments", label: "Ca hỗ trợ", icon: ClipboardList },
    { key: "nurse", label: "Y tá", icon: HeartPulse },
    { key: "treatments", label: "Ghi chú điều trị", icon: NotebookPen },
    { key: "inventory", label: "Vật tư", icon: Package },
    { key: "usecases", label: "Use case", icon: ClipboardCheck },
    { key: "profile", label: "Hồ sơ", icon: UserCog },
  ],
  admin: [
    { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { key: "appointments", label: "Lịch hẹn", icon: ClipboardList },
    { key: "clinicFlow", label: "Điều phối", icon: ClipboardCheck },
    { key: "master", label: "Master data", icon: ShieldCheck },
    { key: "schedule", label: "Lịch nha sĩ", icon: Clock3 },
    { key: "nurse", label: "Y tá", icon: HeartPulse },
    { key: "inventory", label: "Vật tư", icon: Package },
    { key: "reports", label: "Báo cáo", icon: BadgeDollarSign },
    { key: "usecases", label: "Use case", icon: ClipboardCheck },
    { key: "profile", label: "Hồ sơ", icon: UserCog },
  ],
};

function todayInput(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function apiFetch<T>(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as ApiError & T;

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

function objectId(value?: AppUser | DentalService | Appointment | string) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function userName(value?: AppUser | string) {
  if (!value) return "Chưa gán";
  return typeof value === "string" ? value : value.fullName;
}

function serviceName(value?: DentalService | string) {
  if (!value) return "Chưa chọn";
  return typeof value === "string" ? value : value.name;
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function statusClass(status: AppointmentStatus) {
  const styles: Record<AppointmentStatus, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    confirmed: "border-sky-200 bg-sky-50 text-sky-700",
    checked_in: "border-emerald-200 bg-emerald-50 text-emerald-700",
    in_treatment: "border-indigo-200 bg-indigo-50 text-indigo-700",
    completed: "border-teal-200 bg-teal-50 text-teal-700",
    cancelled: "border-zinc-200 bg-zinc-50 text-zinc-600",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    no_show: "border-orange-200 bg-orange-50 text-orange-700",
  };
  return styles[status];
}

function Button({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: typeof LayoutDashboard;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-[#176b87] text-white hover:bg-[#12566e]",
    secondary: "border border-[#c6d5df] bg-white text-[#172033] hover:bg-[#edf7f8]",
    ghost: "text-[#43566d] hover:bg-[#eaf1f6]",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0" /> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "min-h-10 rounded-md border border-[#cbd8e3] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#8494a8] focus:border-[#176b87] focus:ring-2 focus:ring-[#176b87]/15";
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof LayoutDashboard;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#d6e0e8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7f3f5] text-[#176b87]">
              <Icon aria-hidden className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <h2 className="text-base font-bold text-[#172033]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[#5e7188]">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  accent: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <div className="rounded-lg border border-[#d8e2ea] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#5d7188]">{label}</span>
        <Icon aria-hidden className={`h-5 w-5 ${accent}`} />
      </div>
      <div className="mt-3 text-2xl font-bold text-[#172033]">{value}</div>
    </div>
  );
}

export default function DentalClinicApp() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [services, setServices] = useState<DentalService[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [tasks, setTasks] = useState<NurseTask[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<ReportData>({});
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [quickNurse, setQuickNurse] = useState("");

  const dentists = useMemo(
    () => users.filter((user) => user.role === "dentist" && user.active !== false),
    [users],
  );
  const nurses = useMemo(
    () => users.filter((user) => user.role === "nurse" && user.active !== false),
    [users],
  );
  const patients = useMemo(
    () => users.filter((user) => user.role === "patient" && user.active !== false),
    [users],
  );

  const visibleNav = me ? navItems[me.role] : [];

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setLoading(true);
    try {
      const publicData = await apiFetch<{
        clinic: ClinicInfo;
        services: DentalService[];
        dentists: AppUser[];
        useCases: UseCase[];
      }>("/api/clinic");
      setClinic(publicData.clinic);
      setServices(publicData.services);
      setUseCases(publicData.useCases);
      setUsers(publicData.dentists);

      const meData = await apiFetch<{ user: AppUser | null }>("/api/auth/me");
      if (meData.user) {
        setMe(meData.user);
        await loadProtectedData(meData.user);
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProtectedData(user = me) {
    if (!user) return;

    const requests: Promise<void>[] = [
      apiFetch<{ services: DentalService[] }>("/api/services").then((data) =>
        setServices(data.services),
      ),
      apiFetch<{ schedules: WorkSchedule[] }>("/api/schedules").then((data) =>
        setSchedules(data.schedules),
      ),
      apiFetch<{ appointments: Appointment[] }>("/api/appointments").then((data) =>
        setAppointments(data.appointments),
      ),
      apiFetch<{ treatments: Treatment[] }>("/api/treatments").then((data) =>
        setTreatments(data.treatments),
      ),
    ];

    if (user.role !== "patient") {
      requests.push(
        apiFetch<{ users: AppUser[] }>("/api/users").then((data) => setUsers(data.users)),
      );
    } else {
      requests.push(
        apiFetch<{
          dentists: AppUser[];
          services: DentalService[];
          clinic: ClinicInfo;
          useCases: UseCase[];
        }>("/api/clinic").then((data) => {
          setUsers(data.dentists);
          setServices(data.services);
          setClinic(data.clinic);
          setUseCases(data.useCases);
        }),
      );
    }

    if (["admin", "nurse", "receptionist", "dentist"].includes(user.role)) {
      requests.push(
        apiFetch<{ vitals: Vital[] }>("/api/nurse/vitals").then((data) =>
          setVitals(data.vitals),
        ),
      );
    }

    if (["admin", "nurse", "receptionist"].includes(user.role)) {
      requests.push(
        apiFetch<{ tasks: NurseTask[] }>("/api/nurse/tasks").then((data) =>
          setTasks(data.tasks),
        ),
        apiFetch<{ items: InventoryItem[] }>("/api/inventory").then((data) =>
          setInventory(data.items),
        ),
      );
    }

    if (["admin", "receptionist"].includes(user.role)) {
      requests.push(apiFetch<ReportData>("/api/reports").then((data) => setReports(data)));
    }

    await Promise.allSettled(requests);
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  }

  async function runMutation(label: string, callback: () => Promise<void>) {
    setBusy(true);
    try {
      await callback();
      showNotice(label);
      await loadProtectedData();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function login(email: string, password: string) {
    setBusy(true);
    try {
      const data = await apiFetch<{ user: AppUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setMe(data.user);
      setActiveView("overview");
      await loadProtectedData(data.user);
      showNotice(`Xin chào ${data.user.fullName}`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Không thể đăng nhập.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setAppointments([]);
    setTreatments([]);
    setVitals([]);
    setTasks([]);
    setInventory([]);
    setReports({});
    setActiveView("overview");
    await bootstrap();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] p-6">
        <div className="flex items-center gap-3 rounded-lg border border-[#d8e2ea] bg-white px-5 py-4 text-sm font-semibold text-[#43566d] shadow-sm">
          <RefreshCcw aria-hidden className="h-4 w-4 animate-spin" />
          Đang tải hệ thống phòng khám...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#172033]">
      {notice ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-[#b7d9d6] bg-white px-4 py-3 text-sm font-semibold text-[#176b87] shadow-lg">
          {notice}
        </div>
      ) : null}

      {!me ? (
        <AuthScreen
          clinic={clinic}
          services={services}
          dentists={users.filter((user) => user.role === "dentist")}
          busy={busy}
          onLogin={login}
          onRegister={async (payload) => {
            setBusy(true);
            try {
              const data = await apiFetch<{ user: AppUser }>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
              });
              setMe(data.user);
              await loadProtectedData(data.user);
              showNotice("Đăng ký thành công.");
            } catch (error) {
              showNotice(error instanceof Error ? error.message : "Không thể đăng ký.");
            } finally {
              setBusy(false);
            }
          }}
          onForgot={async (email) =>
            runMutation("Đã ghi nhận yêu cầu reset mật khẩu.", async () => {
              await apiFetch("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
              });
            })
          }
        />
      ) : (
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-4 lg:px-6">
          <header className="rounded-lg border border-[#d8e2ea] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#176b87] text-white">
                  <Stethoscope aria-hidden className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5e7188]">{clinic?.name}</p>
                  <h1 className="text-xl font-bold text-[#172033]">
                    {roleLabels[me.role]} dashboard
                  </h1>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-md bg-[#eef5f6] px-3 py-2">
                  {me.avatarUrl ? (
                    <img
                      src={me.avatarUrl}
                      alt=""
                      className="h-9 w-9 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-[#dbe9ee]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#172033]">{me.fullName}</div>
                    <div className="truncate text-xs text-[#5e7188]">{me.email}</div>
                  </div>
                </div>
                <Button icon={RefreshCcw} variant="secondary" disabled={busy} onClick={() => loadProtectedData()}>
                  Làm mới
                </Button>
                <Button icon={LogOut} variant="ghost" onClick={logout}>
                  Đăng xuất
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
            <nav className="rounded-lg border border-[#d8e2ea] bg-white p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
              <div className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-[#6f8195]">
                <Menu aria-hidden className="h-4 w-4" />
                Điều hướng
              </div>
              <div className="grid gap-1">
                {visibleNav.map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveView(item.key)}
                      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                        active
                          ? "bg-[#176b87] text-white"
                          : "text-[#43566d] hover:bg-[#eef5f6] hover:text-[#172033]"
                      }`}
                    >
                      <Icon aria-hidden className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="grid gap-5">
              {activeView === "overview" ? (
                <Overview
                  me={me}
                  clinic={clinic}
                  appointments={appointments}
                  services={services}
                  tasks={tasks}
                  inventory={inventory}
                  reports={reports}
                />
              ) : null}
              {activeView === "booking" ? (
                <BookingPanel
                  me={me}
                  services={services}
                  dentists={dentists}
                  patients={patients}
                  busy={busy}
                  onBook={(payload) =>
                    runMutation("Đã tạo lịch hẹn.", async () => {
                      await apiFetch("/api/appointments", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                />
              ) : null}
              {activeView === "appointments" ? (
                <AppointmentsPanel
                  me={me}
                  appointments={appointments}
                  nurses={nurses}
                  quickNurse={quickNurse}
                  setQuickNurse={setQuickNurse}
                  busy={busy}
                  onAction={(payload) =>
                    runMutation("Đã cập nhật lịch hẹn.", async () => {
                      await apiFetch("/api/appointments", {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                />
              ) : null}
              {activeView === "clinicFlow" ? (
                <ClinicFlowPanel
                  appointments={appointments}
                  dentists={dentists}
                  busy={busy}
                  onAction={(payload) =>
                    runMutation("Đã cập nhật trạng thái phòng khám.", async () => {
                      await apiFetch("/api/appointments", {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                />
              ) : null}
              {activeView === "schedule" ? (
                <SchedulePanel
                  me={me}
                  dentists={dentists}
                  schedules={schedules}
                  busy={busy}
                  onSave={(payload) =>
                    runMutation("Đã lưu lịch làm việc.", async () => {
                      await apiFetch("/api/schedules", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                  onDeactivate={(id) =>
                    runMutation("Đã tắt lịch làm việc.", async () => {
                      await apiFetch(`/api/schedules?id=${id}`, { method: "DELETE" });
                    })
                  }
                />
              ) : null}
              {activeView === "patients" ? (
                <PatientsPanel
                  patients={patients}
                  appointments={appointments}
                  treatments={treatments}
                  search={search}
                  setSearch={setSearch}
                />
              ) : null}
              {activeView === "treatments" ? (
                <TreatmentPanel
                  appointments={appointments}
                  treatments={treatments}
                  busy={busy}
                  onSave={(payload) =>
                    runMutation("Đã lưu hồ sơ điều trị.", async () => {
                      await apiFetch("/api/treatments", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                />
              ) : null}
              {activeView === "nurse" ? (
                <NursePanel
                  me={me}
                  appointments={appointments}
                  nurses={nurses}
                  vitals={vitals}
                  tasks={tasks}
                  busy={busy}
                  onVital={(payload) =>
                    runMutation("Đã lưu sinh hiệu.", async () => {
                      await apiFetch("/api/nurse/vitals", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                  onTask={(payload) =>
                    runMutation("Đã lưu công việc y tá.", async () => {
                      await apiFetch("/api/nurse/tasks", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                />
              ) : null}
              {activeView === "inventory" ? (
                <InventoryPanel
                  inventory={inventory}
                  busy={busy}
                  onSave={(payload) =>
                    runMutation("Đã lưu vật tư.", async () => {
                      await apiFetch("/api/inventory", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                />
              ) : null}
              {activeView === "master" ? (
                <MasterDataPanel
                  clinic={clinic}
                  services={services}
                  users={users}
                  busy={busy}
                  onService={(payload) =>
                    runMutation("Đã lưu dịch vụ.", async () => {
                      await apiFetch("/api/services", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                  onDeactivateService={(id) =>
                    runMutation("Đã ngưng dịch vụ.", async () => {
                      await apiFetch(`/api/services?id=${id}`, { method: "DELETE" });
                    })
                  }
                  onUser={(payload) =>
                    runMutation("Đã lưu nhân sự.", async () => {
                      await apiFetch("/api/users", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                  onClinic={(payload) =>
                    runMutation("Đã cập nhật phòng khám.", async () => {
                      const data = await apiFetch<{ clinic: ClinicInfo }>("/api/clinic", {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                      });
                      setClinic(data.clinic);
                    })
                  }
                />
              ) : null}
              {activeView === "reports" ? <ReportsPanel reports={reports} /> : null}
              {activeView === "usecases" ? <UseCasePanel useCases={useCases} /> : null}
              {activeView === "profile" ? (
                <ProfilePanel
                  me={me}
                  busy={busy}
                  onSave={(payload) =>
                    runMutation("Đã cập nhật hồ sơ.", async () => {
                      const data = await apiFetch<{ user: AppUser }>("/api/users", {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                      });
                      setMe(data.user);
                    })
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AuthScreen({
  clinic,
  services,
  dentists,
  busy,
  onLogin,
  onRegister,
  onForgot,
}: {
  clinic: ClinicInfo | null;
  services: DentalService[];
  dentists: AppUser[];
  busy: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  onForgot: (email: string) => Promise<void>;
}) {
  const [loginEmail, setLoginEmail] = useState("admin@dental.local");
  const [loginPassword, setLoginPassword] = useState("123456");
  const [register, setRegister] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "123456",
  });

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1380px] gap-5 px-4 py-6 lg:grid-cols-[minmax(330px,420px)_minmax(0,1fr)]">
      <section className="rounded-lg border border-[#d8e2ea] bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#176b87] text-white">
            <Stethoscope aria-hidden className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#5e7188]">{clinic?.slogan}</p>
            <h1 className="text-xl font-bold text-[#172033]">{clinic?.name || "DAS Dental"}</h1>
          </div>
        </div>

        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onLogin(loginEmail, loginPassword);
          }}
        >
          <Field label="Email">
            <input
              className={inputClass()}
              value={loginEmail}
              type="email"
              onChange={(event) => setLoginEmail(event.target.value)}
            />
          </Field>
          <Field label="Mật khẩu">
            <input
              className={inputClass()}
              value={loginPassword}
              type="password"
              onChange={(event) => setLoginPassword(event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" icon={ShieldCheck} disabled={busy}>
              Đăng nhập
            </Button>
            <Button
              type="button"
              icon={RefreshCcw}
              variant="secondary"
              disabled={busy}
              onClick={() => onForgot(loginEmail)}
            >
              Reset mật khẩu
            </Button>
          </div>
        </form>

        <div className="mt-5 grid gap-2">
          <p className="text-sm font-bold text-[#334155]">Tài khoản demo</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setLoginEmail(account.email);
                  setLoginPassword("123456");
                  void onLogin(account.email, "123456");
                }}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-[#d8e2ea] pt-5">
          <h2 className="text-base font-bold text-[#172033]">Đăng ký bệnh nhân</h2>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onRegister(register);
            }}
          >
            <Field label="Họ tên">
              <input
                className={inputClass()}
                value={register.fullName}
                onChange={(event) => setRegister({ ...register, fullName: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass()}
                type="email"
                value={register.email}
                onChange={(event) => setRegister({ ...register, email: event.target.value })}
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                className={inputClass()}
                value={register.phone}
                onChange={(event) => setRegister({ ...register, phone: event.target.value })}
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                className={inputClass()}
                type="password"
                value={register.password}
                onChange={(event) => setRegister({ ...register, password: event.target.value })}
              />
            </Field>
            <Button type="submit" icon={UserPlus} disabled={busy}>
              Tạo tài khoản bệnh nhân
            </Button>
          </form>
        </div>
      </section>

      <section className="grid gap-5">
        <div className="overflow-hidden rounded-lg border border-[#d8e2ea] bg-white shadow-sm">
          {clinic?.coverImageUrl ? (
            <img
              src={clinic.coverImageUrl}
              alt=""
              className="h-64 w-full object-cover"
            />
          ) : null}
          <div className="grid gap-5 p-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-[#172033]">Hệ thống đặt lịch phòng khám nha khoa</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e7188]">
                Quản lý từ đặt lịch online, xác nhận lễ tân, check-in, y tá ghi sinh hiệu,
                nha sĩ ghi điều trị đến báo cáo doanh thu.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-[#43566d] sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays aria-hidden className="h-4 w-4 text-[#176b87]" />
                  {clinic?.openingHours}
                </div>
                <div className="flex items-center gap-2">
                  <Bell aria-hidden className="h-4 w-4 text-[#b7791f]" />
                  {clinic?.phone}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[#e1e8ef] bg-[#f7fafb] p-4">
              <div className="text-sm font-bold text-[#172033]">Actors</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.values(roleLabels).map((label) => (
                  <span key={label} className="rounded-md border border-[#cbd8e3] bg-white px-2.5 py-1 text-xs font-semibold text-[#43566d]">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Dịch vụ nổi bật" icon={Activity}>
            <div className="grid gap-3">
              {services.slice(0, 5).map((service) => (
                <div key={service._id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e8ef] p-3">
                  <div>
                    <div className="font-semibold text-[#172033]">{service.name}</div>
                    <div className="text-sm text-[#5e7188]">{service.category} · {service.durationMinutes} phút</div>
                  </div>
                  <div className="text-sm font-bold text-[#176b87]">{moneyFormatter.format(service.price)}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Nha sĩ" icon={Users}>
            <div className="grid gap-3">
              {dentists.map((dentist) => (
                <div key={dentist._id} className="flex items-center gap-3 rounded-lg border border-[#e1e8ef] p-3">
                  {dentist.avatarUrl ? (
                    <img src={dentist.avatarUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-[#dbe9ee]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#172033]">{dentist.fullName}</div>
                    <div className="truncate text-sm text-[#5e7188]">{dentist.specialty}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Overview({
  me,
  clinic,
  appointments,
  services,
  tasks,
  inventory,
  reports,
}: {
  me: AppUser;
  clinic: ClinicInfo | null;
  appointments: Appointment[];
  services: DentalService[];
  tasks: NurseTask[];
  inventory: InventoryItem[];
  reports: ReportData;
}) {
  const today = appointments.filter((appointment) => appointment.appointmentDate.slice(0, 10) === todayInput());
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;
  const lowStock = inventory.filter((item) => item.stock <= item.reorderLevel).length;
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lịch hôm nay" value={today.length} icon={CalendarDays} accent="text-[#176b87]" />
        <StatCard label="Chờ xác nhận" value={pending} icon={Clock3} accent="text-amber-600" />
        <StatCard label="Hoàn tất" value={completed} icon={CheckCircle2} accent="text-teal-600" />
        <StatCard
          label={me.role === "admin" ? "Doanh thu" : "Vật tư cảnh báo"}
          value={me.role === "admin" ? moneyFormatter.format(reports.summary?.revenue || 0) : lowStock}
          icon={me.role === "admin" ? BadgeDollarSign : Package}
          accent={me.role === "admin" ? "text-emerald-600" : "text-orange-600"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Panel title="Lịch gần nhất" subtitle={clinic?.address} icon={ClipboardList}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[#5e7188]">
                  <th className="border-b border-[#d8e2ea] py-2 pr-3">Ngày</th>
                  <th className="border-b border-[#d8e2ea] py-2 pr-3">Giờ</th>
                  <th className="border-b border-[#d8e2ea] py-2 pr-3">Bệnh nhân</th>
                  <th className="border-b border-[#d8e2ea] py-2 pr-3">Dịch vụ</th>
                  <th className="border-b border-[#d8e2ea] py-2 pr-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 8).map((appointment) => (
                  <tr key={appointment._id}>
                    <td className="border-b border-[#edf1f5] py-3 pr-3">{formatDate(appointment.appointmentDate)}</td>
                    <td className="border-b border-[#edf1f5] py-3 pr-3 font-mono">{appointment.startTime}</td>
                    <td className="border-b border-[#edf1f5] py-3 pr-3">{userName(appointment.patient)}</td>
                    <td className="border-b border-[#edf1f5] py-3 pr-3">{serviceName(appointment.service)}</td>
                    <td className="border-b border-[#edf1f5] py-3 pr-3">
                      <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(appointment.status)}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Công việc ưu tiên" icon={Bell}>
          <div className="grid gap-3">
            {tasks.slice(0, 4).map((task) => (
              <div key={task._id} className="rounded-lg border border-[#e1e8ef] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[#172033]">{task.title}</div>
                  <span className="rounded-md bg-[#eef5f6] px-2 py-1 text-xs font-bold text-[#176b87]">{task.status}</span>
                </div>
                <div className="mt-1 text-sm text-[#5e7188]">{task.notes || "Không có ghi chú"}</div>
              </div>
            ))}
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#cbd8e3] p-4 text-sm text-[#5e7188]">
                Chưa có công việc y tá trong phạm vi của bạn.
              </div>
            ) : null}
            <div className="rounded-lg border border-[#e1e8ef] bg-[#f7fafb] p-3 text-sm text-[#43566d]">
              {services.length} dịch vụ đang được cấu hình trong hệ thống.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BookingPanel({
  me,
  services,
  dentists,
  patients,
  busy,
  onBook,
}: {
  me: AppUser;
  services: DentalService[];
  dentists: AppUser[];
  patients: AppUser[];
  busy: boolean;
  onBook: (payload: Record<string, string>) => void;
}) {
  const [form, setForm] = useState({
    patient: patients[0]?._id || "",
    service: services[0]?._id || "",
    dentist: dentists[0]?._id || "",
    appointmentDate: todayInput(1),
    startTime: "09:00",
    symptoms: "",
    notes: "",
  });

  if (me.role === "patient") {
    return (
      <Panel title="Đặt lịch khám" subtitle="Chọn giờ khám phù hợp" icon={CalendarDays}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Dịch vụ">
            <select
              className={inputClass()}
              value={form.service}
              onChange={(event) => setForm({ ...form, service: event.target.value })}
            >
              {services.filter((service) => service.active).map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nha sĩ">
            <select
              className={inputClass()}
              value={form.dentist}
              onChange={(event) => setForm({ ...form, dentist: event.target.value })}
            >
              {dentists.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày khám">
            <input
              className={inputClass()}
              type="date"
              value={form.appointmentDate}
              onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {patientSlotTimes.map((time) => (
            <button
              key={time}
              type="button"
              disabled={busy || !form.service || !form.dentist}
              onClick={() => onBook({ ...form, startTime: time })}
              className="min-h-20 rounded-lg border border-[#cbd8e3] bg-white px-3 text-center text-2xl font-bold text-[#176b87] shadow-sm transition hover:border-[#176b87] hover:bg-[#eef8f8] disabled:opacity-50"
            >
              {time}
            </button>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Đặt lịch khám" subtitle="UCA09, UCA14" icon={CalendarDays}>
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onBook(form);
        }}
      >
        <Field label="Bệnh nhân">
          <select
            className={inputClass()}
            value={form.patient}
            onChange={(event) => setForm({ ...form, patient: event.target.value })}
          >
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dịch vụ">
          <select
            className={inputClass()}
            value={form.service}
            onChange={(event) => setForm({ ...form, service: event.target.value })}
          >
            {services.filter((service) => service.active).map((service) => (
              <option key={service._id} value={service._id}>
                {service.name} - {moneyFormatter.format(service.price)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nha sĩ">
          <select
            className={inputClass()}
            value={form.dentist}
            onChange={(event) => setForm({ ...form, dentist: event.target.value })}
          >
            {dentists.map((dentist) => (
              <option key={dentist._id} value={dentist._id}>
                {dentist.fullName} · {dentist.specialty}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ngày khám">
          <input
            className={inputClass()}
            type="date"
            value={form.appointmentDate}
            onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })}
          />
        </Field>
        <Field label="Giờ bắt đầu">
          <input
            className={inputClass()}
            type="time"
            step={1800}
            value={form.startTime}
            onChange={(event) => setForm({ ...form, startTime: event.target.value })}
          />
        </Field>
        <Field label="Lý do khám">
          <textarea
            className={`${inputClass()} min-h-24 py-2`}
            value={form.symptoms}
            onChange={(event) => setForm({ ...form, symptoms: event.target.value })}
          />
        </Field>
        <Field label="Ghi chú">
          <textarea
            className={`${inputClass()} min-h-24 py-2`}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>
        <div className="lg:col-span-2">
          <Button type="submit" icon={Plus} disabled={busy || !form.service || !form.dentist}>
            Xác nhận đặt lịch
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function AppointmentsPanel({
  me,
  appointments,
  nurses,
  quickNurse,
  setQuickNurse,
  busy,
  onAction,
}: {
  me: AppUser;
  appointments: Appointment[];
  nurses: AppUser[];
  quickNurse: string;
  setQuickNurse: (value: string) => void;
  busy: boolean;
  onAction: (payload: Record<string, string | number>) => void;
}) {
  function askReason(label: string) {
    return window.prompt(label) || "";
  }

  function askReschedule(appointment: Appointment) {
    const appointmentDate = window.prompt("Ngày mới (YYYY-MM-DD)", appointment.appointmentDate.slice(0, 10));
    if (!appointmentDate) return;
    const startTime = window.prompt("Giờ mới (HH:mm)", appointment.startTime);
    if (!startTime) return;
    onAction({ _id: appointment._id, action: "reschedule", appointmentDate, startTime });
  }

  function askReview(appointment: Appointment) {
    const rating = Number(window.prompt("Số sao đánh giá (1-5)", "5"));
    if (!rating || rating < 1 || rating > 5) return;
    const review = window.prompt("Nhận xét", "") || "";
    onAction({ _id: appointment._id, action: "review", rating, review });
  }

  const displayedAppointments =
    me.role === "receptionist"
      ? appointments.filter((appointment) => appointment.status === "pending")
      : appointments;

  return (
    <Panel
      title={me.role === "receptionist" ? "Lịch chờ xác nhận" : "Quản lý lịch hẹn"}
      subtitle={
        me.role === "receptionist"
          ? "Chỉ hiển thị lịch bệnh nhân đang chờ lễ tân xác nhận"
          : "UCA10-UCA15, UCA27-UCA29"
      }
      icon={ClipboardList}
      action={
        me.role === "admin" ? (
          <select
            className={inputClass()}
            value={quickNurse}
            onChange={(event) => setQuickNurse(event.target.value)}
          >
            <option value="">Chọn y tá gán nhanh</option>
            {nurses.map((nurse) => (
              <option key={nurse._id} value={nurse._id}>
                {nurse.fullName}
              </option>
            ))}
          </select>
        ) : null
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[#5e7188]">
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Ngày</th>
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Giờ</th>
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Bệnh nhân</th>
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Nha sĩ</th>
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Y tá</th>
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Dịch vụ</th>
              {me.role !== "receptionist" ? (
                <th className="border-b border-[#d8e2ea] py-2 pr-3">Trạng thái</th>
              ) : null}
              <th className="border-b border-[#d8e2ea] py-2 pr-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedAppointments.map((appointment) => (
              <tr key={appointment._id}>
                <td className="border-b border-[#edf1f5] py-3 pr-3">{formatDate(appointment.appointmentDate)}</td>
                <td className="border-b border-[#edf1f5] py-3 pr-3 font-mono">{appointment.startTime}-{appointment.endTime}</td>
                <td className="border-b border-[#edf1f5] py-3 pr-3">{userName(appointment.patient)}</td>
                <td className="border-b border-[#edf1f5] py-3 pr-3">{userName(appointment.dentist)}</td>
                <td className="border-b border-[#edf1f5] py-3 pr-3">{userName(appointment.nurse)}</td>
                <td className="border-b border-[#edf1f5] py-3 pr-3">{serviceName(appointment.service)}</td>
                {me.role !== "receptionist" ? (
                  <td className="border-b border-[#edf1f5] py-3 pr-3">
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(appointment.status)}`}>
                      {statusLabels[appointment.status]}
                    </span>
                  </td>
                ) : null}
                <td className="border-b border-[#edf1f5] py-3 pr-3">
                  <div className="flex flex-wrap gap-2">
                    {["admin", "receptionist"].includes(me.role) && appointment.status === "pending" ? (
                      <>
                        <Button icon={CheckCircle2} variant="secondary" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "confirm" })}>
                          Xác nhận
                        </Button>
                        <Button icon={XCircle} variant="danger" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "reject", reason: askReason("Lý do từ chối") })}>
                          Từ chối
                        </Button>
                        {me.role === "receptionist" ? (
                          <Button icon={RefreshCcw} variant="ghost" disabled={busy} onClick={() => askReschedule(appointment)}>
                            Dời
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                    {["admin", "receptionist"].includes(me.role) && appointment.status === "confirmed" ? (
                      <Button icon={ClipboardCheck} variant="secondary" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "checkIn" })}>
                        Check-in
                      </Button>
                    ) : null}
                    {me.role === "admin" && quickNurse ? (
                      <Button icon={HeartPulse} variant="secondary" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "assignNurse", nurse: quickNurse })}>
                        Gán y tá
                      </Button>
                    ) : null}
                    {["admin", "dentist", "nurse"].includes(me.role) && ["checked_in", "confirmed"].includes(appointment.status) ? (
                      <Button icon={Stethoscope} variant="secondary" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "startTreatment" })}>
                        Điều trị
                      </Button>
                    ) : null}
                    {["admin", "dentist", "nurse"].includes(me.role) && appointment.status === "in_treatment" ? (
                      <Button icon={CheckCircle2} variant="secondary" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "complete" })}>
                        Hoàn tất
                      </Button>
                    ) : null}
                    {["admin", "patient"].includes(me.role) && ["pending", "confirmed"].includes(appointment.status) ? (
                      <>
                        <Button icon={RefreshCcw} variant="ghost" disabled={busy} onClick={() => askReschedule(appointment)}>
                          Dời
                        </Button>
                        <Button icon={XCircle} variant="danger" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "cancel", reason: askReason("Lý do hủy") })}>
                          Hủy
                        </Button>
                      </>
                    ) : null}
                    {me.role === "patient" && appointment.status === "completed" ? (
                      appointment.patientRating ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          Đã đánh giá {appointment.patientRating}/5
                        </span>
                      ) : (
                        <Button icon={NotebookPen} variant="secondary" disabled={busy} onClick={() => askReview(appointment)}>
                          Đánh giá
                        </Button>
                      )
                    ) : null}
                    {["admin", "receptionist"].includes(me.role) && ["confirmed", "checked_in"].includes(appointment.status) ? (
                      <Button icon={Bell} variant="ghost" disabled={busy} onClick={() => onAction({ _id: appointment._id, action: "noShow", reason: askReason("Ghi chú no-show") })}>
                        No-show
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ClinicFlowPanel({
  appointments,
  dentists,
  busy,
  onAction,
}: {
  appointments: Appointment[];
  dentists: AppUser[];
  busy: boolean;
  onAction: (payload: Record<string, string>) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(todayInput());
  const activeStatuses = ["confirmed", "checked_in", "in_treatment", "completed", "no_show", "cancelled"];
  const dayAppointments = appointments.filter(
    (appointment) =>
      activeStatuses.includes(appointment.status) &&
      appointment.appointmentDate.slice(0, 10) === selectedDate,
  );
  const shownDentists = dentists.filter((dentist) =>
    dayAppointments.some((appointment) => objectId(appointment.dentist) === dentist._id),
  );
  const boardDentists = shownDentists.length ? shownDentists : dentists;
  const slots = Array.from(new Set(dayAppointments.map((appointment) => appointment.startTime))).sort();
  const visibleSlots = slots.length ? slots : patientSlotTimes.slice(0, 10);

  function statusLabel(status: AppointmentStatus) {
    const match = receptionistStatusOptions.find((option) => option.value === status);
    return match?.label || statusLabels[status];
  }

  return (
    <Panel
      title="Điều phối phòng khám"
      subtitle="Lịch đã được lễ tân chấp nhận, quản lý theo nha sĩ và slot"
      icon={ClipboardCheck}
      action={
        <Field label="Ngày">
          <input
            className={inputClass()}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </Field>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[#5e7188]">
              <th className="sticky left-0 z-10 border-b border-[#d8e2ea] bg-white py-3 pr-3">
                Slot
              </th>
              {boardDentists.map((dentist) => (
                <th key={dentist._id} className="border-b border-[#d8e2ea] px-3 py-3">
                  <div className="flex items-center gap-2">
                    {dentist.avatarUrl ? (
                      <img src={dentist.avatarUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-[#dbe9ee]" />
                    )}
                    <div>
                      <div className="font-bold text-[#172033]">{dentist.fullName}</div>
                      <div className="text-xs text-[#6f8195]">{dentist.specialty}</div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleSlots.map((slot) => (
              <tr key={slot}>
                <td className="sticky left-0 z-10 border-b border-[#edf1f5] bg-white py-3 pr-3 align-top font-mono text-base font-bold text-[#176b87]">
                  {slot}
                </td>
                {boardDentists.map((dentist) => {
                  const cellAppointments = dayAppointments.filter(
                    (appointment) =>
                      appointment.startTime === slot &&
                      objectId(appointment.dentist) === dentist._id,
                  );

                  return (
                    <td key={dentist._id} className="min-w-[240px] border-b border-[#edf1f5] px-3 py-3 align-top">
                      {cellAppointments.length ? (
                        <div className="grid gap-2">
                          {cellAppointments.map((appointment) => {
                            const lockedByPatientCancel =
                              appointment.status === "cancelled" &&
                              appointment.cancellationActorRole === "patient";

                            return (
                              <div
                                key={appointment._id}
                                className="rounded-lg border border-[#d8e2ea] bg-[#f7fafb] p-3"
                              >
                                <div className="font-bold text-[#172033]">{userName(appointment.patient)}</div>
                                <div className="mt-1 text-xs text-[#5e7188]">
                                  {serviceName(appointment.service)} · {appointment.startTime}-{appointment.endTime}
                                </div>
                                <div className="mt-3 grid gap-2">
                                  <select
                                    className={inputClass()}
                                    value={
                                      receptionistStatusOptions.some((option) => option.value === appointment.status)
                                        ? appointment.status
                                        : "checked_in"
                                    }
                                    disabled={busy || lockedByPatientCancel}
                                    onChange={(event) => {
                                      const nextStatus = event.target.value as AppointmentStatus;
                                      const reason =
                                        nextStatus === "cancelled"
                                          ? window.prompt("Lý do hủy lịch", "") || ""
                                          : "";
                                      onAction({
                                        _id: appointment._id,
                                        action: "setStatus",
                                        status: nextStatus,
                                        reason,
                                      });
                                    }}
                                  >
                                    {receptionistStatusOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <span className={`w-fit rounded-md border px-2 py-1 text-xs font-bold ${statusClass(appointment.status)}`}>
                                    {statusLabel(appointment.status)}
                                  </span>
                                  {lockedByPatientCancel ? (
                                    <span className="text-xs font-semibold text-rose-700">
                                      Bệnh nhân đã hủy, lễ tân không thể đổi lại.
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-[#d8e2ea] p-3 text-xs text-[#8494a8]">
                          Trống
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SchedulePanel({
  me,
  dentists,
  schedules,
  busy,
  onSave,
  onDeactivate,
}: {
  me: AppUser;
  dentists: AppUser[];
  schedules: WorkSchedule[];
  busy: boolean;
  onSave: (payload: Record<string, string | number | boolean>) => void;
  onDeactivate: (id: string) => void;
}) {
  const [form, setForm] = useState({
    dentist: dentists[0]?._id || "",
    weekday: 1,
    startTime: "08:00",
    endTime: "12:00",
    slotMinutes: 30,
    room: "P.01",
    active: true,
  });

  return (
    <div className="grid gap-5">
      <Panel title="Thiết lập lịch làm việc" subtitle="UCA07" icon={Clock3}>
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
          }}
        >
          {me.role === "admin" ? (
            <Field label="Nha sĩ">
              <select className={inputClass()} value={form.dentist} onChange={(event) => setForm({ ...form, dentist: event.target.value })}>
                {dentists.map((dentist) => (
                  <option key={dentist._id} value={dentist._id}>{dentist.fullName}</option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Thứ">
            <select className={inputClass()} value={form.weekday} onChange={(event) => setForm({ ...form, weekday: Number(event.target.value) })}>
              {weekdays.map((weekday, index) => (
                <option key={weekday} value={index}>{weekday}</option>
              ))}
            </select>
          </Field>
          <Field label="Bắt đầu">
            <input className={inputClass()} type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
          </Field>
          <Field label="Kết thúc">
            <input className={inputClass()} type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
          </Field>
          <Field label="Slot phút">
            <input className={inputClass()} type="number" min={15} value={form.slotMinutes} onChange={(event) => setForm({ ...form, slotMinutes: Number(event.target.value) })} />
          </Field>
          <Field label="Phòng">
            <input className={inputClass()} value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" icon={Save} disabled={busy || (me.role === "admin" && !form.dentist)}>
              Lưu lịch
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Lịch hiện có" icon={ClipboardList}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => (
            <div key={schedule._id} className="rounded-lg border border-[#e1e8ef] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[#172033]">{userName(schedule.dentist)}</div>
                  <div className="text-sm text-[#5e7188]">{weekdays[schedule.weekday]} · {schedule.startTime}-{schedule.endTime}</div>
                  <div className="mt-1 text-xs font-semibold text-[#176b87]">{schedule.room} · {schedule.slotMinutes} phút</div>
                </div>
                <Button variant="ghost" icon={XCircle} disabled={busy} onClick={() => onDeactivate(schedule._id)}>
                  Tắt
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PatientsPanel({
  patients,
  appointments,
  treatments,
  search,
  setSearch,
}: {
  patients: AppUser[];
  appointments: Appointment[];
  treatments: Treatment[];
  search: string;
  setSearch: (value: string) => void;
}) {
  const filtered = patients.filter((patient) => {
    const term = search.toLowerCase();
    return (
      patient.fullName.toLowerCase().includes(term) ||
      patient.email.toLowerCase().includes(term) ||
      (patient.phone || "").includes(term)
    );
  });

  return (
    <Panel
      title="Danh sách bệnh nhân"
      subtitle="UCA28"
      icon={Users}
      action={
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8494a8]" />
          <input className={`${inputClass()} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bệnh nhân" />
        </div>
      }
    >
      <div className="grid gap-3">
        {filtered.map((patient) => {
          const patientAppointments = appointments.filter((appointment) => objectId(appointment.patient) === patient._id);
          const patientTreatments = treatments.filter((treatment) => objectId(treatment.patient) === patient._id);
          return (
            <div key={patient._id} className="grid gap-3 rounded-lg border border-[#e1e8ef] p-4 lg:grid-cols-[minmax(260px,0.6fr)_1fr]">
              <div className="flex gap-3">
                {patient.avatarUrl ? <img src={patient.avatarUrl} alt="" className="h-14 w-14 rounded-md object-cover" /> : <div className="h-14 w-14 rounded-md bg-[#dbe9ee]" />}
                <div>
                  <div className="font-bold text-[#172033]">{patient.fullName}</div>
                  <div className="text-sm text-[#5e7188]">{patient.email}</div>
                  <div className="text-sm text-[#5e7188]">{patient.phone}</div>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="font-semibold text-[#334155]">{patientAppointments.length} lịch hẹn · {patientTreatments.length} hồ sơ điều trị</div>
                {patientTreatments.slice(0, 2).map((treatment) => (
                  <div key={treatment._id} className="rounded-md bg-[#f7fafb] px-3 py-2 text-[#5e7188]">
                    {treatment.diagnosis || "Chưa có chẩn đoán"} · {treatment.procedures || "Chưa ghi thủ thuật"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function TreatmentPanel({
  appointments,
  treatments,
  busy,
  onSave,
}: {
  appointments: Appointment[];
  treatments: Treatment[];
  busy: boolean;
  onSave: (payload: Record<string, string>) => void;
}) {
  const eligible = appointments.filter((appointment) => !["cancelled", "rejected", "no_show"].includes(appointment.status));
  const [form, setForm] = useState({
    appointment: eligible[0]?._id || "",
    diagnosis: "",
    procedures: "",
    prescription: "",
    dentistNotes: "",
    nurseNotes: "",
    careInstructions: "",
    nextVisitDate: "",
  });

  return (
    <div className="grid gap-5">
      <Panel title="Ghi kết quả khám" subtitle="UCA12, UCA21, UCA22" icon={NotebookPen}>
        <form
          className="grid gap-4 lg:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
          }}
        >
          <Field label="Lịch hẹn">
            <select className={inputClass()} value={form.appointment} onChange={(event) => setForm({ ...form, appointment: event.target.value })}>
              {eligible.map((appointment) => (
                <option key={appointment._id} value={appointment._id}>
                  {formatDate(appointment.appointmentDate)} {appointment.startTime} · {userName(appointment.patient)} · {serviceName(appointment.service)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày tái khám">
            <input className={inputClass()} type="date" value={form.nextVisitDate} onChange={(event) => setForm({ ...form, nextVisitDate: event.target.value })} />
          </Field>
          <Field label="Chẩn đoán">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.diagnosis} onChange={(event) => setForm({ ...form, diagnosis: event.target.value })} />
          </Field>
          <Field label="Thủ thuật">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.procedures} onChange={(event) => setForm({ ...form, procedures: event.target.value })} />
          </Field>
          <Field label="Đơn thuốc">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.prescription} onChange={(event) => setForm({ ...form, prescription: event.target.value })} />
          </Field>
          <Field label="Ghi chú nha sĩ">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.dentistNotes} onChange={(event) => setForm({ ...form, dentistNotes: event.target.value })} />
          </Field>
          <Field label="Ghi chú y tá">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.nurseNotes} onChange={(event) => setForm({ ...form, nurseNotes: event.target.value })} />
          </Field>
          <Field label="Dặn dò sau điều trị">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.careInstructions} onChange={(event) => setForm({ ...form, careInstructions: event.target.value })} />
          </Field>
          <div className="lg:col-span-2">
            <Button type="submit" icon={Save} disabled={busy || !form.appointment}>
              Lưu hồ sơ
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Lịch sử điều trị" icon={ClipboardList}>
        <div className="grid gap-3">
          {treatments.map((treatment) => (
            <div key={treatment._id} className="rounded-lg border border-[#e1e8ef] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-bold text-[#172033]">{userName(treatment.patient)}</div>
                <div className="text-sm text-[#5e7188]">{userName(treatment.dentist)}</div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[#43566d] md:grid-cols-2">
                <div><b>Chẩn đoán:</b> {treatment.diagnosis || "Chưa ghi"}</div>
                <div><b>Thủ thuật:</b> {treatment.procedures || "Chưa ghi"}</div>
                <div><b>Dặn dò:</b> {treatment.careInstructions || "Chưa ghi"}</div>
                <div><b>Tái khám:</b> {treatment.nextVisitDate ? formatDate(treatment.nextVisitDate) : "Chưa hẹn"}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function NursePanel({
  me,
  appointments,
  nurses,
  vitals,
  tasks,
  busy,
  onVital,
  onTask,
}: {
  me: AppUser;
  appointments: Appointment[];
  nurses: AppUser[];
  vitals: Vital[];
  tasks: NurseTask[];
  busy: boolean;
  onVital: (payload: Record<string, string | number>) => void;
  onTask: (payload: Record<string, string | string[]>) => void;
}) {
  const nurseAppointments = appointments.filter((appointment) => ["confirmed", "checked_in", "in_treatment"].includes(appointment.status));
  const [vitalForm, setVitalForm] = useState({
    appointment: nurseAppointments[0]?._id || "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    allergies: "",
    chiefComplaint: "",
  });
  const [taskForm, setTaskForm] = useState({
    nurse: nurses[0]?._id || "",
    appointment: nurseAppointments[0]?._id || "",
    title: "",
    checklist: "Kiểm tra phòng, Chuẩn bị dụng cụ, Ghi log vô trùng",
    status: "todo",
    dueAt: todayInput(),
    notes: "",
  });

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Ghi sinh hiệu" subtitle="UCA19" icon={HeartPulse}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onVital({
                ...vitalForm,
                pulse: Number(vitalForm.pulse || 0),
                temperature: Number(vitalForm.temperature || 0),
                weight: Number(vitalForm.weight || 0),
              });
            }}
          >
            <Field label="Lịch hẹn">
              <select className={inputClass()} value={vitalForm.appointment} onChange={(event) => setVitalForm({ ...vitalForm, appointment: event.target.value })}>
                {nurseAppointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {formatDate(appointment.appointmentDate)} {appointment.startTime} · {userName(appointment.patient)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Huyết áp"><input className={inputClass()} value={vitalForm.bloodPressure} onChange={(event) => setVitalForm({ ...vitalForm, bloodPressure: event.target.value })} /></Field>
              <Field label="Mạch"><input className={inputClass()} type="number" value={vitalForm.pulse} onChange={(event) => setVitalForm({ ...vitalForm, pulse: event.target.value })} /></Field>
              <Field label="Nhiệt độ"><input className={inputClass()} type="number" step="0.1" value={vitalForm.temperature} onChange={(event) => setVitalForm({ ...vitalForm, temperature: event.target.value })} /></Field>
              <Field label="Cân nặng"><input className={inputClass()} type="number" step="0.1" value={vitalForm.weight} onChange={(event) => setVitalForm({ ...vitalForm, weight: event.target.value })} /></Field>
            </div>
            <Field label="Dị ứng"><input className={inputClass()} value={vitalForm.allergies} onChange={(event) => setVitalForm({ ...vitalForm, allergies: event.target.value })} /></Field>
            <Field label="Lý do khám"><textarea className={`${inputClass()} min-h-20 py-2`} value={vitalForm.chiefComplaint} onChange={(event) => setVitalForm({ ...vitalForm, chiefComplaint: event.target.value })} /></Field>
            <Button type="submit" icon={Save} disabled={busy || !vitalForm.appointment}>Lưu sinh hiệu</Button>
          </form>
        </Panel>

        <Panel title="Checklist y tá" subtitle="UCA20, UCA24" icon={ClipboardCheck}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onTask({
                ...taskForm,
                nurse: me.role === "nurse" ? me._id : taskForm.nurse,
                checklist: taskForm.checklist.split(",").map((item) => item.trim()).filter(Boolean),
              });
            }}
          >
            {me.role !== "nurse" ? (
              <Field label="Y tá">
                <select className={inputClass()} value={taskForm.nurse} onChange={(event) => setTaskForm({ ...taskForm, nurse: event.target.value })}>
                  {nurses.map((nurse) => (
                    <option key={nurse._id} value={nurse._id}>{nurse.fullName}</option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Tiêu đề"><input className={inputClass()} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></Field>
            <Field label="Lịch hẹn">
              <select className={inputClass()} value={taskForm.appointment} onChange={(event) => setTaskForm({ ...taskForm, appointment: event.target.value })}>
                <option value="">Không gắn lịch</option>
                {nurseAppointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>{formatDate(appointment.appointmentDate)} · {userName(appointment.patient)}</option>
                ))}
              </select>
            </Field>
            <Field label="Checklist">
              <textarea className={`${inputClass()} min-h-20 py-2`} value={taskForm.checklist} onChange={(event) => setTaskForm({ ...taskForm, checklist: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Trạng thái">
                <select className={inputClass()} value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })}>
                  <option value="todo">Todo</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </Field>
              <Field label="Hạn xử lý"><input className={inputClass()} type="date" value={taskForm.dueAt} onChange={(event) => setTaskForm({ ...taskForm, dueAt: event.target.value })} /></Field>
            </div>
            <Field label="Ghi chú"><textarea className={`${inputClass()} min-h-20 py-2`} value={taskForm.notes} onChange={(event) => setTaskForm({ ...taskForm, notes: event.target.value })} /></Field>
            <Button type="submit" icon={Save} disabled={busy || !taskForm.title}>Lưu checklist</Button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Sinh hiệu đã ghi" icon={Activity}>
          <div className="grid gap-3">
            {vitals.map((vital) => (
              <div key={vital._id} className="rounded-lg border border-[#e1e8ef] p-3 text-sm">
                <div className="font-bold text-[#172033]">{userName(vital.patient)}</div>
                <div className="mt-1 text-[#5e7188]">HA {vital.bloodPressure || "--"} · Mạch {vital.pulse || "--"} · {vital.temperature || "--"}°C · {vital.weight || "--"}kg</div>
                <div className="mt-1 text-[#5e7188]">{vital.chiefComplaint}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Công việc y tá" icon={ClipboardList}>
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div key={task._id} className="rounded-lg border border-[#e1e8ef] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-[#172033]">{task.title}</div>
                  <span className="rounded-md bg-[#eef5f6] px-2 py-1 text-xs font-bold text-[#176b87]">{task.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(task.checklist || []).map((item) => (
                    <span key={item} className="rounded-md border border-[#d8e2ea] px-2 py-1 text-xs text-[#43566d]">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function InventoryPanel({
  inventory,
  busy,
  onSave,
}: {
  inventory: InventoryItem[];
  busy: boolean;
  onSave: (payload: Record<string, string | number | boolean>) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "Vật tư điều trị",
    stock: 0,
    unit: "cái",
    reorderLevel: 10,
    notes: "",
    active: true,
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Panel title="Quản lý vật tư" subtitle="UCA23, UCA26" icon={Package}>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
            setForm({ ...form, name: "", stock: 0, notes: "" });
          }}
        >
          <Field label="Tên vật tư"><input className={inputClass()} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Nhóm"><input className={inputClass()} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tồn"><input className={inputClass()} type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} /></Field>
            <Field label="Đơn vị"><input className={inputClass()} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></Field>
            <Field label="Ngưỡng"><input className={inputClass()} type="number" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: Number(event.target.value) })} /></Field>
          </div>
          <Field label="Ghi chú"><textarea className={`${inputClass()} min-h-20 py-2`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          <Button type="submit" icon={Save} disabled={busy || !form.name}>Lưu vật tư</Button>
        </form>
      </Panel>
      <Panel title="Tồn kho hiện tại" icon={ClipboardList}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[#5e7188]">
                <th className="border-b border-[#d8e2ea] py-2 pr-3">Vật tư</th>
                <th className="border-b border-[#d8e2ea] py-2 pr-3">Nhóm</th>
                <th className="border-b border-[#d8e2ea] py-2 pr-3">Tồn</th>
                <th className="border-b border-[#d8e2ea] py-2 pr-3">Ngưỡng</th>
                <th className="border-b border-[#d8e2ea] py-2 pr-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item._id}>
                  <td className="border-b border-[#edf1f5] py-3 pr-3 font-semibold">{item.name}</td>
                  <td className="border-b border-[#edf1f5] py-3 pr-3">{item.category}</td>
                  <td className="border-b border-[#edf1f5] py-3 pr-3">{item.stock} {item.unit}</td>
                  <td className="border-b border-[#edf1f5] py-3 pr-3">{item.reorderLevel}</td>
                  <td className="border-b border-[#edf1f5] py-3 pr-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${item.stock <= item.reorderLevel ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {item.stock <= item.reorderLevel ? "Cần bổ sung" : "Ổn"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function MasterDataPanel({
  clinic,
  services,
  users,
  busy,
  onService,
  onDeactivateService,
  onUser,
  onClinic,
}: {
  clinic: ClinicInfo | null;
  services: DentalService[];
  users: AppUser[];
  busy: boolean;
  onService: (payload: Record<string, string | number | boolean>) => void;
  onDeactivateService: (id: string) => void;
  onUser: (payload: Record<string, string | number | boolean>) => void;
  onClinic: (payload: Record<string, string>) => void;
}) {
  const [service, setService] = useState({
    name: "",
    category: "Điều trị",
    description: "",
    durationMinutes: 30,
    price: 0,
    active: true,
  });
  const [staff, setStaff] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "123456",
    role: "dentist",
    specialty: "",
    experienceYears: 0,
    licenseNo: "",
    bio: "",
    avatarUrl: "",
    active: true,
  });
  const [clinicForm, setClinicForm] = useState({
    name: clinic?.name || "",
    slogan: clinic?.slogan || "",
    phone: clinic?.phone || "",
    email: clinic?.email || "",
    address: clinic?.address || "",
    openingHours: clinic?.openingHours || "",
    coverImageUrl: clinic?.coverImageUrl || "",
    notes: clinic?.notes || "",
  });

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Dịch vụ nha khoa" subtitle="UCA05" icon={Activity}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onService(service);
              setService({ ...service, name: "", description: "", price: 0 });
            }}
          >
            <Field label="Tên dịch vụ"><input className={inputClass()} value={service.name} onChange={(event) => setService({ ...service, name: event.target.value })} /></Field>
            <Field label="Nhóm"><input className={inputClass()} value={service.category} onChange={(event) => setService({ ...service, category: event.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Thời lượng"><input className={inputClass()} type="number" value={service.durationMinutes} onChange={(event) => setService({ ...service, durationMinutes: Number(event.target.value) })} /></Field>
              <Field label="Giá"><input className={inputClass()} type="number" value={service.price} onChange={(event) => setService({ ...service, price: Number(event.target.value) })} /></Field>
            </div>
            <Field label="Mô tả"><textarea className={`${inputClass()} min-h-20 py-2`} value={service.description} onChange={(event) => setService({ ...service, description: event.target.value })} /></Field>
            <Button type="submit" icon={Save} disabled={busy || !service.name}>Lưu dịch vụ</Button>
          </form>
        </Panel>

        <Panel title="Nhân sự" subtitle="UCA06, UCA25" icon={UserCog}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onUser(staff);
              setStaff({ ...staff, fullName: "", email: "", phone: "", specialty: "", licenseNo: "", bio: "" });
            }}
          >
            <Field label="Họ tên"><input className={inputClass()} value={staff.fullName} onChange={(event) => setStaff({ ...staff, fullName: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass()} type="email" value={staff.email} onChange={(event) => setStaff({ ...staff, email: event.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role">
                <select className={inputClass()} value={staff.role} onChange={(event) => setStaff({ ...staff, role: event.target.value })}>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mật khẩu"><input className={inputClass()} value={staff.password} onChange={(event) => setStaff({ ...staff, password: event.target.value })} /></Field>
            </div>
            <Field label="Chuyên môn"><input className={inputClass()} value={staff.specialty} onChange={(event) => setStaff({ ...staff, specialty: event.target.value })} /></Field>
            <Field label="Số điện thoại"><input className={inputClass()} value={staff.phone} onChange={(event) => setStaff({ ...staff, phone: event.target.value })} /></Field>
            <Button type="submit" icon={Save} disabled={busy || !staff.email || !staff.fullName}>Lưu nhân sự</Button>
          </form>
        </Panel>

        <Panel title="Thông tin phòng khám" subtitle="UCA08" icon={ShieldCheck}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              onClinic(clinicForm);
            }}
          >
            <Field label="Tên phòng khám"><input className={inputClass()} value={clinicForm.name} onChange={(event) => setClinicForm({ ...clinicForm, name: event.target.value })} /></Field>
            <Field label="Slogan"><input className={inputClass()} value={clinicForm.slogan} onChange={(event) => setClinicForm({ ...clinicForm, slogan: event.target.value })} /></Field>
            <Field label="Điện thoại"><input className={inputClass()} value={clinicForm.phone} onChange={(event) => setClinicForm({ ...clinicForm, phone: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass()} type="email" value={clinicForm.email} onChange={(event) => setClinicForm({ ...clinicForm, email: event.target.value })} /></Field>
            <Field label="Địa chỉ"><input className={inputClass()} value={clinicForm.address} onChange={(event) => setClinicForm({ ...clinicForm, address: event.target.value })} /></Field>
            <Field label="Giờ hoạt động"><input className={inputClass()} value={clinicForm.openingHours} onChange={(event) => setClinicForm({ ...clinicForm, openingHours: event.target.value })} /></Field>
            <Button type="submit" icon={Save} disabled={busy || !clinicForm.name}>Lưu thông tin</Button>
          </form>
        </Panel>
      </div>

      <Panel title="Dữ liệu hiện có" icon={ClipboardList}>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="grid gap-3">
            {services.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e8ef] p-3">
                <div>
                  <div className="font-bold text-[#172033]">{item.name}</div>
                  <div className="text-sm text-[#5e7188]">{item.category} · {item.durationMinutes} phút · {moneyFormatter.format(item.price)}</div>
                </div>
                <Button icon={XCircle} variant="ghost" disabled={busy || !item.active} onClick={() => onDeactivateService(item._id)}>
                  Ngưng
                </Button>
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            {users.slice(0, 10).map((user) => (
              <div key={user._id} className="flex items-center gap-3 rounded-lg border border-[#e1e8ef] p-3">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="h-10 w-10 rounded-md bg-[#dbe9ee]" />}
                <div className="min-w-0">
                  <div className="truncate font-bold text-[#172033]">{user.fullName}</div>
                  <div className="truncate text-sm text-[#5e7188]">{roleLabels[user.role]} · {user.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ReportsPanel({ reports }: { reports: ReportData }) {
  const summary = reports.summary;
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng lịch hẹn" value={summary?.totalAppointments || 0} icon={CalendarDays} accent="text-[#176b87]" />
        <StatCard label="Doanh thu" value={moneyFormatter.format(summary?.revenue || 0)} icon={BadgeDollarSign} accent="text-emerald-600" />
        <StatCard label="Bệnh nhân" value={summary?.totalPatients || 0} icon={Users} accent="text-indigo-600" />
        <StatCard label="No-show" value={`${summary?.noShowRate || 0}%`} icon={Bell} accent="text-orange-600" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Doanh thu theo dịch vụ" subtitle="UCA17" icon={BadgeDollarSign}>
          <ReportTable rows={reports.revenueByService || []} />
        </Panel>
        <Panel title="Doanh thu theo nha sĩ" subtitle="UCA18" icon={Stethoscope}>
          <ReportTable rows={reports.revenueByDentist || []} />
        </Panel>
      </div>
      <Panel title="Audit log gần đây" subtitle="UCA30" icon={ClipboardCheck}>
        <div className="grid gap-2">
          {(reports.audits || []).map((audit) => (
            <div key={audit._id} className="grid gap-2 rounded-lg border border-[#e1e8ef] p-3 text-sm sm:grid-cols-[1fr_auto]">
              <div className="font-semibold text-[#172033]">{audit.action} · {audit.entity}</div>
              <div className="text-[#5e7188]">{formatDate(audit.createdAt)} · {audit.actorRole || "system"}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ReportTable({ rows }: { rows: { label: string; count: number; revenue: number }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[#5e7188]">
            <th className="border-b border-[#d8e2ea] py-2 pr-3">Tên</th>
            <th className="border-b border-[#d8e2ea] py-2 pr-3">Số ca</th>
            <th className="border-b border-[#d8e2ea] py-2 pr-3">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="border-b border-[#edf1f5] py-3 pr-3 font-semibold">{row.label}</td>
              <td className="border-b border-[#edf1f5] py-3 pr-3">{row.count}</td>
              <td className="border-b border-[#edf1f5] py-3 pr-3">{moneyFormatter.format(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UseCasePanel({ useCases }: { useCases: UseCase[] }) {
  const grouped = useCases.reduce<Record<string, UseCase[]>>((acc, item) => {
    acc[item.workflow] = acc[item.workflow] || [];
    acc[item.workflow].push(item);
    return acc;
  }, {});

  return (
    <div className="grid gap-5">
      {Object.entries(grouped).map(([workflow, items]) => (
        <Panel key={workflow} title={`${workflow} · ${items.length} use cases`} icon={ClipboardCheck}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#e1e8ef] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md bg-[#eef5f6] px-2 py-1 font-mono text-xs font-bold text-[#176b87]">{item.id}</span>
                  <span className="text-xs font-bold text-[#6f8195]">{item.actor}</span>
                </div>
                <div className="mt-3 font-bold text-[#172033]">{item.name}</div>
                <p className="mt-2 text-sm leading-6 text-[#5e7188]">{item.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function ProfilePanel({
  me,
  busy,
  onSave,
}: {
  me: AppUser;
  busy: boolean;
  onSave: (payload: Record<string, string>) => void;
}) {
  const [form, setForm] = useState({
    _id: me._id,
    fullName: me.fullName,
    email: me.email,
    phone: me.phone || "",
    address: me.address || "",
    avatarUrl: me.avatarUrl || "",
    bio: me.bio || "",
    password: "",
  });

  return (
    <Panel title="Hồ sơ cá nhân" subtitle="UCA04" icon={UserCog}>
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <Field label="Họ tên"><input className={inputClass()} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field>
        <Field label="Email"><input className={inputClass()} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
        <Field label="Số điện thoại"><input className={inputClass()} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Ảnh đại diện URL"><input className={inputClass()} value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} /></Field>
        <Field label="Địa chỉ"><input className={inputClass()} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
        <Field label="Mật khẩu mới"><input className={inputClass()} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
        <Field label="Giới thiệu">
          <textarea className={`${inputClass()} min-h-24 py-2`} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" icon={Save} disabled={busy}>Lưu hồ sơ</Button>
        </div>
      </form>
    </Panel>
  );
}
