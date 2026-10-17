import { ChartNoAxesColumnIncreasing, Compass, House, MessagesSquare, Route, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** other path prefixes that should light this item up */
  match?: string[];
  badge?: string;
}

/**
 * The whole app hangs off five destinations. Everything else (saved
 * questions, certificates, settings, admin) lives one level down, so the
 * top level never grows past what fits on a phone's tab bar.
 */
export const APP_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: House },
  { href: '/planner', label: 'Plan', icon: Route },
  { href: '/explore', label: 'Explore', icon: Compass, match: ['/exams'] },
  { href: '/interviews', label: 'Interviews', icon: MessagesSquare, badge: 'AI' },
  { href: '/progress', label: 'Progress', icon: ChartNoAxesColumnIncreasing, match: ['/attempt'] },
];

// Visitors get a single page: these jump to its sections. Explore, Interviews and
// Pricing are app pages for signed-in people, and send visitors back here.
export const MARKETING_NAV = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#catalogue', label: 'Exams' },
  { href: '/#plans', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export function isActive(item: Pick<NavItem, 'href' | 'match'>, pathname: string) {
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
