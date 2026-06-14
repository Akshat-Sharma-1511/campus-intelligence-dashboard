"use client";

import type { MenuResult, DietaryMatch } from "@/lib/types";

// ─── Dietary tag badges ───────────────────────────────────────────────────────

const DIETARY_PATTERNS = [
  {
    re: /vegan/i,
    label: "Vegan",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  {
    re: /jain/i,
    label: "Jain",
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  {
    re: /gluten.free/i,
    label: "GF",
    cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
];

function dietaryBadges(item: string) {
  return DIETARY_PATTERNS.filter(({ re }) => re.test(item));
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MenuSkeleton() {
  return (
    <div className="animate-card-in rounded-xl border border-cafeteria/20 bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        {/* Utensils icon */}
        <svg
          className="h-4 w-4 text-cafeteria animate-pulse"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="text-xs font-semibold text-cafeteria uppercase tracking-wider">
          Cafeteria
        </span>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="skeleton h-2.5 w-1/4 rounded" />
          <div className="flex gap-1.5 flex-wrap">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-28 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Meal Section ─────────────────────────────────────────────────────────────

function MealSection({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-cafeteria uppercase tracking-widest">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => {
          const badges = dietaryBadges(item);
          const cleanName = item.replace(/\s*\(.*?\)\s*/g, "").trim();
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-cafeteria/20 bg-cafeteria/10 px-2.5 py-1 text-xs text-slate-200"
            >
              {cleanName}
              {badges.map(({ label: bl, cls }) => (
                <span
                  key={bl}
                  className={`rounded-full border px-1 py-0.5 text-[9px] font-bold leading-none ${cls}`}
                >
                  {bl}
                </span>
              ))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dietary match list (for check_dietary_item) ──────────────────────────────

function DietaryMatchList({ matches }: { matches: DietaryMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No items found matching that dietary filter.
      </p>
    );
  }

  // Group by day+meal
  const grouped: Record<string, { meal: string; items: string[] }[]> = {};
  for (const m of matches) {
    if (!grouped[m.day]) grouped[m.day] = [];
    const existing = grouped[m.day].find((g) => g.meal === m.meal);
    if (existing) {
      existing.items.push(m.item);
    } else {
      grouped[m.day].push({ meal: m.meal, items: [m.item] });
    }
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([day, mealGroups]) => (
        <div key={day} className="rounded-lg border border-cafeteria/10 bg-surface-elevated p-2.5 space-y-1.5">
          <p className="text-[10px] font-bold text-cafeteria uppercase tracking-wider">{day}</p>
          {mealGroups.map(({ meal, items }) => (
            <div key={meal} className="flex flex-wrap gap-1">
              <span className="text-[10px] text-slate-500 mr-1">{meal}:</span>
              {items.map((item, i) => {
                const cleanName = item.replace(/\s*\(.*?\)\s*/g, "").trim();
                const badges = dietaryBadges(item);
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-cafeteria/20 bg-cafeteria/10 px-2 py-0.5 text-[10px] text-slate-200"
                  >
                    {cleanName}
                    {badges.map(({ label: bl, cls }) => (
                      <span
                        key={bl}
                        className={`rounded-full border px-1 py-0.5 text-[9px] font-bold leading-none ${cls}`}
                      >
                        {bl}
                      </span>
                    ))}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MenuCardProps {
  state: "call" | "result";
  result?: any; // Shape varies per tool — runtime narrowed in component
  toolName?: string;
}

export function MenuCard({ state, result, toolName }: MenuCardProps) {
  if (state === "call") return <MenuSkeleton />;

  const utensilsIcon = (
    <svg
      className="h-4 w-4 text-cafeteria"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );

  if (result?.error) {
    return (
      <div className="animate-card-in rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          {utensilsIcon}
          <span className="text-xs font-semibold text-cafeteria uppercase tracking-wider">
            Cafeteria
          </span>
        </div>
        <p className="text-xs text-red-400">{result.error}</p>
      </div>
    );
  }

  // check_dietary_item returns an array of DietaryMatch
  if (Array.isArray(result) && result.length > 0 && "meal" in result[0]) {
    return (
      <div className="animate-card-in rounded-xl border-l-2 border-cafeteria bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2">
          {utensilsIcon}
          <span className="text-xs font-semibold text-cafeteria uppercase tracking-wider">
            Cafeteria — Dietary Search
          </span>
        </div>
        <DietaryMatchList matches={result as DietaryMatch[]} />
      </div>
    );
  }

  // check_dietary_item returned empty array
  if (Array.isArray(result) && result.length === 0) {
    return (
      <div className="animate-card-in rounded-xl border border-cafeteria/20 bg-surface p-4 space-y-2">
        <div className="flex items-center gap-2">
          {utensilsIcon}
          <span className="text-xs font-semibold text-cafeteria uppercase tracking-wider">
            Cafeteria
          </span>
        </div>
        <p className="text-xs text-slate-400">No matching items found.</p>
      </div>
    );
  }

  // get_menu returns a MenuResult object
  const menu = result as MenuResult | null;
  if (!menu || (!menu.breakfast?.length && !menu.lunch?.length && !menu.dinner?.length)) {
    return (
      <div className="animate-card-in rounded-xl border border-cafeteria/20 bg-surface p-4 space-y-2">
        <div className="flex items-center gap-2">
          {utensilsIcon}
          <span className="text-xs font-semibold text-cafeteria uppercase tracking-wider">
            Cafeteria
          </span>
        </div>
        <p className="text-xs text-slate-400">Menu data unavailable.</p>
      </div>
    );
  }

  const dayLabel =
    menu.day.charAt(0).toUpperCase() + menu.day.slice(1);

  return (
    <div className="animate-card-in rounded-xl border-l-2 border-cafeteria bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        {utensilsIcon}
        <span className="text-xs font-semibold text-cafeteria uppercase tracking-wider">
          Cafeteria
        </span>
        <span className="ml-auto text-xs font-medium text-slate-300">{dayLabel}</span>
      </div>
      <div className="space-y-3">
        <MealSection label="Breakfast" items={menu.breakfast} />
        <MealSection label="Lunch" items={menu.lunch} />
        <MealSection label="Dinner" items={menu.dinner} />
      </div>
    </div>
  );
}
