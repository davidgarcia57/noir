document.addEventListener('DOMContentLoaded', () => {
    // Colors from design palette
    const colors = ['#FF6B6B', '#FFB347', '#A78BFA'];

    /* ==========================================================================
       1. HERO TYPING EFFECT
       ========================================================================== */
    const titleText = "1 año, 4 meses, y contando...";
    const titleEl = document.getElementById('typing-title');
    let charIndex = 0;

    function typeTitle() {
        if (charIndex < titleText.length) {
            titleEl.textContent += titleText.charAt(charIndex);
            charIndex++;
            setTimeout(typeTitle, 120);
        } else {
            // Once typing finishes, trigger subtitle fade-up
            const subtitle = document.querySelector('.hero-subtitle');
            subtitle.style.opacity = '1';
            subtitle.style.transform = 'translateY(0)';
        }
    }

    // Delayed typing start for visual pacing
    setTimeout(typeTitle, 600);

    /* ==========================================================================
       2. FLOATING BACKGROUND PARTICLES (CANVAS)
       ========================================================================== */
    const bgCanvas = document.getElementById('particle-canvas');
    const bgCtx = bgCanvas.getContext('2d');
    let bgParticles = [];

    function resizeBgCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeBgCanvas);
    resizeBgCanvas();

    // Helper functions for drawing shapes
    function drawHeart(ctx, x, y, size, color, opacity) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.moveTo(x, y);
        // Standard cubic bezier heart shape
        ctx.bezierCurveTo(x - size/2, y - size/2, x - size, y + size/3, x, y + size);
        ctx.bezierCurveTo(x + size, y + size/3, x + size/2, y - size/2, x, y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawStar(ctx, x, y, size, color, opacity) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        const points = 4;
        const inset = 0.4;
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const radius = i % 2 === 0 ? size : size * inset;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    class BgParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * bgCanvas.width;
            this.y = initial ? Math.random() * bgCanvas.height : bgCanvas.height + 20;
            this.size = Math.random() * 12 + 6;
            this.speedY = -(Math.random() * 0.5 + 0.2);
            this.speedX = Math.sin(Math.random() * Math.PI) * 0.15;
            this.type = Math.random() > 0.5 ? 'heart' : 'star';
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.25 + 0.1; // Soft background opacity
            this.angle = Math.random() * Math.PI;
            this.angleSpeed = (Math.random() - 0.5) * 0.01;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.angle += this.angleSpeed;

            // Recenter/wrap particles around screen sides
            if (this.x < -20) this.x = bgCanvas.width + 20;
            if (this.x > bgCanvas.width + 20) this.x = -20;

            // Reset when drifting off-screen vertically
            if (this.y < -20) {
                this.reset(false);
            }
        }

        draw() {
            if (this.type === 'heart') {
                // Heart y-coordinate offset so rotation occurs around center
                drawHeart(bgCtx, this.x, this.y - this.size/2, this.size, this.color, this.opacity);
            } else {
                drawStar(bgCtx, this.x, this.y, this.size, this.color, this.opacity);
            }
        }
    }

    // Populate background particles (density-based)
    const particleCount = Math.min(40, Math.floor((bgCanvas.width * bgCanvas.height) / 30000));
    for (let i = 0; i < particleCount; i++) {
        bgParticles.push(new BgParticle());
    }

    function animateBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgParticles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateBg);
    }
    animateBg();

    /* ==========================================================================
       3. INTERSECTION OBSERVER FOR SCROLL REVEALS & COUNTERS
       ========================================================================== */
    const revealElements = document.querySelectorAll(
        '.reveal-text, .reveal-paragraph, .reveal-card, .reveal-letter'
    );

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // If it is a paragraph with underlines, trigger underline draw animation
                const underlines = entry.target.querySelectorAll('.highlight-underline');
                if (underlines.length > 0) {
                    // Stagger underline animations slightly for reading pacing
                    underlines.forEach((ul, index) => {
                        setTimeout(() => {
                            ul.classList.add('active');
                        }, 400 + (index * 400));
                    });
                }
                
                // Unobserve since animations should only trigger once
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before it fully rolls in
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Stats Section Observer (Triggers Counter Increments)
    const statCards = document.querySelectorAll('.stat-card');
    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                const numberEl = entry.target.querySelector('.stat-number');
                if (numberEl) {
                    animateCounter(numberEl);
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });

    statCards.forEach(card => statsObserver.observe(card));

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2200; // Counter takes 2.2 seconds to complete
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function: easeOutExpo for dramatic slowdown at the end
            const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = Math.floor(easeOutExpo * target);

            el.textContent = currentVal.toLocaleString('es-ES') + (currentVal === target ? suffix : '');

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                el.textContent = target.toLocaleString('es-ES') + suffix;
            }
        }
        requestAnimationFrame(updateCounter);
    }

    /* ==========================================================================
       4. PHYSICS-BASED CONFETTI EXPLOSION ENGINE
       ========================================================================== */
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];
    let isConfettiRunning = false;

    function resizeConfettiCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfettiCanvas);
    resizeConfettiCanvas();

    class ConfettiParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 6;
            
            // Random radial velocity vector pointing upwards
            const angle = Math.PI * 1.5 + (Math.random() - 0.5) * 1.0; // Point upwards with horizontal variance
            const speed = Math.random() * 12 + 8;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            
            // Gravity and air drag coefficients
            this.gravity = 0.35;
            this.drag = 0.975;
            
            // Color select
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            // Custom rotational attributes for 3D look
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.25;
            this.scaleY = 1.0;
            this.scaleYSpeed = (Math.random() * 0.1) + 0.05;
            this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
        }

        update() {
            this.vx *= this.drag;
            this.vy *= this.drag;
            this.vy += this.gravity;
            
            this.x += this.vx;
            this.y += this.vy;
            
            this.rotation += this.rotationSpeed;
            
            // Simulates paper flipping over in the air
            this.scaleY = Math.sin(performance.now() * this.scaleYSpeed * 0.05);
        }

        draw() {
            confettiCtx.save();
            confettiCtx.translate(this.x, this.y);
            confettiCtx.rotate(this.rotation);
            confettiCtx.scale(1, this.scaleY);
            confettiCtx.fillStyle = this.color;
            
            confettiCtx.beginPath();
            if (this.shape === 'rect') {
                confettiCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            } else {
                confettiCtx.arc(0, 0, this.size/2, 0, Math.PI * 2);
                confettiCtx.fill();
            }
            confettiCtx.restore();
        }
    }

    function launchConfetti(x, y) {
        // Trigger 150 particles for a dense, vibrant explosion
        for (let i = 0; i < 160; i++) {
            confettiParticles.push(new ConfettiParticle(x, y));
        }

        if (!isConfettiRunning) {
            isConfettiRunning = true;
            animateConfetti();
        }
    }

    function animateConfetti() {
        if (confettiParticles.length === 0) {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            isConfettiRunning = false;
            return;
        }

        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        // Filter out particles that go off-screen vertically
        confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height + 20);

        confettiParticles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animateConfetti);
    }

    // Attach Event Listener to Button
    const loveButton = document.getElementById('love-button');
    loveButton.addEventListener('click', (e) => {
        // Get absolute coordinates of the button center to trigger explosion from correct source
        const rect = loveButton.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        launchConfetti(originX, originY);

        // Subtle micro-interactive click animation
        loveButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            loveButton.style.transform = '';
        }, 150);
    });
});
