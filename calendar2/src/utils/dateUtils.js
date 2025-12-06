import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

export { dayjs };

export function getWeekDays(date) {
  const start = dayjs(date).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

export function getMonthDays(date) {
  const start = dayjs(date).startOf('month').startOf('isoWeek');
  const end = dayjs(date).endOf('month').endOf('isoWeek');
  const days = [];
  let current = start;
  
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    days.push(current);
    current = current.add(1, 'day');
  }
  
  return days;
}

export function formatTime(date) {
  return dayjs(date).format('HH:mm');
}

export function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function isSameDay(date1, date2) {
  return dayjs(date1).isSame(dayjs(date2), 'day');
}

export function isToday(date) {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function getTimeSlotHeight(hourHeight = 60) {
  return hourHeight / 4; // 15-minute slots
}

/**
 * Convert date to ISO 8601 format (2025-12-12T10:30:00Z)
 * Đảm bảo format khớp với backend
 */
export function toISO8601(date) {
  return dayjs(date).utc().toISOString();
}

/**
 * Parse ISO 8601 string from backend
 * Backend trả về format: 2025-12-12T10:30:00Z
 */
export function parseISO8601(isoString) {
  return dayjs(isoString);
}

/**
 * Format tháng sang tiếng Việt: "tháng 1", "tháng 2", ..., "tháng 12"
 */
export function formatMonthVietnamese(date) {
  const month = dayjs(date).month() + 1; // dayjs month is 0-based
  return `tháng ${month}`;
}

/**
 * Format ngày tháng năm tiếng Việt: "tháng 12, 2025"
 */
export function formatMonthYearVietnamese(date) {
  const month = dayjs(date).month() + 1;
  const year = dayjs(date).year();
  return `tháng ${month} ${year}`;
}

/**
 * Format ngày tháng năm đầy đủ tiếng Việt: "tháng 12 6, 2025"
 */
export function formatFullDateVietnamese(date) {
  const month = dayjs(date).month() + 1;
  const day = dayjs(date).date();
  const year = dayjs(date).year();
  return `tháng ${month} ${day}, ${year}`;
}

/**
 * Format tháng ngắn tiếng Việt: "thg 12"
 */
export function formatShortMonthVietnamese(date) {
  const month = dayjs(date).month() + 1;
  return `thg ${month}`;
}

