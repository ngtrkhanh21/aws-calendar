import { useState, useRef } from 'react';
import { dayjs } from '../utils/dateUtils.js';

export function useDragAndDrop(onEventMove) {
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  function handleMouseDown(event, eventData, startPos) {
    if (event.button !== 0) return; // Only left mouse button
    
    event.preventDefault();
    setDragging(eventData);
    dragStartPos.current = { x: event.clientX, y: event.clientY };
    setDragOffset({ x: 0, y: 0 });

    function handleMouseMove(e) {
      if (!dragging) return;
      
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      setDragOffset({ x: deltaX, y: deltaY });
    }

    function handleMouseUp(e) {
      if (!dragging) return;

      // Calculate new time based on drag distance
      const minutesDelta = Math.round(dragOffset.y / 1); // Adjust based on your pixel-to-minute ratio
      const newStart = dayjs(eventData.start).add(minutesDelta, 'minute');
      const duration = dayjs(eventData.end).diff(dayjs(eventData.start), 'minute');
      const newEnd = newStart.add(duration, 'minute');

      onEventMove?.(eventData.id, {
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      });

      setDragging(null);
      setDragOffset({ x: 0, y: 0 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  return {
    dragging,
    dragOffset,
    handleMouseDown,
  };
}

