import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function statusColor(status: string) {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50";
    case "running":
    case "resolving":
    case "in_progress":
      return "text-blue-600 bg-blue-50";
    case "failed":
      return "text-red-600 bg-red-50";
    case "paused":
      return "text-yellow-600 bg-yellow-50";
    case "cancelled":
      return "text-gray-500 bg-gray-100";
    default:
      return "text-gray-600 bg-gray-50";
  }
}
