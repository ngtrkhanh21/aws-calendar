import { useState, useRef } from 'react';
import { dayjs } from '../utils/dateUtils.js';

export function useEventResize(onEventResize) {
  const [resizing, setResizing] = useState(null);
  const [resizeType, setResizeType] = useState(null); // 'start' or 'end'
  const resizeStartPos = useRef({ y: 0, originalStart: null, originalEnd: null });

  function handleResizeStart(event, eventData, type) {
    if (event.button !== 0) return; // Only left mouse button
    
    event.preventDefault();
    event.stopPropagation();
    
    setResizing(eventData);
    setResizeType(type);
    resizeStartPos.current = {
      y: event.clientY,
      originalStart: dayjs(eventData.start),
      originalEnd: dayjs(eventData.end),
    };

    function handleMouseMove(e) {
      if (!resizing) return;
      
      const deltaY = e.clientY - resizeStartPos.current.y;
      const minutesDelta = Math.round(deltaY / 1); // Adjust based on pixel-to-minute ratio
      
      let newStart = resizeStartPos.current.originalStart;
      let newEnd = resizeStartPos.current.originalEnd;

      if (type === 'start') {
        newStart = resizeStartPos.current.originalStart.add(minutesDelta, 'minute');
        // Don't allow start to be after end
        if (newStart.isAfter(newEnd)) {
          newStart = newEnd;
        }
      } else if (type === 'end') {
        newEnd = resizeStartPos.current.originalEnd.add(minutesDelta, 'minute');
        // Don't allow end to be before start
        if (newEnd.isBefore(newStart)) {
          newEnd = newStart;
        }
      }

      // Call callback with preview (optional - you might want to update UI immediately)
      // For now, we'll just update on mouse up
    }

    function handleMouseUp(e) {
      if (!resizing) return;

      const deltaY = e.clientY - resizeStartPos.current.y;
      const minutesDelta = Math.round(deltaY / 1);
      
      let newStart = resizeStartPos.current.originalStart;
      let newEnd = resizeStartPos.current.originalEnd;

      if (type === 'start') {
        newStart = resizeStartPos.current.originalStart.add(minutesDelta, 'minute');
        if (newStart.isAfter(newEnd)) {
          newStart = newEnd;
        }
      } else if (type === 'end') {
        newEnd = resizeStartPos.current.originalEnd.add(minutesDelta, 'minute');
        if (newEnd.isBefore(newStart)) {
          newEnd = newStart;
        }
      }

      // Chuẩn hóa thời gian sang ISO 8601 format (2025-12-12T10:30:00Z)
      onEventResize?.(resizing.id, {
        start: newStart.utc().toISOString(),
        end: newEnd.utc().toISOString(),
      });

      setResizing(null);
      setResizeType(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  return {
    resizing,
    resizeType,
    handleResizeStart,
  };
}

