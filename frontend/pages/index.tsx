import { useEffect, useRef } from 'react';

const icons = [
  { id: 'icon1', src: '/icon1.svg', size: 80 },
  { id: 'icon2', src: '/icon2.svg', size: 100 },
  { id: 'icon3', src: '/icon3.svg', size: 70 },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const xRatio = e.clientX / innerWidth - 0.5; // -0.5 .. 0.5
      const yRatio = e.clientY / innerHeight - 0.5;

      icons.forEach((icon) => {
        const el = document.getElementById(icon.id);
        if (!el) return;
        const translateX = xRatio * 30; // max +/-15px
        const translateY = yRatio * 30;
        el.style.transform = `translate(${translateX}px, ${translateY}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} style={styles.container}>
      <h1 style={styles.title}>MediTrust AI</h1>
      <p style={styles.subtitle}>AI‑powered medical consultation documentation</p>
      <div style={styles.iconWrapper}>
        {icons.map((icon) => (
          <img
            key={icon.id}
            id={icon.id}
            src={icon.src}
            alt="icon"
            style={{ ...styles.icon, width: icon.size, height: icon.size }}
          />
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #e0f7fa, #e8eaf6)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    fontFamily: `'Inter', sans-serif`,
    textAlign: 'center',
  },
  title: {
    fontSize: '3rem',
    color: '#0d47a1',
    margin: 0,
    animation: 'fadeIn 1s ease-out',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#37474f',
    marginTop: '0.5rem',
    animation: 'fadeIn 1.5s ease-out',
  },
  iconWrapper: {
    marginTop: '2rem',
    display: 'flex',
    gap: '2rem',
    perspective: '800px',
  },
  icon: {
    transition: 'transform 0.1s ease-out',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
  },
};

export const __unstable__CSS = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
