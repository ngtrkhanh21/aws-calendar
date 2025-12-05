import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { dayjs } from '../../../utils/dateUtils.js';
import './EventModal.css';

function EventModal({ show, onHide, event, calendars, currentDate, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    if (event) {
      const start = dayjs(event.start);
      const end = dayjs(event.end);
      
      setTitle(event.title || '');
      setDescription(event.description || '');
      setStartDate(start.format('YYYY-MM-DD'));
      setStartTime(start.format('HH:mm'));
      setEndDate(end.format('YYYY-MM-DD'));
      setEndTime(end.format('HH:mm'));
      setCalendarId(event.calendarId || '');
      setAllDay(event.allDay || false);
    } else {
      // Reset for new event - dùng currentDate nếu có, không thì dùng ngày hiện tại
      const selectedDate = currentDate ? dayjs(currentDate) : dayjs();
      // Chỉ lấy My Calendar hoặc Work, ưu tiên My Calendar
      const availableCalendars = calendars?.filter(cal => cal.name === 'My Calendar' || cal.name === 'Work') || [];
      const defaultCalendarId = availableCalendars.find(cal => cal.name === 'My Calendar')?.id 
        || availableCalendars[0]?.id 
        || 'cal-1'; // Fallback to mock calendar ID
      
      console.log('Initializing new event', { currentDate, selectedDate: selectedDate.format('YYYY-MM-DD'), calendars, defaultCalendarId });
      
      setTitle('');
      setDescription('');
      setStartDate(selectedDate.format('YYYY-MM-DD'));
      setStartTime(selectedDate.format('HH:mm'));
      setEndDate(selectedDate.format('YYYY-MM-DD'));
      setEndTime(selectedDate.add(1, 'hour').format('HH:mm'));
      setCalendarId(defaultCalendarId);
      setAllDay(false);
    }
  }, [event, calendars, currentDate]);

  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted', { title, calendarId, calendars });

    // Đảm bảo có calendarId - fallback to mock calendar nếu không có
    const finalCalendarId = calendarId || calendars?.[0]?.id || 'cal-1';
    if (!finalCalendarId) {
      console.error('No calendar available', { calendarId, calendars });
      alert('Please create a calendar before adding events.');
      return;
    }

    if (!title || title.trim() === '') {
      alert('Please enter a title for the event.');
      return;
    }

    // Chuẩn hóa thời gian sang ISO 8601 format (2025-12-12T10:30:00Z)
    const start = allDay
      ? dayjs(startDate).startOf('day').utc().toISOString()
      : dayjs(`${startDate} ${startTime}`).utc().toISOString();
    
    const end = allDay
      ? dayjs(endDate).endOf('day').utc().toISOString()
      : dayjs(`${endDate} ${endTime}`).utc().toISOString();

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      start,
      end,
      calendarId: finalCalendarId,
      allDay,
    };

    console.log('Saving event:', eventData);

    if (event) {
      onSave(event.id, eventData);
    } else {
      onSave(null, eventData);
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{event ? 'Edit Event' : 'Create Event'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Title *</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Event title"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Calendar *</Form.Label>
            <div className="d-flex gap-3">
              {calendars?.filter(cal => cal.name === 'My Calendar' || cal.name === 'Work').map((cal) => (
                <Form.Check
                  key={cal.id}
                  type="radio"
                  id={`calendar-${cal.id}`}
                  name="calendar"
                  label={
                    <span>
                      <span
                        className="calendar-color-indicator me-2"
                        style={{ backgroundColor: cal.color || '#3788d8' }}
                      />
                      {cal.name}
                    </span>
                  }
                  checked={calendarId === cal.id}
                  onChange={() => setCalendarId(cal.id)}
                  className="calendar-radio-option"
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="All Day"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {!allDay && (
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {!allDay && (
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </Form.Group>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          {event && (
            <Button variant="danger" onClick={() => onDelete(event.id)}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {event ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EventModal;

