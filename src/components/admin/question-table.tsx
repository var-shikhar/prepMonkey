'use client';

import Link from 'next/link';
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient,
  type InfiniteData, type QueryFunctionContext,
} from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle, Download, Loader2, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { api } from '@/lib/api';
import type { ExamConfig } from '@/lib/engine/types';
import { FLAG_INFO } from '@/lib/item-flags';
import { cn } from '@/lib/utils';
import type { QuestionListPage, QuestionListRow, QuestionSort } from '@/server/admin/questions';

type Status = QuestionListRow['status'];
type Exam = Pick<ExamConfig, 'id' | 'code' | 'skills' | 'domains'>;

interface Filters {
  status: Status | 'all';
  type: string;
  skill: string;
  flagged: boolean;
  sort: QuestionSort;
  q: string;
}

const STATUSES = ['all', 'draft', 'review', 'published', 'retired'] as const;
const SORT_LABEL: Record<QuestionSort, string> = { updated: 'Recently edited', id: 'By id', p: 'Hardest first', n: 'Most answered' };
const TYPE_LABEL: Record<string, string> = { single: 'Single', multi: 'Multi', truefalse: 'True/false', order: 'Order', match: 'Match', fill: 'Fill-in' };
const STATUS_STYLE: Record<Status, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-banana/25 text-cocoa dark:text-banana',
  published: 'bg-success/12 text-success',
  retired: 'bg-destructive/10 text-destructive',
};
const BULK_ACTIONS: { status: Status; label: string }[] = [
  { status: 'published', label: 'Publish' },
  { status: 'review', label: 'Send to review' },
  { status: 'draft', label: 'Move to draft' },
  { status: 'retired', label: 'Retire' },
];
const NO_FILTERS: Filters = { status: 'all', type: '', skill: '', flagged: false, sort: 'updated', q: '' };
/** Height of a row with a two-line stem, used until the row is measured. Phones show it as a taller card. */
const estimateRow = () => 72;
const estimateCard = () => 112;

type ListKey = readonly ['admin', 'questions', string, 'list', Filters];
const listKey = (examId: string, f: Filters): ListKey => ['admin', 'questions', examId, 'list', f];

/** The filters as query parameters, without defaults so URLs stay short. */
function filterParams(f: Filters): [string, string][] {
  return [
    ['status', f.status === 'all' ? '' : f.status],
    ['type', f.type],
    ['skill', f.skill],
    ['flagged', f.flagged ? '1' : ''],
    ['sort', f.sort === 'updated' ? '' : f.sort],
    ['q', f.q],
  ];
}

function apiUrl(examId: string, f: Filters, extra: [string, string | null][] = []) {
  const p = new URLSearchParams({ examId });
  for (const [k, v] of [...filterParams(f), ...extra]) if (v) p.set(k, v);
  return `/api/admin/questions?${p}`;
}

// Takes the filters from the query key, so prefetched and cached pages always match their view.
const fetchPage = ({ queryKey: [, , examId, , f], pageParam, signal }: QueryFunctionContext<ListKey, string | null>) =>
  api.get<QuestionListPage>(apiUrl(examId, f, [['cursor', pageParam]]), { signal });

function readFilters(params: { get(name: string): string | null }, exam: Exam): Filters {
  const get = (k: string) => params.get(k)?.trim() ?? '';
  return {
    status: STATUSES.find((s) => s === get('status')) ?? 'all',
    type: Object.hasOwn(TYPE_LABEL, get('type')) ? get('type') : '',
    // A skill from another exam (the switcher keeps the URL's filters) would match nothing.
    skill: exam.skills.some((s) => s.id === get('skill')) ? get('skill') : '',
    flagged: get('flagged') === '1',
    sort: (Object.keys(SORT_LABEL) as QuestionSort[]).find((s) => s === get('sort')) ?? 'updated',
    q: get('q'),
  };
}

/**
 * The question bank, built to stay smooth with thousands of rows:
 * - filters are React state, so every control responds on the frame it is used,
 *   and the URL mirrors them without the server rendering the page again;
 * - rows arrive 100 at a time as you scroll, the previous results stay on screen
 *   while new ones load, and superseded requests are cancelled;
 * - only rows near the viewport are in the DOM, each memoised, so ticking a box
 *   re-renders one row.
 */
export function QuestionTable({ exam }: { exam: Exam }) {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(() => readFilters(params, exam));
  const [search, setSearch] = useState(filters.q);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  /** Brings the first rows back into view when the results change under a scrolled list. */
  const scrollToTop = useCallback(() => {
    const el = tbodyRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 240;
    if (window.scrollY > top) window.scrollTo({ top });
  }, []);

  const applyFilters = useCallback((patch: Partial<Filters>) => {
    if ((Object.keys(patch) as (keyof Filters)[]).every((k) => patch[k] === filters[k])) return;
    setFilters({ ...filters, ...patch });
    setSelected(new Set());
    scrollToTop();
  }, [filters, scrollToTop]);

  // Typing applies after a short pause; every other control applies at once.
  useEffect(() => {
    const q = search.trim();
    if (q === filters.q) return;
    const timer = setTimeout(() => applyFilters({ q }), 250);
    return () => clearTimeout(timer);
  }, [search, filters.q, applyFilters]);

  // Mirror the filters into the URL so a view can be shared and survives a reload. Unlike
  // router.replace, history.replaceState doesn't make the server render the page again,
  // and Next still keeps useSearchParams in step.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('exam', exam.id);
    url.searchParams.delete('page');
    for (const [k, v] of filterParams(filters)) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    if (url.href !== window.location.href) window.history.replaceState(null, '', url.href);
  }, [exam.id, filters]);

  // The filters an in-flight "select all matching" must still match when it lands.
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const list = useInfiniteQuery({
    queryKey: listKey(exam.id, filters),
    queryFn: fetchPage,
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
  const counts = useQuery({
    queryKey: ['admin', 'questions', exam.id, 'counts'],
    queryFn: ({ signal }) =>
      api.get<{ counts: Partial<Record<Status, number>> }>(`/api/admin/questions?examId=${encodeURIComponent(exam.id)}&view=counts`, { signal }),
  });
  const prefetch = (f: Filters) => {
    void queryClient.prefetchInfiniteQuery({ queryKey: listKey(exam.id, f), queryFn: fetchPage, initialPageParam: null as string | null });
  };

  const rows = useMemo(() => list.data?.pages.flatMap((p) => p.rows) ?? [], [list.data]);
  const total = list.data?.pages[0]?.total ?? null;

  // Where the rows start on the page. Content above them can wrap or grow, so keep it current.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const el = tbodyRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScrollMargin(Math.round(el.getBoundingClientRect().top + window.scrollY)));
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const getItemKey = useCallback((i: number) => rows[i]?.id ?? i, [rows]);
  // Below md the same rows render as cards (CSS only), so only the first guess at their height differs.
  const wide = useMediaQuery('(min-width: 768px)', true);
  const virtualizer = useWindowVirtualizer({ count: rows.length, estimateSize: wide ? estimateRow : estimateCard, overscan: 10, scrollMargin, getItemKey });
  const items = virtualizer.getVirtualItems();
  const margin = virtualizer.options.scrollMargin;
  const padTop = items.length ? items[0].start - margin : 0;
  const padBottom = items.length ? virtualizer.getTotalSize() - (items[items.length - 1].end - margin) : 0;

  // Fetch the next page while the reader is still a screen or so from the end.
  const { fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isPlaceholderData } = list;
  const lastIndex = items.at(-1)?.index ?? -1;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError && !isPlaceholderData && lastIndex >= rows.length - 20) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, isPlaceholderData, lastIndex, rows.length, fetchNextPage]);

  const toggle = useCallback((id: string, on: boolean) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const selectedLoaded = useMemo(() => rows.reduce((n, r) => n + (selected.has(r.id) ? 1 : 0), 0), [rows, selected]);
  const allLoadedSelected = rows.length > 0 && selectedLoaded === rows.length;

  const bulk = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Status }) =>
      api.post<{ updated: number; blocked: string[] }>('/api/admin/questions/status', { ids, status }),
    onMutate: async ({ ids, status }) => {
      const key = listKey(exam.id, filters);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<QuestionListPage, string | null>>(key);
      const changed = new Set(ids);
      // Rows that leave the current status tab go at once; the others show their new status.
      const stays = filters.status === 'all' || filters.status === status;
      queryClient.setQueryData<InfiniteData<QuestionListPage, string | null>>(key, (d) => d && {
        ...d,
        pages: d.pages.map((p) => ({ ...p, rows: p.rows.flatMap((r) => (!changed.has(r.id) ? [r] : stays ? [{ ...r, status }] : [])) })),
      });
      return { key, previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
      toast.error(err instanceof Error ? err.message : 'Could not update the status.');
    },
    onSuccess: (res, { status }) => {
      setSelected(new Set());
      if (res.blocked.length) {
        toast.warning(`${res.updated} updated. ${res.blocked.length} blocked by validation errors: ${res.blocked.slice(0, 3).join(', ')}${res.blocked.length > 3 ? '…' : ''}`);
      } else {
        toast.success(`${res.updated.toLocaleString()} question${res.updated === 1 ? '' : 's'} moved to ${status}`);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'questions', exam.id] }),
  });

  const selectAll = useMutation({
    mutationFn: (f: Filters) => api.get<{ ids: string[] }>(apiUrl(exam.id, f, [['view', 'ids']])),
    onSuccess: ({ ids }, f) => {
      if (f === filtersRef.current) setSelected(new Set(ids));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not select every match.'),
  });

  const countValues = counts.data?.counts;
  const totalAll = countValues ? Object.values(countValues).reduce((a, b) => a + (b ?? 0), 0) : null;
  const refreshing = list.isFetching && isPlaceholderData;
  const filtered = filterParams({ ...filters, sort: 'updated' }).some(([, v]) => v);
  const matchCount = total != null && allLoadedSelected && total > selected.size ? total : null;
  // What the phone's Filters button summarises; status and search stay visible outside it.
  const activeFilters = [filters.skill, filters.type, filters.flagged, filters.sort !== 'updated'].filter(Boolean).length;
  const toggleAllLoaded = (on: boolean) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set());
  const allLoadedState = allLoadedSelected ? true : selectedLoaded > 0 ? 'indeterminate' : false;

  return (
    <div className={cn('space-y-4', selected.size > 0 && 'pb-20 max-md:pb-48')}>
      {/* status tabs */}
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-b">
        {STATUSES.map((s) => {
          const n = s === 'all' ? totalAll : countValues ? countValues[s] ?? 0 : null;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={filters.status === s}
              onClick={() => applyFilters({ status: s })}
              onMouseEnter={() => prefetch({ ...filters, status: s })}
              onFocus={() => prefetch({ ...filters, status: s })}
              className={cn('-mb-px min-h-10 shrink-0 border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors md:min-h-0', filters.status === s ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              {s} <span className="text-xs text-muted-foreground tabular-nums">{n == null ? '·' : n.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {/* one filter row; on phones the filters move into a bottom sheet behind one button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 md:min-w-52">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stem or id…" className="h-9 pr-9 pl-9" aria-label="Search questions" />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); applyFilters({ q: '' }); }}
              className="absolute top-1/2 right-0.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground max-md:size-9"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-9 md:hidden" aria-label={activeFilters ? `Filters, ${activeFilters} active` : 'Filters'}>
              <SlidersHorizontal /> Filters
              {activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-semibold text-primary-foreground tabular-nums">{activeFilters}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-3xl p-0">
            <SheetHeader className="border-b p-5">
              <SheetTitle className="font-heading text-lg">Filters</SheetTitle>
              <SheetDescription>Changes apply as you make them.</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <FilterFields exam={exam} filters={filters} onChange={applyFilters} stacked />
            </div>
            <SheetFooter className="flex-row border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button variant="outline" className="h-11 flex-1" disabled={!activeFilters} onClick={() => applyFilters({ skill: '', type: '', flagged: false, sort: 'updated' })}>Reset</Button>
              <SheetClose asChild>
                <Button variant="premium" className="h-11 flex-1">{total == null ? 'Done' : `Show ${total.toLocaleString()}`}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <div className="hidden md:contents">
          <FilterFields exam={exam} filters={filters} onChange={applyFilters} />
        </div>
        <div className="flex gap-2 max-md:w-full md:ml-auto">
          <Button asChild variant="outline" size="sm" className="max-md:flex-1"><a href={`/api/admin/export?examId=${encodeURIComponent(exam.id)}&status=${filters.status}`}><Download /> Export</a></Button>
          <Button asChild variant="premium" size="sm" className="max-md:flex-1"><Link href={`/admin/questions/new?exam=${exam.id}`}><Plus /> New question</Link></Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          {total != null && (
            <span>{total.toLocaleString()} question{total === 1 ? '' : 's'}{filters.q ? ` matching “${filters.q}”` : ''}</span>
          )}
          {list.isFetching && <Loader2 className="size-3.5 animate-spin" aria-label="Loading" />}
        </div>
        {/* The cards have no header row, so the select-all box lives here on phones. */}
        <label className="flex min-h-10 shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground md:hidden">
          <Checkbox checked={allLoadedState} onCheckedChange={(v) => toggleAllLoaded(v === true)} disabled={!rows.length} />
          Select all
        </label>
      </div>

      {/* table: rows outside the viewport are replaced by two spacer rows. Below md the table,
          its body and rows turn into plain blocks, so each row reads as a card. */}
      <div className="overflow-x-auto glass rounded-3xl [overflow-anchor:none]">
        <table className="w-full table-fixed text-left text-sm max-md:block md:min-w-[60rem]" aria-rowcount={(total ?? rows.length) + 1}>
          <colgroup className="max-md:hidden">
            <col className="w-10" />
            <col />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-[4.5rem]" />
            <col className="w-24" />
            <col className="w-[5.5rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-36" />
          </colgroup>
          <thead className="border-b bg-wash text-xs text-muted-foreground max-md:hidden">
            <tr aria-rowindex={1}>
              <th className="px-3 py-2.5">
                <Checkbox checked={allLoadedState} onCheckedChange={(v) => toggleAllLoaded(v === true)} disabled={!rows.length} aria-label="Select all loaded questions" />
              </th>
              <th className="px-3 py-2.5 font-medium">Question</th>
              <th className="px-3 py-2.5 font-medium">Skill</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Level</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Answered</th>
              <th className="px-3 py-2.5 text-right font-medium">% correct</th>
              <th className="px-3 py-2.5 font-medium">Signals</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef} className={cn('transition-opacity max-md:block', refreshing && 'opacity-60')}>
            {list.isPending ? (
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-b max-md:block"><td colSpan={9} className="px-3 py-3 max-md:block"><Skeleton className="h-10 w-full max-md:h-20" /></td></tr>
              ))
            ) : (
              <>
                {padTop > 0 && <tr aria-hidden className="max-md:block" style={{ height: padTop }}><td colSpan={9} /></tr>}
                {items.map((item) => {
                  const row = rows[item.index];
                  return row ? (
                    <QuestionRow
                      key={row.id}
                      row={row}
                      index={item.index}
                      examId={exam.id}
                      selected={selected.has(row.id)}
                      onToggle={toggle}
                      measure={virtualizer.measureElement}
                    />
                  ) : null;
                })}
                {padBottom > 0 && <tr aria-hidden className="max-md:block" style={{ height: padBottom }}><td colSpan={9} /></tr>}
                <tr className="max-md:block">
                  <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground max-md:block">
                    {list.isError && (isFetchNextPageError || !rows.length) ? (
                      <>
                        Couldn&apos;t load {rows.length ? 'more questions' : 'the questions'}.{' '}
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void (rows.length ? fetchNextPage() : list.refetch())}>Try again</Button>
                      </>
                    ) : rows.length === 0 ? (
                      <>
                        No questions match these filters.{' '}
                        {filtered && (
                          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setSearch(''); applyFilters({ ...NO_FILTERS, sort: filters.sort }); }}>
                            Clear filters
                          </Button>
                        )}
                      </>
                    ) : isFetchingNextPage ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading more…</span>
                    ) : hasNextPage ? (
                      <Button variant="ghost" size="sm" onClick={() => void fetchNextPage()}>Load more</Button>
                    ) : (
                      `That's all ${rows.length.toLocaleString()}.`
                    )}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* bulk actions float over the list, so selecting never shifts the rows; on phones they
          span the width, clear of the home indicator, with the four actions in a 2×2 grid */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border bg-popover/95 px-3 py-2 text-sm shadow-lg backdrop-blur animate-pop max-md:inset-x-3 max-md:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-md:w-auto max-md:max-w-none max-md:justify-start max-md:p-3"
        >
          <span className="font-medium tabular-nums">{selected.size.toLocaleString()} selected</span>
          {matchCount != null && (
            <Button size="xs" variant="link" disabled={selectAll.isPending} onClick={() => selectAll.mutate(filters)}>
              {selectAll.isPending ? 'Selecting…' : `Select all ${matchCount.toLocaleString()} matching`}
            </Button>
          )}
          <Button size="xs" variant="ghost" className="max-md:ml-auto md:order-last" onClick={() => setSelected(new Set())}>Clear</Button>
          <span className="mx-1 h-4 w-px bg-border max-md:hidden" aria-hidden />
          <div className="contents max-md:grid max-md:w-full max-md:grid-cols-2 max-md:gap-2">
            {BULK_ACTIONS.map((a) => (
              <Button key={a.status} size="xs" variant={a.status === 'published' ? 'default' : 'outline'} disabled={bulk.isPending} onClick={() => bulk.mutate({ ids: [...selected], status: a.status })}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  row: QuestionListRow;
  index: number;
  examId: string;
  selected: boolean;
  onToggle: (id: string, on: boolean) => void;
  measure: (el: Element | null) => void;
}

/** Memoised, so ticking one box or loading another page leaves the other rows alone. */
const QuestionRow = memo(function QuestionRow({ row, index, examId, selected, onToggle, measure }: RowProps) {
  const router = useRouter();
  const href = `/admin/questions/${encodeURIComponent(row.id)}?exam=${examId}`;
  const stats = row.stats;
  const pct = stats && stats.p != null && stats.n >= 5 ? `${Math.round(stats.p * 100)}%` : null;
  // Below md the row is a flex card: checkbox, then the question with its key facts under it.
  // The other cells would repeat those facts, so they are hidden there.
  const cell = 'px-3 py-2.5 max-md:hidden';
  return (
    <tr ref={measure} data-index={index} aria-rowindex={index + 2} className={cn('border-b transition-colors hover:bg-wash max-md:flex max-md:items-start', selected && 'bg-primary/[0.04]')}>
      <td className="px-3 py-2.5 max-md:shrink-0 max-md:py-3.5 max-md:pl-4">
        <Checkbox checked={selected} onCheckedChange={(v) => onToggle(row.id, v === true)} aria-label={`Select ${row.id}`} className="max-md:after:-inset-y-3" />
      </td>
      <td className="px-3 py-2.5 max-md:min-w-0 max-md:flex-1 max-md:py-3 max-md:pr-4 max-md:pl-1">
        {/* Rows scroll in and out of view constantly, so prefetch on hover rather than on sight. */}
        <Link href={href} prefetch={false} onMouseEnter={() => router.prefetch(href)} className="group block min-w-0">
          <span className="block truncate font-mono text-[0.7rem] text-muted-foreground">
            {row.id}{row.version > 1 ? ` · v${row.version}` : ''}{row.pool === 'imported' ? ' · imported' : ''}
          </span>
          <span className="line-clamp-2 group-hover:text-primary">{row.preview}</span>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground md:hidden">
          <StatusPill status={row.status} />
          <span>{TYPE_LABEL[row.type]}</span>
          <Level difficulty={row.difficulty} />
          <span className="tabular-nums">{(stats?.n ?? 0).toLocaleString()} answered{pct ? ` · ${pct} correct` : ''}</span>
          {/* Tooltips need a hover, so phones get the labels alone; the editor explains each flag. */}
          <Signals row={row} />
        </div>
      </td>
      <td className={cn(cell, 'text-xs text-muted-foreground')}><span className="line-clamp-2" title={row.skillName}>{row.skillName}</span></td>
      <td className={cn(cell, 'text-xs')}>{TYPE_LABEL[row.type]}</td>
      <td className={cell}><Level difficulty={row.difficulty} /></td>
      <td className={cell}><StatusPill status={row.status} /></td>
      <td className={cn(cell, 'text-right tabular-nums')}>{stats?.n ?? 0}</td>
      <td className={cn(cell, 'text-right tabular-nums')}>{pct ?? '—'}</td>
      <td className={cell}>
        <span className="flex flex-wrap items-center gap-1"><Signals row={row} hints /></span>
      </td>
    </tr>
  );
});

function StatusPill({ status }: { status: Status }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-[0.7rem] font-semibold capitalize', STATUS_STYLE[status])}>{status}</span>;
}

function Level({ difficulty }: { difficulty: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Difficulty ${difficulty} of 4`}>
      {[1, 2, 3, 4].map((l) => <span key={l} className={cn('h-2.5 w-1.5 rounded-sm', l <= difficulty ? 'bg-primary' : 'bg-secondary')} />)}
    </span>
  );
}

/** Open reports and statistical flags; with `hints`, each flag explains itself on hover. */
function Signals({ row, hints = false }: { row: QuestionListRow; hints?: boolean }) {
  return (
    <>
      {row.openReports > 0 && <Badge variant="outline" className="border-primary/40 text-primary">{row.openReports} report{row.openReports === 1 ? '' : 's'}</Badge>}
      {row.stats?.flags.map((f) => {
        const pill = (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium', FLAG_INFO[f].tone === 'bad' ? 'bg-destructive/10 text-destructive' : 'bg-banana/25 text-cocoa dark:text-banana')}>
            <AlertTriangle className="size-3" />{FLAG_INFO[f].label}
          </span>
        );
        return hints ? (
          <Tooltip key={f}>
            <TooltipTrigger asChild>{pill}</TooltipTrigger>
            <TooltipContent>{FLAG_INFO[f].hint}</TooltipContent>
          </Tooltip>
        ) : <Fragment key={f}>{pill}</Fragment>;
      })}
    </>
  );
}

/** Skill, type, sort and "needs attention": inline on wider screens, stacked in the phone's filter sheet. */
function FilterFields({ exam, filters, onChange, stacked = false }: { exam: Exam; filters: Filters; onChange: (patch: Partial<Filters>) => void; stacked?: boolean }) {
  // The sheet sits in a portal outside the admin's touch-size rule, so it sizes its own controls.
  const trigger = stacked ? 'min-h-11 w-full' : '';
  const field = (label: string, control: React.ReactNode) => (stacked ? <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{control}</div> : control);
  return (
    <>
      {field('Skill', (
        <Select value={filters.skill || 'all'} onValueChange={(v) => onChange({ skill: v === 'all' ? '' : v })}>
          <SelectTrigger className={cn('h-9 w-48', trigger)} aria-label="Skill"><SelectValue placeholder="All skills" /></SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            <SelectItem value="all">All skills</SelectItem>
            {exam.domains.map((d) => exam.skills.filter((s) => s.domain === d.id).map((s) => <SelectItem key={s.id} value={s.id}>D{d.id} · {s.name}</SelectItem>))}
          </SelectContent>
        </Select>
      ))}
      {field('Type', (
        <Select value={filters.type || 'all'} onValueChange={(v) => onChange({ type: v === 'all' ? '' : v })}>
          <SelectTrigger className={cn('h-9 w-36', trigger)} aria-label="Type"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {field('Sort', (
        <Select value={filters.sort} onValueChange={(v) => onChange({ sort: v as QuestionSort })}>
          <SelectTrigger className={cn('h-9 w-40', trigger)} aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      <label className={cn('flex items-center gap-2 rounded-lg border px-3 text-sm', stacked ? 'min-h-11 flex-row-reverse justify-between' : 'h-9')}>
        <Switch checked={filters.flagged} onCheckedChange={(v) => onChange({ flagged: v })} /> Needs attention
      </label>
    </>
  );
}
