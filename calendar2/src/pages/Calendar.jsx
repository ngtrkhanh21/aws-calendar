import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, ButtonGroup, Navbar, Nav } from 'react-bootstrap';
import { dayjs } from '../utils/dateUtils.js';
import { calendarService } from '../services/calendarService.js';
import { eventService } from '../services/eventService.js';
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
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentDate, view]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Nếu đã biết API không available, dùng mock data luôn
      if (useMockData) {
        let calendarsData = loadMockCalendarsFromStorage();
        let eventsData = loadMockEventsFromStorage();

        // Migrate events từ Personal calendar (cal-3) sang My Calendar (cal-1)
        const hasPersonalEvents = eventsData.some(e => e.calendarId === 'cal-3');
        if (hasPersonalEvents) {
          eventsData = eventsData.map((event) => {
            if (event.calendarId === 'cal-3') {
              return { ...event, calendarId: 'cal-1' };
            }
            return event;
          });
          saveMockEventsToStorage(eventsData);
        }

        // Đảm bảo chỉ có My Calendar và Work
        calendarsData = calendarsData.filter(cal => cal.id !== 'cal-3' && (cal.name === 'My Calendar' || cal.name === 'Work'));
        if (calendarsData.length === 0 || calendarsData.some(cal => cal.id === 'cal-3')) {
          // Reset về mock data mặc định
          calendarsData = mockCalendars;
          saveMockCalendarsToStorage(calendarsData);
        }

        const calendarsWithVisibility = calendarsData.map((cal) => ({
          ...cal,
          visible: cal.visible !== false,
        }));

        setCalendars(calendarsWithVisibility);
        setEvents(eventsData);
        return;
      }

      // Thử load từ API trước
      try {
        const [calendarsData, eventsData] = await Promise.all([
          calendarService.getCalendars(),
          eventService.getEvents(),
        ]);

        // Set default visibility
        const calendarsWithVisibility = calendarsData.map((cal) => ({
          ...cal,
          visible: cal.visible !== false,
        }));

        setCalendars(calendarsWithVisibility);
        setEvents(eventsData);
      } catch (apiError) {
        // Nếu API fail, dùng mock data từ localStorage
        console.debug('API unavailable, switching to mock data');
        setUseMockData(true);
        let calendarsData = loadMockCalendarsFromStorage();
        let eventsData = loadMockEventsFromStorage();

        // Migrate events từ Personal calendar (cal-3) sang My Calendar (cal-1)
        const hasPersonalEvents = eventsData.some(e => e.calendarId === 'cal-3');
        if (hasPersonalEvents) {
          eventsData = eventsData.map((event) => {
            if (event.calendarId === 'cal-3') {
              return { ...event, calendarId: 'cal-1' };
            }
            return event;
          });
          saveMockEventsToStorage(eventsData);
        }

        // Đảm bảo chỉ có My Calendar và Work
        calendarsData = calendarsData.filter(cal => cal.id !== 'cal-3' && (cal.name === 'My Calendar' || cal.name === 'Work'));
        if (calendarsData.length === 0 || calendarsData.some(cal => cal.id === 'cal-3')) {
          // Reset về mock data mặc định
          calendarsData = mockCalendars;
          saveMockCalendarsToStorage(calendarsData);
        }

        const calendarsWithVisibility = calendarsData.map((cal) => ({
          ...cal,
          visible: cal.visible !== false,
        }));

        setCalendars(calendarsWithVisibility);
        setEvents(eventsData);
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
          // Không có repeat -> giữ nguyên
          if (ev.type !== 'task' || !ev.repeat || ev.repeat === 'none') {
            expanded.push(ev);
            return;
          }

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

          // Lặp hằng ngày tới hết năm hiện tại
          if (ev.repeat === 'daily') {
            let cursor = baseStart.clone();
            while (cursor.isBefore(endOfYear) || cursor.isSame(endOfYear, 'day')) {
              const occurrenceStart = cursor.clone();
              // Bỏ qua nếu ngày này bị exclude
              if (isExcluded(occurrenceStart)) {
                cursor = cursor.add(1, 'day');
                continue;
              }
              const occurrenceEnd = occurrenceStart.add(durationMinutes, 'minute');
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
            while (cursor.isBefore(endOfYear) || cursor.isSame(endOfYear, 'day')) {
              targetDays.forEach((dow) => {
                const dayDate = cursor.day(dow);
                const occurrenceStart = dayDate
                  .hour(baseStart.hour())
                  .minute(baseStart.minute());
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

      // Chuẩn hóa thời gian sang ISO 8601 format (2025-12-12T10:30:00Z)
      const params = {
        start: startDate.utc().toISOString(),
        end: endDate.utc().toISOString(),
      };

      try {
        const eventsData = await eventService.getEvents(params);
        setEvents(eventsData);
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

  async function handleEventSave(eventId, eventData) {
    try {
      console.log('handleEventSave called', { eventId, eventData, useMockData });
      
      // Luôn dùng mock data để lưu tạm (vì backend chưa sẵn sàng)
      const allEvents = loadMockEventsFromStorage();
      let updatedEventsList;
      
      if (eventId) {
        // Update event
        updatedEventsList = allEvents.map((e) =>
          e.id === eventId ? { ...e, ...eventData, updatedAt: new Date().toISOString() } : e
        );
        saveMockEventsToStorage(updatedEventsList);
        console.log('✅ Event updated in mock data:', eventId);
      } else {
        // Create new event
        const newEvent = {
          id: `event-${Date.now()}`,
          ...eventData,
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedEventsList = [...allEvents, newEvent];
        saveMockEventsToStorage(updatedEventsList);
        console.log('✅ Event created in mock data:', newEvent);
        console.log('📦 All events in storage:', updatedEventsList);
      }
      
      // Đảm bảo useMockData = true
      if (!useMockData) {
        setUseMockData(true);
      }
      
      // Reload events để hiển thị ngay
      await loadEvents();
      
      // Đóng modal
      setShowEventModal(false);
      setSelectedEvent(null);
      
      console.log('✅ Event saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    }
  }

  async function handleEventDelete(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      try {
        await eventService.deleteEvent(eventId);
      } catch (apiError) {
        // Mock mode: xóa từ localStorage
        const allEvents = loadMockEventsFromStorage();
        const filteredEvents = allEvents.filter((e) => e.id !== eventId);
        saveMockEventsToStorage(filteredEvents);
      }
      await loadEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }

  async function handleEventMove(eventId, newTimes) {
    try {
      await eventService.updateEvent(eventId, newTimes);
      await loadEvents();
    } catch (error) {
      console.error('Failed to move event:', error);
    }
  }

  async function handleTaskSave(taskId, taskData) {
    console.log('handleTaskSave called', { taskId, taskData, useMockData });
    try {
      // Lưu task như event để hiển thị trên calendar
      const allEvents = loadMockEventsFromStorage();
      let updatedEvents;
      
      if (taskId) {
        // Update existing task
        updatedEvents = allEvents.map((e) =>
          e.id === taskId ? { ...e, ...taskData, updatedAt: new Date().toISOString() } : e
        );
      } else {
        // Create new task
        const newTask = {
          id: `task-${Date.now()}`,
          ...taskData,
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedEvents = [...allEvents, newTask];
      }
      
      saveMockEventsToStorage(updatedEvents);
      console.log('✅ Task saved as event:', taskId || 'new');
      
      // Reload events để hiển thị task mới
      await loadEvents();
      alert('Đã lưu việc cần làm thành công!');
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Có lỗi xảy ra khi lưu việc cần làm. Vui lòng thử lại.');
    }
  }

  async function handleTaskDelete(taskId, mode = 'single', occurrenceStart) {
    try {
      const allEvents = loadMockEventsFromStorage();

      if (mode === 'all') {
        // Xóa toàn bộ chuỗi
        const filteredEvents = allEvents.filter((e) => e.id !== taskId);
        saveMockEventsToStorage(filteredEvents);
        console.log('✅ Task deleted (all occurrences):', taskId);
      } else {
        // Xóa một lần lặp: thêm excludeDates
        const updated = allEvents.map((e) => {
          if (e.id !== taskId) return e;
          const exclude = Array.isArray(e.excludeDates) ? e.excludeDates : [];
          const occ = occurrenceStart
            ? dayjs(occurrenceStart).startOf('day').toISOString()
            : dayjs(e.start).startOf('day').toISOString();
          if (!exclude.includes(occ)) exclude.push(occ);
          return { ...e, excludeDates: exclude, updatedAt: new Date().toISOString() };
        });
        saveMockEventsToStorage(updated);
        console.log('✅ Task deleted (single occurrence):', taskId, occurrenceStart);
      }

      await loadEvents();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Có lỗi xảy ra khi xóa việc cần làm. Vui lòng thử lại.');
    }
  }

  async function handleEventResize(eventId, newTimes) {
    try {
      await eventService.updateEvent(eventId, newTimes);
      await loadEvents();
    } catch (error) {
      console.error('Failed to resize event:', error);
    }
  }

  const visibleCalendars = calendars.filter((cal) => cal.visible !== false);
  const filteredEvents = events.filter((event) => {
    const calendar = calendars.find((cal) => cal.id === event.calendarId);
    return calendar?.visible !== false;
  });

  const viewTitle = () => {
    if (view === VIEWS.MONTH) {
      return currentDate.format('MMMM YYYY');
    } else if (view === VIEWS.WEEK) {
      const weekStart = dayjs(currentDate).startOf('isoWeek');
      const weekEnd = dayjs(currentDate).endOf('isoWeek');
      if (weekStart.month() === weekEnd.month()) {
        return `${weekStart.format('MMM D')} - ${weekEnd.format('D, YYYY')}`;
      }
      return `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D, YYYY')}`;
    } else if (view === VIEWS.DAY) {
      return currentDate.format('MMMM D, YYYY');
    }
    return '';
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div>Loading...</div>
      </Container>
    );
  }

  return (
    <div className="calendar-page">
      <Navbar bg="light" expand="lg" className="calendar-navbar">
        <Container fluid>
          <Navbar.Brand>Calendar</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <ButtonGroup className="me-3">
                <Button
                  variant={view === VIEWS.MONTH ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.MONTH)}
                >
                  Month
                </Button>
                <Button
                  variant={view === VIEWS.WEEK ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.WEEK)}
                >
                  Week
                </Button>
                <Button
                  variant={view === VIEWS.DAY ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.DAY)}
                >
                  Day
                </Button>
              </ButtonGroup>

              <ButtonGroup className="me-3">
                <Button variant="outline-secondary" onClick={handlePrev}>
                  ‹
                </Button>
                <Button variant="outline-secondary" onClick={handleToday}>
                  Today
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
        }}
        event={selectedEvent}
        calendars={calendars}
        currentDate={currentDate}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />

      <TaskModal
        show={showTaskModal}
        onHide={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
          setSelectedTaskOccurrenceStart(null);
        }}
        task={selectedTask}
        occurrenceStart={selectedTaskOccurrenceStart}
        currentDate={currentDate}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}

export default Calendar;

