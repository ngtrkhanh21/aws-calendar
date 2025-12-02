import { useMemo, useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import classNames from 'classnames';
import { dayjs, getWeekDays, formatTime, isSameDay, isToday, getTimeSlotHeight } from '../../../utils/dateUtils.js';
import './WeekView.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 60; // pixels per hour

function WeekView({ currentDate, events, calendars, onEventClick, onTimeSlotClick }) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    // Cập nhật vị trí vạch đỏ mỗi phút
    setNow(dayjs());
    const intervalId = setInterval(() => {
      setNow(dayjs());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  function getEventsForDay(day) {
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

  function getCurrentTimeTop() {
    const dayStart = now.startOf('day');
    const minutesFromStart = now.diff(dayStart, 'minute');
    return minutesFromStart * (SLOT_HEIGHT / 60);
  }

  function handleTimeSlotClick(day, hour) {
    const dateTime = dayjs(day).hour(hour).minute(0);
    onTimeSlotClick?.(dateTime);
  }

  return (
    <div className="week-view">
      <Row className="week-header">
        <Col xs={1} className="time-column"></Col>
        {weekDays.map((day) => (
          <Col key={day.format('YYYY-MM-DD')} className="text-center">
            <div className={classNames('day-header', { 'today': isToday(day) })}>
              <div className="day-name">{day.format('ddd')}</div>
              <div className="day-number">{day.date()}</div>
            </div>
          </Col>
        ))}
      </Row>
      <div className="week-body">
        <div className="time-column">
          {HOURS.map((hour) => (
            <div key={hour} className="time-slot" style={{ height: `${SLOT_HEIGHT}px` }}>
              {hour}:00
            </div>
          ))}
        </div>
        <div className="week-days">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isTodayDay = isToday(day);
            return (
              <div key={day.format('YYYY-MM-DD')} className="week-day">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="time-slot"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onClick={() => handleTimeSlotClick(day, hour)}
                  />
                ))}
                <div className="events-layer">
                  {isTodayDay && (
                    <div
                      className="current-time-line"
                      style={{ top: `${getCurrentTimeTop()}px` }}
                    >
                      <div className="current-time-dot" />
                    </div>
                  )}
                  {dayEvents.map((event) => {
                    if (event.allDay) return null;
                    const { top, height } = getEventPosition(event);
                    return (
                      <div
                        key={event.id}
                        className="week-event"
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeekView;

