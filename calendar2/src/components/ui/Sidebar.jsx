import { useState, useEffect } from 'react';
import { Card, Form, Dropdown } from 'react-bootstrap';
import { dayjs, getMonthDays, isSameDay, isToday, formatMonthYearVietnamese } from '../../utils/dateUtils.js';
import './Sidebar.css';

function Sidebar({ currentDate, onDateChange, calendars, onCalendarToggle, onDatePickerChange, onCreateEvent, onCreateTask, showEvents, showTasks, onToggleEvents, onToggleTasks }) {
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
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="sidebar">
      <Dropdown className="mb-3">
        <Dropdown.Toggle
          as="button"
          className="create-button"
        >
          <svg className="create-button-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
          <span className="create-button-label">Tạo</span>
          <span className="create-button-caret">▾</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="create-dropdown-menu">
          <Dropdown.Item
            onClick={() => onCreateEvent?.()}
          >
            Sự kiện
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onCreateTask?.()}
          >
            Việc cần làm
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
              {formatMonthYearVietnamese(selectedMonth)}
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
          <h6 className="mb-3">Phân loại</h6>
          <Form.Check
            type="checkbox"
            id="filter-events"
            label={
              <span>
                <span
                  className="calendar-color-indicator"
                  style={{ backgroundColor: '#3788d8' }}
                />
                Sự kiện
              </span>
            }
            checked={showEvents !== false}
            onChange={(e) => onToggleEvents?.(e.target.checked)}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            id="filter-tasks"
            label={
              <span>
                <span
                  className="calendar-color-indicator"
                  style={{ backgroundColor: '#ff9800' }}
                />
                Việc cần làm
              </span>
            }
            checked={showTasks !== false}
            onChange={(e) => onToggleTasks?.(e.target.checked)}
            className="mb-2"
          />
        </Card.Body>
      </Card>
    </div>
  );
}

export default Sidebar;

