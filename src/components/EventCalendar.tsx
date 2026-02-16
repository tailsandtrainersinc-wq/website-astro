import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

/* ── Types ─────────────────────────────────────────────────── */

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  tags?: string[];
  parentEvent?: string;
  body?: string;
}

interface EventCalendarProps {
  events: CalendarEvent[];
}

/* ── Tag colors ────────────────────────────────────────────── */

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cons:            { bg: "bg-violet-500/15", text: "text-violet-300", border: "border-violet-500/30" },
  furry:           { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
  kink:            { bg: "bg-fuchsia-500/15", text: "text-fuchsia-300", border: "border-fuchsia-500/30" },
  leather:         { bg: "bg-orange-500/15", text: "text-orange-300", border: "border-orange-500/30" },
  education:       { bg: "bg-sky-500/15", text: "text-sky-300", border: "border-sky-500/30" },
  community:       { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  social:          { bg: "bg-teal-500/15", text: "text-teal-300", border: "border-teal-500/30" },
  pride:           { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/30" },
  "family-friendly": { bg: "bg-lime-500/15", text: "text-lime-300", border: "border-lime-500/30" },
  charity:         { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/30" },
  art:             { bg: "bg-indigo-500/15", text: "text-indigo-300", border: "border-indigo-500/30" },
  workshop:        { bg: "bg-sky-500/15", text: "text-sky-300", border: "border-sky-500/30" },
  dance:           { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/30" },
  nightlife:       { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/30" },
  fursuit:         { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
};

const DEFAULT_TAG = { bg: "bg-taupe-dark/15", text: "text-taupe", border: "border-taupe-dark/30" };

function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? DEFAULT_TAG;
}

/* ── Bar colors for multi-day spanning events ─────────────── */

const BAR_COLORS = [
  { bg: "bg-brass/25", hover: "hover:bg-brass/35", active: "bg-brass/40", text: "text-cream", border: "border-brass/40" },
  { bg: "bg-violet-500/25", hover: "hover:bg-violet-500/35", active: "bg-violet-500/40", text: "text-violet-100", border: "border-violet-500/40" },
  { bg: "bg-sky-500/25", hover: "hover:bg-sky-500/35", active: "bg-sky-500/40", text: "text-sky-100", border: "border-sky-500/40" },
  { bg: "bg-emerald-500/25", hover: "hover:bg-emerald-500/35", active: "bg-emerald-500/40", text: "text-emerald-100", border: "border-emerald-500/40" },
  { bg: "bg-amber-500/25", hover: "hover:bg-amber-500/35", active: "bg-amber-500/40", text: "text-amber-100", border: "border-amber-500/40" },
  { bg: "bg-fuchsia-500/25", hover: "hover:bg-fuchsia-500/35", active: "bg-fuchsia-500/40", text: "text-fuchsia-100", border: "border-fuchsia-500/40" },
];

/* ── Date helpers ──────────────────────────────────────────── */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--)
    days.push(new Date(year, month - 1, prevMonthLast - i));
  for (let d = 1; d <= daysInMonth; d++)
    days.push(new Date(year, month, d));
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++)
    days.push(new Date(year, month + 1, d));
  return days;
}

function dk(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isCurMonth(d: Date, y: number, m: number) {
  return d.getFullYear() === y && d.getMonth() === m;
}

function isMultiDay(ev: CalendarEvent) {
  return ev.endDate && ev.endDate !== ev.date;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

/* ── Bar segment computation ──────────────────────────────── */

interface BarSegment {
  event: CalendarEvent;
  startCol: number;
  span: number;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
  colorIdx: number;
}

function computeBars(
  weekDays: Date[],
  topEvents: CalendarEvent[],
  colorMap: Map<string, number>,
): { bars: BarSegment[]; laneCount: number } {
  const wStart = dk(weekDays[0]);
  const wEnd = dk(weekDays[6]);
  const dateKeys = weekDays.map(dk);

  const multi = topEvents.filter((ev) => {
    if (!isMultiDay(ev)) return false;
    const end = ev.endDate!;
    return ev.date <= wEnd && end >= wStart;
  });

  multi.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (b.endDate ?? b.date).localeCompare(a.endDate ?? a.date);
  });

  const bars: BarSegment[] = [];
  const lanes: (string | undefined)[][] = [];

  for (const ev of multi) {
    const evEnd = ev.endDate ?? ev.date;
    let sc = -1, ec = -1;
    for (let c = 0; c < 7; c++) {
      if (dateKeys[c] >= ev.date && dateKeys[c] <= evEnd) {
        if (sc === -1) sc = c;
        ec = c;
      }
    }
    if (sc === -1) continue;

    let lane = 0;
    while (true) {
      if (!lanes[lane]) lanes[lane] = [];
      let free = true;
      for (let c = sc; c <= ec; c++) {
        if (lanes[lane][c]) { free = false; break; }
      }
      if (free) break;
      lane++;
    }
    if (!lanes[lane]) lanes[lane] = [];
    for (let c = sc; c <= ec; c++) lanes[lane][c] = ev.id;

    bars.push({
      event: ev,
      startCol: sc,
      span: ec - sc + 1,
      lane,
      isStart: ev.date >= wStart,
      isEnd: evEnd <= wEnd,
      colorIdx: colorMap.get(ev.id) ?? 0,
    });
  }

  return { bars, laneCount: lanes.length };
}

/* ── Sub-event helpers ────────────────────────────────────── */

function allChildren(events: CalendarEvent[], parentId: string): CalendarEvent[] {
  return events.filter((e) => e.parentEvent === parentId);
}

/* ── Popover ──────────────────────────────────────────────── */

interface PopoverProps {
  parent: CalendarEvent;
  children: CalendarEvent[];
  onSelect: (ev: CalendarEvent) => void;
  onClose: () => void;
}

function EventPopover({ parent, children, onSelect, onClose }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 top-full mt-1 z-40 bg-leather-raised/95 backdrop-blur-sm border border-brass/20 rounded-xl shadow-2xl overflow-hidden min-w-[200px] max-w-[280px]"
    >
      <button type="button" onClick={() => onSelect(parent)}
        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-brass hover:bg-leather-glow/60 transition-colors border-b border-brass/15">
        {parent.title}
        <span className="block text-[10px] text-taupe-dark font-normal mt-0.5">View details</span>
      </button>
      <div className="py-1">
        {children.map((ch) => (
          <button key={ch.id} type="button" onClick={() => onSelect(ch)}
            className="w-full text-left px-4 py-2 text-xs text-taupe hover:bg-leather-glow/60 transition-colors flex items-baseline gap-2">
            <span className="truncate">{ch.title}</span>
            {ch.startTime && <span className="text-[10px] text-taupe-dark shrink-0">{ch.startTime}</span>}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Tag badge ────────────────────────────────────────────── */

function TagBadge({ tag }: { tag: string }) {
  const s = tagStyle(tag);
  return (
    <span className={`px-2 py-0.5 text-[11px] rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {tag}
    </span>
  );
}

/* ── Constants ────────────────────────────────────────────── */

const BAR_H = 24;
const BAR_GAP = 2;
const DATE_ROW_H = 28;

/* ── Desktop calendar grid ────────────────────────────────── */

function DesktopCalendar({
  year, month, days, weeks, weekData, events, now,
  openPopover, setOpenPopover,
  onEventClick, onPopoverSelect,
}: {
  year: number; month: number;
  days: Date[];
  weeks: Date[][];
  weekData: { bars: BarSegment[]; laneCount: number; singleByCol: CalendarEvent[][]; dateKeys: string[] }[];
  events: CalendarEvent[];
  now: Date;
  openPopover: string | null;
  setOpenPopover: (v: string | null) => void;
  onEventClick: (ev: CalendarEvent, popKey: string) => void;
  onPopoverSelect: (ev: CalendarEvent) => void;
}) {
  return (
    <div className="hidden md:block rounded-2xl overflow-hidden border border-leather-raised/80 shadow-xl shadow-black/20">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 bg-leather-raised" style={{ gap: "1px" }}>
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-leather py-2.5 text-center text-xs font-semibold text-taupe-dark uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((weekDays, w) => {
        const { bars, laneCount, singleByCol } = weekData[w];
        const barAreaH = laneCount > 0 ? laneCount * (BAR_H + BAR_GAP) + BAR_GAP : 0;

        return (
          <div key={w} className="relative">
            {/* Day cells */}
            <div className="grid grid-cols-7 bg-leather-raised/60" style={{ gap: "1px" }}>
              {weekDays.map((d, c) => {
                const isThisMonth = isCurMonth(d, year, month);
                const isToday = isThisMonth && d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

                return (
                  <div key={c}
                    className={`bg-leather/90 flex flex-col transition-colors ${
                      isThisMonth ? "" : "opacity-40"
                    }`}
                    style={{ minHeight: "110px", paddingTop: `${DATE_ROW_H + barAreaH + 6}px` }}
                  >
                    <div className="flex flex-col gap-1 px-1.5 pb-1.5 flex-1 overflow-visible">
                      {singleByCol[c].map((ev) => {
                        const popKey = `${w}-${c}-${ev.id}`;
                        const kids = allChildren(events, ev.id);
                        const hasKids = kids.length > 0;
                        const isOpen = openPopover === popKey;

                        return (
                          <div key={ev.id} className="relative">
                            <button type="button"
                              onClick={() => onEventClick(ev, popKey)}
                              className={`w-full text-left text-[11px] leading-tight px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                                isOpen
                                  ? "bg-brass/30 text-cream shadow-sm"
                                  : "bg-brass/15 text-brass hover:bg-brass/25 hover:shadow-sm"
                              }`}
                              title={ev.title}>
                              <span className="truncate font-medium">{ev.title}</span>
                              {hasKids && (
                                <svg className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>
                            <AnimatePresence>
                              {hasKids && isOpen && (
                                <EventPopover parent={ev} children={kids}
                                  onSelect={onPopoverSelect} onClose={() => setOpenPopover(null)} />
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Date numbers */}
            <div className="absolute top-0 left-0 right-0 grid grid-cols-7 pointer-events-none" style={{ gap: "1px" }}>
              {weekDays.map((d, c) => {
                const isThisMonth = isCurMonth(d, year, month);
                const isToday = isThisMonth && d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                return (
                  <div key={c} className={`p-1.5 ${isThisMonth ? "" : "opacity-40"}`}>
                    <span className={`text-xs font-semibold inline-flex items-center justify-center w-7 h-7 ${
                      isToday
                        ? "bg-brass text-leather-deep rounded-full shadow-lg shadow-brass/30"
                        : isThisMonth ? "text-taupe" : "text-taupe-dark"
                    }`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Spanning bars */}
            {bars.length > 0 && (
              <div className="absolute left-0 right-0 grid grid-cols-7 pointer-events-none"
                style={{ top: `${DATE_ROW_H + 4}px`, gap: "1px" }}>
                {bars.map((bar) => {
                  const popKey = `bar-${w}-${bar.event.id}`;
                  const kids = allChildren(events, bar.event.id);
                  const hasKids = kids.length > 0;
                  const isOpen = openPopover === popKey;
                  const color = BAR_COLORS[bar.colorIdx % BAR_COLORS.length];

                  return (
                    <div key={bar.event.id + "-" + bar.lane}
                      className="relative pointer-events-auto"
                      style={{
                        gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                        marginTop: `${bar.lane * (BAR_H + BAR_GAP)}px`,
                        height: `${BAR_H}px`,
                        paddingLeft: bar.isStart ? "3px" : "0",
                        paddingRight: bar.isEnd ? "3px" : "0",
                      }}>
                      <button type="button"
                        onClick={() => onEventClick(bar.event, popKey)}
                        className={`w-full h-full text-left text-[11px] font-semibold px-2.5 truncate flex items-center gap-1 transition-all border-t border-b ${
                          isOpen
                            ? `${color.active} ${color.text} ${color.border} shadow-md`
                            : `${color.bg} ${color.text} ${color.hover} ${color.border}`
                        } ${bar.isStart ? "rounded-l-lg border-l" : ""} ${bar.isEnd ? "rounded-r-lg border-r" : ""}`}
                        title={bar.event.title}>
                        {bar.isStart && <span className="truncate">{bar.event.title}</span>}
                        {bar.isStart && hasKids && (
                          <svg className={`w-3 h-3 shrink-0 transition-transform opacity-60 ${isOpen ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                      <AnimatePresence>
                        {hasKids && isOpen && (
                          <EventPopover parent={bar.event} children={kids}
                            onSelect={onPopoverSelect} onClose={() => setOpenPopover(null)} />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile agenda view ───────────────────────────────────── */

function MobileAgenda({
  year, month, events, topEvents,
  onEventClick,
}: {
  year: number; month: number;
  events: CalendarEvent[];
  topEvents: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
}) {
  // Get all top-level events in this month, sorted by date
  const monthEvents = useMemo(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    return topEvents
      .filter((ev) => {
        const start = ev.date.slice(0, 7);
        const end = (ev.endDate ?? ev.date).slice(0, 7);
        return start <= monthStr && end >= monthStr;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [year, month, topEvents]);

  if (monthEvents.length === 0) {
    return (
      <div className="md:hidden py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-leather-raised/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-taupe-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-taupe-dark text-sm">No events this month</p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {monthEvents.map((ev) => {
        const kids = allChildren(events, ev.id);
        const multi = isMultiDay(ev);

        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-leather-raised/80 bg-leather/80 overflow-hidden"
          >
            {/* Main event card */}
            <button
              type="button"
              onClick={() => onEventClick(ev)}
              className="w-full text-left p-4 hover:bg-leather-raised/40 active:bg-leather-raised/60 transition-colors"
            >
              {/* Date badge */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 text-center">
                  <div className="text-[10px] font-semibold text-taupe-dark uppercase">
                    {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-xl font-bold text-cream leading-tight">
                    {new Date(ev.date + "T12:00:00").getDate()}
                  </div>
                  {multi && (
                    <div className="text-[9px] text-taupe-dark mt-0.5">
                      – {new Date(ev.endDate! + "T12:00:00").getDate()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-cream text-sm leading-snug mb-1">{ev.title}</h3>
                  <p className="text-xs text-taupe line-clamp-2 mb-2">{ev.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-taupe-dark">
                    {ev.startTime && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}
                      </span>
                    )}
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate max-w-[140px]">{ev.location}</span>
                      </span>
                    )}
                  </div>
                  {ev.tags && ev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ev.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
                    </div>
                  )}
                </div>
                <svg className="w-4 h-4 text-taupe-dark shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Sub-events */}
            {kids.length > 0 && (
              <div className="border-t border-leather-raised/60 bg-leather-deep/40">
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-taupe-dark uppercase tracking-wider mb-1">Sub-events</p>
                </div>
                {kids.map((child) => (
                  <button key={child.id} type="button"
                    onClick={() => onEventClick(child)}
                    className="w-full text-left px-4 py-2.5 hover:bg-leather-raised/40 active:bg-leather-raised/60 transition-colors flex items-center gap-3 border-t border-leather-raised/30"
                  >
                    <div className="w-1 h-8 rounded-full bg-brass/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-cream truncate">{child.title}</p>
                      <p className="text-[11px] text-taupe-dark">
                        {child.startTime && <>{child.startTime}{child.endTime ? ` – ${child.endTime}` : ""}</>}
                        {child.startTime && child.date && " · "}
                        {formatDateShort(child.date)}
                      </p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-taupe-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Event detail modal ───────────────────────────────────── */

const SWIPE_THRESHOLD = 80;

function EventModal({
  event, events, onClose, onNavigate,
}: {
  event: CalendarEvent;
  events: CalendarEvent[];
  onClose: () => void;
  onNavigate: (ev: CalendarEvent) => void;
}) {
  const children = events.filter((e) => e.parentEvent === event.id);
  const parent = event.parentEvent ? events.find((e) => e.id === event.parentEvent) : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Scroll to top when navigating between events
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [event.id]);

  // Swipe-to-dismiss on mobile
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only initiate drag if the scrollable content is at the top
    if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    // Only allow dragging downward
    if (dy < 0) {
      dragCurrentY.current = 0;
      if (sheetRef.current) sheetRef.current.style.transform = "";
      return;
    }
    dragCurrentY.current = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform = "";
    }
    if (dragCurrentY.current > SWIPE_THRESHOLD) {
      onClose();
    }
    dragCurrentY.current = 0;
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="event-modal-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        ref={sheetRef}
        className="relative w-full md:max-w-lg md:mx-4 bg-leather md:rounded-2xl rounded-t-2xl border-t md:border border-brass/25 shadow-2xl flex flex-col"
        style={{ maxHeight: "min(92vh, 100dvh - env(safe-area-inset-top, 0px))" }}
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle (mobile) — swipe down to dismiss */}
        <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-taupe-dark" />
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="overflow-y-auto overscroll-contain flex-1 min-h-0">
          <div className="p-5 md:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))] md:pb-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                {parent && (
                  <button type="button" onClick={() => onNavigate(parent)}
                    className="text-xs text-brass hover:text-brass-bright active:text-brass-bright transition-colors mb-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {parent.title}
                  </button>
                )}
                <h3 id="event-modal-title" className="text-xl md:text-2xl font-bold text-cream leading-tight">
                  {event.title}
                </h3>
              </div>
              <button type="button" onClick={onClose}
                className="shrink-0 p-2 -mr-2 -mt-1 rounded-lg text-taupe hover:text-cream active:bg-leather-glow hover:bg-leather-raised transition-colors"
                aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {event.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
              </div>
            )}

            <p className="text-taupe text-sm md:text-base mb-5 leading-relaxed">{event.description}</p>

            {/* Meta details */}
            <div className="flex flex-col gap-3 p-4 bg-leather-raised/50 rounded-xl mb-5">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-taupe-dark mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-sm text-taupe">
                  {formatDate(event.date)}
                  {event.endDate && event.endDate !== event.date && (
                    <><br className="md:hidden" /><span className="hidden md:inline"> – </span><span className="md:hidden">– </span>{formatDate(event.endDate)}</>
                  )}
                </div>
              </div>
              {(event.startTime || event.endTime) && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-taupe-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-taupe">
                    {[event.startTime, event.endTime].filter(Boolean).join(" – ")}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-taupe-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-taupe">{event.location}</span>
                </div>
              )}
            </div>

            {/* Body */}
            {event.body && (
              <div className="prose prose-invert prose-sm max-w-none text-taupe border-t border-leather-raised pt-5">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} className="text-brass hover:text-brass-bright underline">{children}</a>
                    ),
                  }}
                >
                  {event.body}
                </ReactMarkdown>
              </div>
            )}

            {/* Sub-events list */}
            {children.length > 0 && (
              <div className="border-t border-leather-raised pt-5 mt-5">
                <h4 className="text-xs font-semibold text-taupe-dark uppercase tracking-wider mb-3">
                  Sub-events ({children.length})
                </h4>
                <div className="space-y-1">
                  {children.map((child) => (
                    <button key={child.id} type="button" onClick={() => onNavigate(child)}
                      className="w-full text-left p-3 rounded-lg hover:bg-leather-raised/60 active:bg-leather-raised/80 transition-colors flex items-center gap-3 group">
                      <div className="w-1 h-8 rounded-full bg-brass/40 group-hover:bg-brass-bright/60 transition-colors shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cream">{child.title}</p>
                        <p className="text-xs text-taupe-dark">
                          {formatDateShort(child.date)}
                          {child.startTime && ` · ${child.startTime}`}
                          {child.endTime && ` – ${child.endTime}`}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-taupe-dark group-hover:text-taupe transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export default function EventCalendar({ events }: EventCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const topEvents = useMemo(() => events.filter((e) => !e.parentEvent), [events]);

  // Assign stable colors to multi-day events
  const colorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const ev of topEvents) {
      if (isMultiDay(ev)) {
        map.set(ev.id, idx);
        idx++;
      }
    }
    return map;
  }, [topEvents]);

  const weeks = useMemo(() => {
    const w: Date[][] = [];
    for (let i = 0; i < 6; i++) w.push(days.slice(i * 7, i * 7 + 7));
    return w;
  }, [days]);

  const weekData = useMemo(() => weeks.map((weekDays) => {
    const { bars, laneCount } = computeBars(weekDays, topEvents, colorMap);
    const dateKeys = weekDays.map(dk);
    const singleByCol: CalendarEvent[][] = Array.from({ length: 7 }, () => []);
    for (const ev of topEvents) {
      if (isMultiDay(ev)) continue;
      for (let c = 0; c < 7; c++) {
        if (dateKeys[c] === ev.date) singleByCol[c].push(ev);
      }
    }
    return { bars, laneCount, singleByCol, dateKeys };
  }), [weeks, topEvents, colorMap]);

  const goPrev = useCallback(() => {
    setOpenPopover(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }, [month]);

  const goNext = useCallback(() => {
    setOpenPopover(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }, [month]);

  const closeModal = useCallback(() => setSelectedEvent(null), []);

  const handleDesktopEventClick = useCallback((ev: CalendarEvent, popKey: string) => {
    const kids = allChildren(events, ev.id);
    if (kids.length > 0) {
      setOpenPopover((prev) => (prev === popKey ? null : popKey));
    } else {
      setOpenPopover(null);
      setSelectedEvent(ev);
    }
  }, [events]);

  const handlePopoverSelect = useCallback((ev: CalendarEvent) => {
    setOpenPopover(null);
    setSelectedEvent(ev);
  }, []);

  const handleMobileEventClick = useCallback((ev: CalendarEvent) => {
    setSelectedEvent(ev);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openPopover) setOpenPopover(null);
        else closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal, openPopover]);

  return (
    <div className="event-calendar">
      {/* Month header */}
      <header className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-cream">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={goPrev}
            className="p-2.5 rounded-xl text-taupe hover:text-cream hover:bg-leather-raised/80 transition-colors"
            aria-label="Previous month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button type="button" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setOpenPopover(null); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-taupe hover:text-cream hover:bg-leather-raised/80 transition-colors hidden md:block"
          >
            Today
          </button>
          <button type="button" onClick={goNext}
            className="p-2.5 rounded-xl text-taupe hover:text-cream hover:bg-leather-raised/80 transition-colors"
            aria-label="Next month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Desktop: calendar grid */}
      <DesktopCalendar
        year={year} month={month} days={days} weeks={weeks} weekData={weekData}
        events={events} now={now}
        openPopover={openPopover} setOpenPopover={setOpenPopover}
        onEventClick={handleDesktopEventClick} onPopoverSelect={handlePopoverSelect}
      />

      {/* Mobile: agenda list */}
      <MobileAgenda
        year={year} month={month}
        events={events} topEvents={topEvents}
        onEventClick={handleMobileEventClick}
      />

      {/* Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            events={events}
            onClose={closeModal}
            onNavigate={setSelectedEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
