import { dayjs } from './dateUtils.js';

// Mock calendars - chỉ có My Calendar và Work
export const mockCalendars = [
  {
    id: 'cal-1',
    name: 'My Calendar',
    color: '#4285f4',
    visible: true,
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cal-2',
    name: 'Work',
    color: '#ea4335',
    visible: true,
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock events - tạo các sự kiện mẫu
const today = dayjs();
const startOfWeek = today.startOf('isoWeek');

export const mockEvents = [
  {
    id: 'event-1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    start: startOfWeek.add(1, 'day').hour(10).minute(0).utc().toISOString(),
    end: startOfWeek.add(1, 'day').hour(11).minute(30).utc().toISOString(),
    allDay: false,
    calendarId: 'cal-2',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    title: 'Lunch with Friends',
    description: 'Restaurant downtown',
    start: startOfWeek.add(2, 'day').hour(12).minute(0).utc().toISOString(),
    end: startOfWeek.add(2, 'day').hour(13).minute(30).utc().toISOString(),
    allDay: false,
    calendarId: 'cal-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-3',
    title: 'Project Deadline',
    description: 'Submit final report',
    start: startOfWeek.add(4, 'day').hour(17).minute(0).utc().toISOString(),
    end: startOfWeek.add(4, 'day').hour(18).minute(0).utc().toISOString(),
    allDay: false,
    calendarId: 'cal-2',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-4',
    title: 'Weekend Trip',
    description: 'All day event',
    start: startOfWeek.add(5, 'day').startOf('day').utc().toISOString(),
    end: startOfWeek.add(6, 'day').endOf('day').utc().toISOString(),
    allDay: true,
    calendarId: 'cal-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-5',
    title: 'Birthday Party',
    description: 'Friend\'s birthday celebration',
    start: today.hour(19).minute(0).utc().toISOString(),
    end: today.hour(22).minute(0).utc().toISOString(),
    allDay: false,
    calendarId: 'cal-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper để lưu vào localStorage
export function saveMockEventsToStorage(events) {
  localStorage.setItem('mockEvents', JSON.stringify(events));
}

// Helper để load từ localStorage
export function loadMockEventsFromStorage() {
  const stored = localStorage.getItem('mockEvents');
  if (stored) {
    return JSON.parse(stored);
  }
  // Nếu chưa có, khởi tạo với mock data
  saveMockEventsToStorage(mockEvents);
  return mockEvents;
}

// Helper để lưu calendars
export function saveMockCalendarsToStorage(calendars) {
  localStorage.setItem('mockCalendars', JSON.stringify(calendars));
}

// Helper để load calendars
export function loadMockCalendarsFromStorage() {
  const stored = localStorage.getItem('mockCalendars');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Filter out Personal calendar và chỉ giữ My Calendar và Work
    const filtered = parsed.filter(cal => cal.id !== 'cal-3' && (cal.name === 'My Calendar' || cal.name === 'Work'));
    // Nếu có Personal calendar, cập nhật lại localStorage
    if (parsed.some(cal => cal.id === 'cal-3')) {
      saveMockCalendarsToStorage(filtered.length > 0 ? filtered : mockCalendars);
      return filtered.length > 0 ? filtered : mockCalendars;
    }
    return filtered.length > 0 ? filtered : mockCalendars;
  }
  saveMockCalendarsToStorage(mockCalendars);
  return mockCalendars;
}

