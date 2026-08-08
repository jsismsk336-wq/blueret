import { useEffect, useRef } from 'react';

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let shootingStars: ShootingStar[] = [];
    const particleCount = window.innerWidth < 768 ? 80 : 180; // ปรับจำนวนลงนิดนึงเพราะจุดใหญ่ขึ้น
    const connectionDistance = 150; // เพิ่มระยะเชื่อมต่อให้กว้างขึ้นนิดนึง
    const mouseConnectionDistance = 180; 
    
    // โทนสีม่วงอ่อนแบบในรูป
    const particleColor = 'rgba(192, 132, 252, 0.9)'; // สว่างขึ้นนิดนึง
    const lineColor = 'rgba(192, 132, 252, '; 

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120,
      isDown: false
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseVx: number;
      baseVy: number;
      radius: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseVx = (Math.random() - 0.5) * 0.8;
        this.baseVy = (Math.random() - 0.5) * 0.8;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        // ใหญ่ขึ้นมานิดนึง (รัศมี 1.5 - 3.5)
        this.radius = Math.random() * 2 + 1.5; 
      }

      update(width: number, height: number) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        const forceRadius = mouse.isDown ? mouse.radius * 1.5 : mouse.radius;
        if (distance < forceRadius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (forceRadius - distance) / forceRadius;
          const directionX = forceDirectionX * force * 3;
          const directionY = forceDirectionY * force * 3;
          
          this.vx = this.baseVx - directionX;
          this.vy = this.baseVy - directionY;
        } else {
          this.vx += (this.baseVx - this.vx) * 0.1;
          this.vy += (this.baseVy - this.vy) * 0.1;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) { this.x = 0; this.vx = -this.vx; this.baseVx = -this.baseVx; }
        if (this.x > width) { this.x = width; this.vx = -this.vx; this.baseVx = -this.baseVx; }
        if (this.y < 0) { this.y = 0; this.vy = -this.vy; this.baseVy = -this.baseVy; }
        if (this.y > height) { this.y = height; this.vy = -this.vy; this.baseVy = -this.baseVy; }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
        ctx.shadowBlur = 5; // ใส่แสงฟุ้งบางๆ กลับมาให้จุดดูนูนขึ้น
        ctx.shadowColor = particleColor;
      }
    }

    class ShootingStar {
      x: number = 0;
      y: number = 0;
      length: number = 0;
      speed: number = 0;
      opacity: number = 0;
      active: boolean = false;

      constructor(width: number, height: number) {
        this.reset(width, height);
      }

      reset(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = -Math.random() * height;
        this.length = Math.random() * 80 + 30; // ความยาวดาวตกนุ่มๆ
        this.speed = Math.random() * 2 + 1.5; // วิ่งช้าๆ นุ่มๆ
        this.opacity = Math.random() * 0.4 + 0.1; // แสงอ่อนๆ
        this.active = false;
      }

      update(width: number, height: number) {
        if (!this.active) {
          if (Math.random() < 0.003) { // โอกาสเกิดน้อยๆ จะได้ดูนุ่มนวล ไม่เยอะไป
            this.reset(width, height);
            this.active = true;
          }
          return;
        }

        // เฉียงลงซ้าย
        this.x -= this.speed;
        this.y += this.speed;

        if (this.x < -100 || this.y > height + 100) {
          this.active = false;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.length, this.y - this.length);
        gradient.addColorStop(0, `rgba(192, 132, 252, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y - this.length);
        ctx.stroke();
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles = [];
      shootingStars = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
      for (let i = 0; i < 6; i++) { // มีดาวตก 6 ดวงที่สลับกันวิ่ง
        shootingStars.push(new ShootingStar(canvas.width, canvas.height));
      }
    };

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(canvas.width, canvas.height);
        
        ctx.shadowBlur = 0;
        
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // เส้นหนาขึ้นมานิดนึง (1.0)
            ctx.strokeStyle = `${lineColor}${opacity * 0.4})`;
            ctx.lineWidth = 1; 
            ctx.stroke();
          }
        }

        const dxMouse = particles[i].x - mouse.x;
        const dyMouse = particles[i].y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < mouseConnectionDistance) {
          const opacity = 1 - distMouse / mouseConnectionDistance;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `${lineColor}${opacity * 0.6})`; 
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        
        particles[i].draw(ctx);
      }
      
      ctx.shadowBlur = 0; // reset shadow for shooting stars
      for (let i = 0; i < shootingStars.length; i++) {
        shootingStars[i].update(canvas.width, canvas.height);
        shootingStars[i].draw(ctx);
      }
      
      animId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    const handleMouseDown = () => { mouse.isDown = true; };
    const handleMouseUp = () => { mouse.isDown = false; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    init();
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14] via-[#0d0914] to-[#090610]"></div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-100"
      />
    </div>
  );
}
