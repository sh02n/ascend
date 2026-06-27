import type { SignalResponse } from "../types";
import { useEffect, useMemo, useState } from "react";

interface TimelineProps {
  events: SignalResponse["timeline"];
}

const TIMELINE_PAGE_SIZE = 80;

export function Timeline({ events }: TimelineProps) {
  const [visibleCount, setVisibleCount] = useState(TIMELINE_PAGE_SIZE);
  const visibleEvents = useMemo(() => events.slice(0, visibleCount), [events, visibleCount]);
  const hasMoreEvents = visibleCount < events.length;

  useEffect(() => {
    setVisibleCount(TIMELINE_PAGE_SIZE);
  }, [events]);

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B]">
      <div className="flex flex-col gap-2 border-b border-[#161E30] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#EDEFF8]">Timeline</h2>
          <p className="mt-1 text-xs text-[#586383]">Cluster activity, most recent first</p>
        </div>
        <p className="font-mono text-[11px] text-[#586383]">
          showing <b className="text-[#EDEFF8]">{Math.min(visibleCount, events.length).toLocaleString()}</b> of{" "}
          <b className="text-[#EDEFF8]">{events.length.toLocaleString()}</b> events
        </p>
      </div>
      <div className="flex h-12 items-end gap-0.5 px-5 pt-3">
        {Array.from({ length: 32 }).map((_, index) => (
          <span
            key={index}
            className="min-h-[2px] flex-1 rounded-t-sm bg-gradient-to-b from-[#4C82FF] to-[#4C82FF]/10 opacity-60"
            style={{ height: `${8 + ((index * 17) % 28)}px` }}
          />
        ))}
      </div>
      <div className="max-h-[380px] overflow-y-auto px-5 pb-4 pt-2">
        {events.length > 0 ? (
          visibleEvents.map((item, index) => (
            <div
              key={`${item.time}-${item.event}-${index}`}
              className="flex items-center gap-4 border-b border-[#161E30] px-1 py-2.5 text-xs"
            >
              <div className="w-20 shrink-0 font-mono text-[#586383]">{item.time}</div>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4C82FF]" />
              <p className="text-[#94A0BE]">
                <b className="font-medium text-[#EDEFF8]">{item.event.split(" ")[0]}</b>{" "}
                {item.event.split(" ").slice(1).join(" ")}
              </p>
            </div>
          ))
        ) : (
          <p className="px-1 py-4 text-sm text-[#586383]">No timeline events returned</p>
        )}
      </div>
      {hasMoreEvents ? (
        <div className="flex justify-center border-t border-[#161E30] px-5 py-4">
          <button
            type="button"
            onClick={() => setVisibleCount((currentCount) => currentCount + TIMELINE_PAGE_SIZE)}
            className="rounded-lg border border-[#202A42] bg-[#10162A] px-4 py-2 text-xs font-semibold text-[#EDEFF8] hover:border-[#4C82FF]/50 hover:bg-[#161E36]"
          >
            Load 80 more
          </button>
        </div>
      ) : null}
    </section>
  );
}
