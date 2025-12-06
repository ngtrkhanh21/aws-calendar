import { useMemo, useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import classNames from 'classnames';
import { dayjs, formatTime, isToday, getTimeSlotHeight, formatFullDateVietnamese } from '../../../utils/dateUtils.js';
import './DayView.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 60; // pixels per hour

function DayView({ currentDate, events, calendars, onEventClick, onTimeSlotClick }) {
  const day = useMemo(() => dayjs(currentDate), [currentDate]);
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    // Cập nhật vạch đỏ mỗi phút
    setNow(dayjs());
    const intervalId = setInterval(() => {
      setNow(dayjs());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  function getEventsForDay() {
    if (!events) return [];
    return events.filter((event) => {
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      return dayjs(day).isSame(eventStart, 'day') || 
             (dayjs(day).isAfter(eventStart, 'day') && dayjs(day).isBefore(eventEnd, 'day')) ||
             (dayjs(day).isSame(eventEnd, 'day') && !event.allDay);
    });
  }

  function getEventPosition(event) {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const dayStart = start.startOf('day');
    
    const top = start.diff(dayStart, 'minute') * (SLOT_HEIGHT / 60);
    const height = end.diff(start, 'minute') * (SLOT_HEIGHT / 60);
    
    return { top, height };
  }

  function getCalendarColor(calendarId) {
    const calendar = calendars?.find((cal) => cal.id === calendarId);
    return calendar?.color || '#3788d8';
  }

  function handleTimeSlotClick(hour) {
    const dateTime = dayjs(day).hour(hour).minute(0);
    onTimeSlotClick?.(dateTime);
  }

  function getCurrentTimeTop() {
    const dayStart = now.startOf('day');
    const minutesFromStart = now.diff(dayStart, 'minute');
    return minutesFromStart * (SLOT_HEIGHT / 60);
  }

  const dayEvents = getEventsForDay();
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  return (
    <div className="day-view">
      <Row className="day-header">
        <Col xs={1} className="time-column"></Col>
        <Col className={classNames('day-header-content', { 'today': isToday(day) })}>
          <div className="day-name">{day.format('dddd')}</div>
          <div className="day-number">{formatFullDateVietnamese(day)}</div>
        </Col>
      </Row>
      
      {allDayEvents.length > 0 && (
        <div className="all-day-events">
          {allDayEvents.map((event) => (
            <div
              key={event.id}
              className="all-day-event"
              style={{ borderLeftColor: getCalendarColor(event.calendarId) }}
              onClick={() => onEventClick?.(event)}
            >
              {event.title}
            </div>
          ))}
        </div>
      )}

      <div className="day-body">
        <div className="time-column">
          {HOURS.map((hour) => (
            <div key={hour} className="time-slot" style={{ height: `${SLOT_HEIGHT}px` }}>
              {hour}:00
            </div>
          ))}
        </div>
        <div className="day-timeline">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="time-slot"
              style={{ height: `${SLOT_HEIGHT}px` }}
              onClick={() => handleTimeSlotClick(hour)}
            />
          ))}
          <div className="events-layer">
            {isToday(day) && (
              <div
                className="current-time-line"
                style={{ top: `${getCurrentTimeTop()}px` }}
              >
                <div className="current-time-dot" />
              </div>
            )}
            {timedEvents.map((event) => {
              const { top, height } = getEventPosition(event);
              return (
                <div
                  key={event.id}
                  className="day-event"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: getCalendarColor(event.calendarId),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  <div className="event-title">{event.title}</div>
                  <div className="event-time">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayView;

