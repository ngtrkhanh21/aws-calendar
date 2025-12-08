import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { dayjs } from '../../../utils/dateUtils.js';
import './EventModal.css';

function EventModal({ show, onHide, event, calendars, currentDate, onSave, onDelete, onSwitchToTask, initialData }) {
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
    } else if (initialData) {
      const selectedDate = initialData.date ? dayjs(initialData.date) : (currentDate ? dayjs(currentDate) : dayjs());
      const availableCalendars = calendars?.filter(cal => cal.name === 'My Calendar' || cal.name === 'Work') || [];
      const defaultCalendarId = availableCalendars.find(cal => cal.name === 'My Calendar')?.id 
        || availableCalendars[0]?.id 
        || 'cal-1';

      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStartDate(initialData.date || selectedDate.format('YYYY-MM-DD'));
      setStartTime(initialData.time || selectedDate.format('HH:mm'));
      setEndDate(initialData.endDate || selectedDate.format('YYYY-MM-DD'));
      setEndTime(initialData.endTime || selectedDate.add(1, 'hour').format('HH:mm'));
      setCalendarId(defaultCalendarId);
      setAllDay(false);
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
  }, [event, calendars, currentDate, initialData]);

  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted', { title, calendarId, calendars });

    // Đảm bảo có calendarId - fallback to mock calendar nếu không có
    const finalCalendarId = calendarId || calendars?.[0]?.id || 'cal-1';
    if (!finalCalendarId) {
      console.error('No calendar available', { calendarId, calendars });
      alert('Vui lòng tạo lịch trước khi thêm sự kiện.');
      return;
    }

    if (!title || title.trim() === '') {
      alert('Vui lòng nhập tiêu đề cho sự kiện.');
      return;
    }

    // Chuẩn hóa thời gian sang ISO 8601 format với timezone offset (2025-12-12T10:30:00+07:00)
    // Giữ nguyên thời gian local để backend nhận đúng giờ người dùng chọn
    const start = allDay
      ? dayjs(startDate).startOf('day').toISOString()
      : dayjs(`${startDate}T${startTime}`).toISOString();
    
    const end = allDay
      ? dayjs(endDate).endOf('day').toISOString()
      : dayjs(`${endDate}T${endTime}`).toISOString();

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
      onSave(event.id || event.eventId, eventData);
    } else {
      onSave(null, eventData);
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="position-relative">
        {!event && (
          <div
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f1f3f4',
              borderRadius: '8px',
              padding: '2px',
              gap: '0',
            }}
          >
            <button
              type="button"
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#fff',
                color: '#000',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'default',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              Sự kiện
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSwitchToTask?.({
                  title,
                  description,
                  date: startDate,
                  time: startTime,
                  endDate,
                  endTime,
                });
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#000',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Việc cần làm
            </button>
          </div>
        )}
        <Modal.Title style={{ marginLeft: !event ? '190px' : '0' }}>
          {event ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tiêu đề *</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Tiêu đề sự kiện"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả sự kiện"
            />
          </Form.Group>

          {/* Ẩn chọn lịch - tự động chọn mặc định */}

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Cả ngày"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ngày bắt đầu *</Form.Label>
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
                  <Form.Label>Giờ bắt đầu *</Form.Label>
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
                <Form.Label>Ngày kết thúc *</Form.Label>
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
                  <Form.Label>Giờ kết thúc *</Form.Label>
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
              Xóa
            </Button>
          )}
          <Button variant="secondary" onClick={onHide}>
            Hủy
          </Button>
          <Button variant="primary" type="submit">
            {event ? 'Cập nhật' : 'Tạo'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EventModal;

