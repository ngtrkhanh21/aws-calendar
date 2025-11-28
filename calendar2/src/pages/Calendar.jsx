import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, ButtonGroup, Navbar, Nav } from 'react-bootstrap';
import { dayjs } from '../utils/dateUtils.js';
import { calendarService } from '../services/calendarService.js';
import { eventService } from '../services/eventService.js';
import {
  loadMockCalendarsFromStorage,
  saveMockCalendarsToStorage,
  loadMockEventsFromStorage,
  saveMockEventsToStorage,
} from '../utils/mockData.js';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import AgendaView from '../components/calendar/AgendaView';
import EventModal from '../components/calendar/EventModal';
import Sidebar from '../components/ui/Sidebar.jsx';
import './Calendar.css';

const VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda',
};

function Calendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [view, setView] = useState(VIEWS.MONTH);
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
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
        const calendarsData = loadMockCalendarsFromStorage();
        const eventsData = loadMockEventsFromStorage();

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
        const calendarsData = loadMockCalendarsFromStorage();
        const eventsData = loadMockEventsFromStorage();

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

      // Nếu đã biết API không available, dùng mock data luôn
      if (useMockData) {
        const allMockEvents = loadMockEventsFromStorage();
        const filteredEvents = allMockEvents.filter((event) => {
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

      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      try {
        const eventsData = await eventService.getEvents(params);
        setEvents(eventsData);
      } catch (apiError) {
        // Nếu API fail, filter mock events theo date range
        console.debug('API unavailable, using mock data');
        setUseMockData(true);
        const allMockEvents = loadMockEventsFromStorage();
        const filteredEvents = allMockEvents.filter((event) => {
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
    setSelectedEvent(event);
    setShowEventModal(true);
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
    return 'Agenda';
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
                <Button
                  variant={view === VIEWS.AGENDA ? 'primary' : 'outline-primary'}
                  onClick={() => setView(VIEWS.AGENDA)}
                >
                  Agenda
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
              {view === VIEWS.AGENDA && (
                <AgendaView
                  events={filteredEvents}
                  calendars={visibleCalendars}
                  onEventClick={handleEventClick}
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
    </div>
  );
}

export default Calendar;

