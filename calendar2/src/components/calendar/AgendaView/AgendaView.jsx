import { useMemo } from 'react';
import { ListGroup } from 'react-bootstrap';
import { dayjs, formatDate, formatTime, isToday } from '../../../utils/dateUtils.js';
import './AgendaView.css';

function AgendaView({ events, calendars, onEventClick }) {
  const groupedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const sorted = [...events].sort((a, b) => 
      dayjs(a.start).valueOf() - dayjs(b.start).valueOf()
    );

    const grouped = {};
    sorted.forEach((event) => {
      const dateKey = dayjs(event.start).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return Object.entries(grouped).map(([date, events]) => ({
      date: dayjs(date),
      events,
    }));
  }, [events]);

  function getCalendarColor(calendarId) {
    const calendar = calendars?.find((cal) => cal.id === calendarId);
    return calendar?.color || '#3788d8';
  }

  if (groupedEvents.length === 0) {
    return (
      <div className="agenda-view-empty">
        <p>No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="agenda-view">
      <ListGroup variant="flush">
        {groupedEvents.map(({ date, events }) => (
          <div key={date.format('YYYY-MM-DD')} className="agenda-day">
            <div className={isToday(date) ? 'agenda-day-header today' : 'agenda-day-header'}>
              <div className="agenda-day-name">{date.format('dddd')}</div>
              <div className="agenda-day-date">{date.format('MMMM D, YYYY')}</div>
            </div>
            {events.map((event) => (
              <ListGroup.Item
                key={event.id}
                action
                onClick={() => onEventClick?.(event)}
                className="agenda-event"
              >
                <div className="agenda-event-time">
                  {event.allDay ? (
                    <span className="all-day-badge">All Day</span>
                  ) : (
                    <>
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </>
                  )}
                </div>
                <div
                  className="agenda-event-indicator"
                  style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                />
                <div className="agenda-event-content">
                  <div className="agenda-event-title">{event.title}</div>
                  {event.description && (
                    <div className="agenda-event-description">{event.description}</div>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </div>
        ))}
      </ListGroup>
    </div>
  );
}

export default AgendaView;

