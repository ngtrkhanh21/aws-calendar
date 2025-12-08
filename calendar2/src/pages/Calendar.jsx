import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, ButtonGroup, Navbar, Nav } from 'react-bootstrap';
import { dayjs, formatMonthYearVietnamese, formatShortMonthVietnamese, formatFullDateVietnamese } from '../utils/dateUtils.js';
import { toast } from 'react-toastify';
import { eventService } from '../services/eventService.js';
import { todoService } from '../services/todoService.js';
import {
  mockCalendars,
  loadMockCalendarsFromStorage,
  saveMockCalendarsToStorage,
  loadMockEventsFromStorage,
  saveMockEventsToStorage,
} from '../utils/mockData.js';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import EventModal from '../components/calendar/EventModal';
import TaskModal from '../components/calendar/TaskModal/TaskModal';
import Sidebar from '../components/ui/Sidebar.jsx';
import './Calendar.css';

const VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
};

function Calendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [view, setView] = useState(VIEWS.MONTH);
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskOccurrenceStart, setSelectedTaskOccurrenceStart] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState(null);
  const [eventInitialData, setEventInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [showEvents, setShowEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);

  function mapDayToNumber(d) {
    if (typeof d === 'number') return d;
    const str = String(d || '').toLowerCase();
    if (['0', 'sun', 'cn'].includes(str)) return 0;
    if (['1', 'mon', 't2'].includes(str)) return 1;
    if (['2', 'tue', 't3'].includes(str)) return 2;
    if (['3', 'wed', 't4'].includes(str)) return 3;
    if (['4', 'thu', 't5'].includes(str)) return 4;
    if (['5', 'fri', 't6'].includes(str)) return 5;
    if (['6', 'sat', 't7'].includes(str)) return 6;
    return null;
  }

  // Chuẩn hóa event từ backend về format frontend
  function normalizeEventFromBackend(ev) {
    if (!ev) return null;

    // Nếu là TODO response (task)
    if (ev.todoId || ev.taskName) {
      // Backend trả về recurrence dạng uppercase (NONE, DAILY, WEEKLY, MONTHLY, WEEKDAY, YEARLY)
      // hoặc trong recurrenceRule
      const backendRecurrence = ev.recurrence || ev.recurrenceRule?.frequency || ev.repeat || 'none';
      // Map từ uppercase về lowercase cho frontend
      const freqMap = {
        'NONE': 'none',
        'DAILY': 'daily',
        'WEEKLY': 'weekly',
        'MONTHLY': 'monthly',
        'WEEKDAY': 'weekday',
        'YEARLY': 'yearly',
        // Fallback cho các giá trị đã ở dạng lowercase
        'none': 'none',
        'daily': 'daily',
        'weekly': 'weekly',
        'monthly': 'monthly',
        'weekday': 'weekday',
        'yearly': 'yearly',
      };
      const freq = freqMap[backendRecurrence] || freqMap[backendRecurrence?.toUpperCase()] || 'none';
      
      // Backend có thể trả về days trong recurrenceRule hoặc không có
      const rawDays = ev.recurrenceRule?.days || ev.repeatDays || [];
      const days = rawDays
        .map(mapDayToNumber)
        .filter((d) => d !== null && d !== undefined);
      
      // Backend trả về recurrenceEnd hoặc trong recurrenceRule.endDate
      const recurrenceEnd = ev.recurrenceEnd || ev.recurrenceRule?.endDate || null;
      
      return {
        id: ev.todoId || ev.id,
        eventId: ev.todoId || ev.id,
        title: ev.taskName || ev.title || '',
        description: ev.description || '',
        start: ev.dateTime,
        end: ev.endTime || ev.dateTime,
        calendarId: ev.calendarId || 'cal-1',
        allDay: false,
        type: 'task',
        repeat: freq,
        repeatDays: days,
        userId: ev.userId,
        createdAt: ev.createdAt || null,
        completed: ev.isCompleted || false,
        recurrenceRule: {
          frequency: freq,
          endDate: recurrenceEnd,
          days,
        },
      };
    }

    return {
      id: ev.eventId || ev.id,
      eventId: ev.eventId,
      title: ev.title || ev.summary || '',
      summary: ev.summary,
      description: ev.description || '',
      start: ev.start || ev.startTime,
      end: ev.end || ev.endTime,
      startTime: ev.startTime,
      endTime: ev.endTime,
      calendarId: ev.calendarId || 'cal-1',
      allDay: ev.allDay || false,
      userEmail: ev.userEmail || null,
      userId: ev.userId,
      createdAt: ev.createdAt || null,
      googleEventId: ev.googleEventId || null,
    };
  }

  function normalizeEventsFromBackend(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeEventFromBackend).filter(Boolean);
  }

  function isEventEnded(ev) {
    if (!ev) return false;
    const end = ev.end || ev.endTime || ev.dateTime;
    if (!end) return false;
    return dayjs(end).isBefore(dayjs(), 'minute');
  }

  // Chuẩn hóa task (todo) sang backend
  function normalizeTaskToBackend(task) {
    if (!task) return null;

    let frequency = task.repeat || task.recurrenceRule?.frequency || task.recurrence || 'none';
    // Nếu chọn "Tùy chỉnh ngày" thì gửi dưới dạng weekly với repeatDays
    if (frequency === 'custom') {
      frequency = 'weekly';
    }
    
    // Map frequency sang uppercase cho backend (NONE, DAILY, WEEKLY, MONTHLY, WEEKDAY, YEARLY)
    // Backend validate chính tả quy ước này
    const recurrenceMap = {
      'none': null,
      'daily': 'DAILY',
      'weekly': 'WEEKLY',
      'monthly': 'MONTHLY',
      'weekday': 'WEEKDAY',
      'yearly': 'YEARLY',
    };
    const recurrence = recurrenceMap[frequency.toLowerCase()] || null;

    // Ưu tiên endDate từ recurrenceRule, sau đó deadline/end/endTime/start
    let endDateCandidate =
      task.recurrenceRule?.endDate ||
      task.recurrenceEnd ||
      task.deadline ||
      task.end ||
      task.endTime ||
      task.dateTime ||
      task.start ||
      null;

    // Nếu là recurring mà chưa có endDate, đặt mặc định +30 ngày từ ngày bắt đầu
    let startForEnd = task.start || task.dateTime || task.end || task.endTime || null;
    let recurrenceEnd = endDateCandidate;
    if (frequency !== 'none' && !recurrenceEnd) {
      if (startForEnd) {
        recurrenceEnd = dayjs(startForEnd).add(30, 'day').endOf('day').toISOString();
      } else {
        recurrenceEnd = null;
      }
    } else if (recurrenceEnd) {
      // Chuẩn hóa recurrenceEnd về endOf('day') để backend đỡ lỗi
      const endDay = dayjs(recurrenceEnd);
      recurrenceEnd = endDay.isValid() ? endDay.endOf('day').toISOString() : recurrenceEnd;
    }

    const payload = {
      taskName: task.title || task.taskName || '',
      description: task.description || '',
      dateTime: task.start || task.dateTime,
      endTime: task.end || task.endTime,
      isCompleted: task.completed || false,
    };

    // Chỉ thêm recurrence và recurrenceEnd nếu có recurrence
    if (recurrence) {
      payload.recurrence = recurrence;
      if (recurrenceEnd) {
        payload.recurrenceEnd = recurrenceEnd;
      }
    }

    return payload;
  }

  // Chuẩn hóa event từ frontend sang format backend
  function normalizeEventToBackend(ev) {
    if (!ev) return null;
    return {
      summary: ev.title || ev.summary || '',
      description: ev.description || '',
      startTime: ev.start || ev.startTime,
      endTime: ev.end || ev.endTime,
      calendarId: ev.calendarId,
      allDay: ev.allDay || false,
      eventId: ev.eventId || ev.id, // dùng khi update
    };
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentDate, view]);

  async function loadData() {
    try {
      setLoading(true);

      // Thử load từ API trước
      try {
        const eventsData = await eventService.getEvents();
        const todosData = await todoService.getTodos();
        const normalizedEvents = normalizeEventsFromBackend([
          ...eventsData,
          ...todosData,
        ]);
        // Dùng calendars mock (My Calendar, Work) khi không có calendarService
        const calendarsData = mockCalendars;
        const calendarsWithVisibility = calendarsData.map((cal) => ({
          ...cal,
          visible: cal.visible !== false,
        }));

        setCalendars(calendarsWithVisibility);
        setEvents(normalizedEvents);
      } catch (apiError) {
        console.error('API unavailable, cannot load data', apiError);
        toast.error('Không tải được dữ liệu từ API');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents() {
    try {
      const startDate = dayjs(currentDate).startOf(view === VIEWS.MONTH ? 'month' : view === VIEWS.WEEK ? 'isoWeek' : 'day');
      const endDate = dayjs(currentDate).endOf(view === VIEWS.MONTH ? 'month' : view === VIEWS.WEEK ? 'isoWeek' : 'day');

      function expandRecurring(events, rangeStart, rangeEnd) {
        const expanded = [];
        const endOfYear = dayjs(rangeEnd).endOf('year');
        events.forEach((ev) => {
          // Không có repeat -> giữ nguyên (áp dụng cho cả events và tasks)
          if (!ev.repeat || ev.repeat === 'none') {
            expanded.push(ev);
            return;
          }

          // Chỉ expand tasks (việc cần làm) có recurrence
          // Events có thể có recurrence nhưng hiện tại chỉ expand tasks
          if (ev.type !== 'task') {
            expanded.push(ev);
            return;
          }

          const recurrenceEnd = ev.recurrenceRule?.endDate || ev.endDate || null;
          const recurrenceEndDay = recurrenceEnd ? dayjs(recurrenceEnd).endOf('day') : endOfYear;

          const baseStart = dayjs(ev.start);
          const baseEnd = dayjs(ev.end);
          const durationMinutes = baseEnd.diff(baseStart, 'minute');
          const excludeDates = Array.isArray(ev.excludeDates) 
            ? ev.excludeDates.map(d => dayjs(d).startOf('day').toISOString())
            : [];

          // Helper function để kiểm tra xem occurrence có bị exclude không
          function isExcluded(occurrenceDate) {
            const occDateStr = occurrenceDate.startOf('day').toISOString();
            return excludeDates.includes(occDateStr);
          }

          // Lặp hằng ngày tới recurrenceEndDay
          if (ev.repeat === 'daily') {
            let cursor = baseStart.clone().startOf('day');
            while (cursor.isBefore(recurrenceEndDay) || cursor.isSame(recurrenceEndDay, 'day')) {
              // Đảm bảo không bắt đầu trước baseStart
              if (cursor.isBefore(baseStart, 'day')) {
                cursor = cursor.add(1, 'day');
                continue;
              }
              
              // Tạo occurrence với cùng giờ/phút như baseStart
              const occurrenceStart = cursor
                .clone()
                .hour(baseStart.hour())
                .minute(baseStart.minute())
                .second(baseStart.second());
              
              // Bỏ qua nếu ngày này bị exclude
              if (isExcluded(occurrenceStart)) {
                cursor = cursor.add(1, 'day');
                continue;
              }
              
              const occurrenceEnd = occurrenceStart.add(durationMinutes, 'minute');
              
              // Chỉ thêm nếu occurrence overlap với range hiện tại
              if (
                occurrenceEnd.isAfter(rangeStart) &&
                occurrenceStart.isBefore(rangeEnd)
              ) {
                expanded.push({
                  ...ev,
                  start: occurrenceStart.toISOString(),
                  end: occurrenceEnd.toISOString(),
                });
              }
              
              cursor = cursor.add(1, 'day');
            }
            return;
          }

          // Lặp theo tuần / tùy chỉnh ngày (repeatDays)
          if (ev.repeat === 'weekly' || ev.repeat === 'custom') {
            const days = Array.isArray(ev.repeatDays) ? ev.repeatDays : [];
            const targetDays = days.length > 0 ? days : [baseStart.day()];
            let cursor = baseStart.startOf('week');
            while (cursor.isBefore(recurrenceEndDay) || cursor.isSame(recurrenceEndDay, 'day')) {
              targetDays.forEach((dow) => {
                const dayDate = cursor.day(dow);
                const occurrenceStart = dayDate
                  .hour(baseStart.hour())
                  .minute(baseStart.minute());
                if (occurrenceStart.isBefore(baseStart, 'day')) {
                  return;
                }
                // Bỏ qua nếu ngày này bị exclude
                if (isExcluded(occurrenceStart)) {
                  return;
                }
                const occurrenceEnd = occurrenceStart.add(durationMinutes, 'minute');
                if (
                  occurrenceEnd.isAfter(rangeStart) &&
                  occurrenceStart.isBefore(rangeEnd) &&
                  occurrenceStart.isAfter(baseStart.subtract(1, 'day'))
                ) {
                  expanded.push({
                    ...ev,
                    start: occurrenceStart.toISOString(),
                    end: occurrenceEnd.toISOString(),
                  });
                }
              });
              cursor = cursor.add(1, 'week');
            }
            return;
          }

          // fallback
          expanded.push(ev);
        });
        return expanded;
      }

      // Nếu đã biết API không available, dùng mock data luôn
      if (useMockData) {
        const allMockEvents = loadMockEventsFromStorage();
        const expandedEvents = expandRecurring(allMockEvents, startDate, endDate);
        const filteredEvents = expandedEvents.filter((event) => {
          const eventStart = dayjs(event.start);
          const eventEnd = dayjs(event.end);
          return (
            (eventStart.isAfter(startDate) || eventStart.isSame(startDate, 'day')) &&
            (eventEnd.isBefore(endDate) || eventEnd.isSame(endDate, 'day'))
          );
        });
        setEvents(filteredEvents);
        return;
      }

      // Chuẩn hóa thời gian sang ISO 8601 format với timezone offset
      // Giữ nguyên timezone local để backend nhận đúng giờ
      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      try {
        const [eventsData, todosData] = await Promise.all([
          eventService.getEvents(params),
          todoService.getTodos(), // TODO API chưa filter theo range; backend nên hỗ trợ
        ]);
        const normalizedEvents = normalizeEventsFromBackend([
          ...eventsData,
          ...todosData,
        ]);
        // Expand recurring tasks để hiển thị trên các ngày khác
        const expandedEvents = expandRecurring(normalizedEvents, startDate, endDate);
        setEvents(expandedEvents);
      } catch (apiError) {
        // Nếu API fail, filter mock events theo date range
        console.debug('API unavailable, using mock data');
        setUseMockData(true);
        const allMockEvents = loadMockEventsFromStorage();
        const expandedEvents = expandRecurring(allMockEvents, startDate, endDate);
        const filteredEvents = expandedEvents.filter((event) => {
          const eventStart = dayjs(event.start);
          const eventEnd = dayjs(event.end);
          return (
            (eventStart.isAfter(startDate) || eventStart.isSame(startDate, 'day')) &&
            (eventEnd.isBefore(endDate) || eventEnd.isSame(endDate, 'day'))
          );
        });
        setEvents(filteredEvents);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  function handleToday() {
    setCurrentDate(dayjs());
  }

  function handlePrev() {
    if (view === VIEWS.MONTH) {
      setCurrentDate(dayjs(currentDate).subtract(1, 'month'));
    } else if (view === VIEWS.WEEK) {
      setCurrentDate(dayjs(currentDate).subtract(1, 'week'));
    } else if (view === VIEWS.DAY) {
      setCurrentDate(dayjs(currentDate).subtract(1, 'day'));
    }
  }

  function handleNext() {
    if (view === VIEWS.MONTH) {
      setCurrentDate(dayjs(currentDate).add(1, 'month'));
    } else if (view === VIEWS.WEEK) {
      setCurrentDate(dayjs(currentDate).add(1, 'week'));
    } else if (view === VIEWS.DAY) {
      setCurrentDate(dayjs(currentDate).add(1, 'day'));
    }
  }

  function handleDateChange(date) {
    setCurrentDate(date);
  }

  function handleDatePickerChange(date) {
    setCurrentDate(date);
  }

  function handleCalendarToggle(calendarId, visible) {
    setCalendars((prev) =>
      prev.map((cal) =>
        cal.id === calendarId ? { ...cal, visible } : cal
      )
    );
  }

  function handleEventClick(event) {
    // Nếu là task thì mở TaskModal, nếu không thì mở EventModal
    if (event.type === 'task') {
      setSelectedTask(event);
      // Lưu lại ngày occurrence hiện tại để dùng khi xóa "lần này"
      setSelectedTaskOccurrenceStart(event.start);
      setShowTaskModal(true);
    } else {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  }

  function handleDateClick(date) {
    setCurrentDate(date);
    if (view === VIEWS.MONTH) {
      setView(VIEWS.DAY);
    }
  }

  function handleTimeSlotClick(dateTime) {
    setSelectedEvent(null);
    setCurrentDate(dateTime);
    setShowEventModal(true);
  }

  // Chuyển từ EventModal sang TaskModal
  function handleSwitchToTaskFromEvent(eventData) {
    setSelectedTask(null);
    setSelectedTaskOccurrenceStart(null);
    setShowEventModal(false);

    const taskData = {
      title: eventData?.title || '',
      description: eventData?.description || '',
      date: eventData?.date || dayjs(currentDate).format('YYYY-MM-DD'),
      time: eventData?.time || dayjs(currentDate).format('HH:mm'),
      endDate: eventData?.endDate,
      endTime: eventData?.endTime,
    };

    if (taskData.date) {
      setCurrentDate(dayjs(taskData.date));
    }

    setTaskInitialData(taskData);
    setEventInitialData(null);
    setShowTaskModal(true);
  }

  // Chuyển từ TaskModal sang EventModal
  function handleSwitchToEventFromTask(taskData) {
    setSelectedEvent(null);
    setShowTaskModal(false);

    const eventData = {
      title: taskData?.title || '',
      description: taskData?.description || '',
      date: taskData?.date || dayjs(currentDate).format('YYYY-MM-DD'),
      time: taskData?.time || dayjs(currentDate).format('HH:mm'),
      endDate: taskData?.endDate || taskData?.date,
      endTime: taskData?.endTime || taskData?.time,
    };

    if (eventData.date) {
      setCurrentDate(dayjs(eventData.date));
    }

    setEventInitialData(eventData);
    setTaskInitialData(null);
    setShowEventModal(true);
  }

  async function handleEventSave(eventId, eventData) {
    try {
      console.log('handleEventSave called', { eventId, eventData, useMockData });

      const backendPayload = normalizeEventToBackend(eventData);

       // Không cho cập nhật nếu sự kiện đã kết thúc
       if (eventId && isEventEnded(selectedEvent || eventData)) {
         toast.error('Sự kiện đã kết thúc, không thể cập nhật. Vui lòng tạo sự kiện mới.');
         return;
       }

      if (eventId) {
        await eventService.updateEvent(eventId, backendPayload);
      } else {
        await eventService.createEvent(backendPayload);
      }
      await loadEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
      toast.success(eventId ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện');
    } catch (error) {
      const apiMsg = error?.response?.data || error?.message;
      console.error('❌ Failed to save event:', apiMsg);
      toast.error(`Lưu sự kiện thất bại: ${apiMsg || 'Unknown error'}`);
      alert('Không thể lưu sự kiện. Vui lòng thử lại.');
    }
  }

  async function handleEventDelete(eventId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      return;
    }

    try {
      await eventService.deleteEvent(eventId);
      await loadEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
      toast.success('Đã xóa sự kiện');
    } catch (error) {
      const apiMsg = error?.response?.data || error?.message;
      console.error('Failed to delete event:', apiMsg);
      alert('Không thể xóa sự kiện. Vui lòng thử lại.');
      toast.error(`Xóa sự kiện thất bại: ${apiMsg || 'Unknown error'}`);
    }
  }

  async function handleEventMove(eventId, newTimes) {
    try {
      const backendPayload = normalizeEventToBackend(newTimes);

      if (isEventEnded(newTimes)) {
        toast.error('Sự kiện đã kết thúc, không thể di chuyển.');
        return;
      }

      await eventService.updateEvent(eventId, backendPayload);
      await loadEvents();
      toast.success('Đã di chuyển sự kiện');
    } catch (error) {
      console.error('Failed to move event:', error);
      toast.error('Di chuyển sự kiện thất bại');
    }
  }

  async function handleTaskSave(taskId, taskData) {
    console.log('handleTaskSave called', { taskId, taskData, useMockData });
    try {
      const backendPayload = normalizeTaskToBackend(taskData);
      if (taskId) {
        await todoService.updateTodo(taskId, backendPayload);
      } else {
        await todoService.createTodo(backendPayload);
      }
      await loadEvents();
      toast.success(taskId ? 'Đã cập nhật việc cần làm' : 'Đã tạo việc cần làm');
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Lưu việc cần làm thất bại');
    }
  }

  async function handleTaskDelete(taskId, mode = 'single', occurrenceStart) {
    try {
      await todoService.deleteTodo(taskId);
      await loadEvents();
      toast.success('Đã xóa việc cần làm');
    } catch (error) {
      const apiMsg = error?.response?.data || error?.message;
      console.error('Failed to delete task:', apiMsg);
      toast.error(`Xóa việc cần làm thất bại: ${apiMsg || 'Unknown error'}`);
    }
  }

  async function handleEventResize(eventId, newTimes) {
    try {
      const backendPayload = normalizeEventToBackend(newTimes);

      if (isEventEnded(newTimes)) {
        toast.error('Sự kiện đã kết thúc, không thể thay đổi thời lượng.');
        return;
      }

      await eventService.updateEvent(eventId, backendPayload);
      await loadEvents();
      toast.success('Đã thay đổi thời lượng sự kiện');
    } catch (error) {
      console.error('Failed to resize event:', error);
      toast.error('Thay đổi thời lượng thất bại');
    }
  }

  const visibleCalendars = calendars.filter((cal) => cal.visible !== false);
  const filteredEvents = events.filter((event) => {
    const calendar = calendars.find((cal) => cal.id === event.calendarId);
    const calendarVisible = calendar?.visible !== false;
    
    // Filter theo type: events hoặc tasks
    if (event.type === 'task') {
      return calendarVisible && showTasks;
    } else {
      return calendarVisible && showEvents;
    }
  });

  const viewTitle = () => {
    if (view === VIEWS.MONTH) {
      return formatMonthYearVietnamese(currentDate);
    } else if (view === VIEWS.WEEK) {
      const weekStart = dayjs(currentDate).startOf('isoWeek');
      const weekEnd = dayjs(currentDate).endOf('isoWeek');
      if (weekStart.month() === weekEnd.month()) {
        return `${formatShortMonthVietnamese(weekStart)} ${weekStart.date()} - ${weekEnd.date()}, ${weekEnd.year()}`;
      }
      return `${formatShortMonthVietnamese(weekStart)} ${weekStart.date()} - ${formatShortMonthVietnamese(weekEnd)} ${weekEnd.date()}, ${weekEnd.year()}`;
    } else if (view === VIEWS.DAY) {
      return formatFullDateVietnamese(currentDate);
    }
    return '';
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div>Đang tải...</div>
      </Container>
    );
  }

  return (
    <div className="calendar-page">
      <Navbar bg="light" expand="lg" className="calendar-navbar">
        <Container fluid>
          <Navbar.Brand>Lịch</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <ButtonGroup className="me-3">
                <Button
                  variant={view === VIEWS.MONTH ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.MONTH)}
                >
                  Tháng
                </Button>
                <Button
                  variant={view === VIEWS.WEEK ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.WEEK)}
                >
                  Tuần
                </Button>
                <Button
                  variant={view === VIEWS.DAY ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.DAY)}
                >
                  Ngày
                </Button>
              </ButtonGroup>

              <ButtonGroup className="me-3">
                <Button variant="outline-secondary" onClick={handlePrev}>
                  ‹
                </Button>
                <Button variant="outline-secondary" onClick={handleToday}>
                  Hôm nay
                </Button>
                <Button variant="outline-secondary" onClick={handleNext}>
                  ›
                </Button>
              </ButtonGroup>

              <span className="navbar-text me-3">{viewTitle()}</span>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="calendar-container">
        <Row className="g-0 h-100">
          <Col lg={3} className="d-none d-lg-block sidebar-column">
            <Sidebar
              currentDate={currentDate}
              onDateChange={handleDateChange}
              calendars={calendars}
              onCalendarToggle={handleCalendarToggle}
              onDatePickerChange={handleDatePickerChange}
              onCreateEvent={() => {
                setSelectedEvent(null);
                setShowEventModal(true);
              }}
              onCreateTask={() => {
                setSelectedTask(null);
                setShowTaskModal(true);
              }}
              showEvents={showEvents}
              showTasks={showTasks}
              onToggleEvents={(visible) => setShowEvents(visible)}
              onToggleTasks={(visible) => setShowTasks(visible)}
            />
          </Col>
          <Col lg={9} xs={12} className="calendar-main-column">
            <div className="calendar-view-container">
              {view === VIEWS.MONTH && (
                <MonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={visibleCalendars}
                  onEventClick={handleEventClick}
                  onDateClick={handleDateClick}
                />
              )}
              {view === VIEWS.WEEK && (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={visibleCalendars}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}
              {view === VIEWS.DAY && (
                <DayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={visibleCalendars}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}
            </div>
          </Col>
        </Row>
      </Container>

      <EventModal
        show={showEventModal}
        onHide={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setEventInitialData(null);
        }}
        event={selectedEvent}
        calendars={calendars}
        currentDate={currentDate}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        onSwitchToTask={handleSwitchToTaskFromEvent}
        initialData={eventInitialData}
      />

      <TaskModal
        show={showTaskModal}
        onHide={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
          setSelectedTaskOccurrenceStart(null);
          setTaskInitialData(null);
        }}
        task={selectedTask}
        occurrenceStart={selectedTaskOccurrenceStart}
        currentDate={currentDate}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onSwitchToEvent={handleSwitchToEventFromTask}
        initialData={taskInitialData}
      />
    </div>
  );
}

export default Calendar;

