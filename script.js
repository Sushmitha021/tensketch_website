function init() {
    initPreloader();

    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.set(".reveal", { opacity: 0, y: 30 });
        initReveals();
        initNavigation();
        initDetailedFlow();
    } else {
        const preloader = document.getElementById("preloader");
        if (preloader) preloader.style.display = "none";
        document.body.style.overflow = "auto";
    }

    initCountdown();
    initFormHandler();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

function initReveals() {
    const reveals = gsap.utils.toArray(".reveal:not(.detail-step)");
    reveals.forEach((el) => {
        gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
    });

    // Special staggering for flow steps
    const flowSteps = document.querySelectorAll(".flow-step");
    if (flowSteps.length > 0) {
        gsap.to(flowSteps, {
            opacity: 1,
            y: 0,
            stagger: 0.2,
            duration: 0.8,
            scrollTrigger: {
                trigger: ".flow-track",
                start: "top 75%"
            }
        });
    }
}

function initCountdown() {
    // Set target date for the end of the month
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3); // 3 days from now for demo
    targetDate.setHours(23, 59, 59);

    function updateTimer() {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        const daysSpan = document.getElementById("days");
        const hoursSpan = document.getElementById("hours");
        const minutesSpan = document.getElementById("minutes");
        const secondsSpan = document.getElementById("seconds");

        if (daysSpan) daysSpan.innerHTML = d.toString().padStart(2, '0');
        if (hoursSpan) hoursSpan.innerHTML = h.toString().padStart(2, '0');
        if (minutesSpan) minutesSpan.innerHTML = m.toString().padStart(2, '0');
        if (secondsSpan) secondsSpan.innerHTML = s.toString().padStart(2, '0');

        if (distance < 0) {
            clearInterval(timerInterval);
            const countdownEl = document.getElementById("countdown");
            if (countdownEl) countdownEl.innerHTML = "OFFER EXPIRED";
        }
    }

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function initFormHandler() {
    const form = document.getElementById("leadCaptureForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const name = formData.get("name");
        const phone = formData.get("phone");
        const business = formData.get("business");

        const message = `Hi TenSketch! My name is ${name}. I have a ${business} business and I'm interested in the Lead Engine offer. My phone is ${phone}.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/919999999999?text=${encodedMessage}`;

        window.open(whatsappUrl, "_blank");
    });
}

function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    const safetyTimer = setTimeout(() => {
        if (preloader.style.display !== "none") {
            preloader.style.opacity = "0";
            setTimeout(() => {
                preloader.style.display = "none";
                document.body.style.overflow = "auto";
            }, 500);
        }
    }, 4000);

    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({
        onComplete: () => clearTimeout(safetyTimer)
    });

    tl.to("#preloader .logo", { opacity: 1, y: 0, duration: 0.6 })
      .to("#loader-progress", { x: "0%", duration: 1.2, ease: "power1.inOut" })
      .to("#preloader", {
          opacity: 0,
          display: "none",
          duration: 0.5,
          onComplete: () => {
              document.body.style.overflow = "auto";
              gsap.to("#hero .reveal", { y: 0, opacity: 1, duration: 1, stagger: 0.2 });
          }
      });
}

function initNavigation() {
    const header = document.querySelector("header");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.style.background = "rgba(10, 10, 10, 0.8)";
            header.style.backdropFilter = "blur(10px)";
        } else {
            header.style.background = "transparent";
            header.style.backdropFilter = "none";
        }
    });
}

function initDetailedFlow() {
    if (typeof gsap === 'undefined' || !document.querySelector(".detailed-flow")) return;

    const steps = gsap.utils.toArray(".detail-step");
    const visuals = gsap.utils.toArray(".flow-visual");
    const line = document.getElementById("flow-line");
    const dot = document.getElementById("flow-dot");

    // Initial state
    if (steps[0]) steps[0].classList.add("is-active");
    if (visuals[0]) visuals[0].classList.add("is-active");

    steps.forEach((step, i) => {
        ScrollTrigger.create({
            trigger: step,
            start: "top 60%",
            end: "bottom 60%",
            onToggle: (self) => {
                if (self.isActive) {
                    steps.forEach(s => s.classList.remove("is-active"));
                    visuals.forEach(v => v.classList.remove("is-active"));
                    step.classList.add("is-active");
                    if (visuals[i]) visuals[i].classList.add("is-active");
                }
            }
        });
    });

    // Progress line mapping
    ScrollTrigger.create({
        trigger: ".detailed-flow",
        start: "top 15vw",
        end: "bottom 80%",
        scrub: true,
        onUpdate: (self) => {
            const progress = self.progress * 100;
            if (line) line.style.height = progress + "%";
            if (dot) dot.style.top = progress + "%";
        }
    });
}

