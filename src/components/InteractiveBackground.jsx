import React, { useState, useEffect } from 'react';

export default function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [popups, setPopups] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Use requestAnimationFrame for smoother performance
      requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
      });
    };

    const handleClick = (e) => {
      const newPopup = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setPopups(prev => [...prev, newPopup]);
      
      // Remove popup after 1.5 second
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== newPopup.id));
      }, 1500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  // Calculate background shift based on mouse position
  // 3% movement for parallax
  const xShift = (mousePos.x / window.innerWidth) * 3 - 1.5;
  const yShift = (mousePos.y / window.innerHeight) * 3 - 1.5;

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: '-5%',
          left: '-5%',
          right: '-5%',
          bottom: '-5%',
          width: '110vw',
          height: '110vh',
          zIndex: -10,
          backgroundImage: 'url(/space_hospital_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translate(${xShift}%, ${yShift}%)`,
          transition: 'transform 0.15s ease-out'
        }}
      />
      {popups.map(p => (
        <img 
          key={p.id}
          src="/ai_doctor_head.jpg" 
          alt="AI Doctor"
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(0, 200, 255, 0.5)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            animation: 'popup-appear 1.5s forwards ease-in-out'
          }}
        />
      ))}
      <style>{`
        @keyframes popup-appear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) translateY(20px); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1) translateY(-10px); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) translateY(-20px); }
        }
      `}</style>
    </>
  );
}
