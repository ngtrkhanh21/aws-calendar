import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { dayjs } from '../../../utils/dateUtils.js';
import './TaskModal.css';

function TaskModal({ show, onHide, task, currentDate, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskList, setTaskList] = useState('my-tasks');
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [repeat, setRepeat] = useState('none');

  useEffect(() => {
    if (task) {
      const taskDate = task.date ? dayjs(task.date) : dayjs();
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDate(taskDate.format('YYYY-MM-DD'));
      setTime(taskDate.format('HH:mm'));
      setDeadline(task.deadline || '');
      setTaskList(task.taskList || 'my-tasks');
      setRepeat(task.repeat || 'none');
    } else {
      // Reset for new task
      const selectedDate = currentDate ? dayjs(currentDate) : dayjs();
      setTitle('');
      setDescription('');
      setDate(selectedDate.format('YYYY-MM-DD'));
      setTime(selectedDate.format('HH:mm'));
      setDeadline('');
      setTaskList('my-tasks');
      setRepeat('none');
    }
    setShowDeadlinePicker(false);
  }, [task, currentDate]);

  function handleSubmit(e) {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    const taskDate = dayjs(`${date} ${time}`).utc().toISOString();
    const deadlineDate = deadline ? dayjs(deadline).utc().toISOString() : null;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      date: taskDate,
      deadline: deadlineDate,
      taskList,
      repeat,
      completed: task?.completed || false,
    };

    onSave?.(task?.id, taskData);
    onHide();
  }

  function handleDelete() {
    if (window.confirm('Bạn có chắc chắn muốn xóa việc cần làm này?')) {
      onDelete?.(task?.id);
      onHide();
    }
  }

  const formattedDate = date ? dayjs(date).format('D [thg] M, YYYY') : '';
  const formattedTime = time ? dayjs(`2000-01-01 ${time}`).format('h:mmA') : '';
  const formattedDeadline = deadline ? dayjs(deadline).format('D [thg] M, YYYY') : '';

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="task-modal">
      <Modal.Header closeButton className="task-modal-header">
        <div className="w-100">
          <Form.Control
            type="text"
            placeholder="Thêm tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="task-title-input"
          />
          <div className="task-tabs mt-3">
            <button
              type="button"
              className="task-tab"
              onClick={() => {
                // Switch to event modal - sẽ implement sau
                onHide();
              }}
            >
              Sự kiện
            </button>
            <button
              type="button"
              className="task-tab active"
            >
              Việc cần làm
            </button>
            <button
              type="button"
              className="task-tab"
              onClick={() => {
                // Switch to appointment modal - sẽ implement sau
                onHide();
              }}
            >
              Lên lịch hẹn
            </button>
          </div>
        </div>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="task-modal-body">
          <div className="task-field mb-3">
            <div className="task-field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.9 1.57h1.6c0-.93-.56-2.01-2.3-2.39v-.75h-1.2v.74c-1.5.3-2.5 1.2-2.5 2.55 0 1.77 1.39 2.41 3.48 2.95 1.99.5 2.4 1.1 2.4 1.87 0 .53-.39 1.39-2.28 1.39-1.38 0-2.03-.58-2.03-1.54h-1.6c.01 1.4 1.11 2.48 2.71 2.8v.75h1.2v-.74c1.5-.3 2.5-1.11 2.5-2.45 0-1.5-1.02-2.22-3.48-2.9z"/>
              </svg>
            </div>
            <div className="task-field-content">
              <div className="task-date-time">
                <span>{formattedDate}</span>
                {time && <span className="ms-2">{formattedTime}</span>}
              </div>
              <div className="task-repeat">
                {repeat === 'none' ? 'Không lặp lại' : 'Lặp lại'}
              </div>
            </div>
            <div className="task-field-actions">
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="task-date-input"
              />
              <Form.Control
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="task-time-input ms-2"
              />
            </div>
          </div>

          <div className="task-field mb-3">
            <div className="task-field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="task-field-content">
              {deadline ? (
                <div className="task-deadline-selected" onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}>
                  {formattedDeadline}
                  <button
                    type="button"
                    className="task-remove-deadline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeadline('');
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="task-add-deadline"
                  onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}
                >
                  Thêm thời hạn
                </button>
              )}
            </div>
            {showDeadlinePicker && (
              <div className="task-deadline-picker">
                <Form.Control
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    setShowDeadlinePicker(false);
                  }}
                  className="task-deadline-input"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="task-field mb-3">
            <div className="task-field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z"/>
              </svg>
            </div>
            <div className="task-field-content">
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Thêm nội dung mô tả"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="task-description-input"
              />
            </div>
          </div>

          <div className="task-field">
            <div className="task-field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <div className="task-field-content">
              <Form.Select
                value={taskList}
                onChange={(e) => setTaskList(e.target.value)}
                className="task-list-select"
              >
                <option value="my-tasks">Việc cần làm của tôi</option>
                <option value="work-tasks">Việc cần làm công việc</option>
              </Form.Select>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="task-modal-footer">
          {task && (
            <Button variant="danger" onClick={handleDelete} className="me-auto">
              Xóa
            </Button>
          )}
          <Button variant="secondary" onClick={onHide}>
            Hủy
          </Button>
          <Button variant="primary" type="submit">
            Lưu
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default TaskModal;

