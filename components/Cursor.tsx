import React, { useEffect, useRef, useState } from 'react';

const Cursor: React.FC = () => {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOutlineRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Hide default cursor
    document.body.style.cursor = 'none';

    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${clientX}px`;
        cursorDotRef.current.style.top = `${clientY}px`;
      }

      if (cursorOutlineRef.current) {
        cursorOutlineRef.current.animate({
          left: `${clientX}px`,
          top: `${clientY}px`
        }, { duration: 200, fill: "forwards" }); // Faster response for tech feel
      }
    };

    const onMouseDown = () => {
      if (cursorOutlineRef.current) {
        cursorOutlineRef.current.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(45deg)';
        cursorOutlineRef.current.style.borderColor = '#ff2a2a';
      }
    };

    const onMouseUp = () => {
      if (cursorOutlineRef.current) {
        cursorOutlineRef.current.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
        cursorOutlineRef.current.style.borderColor = '#00f3ff';
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('.hover-target')) {
            setHovering(true);
        } else {
            setHovering(false);
        }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      {/* Center Cross */}
      <div 
        ref={cursorDotRef}
        className="fixed w-1 h-1 bg-neonBlue pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
      >
        {/* Horizontal Line */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-neonBlue"></div>
        {/* Vertical Line */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-4 bg-neonBlue"></div>
      </div>

      {/* Outer Reticle */}
      <div 
        ref={cursorOutlineRef}
        className={`
            fixed w-8 h-8 border border-neonBlue pointer-events-none z-[9999] 
            -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out
            ${hovering ? 'scale-150 border-neonRed rotate-90 border-dashed' : 'scale-100'}
        `}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-neonBlue"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-neonBlue"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-neonBlue"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-neonBlue"></div>
      </div>
    </>
  );
};

export default Cursor;