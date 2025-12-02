import { useState, useEffect } from 'react';
import { Card, Form, Dropdown } from 'react-bootstrap';
import { dayjs, getMonthDays, isSameDay, isToday } from '../../utils/dateUtils.js';
import './Sidebar.css';

function Sidebar({ currentDate, onDateChange, calendars, onCalendarToggle, onDatePickerChange, onCreateEvent }) {
  const [selectedMonth, setSelectedMonth] = useState(dayjs(currentDate));

  // Đồng bộ month/year trên mini calendar với currentDate bên ngoài
  useEffect(() => {
    setSelectedMonth(dayjs(currentDate));
  }, [currentDate]);

  function handleDateClick(day) {
    onDateChange?.(day);
  }

  function handlePrevMonth() {
    setSelectedMonth(dayjs(selectedMonth).subtract(1, 'month'));
  }

  function handleNextMonth() {
    setSelectedMonth(dayjs(selectedMonth).add(1, 'month'));
  }

  const monthDays = getMonthDays(selectedMonth);
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="sidebar">
      <Dropdown className="w-100 mb-3">
        <Dropdown.Toggle
          as="button"
          className="create-button w-100"
        >
          <span className="create-button-icon">+</span>
          <span className="create-button-label">Tạo</span>
          <span className="create-button-caret">▾</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="create-dropdown-menu">
          <Dropdown.Item
            onClick={() => onCreateEvent?.()}
          >
            Sự kiện
          </Dropdown.Item>
          <Dropdown.Item disabled>
            Việc cần làm
          </Dropdown.Item>
          <Dropdown.Item disabled>
            Lên lịch hẹn
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handlePrevMonth}
            >
              ‹
            </button>
            <h6 className="mb-0">
              {selectedMonth.format('MMMM YYYY')}
            </h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleNextMonth}
            >
              ›
            </button>
          </div>
          
          <div className="mini-calendar">
            <div className="mini-calendar-header">
              {weekDays.map((day) => (
                <div key={day} className="mini-calendar-day-name">
                  {day}
                </div>
              ))}
            </div>
            <div className="mini-calendar-grid">
              {monthDays.map((day, idx) => {
                const isCurrentMonth = day.month() === selectedMonth.month();
                const isCurrentDay = isToday(day);
                const isSelected = isSameDay(day, currentDate);

                return (
                  <div
                    key={idx}
                    className={`mini-calendar-day ${
                      !isCurrentMonth ? 'other-month' : ''
                    } ${isCurrentDay ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day.date()}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <Form.Control
              type="date"
              value={dayjs(currentDate).format('YYYY-MM-DD')}
              onChange={(e) => {
                const newDate = dayjs(e.target.value);
                onDatePickerChange?.(newDate);
              }}
            />
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h6 className="mb-3">Calendars</h6>
          {calendars?.map((calendar) => (
            <Form.Check
              key={calendar.id}
              type="checkbox"
              id={`calendar-${calendar.id}`}
              label={
                <span>
                  <span
                    className="calendar-color-indicator"
                    style={{ backgroundColor: calendar.color || '#3788d8' }}
                  />
                  {calendar.name}
                </span>
              }
              checked={calendar.visible !== false}
              onChange={(e) => onCalendarToggle?.(calendar.id, e.target.checked)}
              className="mb-2"
            />
          ))}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Sidebar;

