import { useEffect, useRef } from 'react';

export default function MedicalCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Google professional colors
    const colors = ['#1a73e8', '#0f9d58', '#4285F4', '#34A853', '#e8f0fe'];
    
    let particles = [];
    const particleCount = Math.floor((width * height) / 12000); // Responsive count

    let mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2 + 0.5; // Depth for 3D effect
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = (Math.random() * 3 + 1) * this.z;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.density = (Math.random() * 30) + 1;
        this.isCross = Math.random() > 0.85; // 15% are medical crosses
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.5 + 0.2) / this.z;
      }

      draw() {
        ctx.beginPath();
        if (this.isCross) {
          // Draw a medical cross
          const s = this.size * 1.5;
          ctx.rect(this.x - s/2, this.y - s*1.5, s, s*3);
          ctx.rect(this.x - s*1.5, this.y - s/2, s*3, s);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else {
          // Draw circle
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
        ctx.closePath();
      }

      update() {
        // Subtle floating movement
        this.angle += 0.01;
        this.baseX += Math.cos(this.angle) * this.speed;
        this.baseY += Math.sin(this.angle) * this.speed;

        // Wrap around screen
        if (this.baseX > width + 50) this.baseX = -50;
        if (this.baseX < -50) this.baseX = width + 50;
        if (this.baseY > height + 50) this.baseY = -50;
        if (this.baseY < -50) this.baseY = height + 50;

        // Interactive 3D Parallax & Repulsion
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (mouse.x != null && distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.radius;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * this.density;
          const directionY = forceDirectionY * force * this.density;
          
          this.x -= directionX;
          this.y -= directionY;
        } else {
          // Return to base position with depth sorting
          if (this.x !== this.baseX) {
            let dx = this.x - this.baseX;
            this.x -= dx / 20;
          }
          if (this.y !== this.baseY) {
            let dy = this.y - this.baseY;
            this.y -= dy / 20;
          }
        }
        this.draw();
      }
    }

    function init() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      
      connect();
      requestAnimationFrame(animate);
    }

    // Connect particles to form neural network
    function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            opacityValue = 1 - (distance / 120);
            ctx.strokeStyle = `rgba(26, 115, 232, ${opacityValue * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    window.addEventListener('resize', handleResize);
    
    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6
      }} 
    />
  );
}
