import { useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import classNames from 'classnames';
import { dayjs, getMonthDays, isSameDay, isToday } from '../../../utils/dateUtils.js';
import './MonthView.css';

function MonthView({ currentDate, events, calendars, onEventClick, onDateClick }) {
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function getEventsForDay(day) {
    if (!events) return [];
    return events.filter((event) => {
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      return dayjs(day).isBetween(eventStart, eventEnd, 'day', '[]');
    });
  }

  function getCalendarColor(calendarId) {
    const calendar = calendars?.find((cal) => cal.id === calendarId);
    return calendar?.color || '#3788d8';
  }

  return (
    <Container fluid className="month-view">
      <Row className="month-header">
        {weekDays.map((day) => (
          <Col key={day} className="text-center fw-bold">
            {day}
          </Col>
        ))}
      </Row>
      <div className="month-grid">
        {monthDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = day.month() === dayjs(currentDate).month();
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={classNames('month-day', {
                'other-month': !isCurrentMonth,
                'today': isCurrentDay,
              })}
              onClick={() => onDateClick?.(day)}
            >
              <div className="day-number">{day.date()}</div>
              <div className="day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="event-item"
                    style={{ borderLeftColor: getCalendarColor(event.calendarId) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {dayjs(event.start).format('HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="more-events">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}

export default MonthView;

