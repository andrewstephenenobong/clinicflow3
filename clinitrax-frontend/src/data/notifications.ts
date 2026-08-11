// UI-only notification data. No backend endpoint exists yet.
// TODO(backend): replace with GET /api/notifications once implemented.
import type { LucideIcon } from "lucide-react";
import {
  MessageSquareText,
  Mail,
  Bell,
  CalendarClock,
  AlertTriangle,
  PhoneCall,
  BedDouble,
  FlaskConical,
} from "lucide-react";

export type NotificationChannel =
  | "sms"
  | "email"
  | "internal"
  | "appointment"
  | "emergency"
  | "patient-called"
  | "bed-assigned"
  | "lab-result";

export interface NotificationItem {
  id: string;
  channel: NotificationChannel;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export const CHANNEL_META: Record<
  NotificationChannel,
  { label: string; Icon: LucideIcon; color: string }
> = {
  sms: { label: "SMS", Icon: MessageSquareText, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  email: { label: "Email", Icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
  internal: { label: "Internal", Icon: Bell, color: "text-slate-600 bg-slate-100 border-slate-200" },
  appointment: { label: "Appointment reminder", Icon: CalendarClock, color: "text-purple-600 bg-purple-50 border-purple-200" },
  emergency: { label: "Emergency alert", Icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
  "patient-called": { label: "Patient called", Icon: PhoneCall, color: "text-blue-600 bg-blue-50 border-blue-200" },
  "bed-assigned": { label: "Bed assigned", Icon: BedDouble, color: "text-amber-600 bg-amber-50 border-amber-200" },
  "lab-result": { label: "Lab result ready", Icon: FlaskConical, color: "text-teal-600 bg-teal-50 border-teal-200" },
};

export const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    channel: "emergency",
    title: "Emergency triage waiting",
    detail: "A patient checked in with EMERGENCY triage is waiting in the queue.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "n2",
    channel: "patient-called",
    title: "Patient called to doctor",
    detail: "Front desk called the next patient in the queue.",
    time: "12 min ago",
    read: false,
  },
  {
    id: "n3",
    channel: "bed-assigned",
    title: "Bed assigned",
    detail: "A patient was admitted to General ward.",
    time: "40 min ago",
    read: true,
  },
  {
    id: "n4",
    channel: "appointment",
    title: "Appointment reminder",
    detail: "Follow-up appointment scheduled for tomorrow, 10:00 AM.",
    time: "1 hr ago",
    read: true,
  },
  {
    id: "n5",
    channel: "lab-result",
    title: "Lab result ready",
    detail: "Pending integration — will notify staff when results are uploaded.",
    time: "—",
    read: true,
  },
];
