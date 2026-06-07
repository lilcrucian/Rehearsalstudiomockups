import { useState, useEffect } from "react";
import { Box, Typography, IconButton, CircularProgress, Tooltip } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { hallAPI, bookingAPI, type DayAvailability } from "../../utils/api";

async function fetchAvailability(month: string): Promise<Record<string, DayAvailability>> {
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();

  const [halls, bookings] = await Promise.allSettled([
    hallAPI.getAllHalls(),
    bookingAPI.getAllBookings(),
  ]);

  const hallList = halls.status === 'fulfilled' ? halls.value : [];
  const bookingList = bookings.status === 'fulfilled' ? bookings.value : [];

  const hallCount = hallList.filter(h => h.isAvailable).length || 1;
  const capacityPerDay = hallCount * 14;

  const bookedByDay: Record<string, number> = {};
  for (const b of bookingList) {
    if (b.status === 'cancelled') continue;
    const d = b.bookingDate.slice(0, 10);
    if (!d.startsWith(month)) continue;
    bookedByDay[d] = (bookedByDay[d] ?? 0) + (b.durationHours ?? 0);
  }

  const result: Record<string, DayAvailability> = {};
  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const booked = bookedByDay[dateStr] ?? 0;
    let status: DayAvailability['status'] = "free";
    if (booked >= capacityPerDay) status = "full";
    else if (booked > 0) status = "partial";
    result[dateStr] = { booked, capacity: capacityPerDay, status };
  }
  return result;
}

interface Props {
  selectedDate: string; // "YYYY-MM-DD"
  onDateSelect: (date: string) => void;
}

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const STATUS_COLORS = {
  free:    { bg: "#e8f5e9", border: "#66bb6a", dot: "#43a047", label: "Свободно" },
  partial: { bg: "#fff8e1", border: "#ffca28", dot: "#f9a825", label: "Частично занято" },
  full:    { bg: "#ffebee", border: "#ef5350", dot: "#e53935", label: "Занято полностью" },
  unknown: { bg: "#f5f5f5", border: "#e0e0e0", dot: "#bdbdbd", label: "" },
};

function toMonthStr(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function toDayStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function InteractiveCalendar({ selectedDate, onDateSelect }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [viewYear, viewMonth]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await fetchAvailability(toMonthStr(viewYear, viewMonth));
      setAvailability(data);
    } catch {
      // silently ignore — calendar renders without colour coding
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth - 1, 1);
  // Monday-based: Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString("ru-RU", {
    month: "long", year: "numeric",
  });

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth - 1, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <IconButton size="small" onClick={prevMonth}>
          <ChevronLeft />
        </IconButton>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: "capitalize" }}>
            {monthName}
          </Typography>
          {loading && <CircularProgress size={14} sx={{ color: "#757575" }} />}
        </Box>
        <IconButton size="small" onClick={nextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Day labels */}
      <Box display="grid" sx={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", mb: "4px" }}>
        {DAY_LABELS.map(d => (
          <Box key={d} textAlign="center">
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {d}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar cells */}
      <Box display="grid" sx={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
          if (!isCurrentMonth) return <Box key={i} />;

          const dateStr = toDayStr(viewYear, viewMonth, dayNum);
          const info = availability[dateStr];
          const past = isPast(dayNum);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === toDayStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

          const colors = past
            ? STATUS_COLORS.unknown
            : info
            ? STATUS_COLORS[info.status] ?? STATUS_COLORS.unknown
            : STATUS_COLORS.unknown;

          return (
            <Tooltip
              key={dateStr}
              title={
                past ? "Прошедшая дата" :
                info ? `${colors.label}${info.booked > 0 ? ` · занято ${info.booked}ч из ${info.capacity}ч` : ""}` : ""
              }
              arrow
            >
              <Box
                onClick={() => !past && info?.status !== "full" && onDateSelect(dateStr)}
                sx={{
                  aspectRatio: "1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  border: isSelected
                    ? "2px solid #424242"
                    : `1.5px solid ${colors.border}`,
                  bgcolor: isSelected ? "#424242" : colors.bg,
                  cursor: past || info?.status === "full" ? "not-allowed" : "pointer",
                  opacity: past ? 0.4 : 1,
                  transition: "all 0.15s",
                  position: "relative",
                  "&:hover": !past && info?.status !== "full" ? {
                    transform: "scale(1.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  } : {},
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={isToday || isSelected ? 700 : 400}
                  sx={{ color: isSelected ? "#fff" : "text.primary", lineHeight: 1 }}
                >
                  {dayNum}
                </Typography>
                {/* Status dot */}
                {!past && info && (
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      bgcolor: isSelected ? "#fff" : colors.dot,
                      mt: "3px",
                    }}
                  />
                )}
                {/* Today indicator */}
                {isToday && !isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 3,
                      right: 4,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      bgcolor: "#757575",
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Legend */}
      <Box display="flex" gap={2} mt={2} flexWrap="wrap">
        {(["free", "partial", "full"] as const).map(s => (
          <Box key={s} display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: STATUS_COLORS[s].dot }} />
            <Typography variant="caption" color="text.secondary">
              {STATUS_COLORS[s].label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
