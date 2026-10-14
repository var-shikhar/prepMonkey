'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ROLE_LEVELS, roleLevel, type RoleCounts } from '@/lib/role-levels';

const ANY = 'any';

/** "Preparing for" role picker: questions are drawn up to the chosen level. */
export function RolePicker({ counts, value, onChange }: {
  counts: RoleCounts;
  value: number | null;
  onChange: (role: number | null) => void;
}) {
  const upTo = (level: number) => ROLE_LEVELS.filter((r) => r.level <= level).reduce((a, r) => a + (counts.byLevel[r.level] ?? 0), 0);
  const picked = roleLevel(value);
  return (
    <div className="space-y-2">
      <ToggleGroup
        type="single"
        value={value ? String(value) : ANY}
        onValueChange={(v) => v && onChange(v === ANY ? null : Number(v))}
        variant="outline"
        aria-label="Preparing for"
        className="grid w-full grid-cols-3 gap-1.5 sm:grid-cols-6"
      >
        <ToggleGroupItem value={ANY} className="h-auto flex-col rounded-lg px-2 py-1.5 text-xs">
          <span className="font-semibold">Any</span>
          <span className="text-[0.65rem] opacity-70">all levels</span>
        </ToggleGroupItem>
        {ROLE_LEVELS.map((r) => (
          <ToggleGroupItem key={r.level} value={String(r.level)} className="h-auto flex-col rounded-lg px-2 py-1.5 text-xs">
            <span className="font-semibold">{r.code}</span>
            <span className="text-[0.65rem] opacity-70">{r.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {picked
          ? `${picked.label} (${picked.years}): questions up to ${picked.code}, ${upTo(picked.level).toLocaleString()} in the bank.`
          : 'Questions from every level, fresher to staff.'}
      </p>
    </div>
  );
}

/** True once an exam's questions carry role levels, so the picker has something to filter. */
export const hasRoleLevels = (counts?: RoleCounts | null) => Boolean(counts && Object.keys(counts.byLevel).length);
