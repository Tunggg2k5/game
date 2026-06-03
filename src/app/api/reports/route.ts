import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { connectMongo } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import { AuditLog } from "@/models/AuditLog";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PopulatedAppointment = {
  status: string;
  price?: number;
  appointmentDate: string;
  service?: { _id?: string; name?: string };
  dentist?: { _id?: string; fullName?: string };
  patient?: { _id?: string; createdAt?: string };
};

function addToBucket(
  buckets: Record<string, { label: string; count: number; revenue: number }>,
  id: string,
  label: string,
  price: number,
) {
  if (!buckets[id]) {
    buckets[id] = { label, count: 0, revenue: 0 };
  }
  buckets[id].count += 1;
  buckets[id].revenue += price;
}

export async function GET() {
  const guard = await authGuard(["admin", "receptionist"]);
  if (isGuardError(guard)) return guard.response;

  try {
    await connectMongo();
    const [appointmentsRaw, patients, audits] = await Promise.all([
      Appointment.find({})
        .populate("service")
        .populate("dentist")
        .populate("patient")
        .sort({ appointmentDate: -1 }),
      User.find({ role: "patient" }).sort({ createdAt: -1 }),
      AuditLog.find({}).populate("actor").sort({ createdAt: -1 }).limit(12),
    ]);

    const appointments = toJson(appointmentsRaw) as PopulatedAppointment[];
    const statusCounts: Record<string, number> = {};
    const serviceBuckets: Record<string, { label: string; count: number; revenue: number }> = {};
    const dentistBuckets: Record<string, { label: string; count: number; revenue: number }> = {};
    let revenue = 0;
    let noShow = 0;
    let completed = 0;

    for (const appointment of appointments) {
      statusCounts[appointment.status] = (statusCounts[appointment.status] || 0) + 1;
      if (appointment.status === "no_show") noShow += 1;
      if (appointment.status !== "completed") continue;

      const price = appointment.price || 0;
      completed += 1;
      revenue += price;
      addToBucket(
        serviceBuckets,
        appointment.service?._id || "unknown",
        appointment.service?.name || "Chưa rõ dịch vụ",
        price,
      );
      addToBucket(
        dentistBuckets,
        appointment.dentist?._id || "unknown",
        appointment.dentist?.fullName || "Chưa rõ nha sĩ",
        price,
      );
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const newPatientsThisMonth = patients.filter(
      (patient) => patient.createdAt && patient.createdAt >= monthStart,
    ).length;

    return ok({
      summary: {
        totalAppointments: appointments.length,
        completed,
        revenue,
        noShow,
        noShowRate: appointments.length ? Math.round((noShow / appointments.length) * 100) : 0,
        totalPatients: patients.length,
        newPatientsThisMonth,
      },
      statusCounts,
      revenueByService: Object.values(serviceBuckets).sort((a, b) => b.revenue - a.revenue),
      revenueByDentist: Object.values(dentistBuckets).sort((a, b) => b.revenue - a.revenue),
      audits: toJson(audits),
    });
  } catch {
    return fail("Không thể tải báo cáo.", 500);
  }
}
