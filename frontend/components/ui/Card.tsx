import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 ${className}`}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: "library" | "cafeteria" | "events" | "handbook" | "default";
}

const badgeColors: Record<NonNullable<BadgeProps["color"]>, string> = {
  library: "bg-library/20 text-library border-library/30",
  cafeteria: "bg-cafeteria/20 text-cafeteria border-cafeteria/30",
  events: "bg-events/20 text-events border-events/30",
  handbook: "bg-handbook/20 text-handbook border-handbook/30",
  default: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export function Badge({ children, color = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeColors[color]}`}
    >
      {children}
    </span>
  );
}
