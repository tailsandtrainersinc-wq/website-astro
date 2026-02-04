import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  body?: string;
}

interface EventCalendarProps {
  events: CalendarEvent[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const days: Date[] = [];

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLast - i));
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  // Next month padding to complete 6 rows
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }
  return days;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isCurrentMonth(d: Date, year: number, month: number): boolean {
  return d.getFullYear() === year && d.getMonth() === month;
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const days = getDaysInMonth(year, month);
  const monthLabel = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const key = ev.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const goPrev = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const goNext = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  const closeModal = useCallback(() => setSelectedEvent(null), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeModal]);

  return (
    <div className="event-calendar">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-zinc-50">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-zinc-900/80 py-2 text-center text-sm font-medium text-zinc-400"
          >
            {day}
          </div>
        ))}
        {days.map((d, i) => {
          const key = dateKey(d);
          const dayEvents = eventsByDate[key] ?? [];
          const isThisMonth = isCurrentMonth(d, year, month);
          const isToday =
            isThisMonth &&
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();

          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 bg-zinc-900/80 flex flex-col ${
                isThisMonth ? "text-zinc-100" : "text-zinc-600"
              }`}
            >
              <span
                className={`text-sm font-medium mb-1 ${
                  isToday
                    ? "inline-flex items-center justify-center bg-rose-500 text-white w-7 h-7 rounded-full"
                    : ""
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-1 flex-1 overflow-auto">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedEvent(ev)}
                    className="text-left text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition-colors truncate"
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 id="event-modal-title" className="text-2xl font-bold text-zinc-50 pr-8">
                    {selectedEvent.title}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="shrink-0 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-zinc-400 mb-4">{selectedEvent.description}</p>

                <dl className="space-y-2 text-sm mb-6">
                  <div className="flex gap-2">
                    <dt className="text-zinc-500 shrink-0">Date</dt>
                    <dd className="text-zinc-300">
                      {new Date(selectedEvent.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  {(selectedEvent.startTime || selectedEvent.endTime) && (
                    <div className="flex gap-2">
                      <dt className="text-zinc-500 shrink-0">Time</dt>
                      <dd className="text-zinc-300">
                        {[selectedEvent.startTime, selectedEvent.endTime].filter(Boolean).join(" – ")}
                      </dd>
                    </div>
                  )}
                  {selectedEvent.location && (
                    <div className="flex gap-2">
                      <dt className="text-zinc-500 shrink-0">Location</dt>
                      <dd className="text-zinc-300">{selectedEvent.location}</dd>
                    </div>
                  )}
                </dl>

                {selectedEvent.body && (
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 border-t border-zinc-800 pt-4">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} className="text-rose-400 hover:text-rose-300 underline">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {selectedEvent.body}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
