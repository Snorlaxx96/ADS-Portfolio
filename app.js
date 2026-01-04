document.addEventListener('DOMContentLoaded', () => {
    fetchPortfolioData();
    setupContactForm();
    initCustomCursor();

    // Creative Click Animation
    document.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        ripple.class = 'click-ripple'; // potential bug fix: className
        ripple.className = 'click-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);

        // Remove element after animation to prevent memory leaks
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    });
});

function initCustomCursor() {
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    const cursorOutline = document.createElement('div');
    cursorOutline.className = 'cursor-outline';

    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorOutline);

    document.body.classList.add('custom-cursor-active');

    let mouseX = 0;
    let mouseY = 0;
    let outlineX = 0;
    let outlineY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Dot follows instantly
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    });

    // Outline follows with delay (Smooth Lerp)
    const animateCursor = () => {
        const speed = 0.15; // Smooth factor

        outlineX += (mouseX - outlineX) * speed;
        outlineY += (mouseY - outlineY) * speed;

        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;

        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Hover Effects
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .project-card, .skill-category, .hobby-card');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.classList.add('hovered');
            cursorDot.style.transform = 'translate(-50%, -50%) scale(0.5)'; // Shrink dot
        });
        el.addEventListener('mouseleave', () => {
            cursorOutline.classList.remove('hovered');
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1)'; // Restore dot
        });
    });

    // Use MutationObserver for dynamically added elements (like projects)
    const observer = new MutationObserver((mutations) => {
        const newElements = document.querySelectorAll('a, button, input, textarea, .project-card');
        newElements.forEach(el => {
            // Re-bind (simplistic approach, ideally check if bound)
            el.onmouseenter = () => {
                cursorOutline.classList.add('hovered');
                cursorDot.style.transform = 'translate(-50%, -50%) scale(0.5)';
            };
            el.onmouseleave = () => {
                cursorOutline.classList.remove('hovered');
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            };
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

const API_URL = 'http://localhost/Portfolio/api/index.php';

async function fetchPortfolioData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        renderProfile(data.profile);
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderHobbies(data.hobbies);

        // Remove skeleton loader if present
        const loader = document.querySelector('.skeleton-loader');
        if (loader) loader.style.display = 'none';

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('profile-container').innerHTML = '<p>Failed to load portfolio data. Please check the API connection.</p>';
    }
}

function renderProfile(profile) {
    if (!profile) return;

    // Hero Section
    const container = document.getElementById('profile-container');
    container.innerHTML = `
        <h1>Hello, I'm ${profile.name}</h1>
        <p>${profile.title}</p>
        <div style="margin-top: 2rem;">
            <a href="${profile.contacts.github}" target="_blank" class="btn-primary" style="margin-right: 1rem;"><i class="fab fa-github"></i> GitHub</a>
            <a href="#contact" class="btn-primary">Contact Me</a>
        </div>
    `;

    // About Section
    document.getElementById('about-text-container').innerHTML = `
        <p>${profile.bio}</p>
        <p>Email: <a href="mailto:${profile.contacts.email}" style="color: var(--primary);">${profile.contacts.email}</a></p>
    `;

    // Experience Years (Fetched from Function in DB)
    if (profile.exp_years !== undefined) {
        document.getElementById('exp-years').innerHTML = `<i class="fas fa-code" style="font-size: 0.8em; margin-right: 10px;"></i>` + profile.exp_years + '+';
    }
}

function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    if (!skills) return;
    container.innerHTML = ''; // Clear existing content

    const iconMap = {
        'Frontend': 'fa-laptop-code',
        'Backend': 'fa-server',
        'Database': 'fa-database',
        'Tools': 'fa-tools'
    };

    skills.forEach(categoryGroup => {
        const catDiv = document.createElement('div');
        catDiv.className = 'skill-category';

        const iconClass = iconMap[categoryGroup.category] || 'fa-code';

        // Items is a JSON string because of how we fetched it? 
        // No, in PHP called json_decode, so it should be an array of objects.
        const itemsHtml = categoryGroup.items.map(skill => `
            <div class="skill-item">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                    <span>${skill.name}</span>
                    <span style="opacity: 0.8;">${skill.level}%</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${skill.level}%"></div>
                </div>
            </div>
        `).join('');

        catDiv.innerHTML = `
            <h3><i class="fas ${iconClass}"></i> ${categoryGroup.category}</h3>
            ${itemsHtml}
        `;
        container.appendChild(catDiv);
    });
}

function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    if (!projects) return;
    container.innerHTML = ''; // Clear existing content

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-img" style="background-image: url('${project.img || 'https://via.placeholder.com/400'}')"></div>
            <div class="project-content">
                <h3>${project.title}</h3>
                <p>${project.desc}</p>
                <div class="tech-tag">${project.tech}</div>
                <div style="margin-top: 1.5rem;">
                    <a href="${project.link}" target="_blank" style="color: var(--primary); font-weight: bold;">View Project <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `;

        // Add 3D Tilt Effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });

        container.appendChild(card);
    });
}

function renderHobbies(hobbies) {
    const container = document.getElementById('hobbies-container');
    if (!hobbies) return;
    container.innerHTML = ''; // Clear existing content

    const hobbyIcons = {
        'Eating': 'fa-utensils',
        'Gaming': 'fa-gamepad',
        'Work out': 'fa-dumbbell',
        'Traveling': 'fa-plane-departure'
    };

    hobbies.forEach(hobby => {
        const card = document.createElement('div');
        card.className = 'hobby-card';
        const icon = hobbyIcons[hobby.name] || 'fa-star';

        card.innerHTML = `
            <i class="fas ${icon}"></i>
            <h3>${hobby.name}</h3>
            <p>${hobby.desc}</p>
        `;
        container.appendChild(card);
    });
}

function setupContactForm() {
    const form = document.getElementById('contact-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusDiv = document.getElementById('form-status');
        const btn = form.querySelector('button');

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };

        btn.disabled = true;
        btn.innerHTML = 'Sending...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.innerHTML = `<span class="success">${result.message}</span>`;
                form.reset();
            } else {
                statusDiv.innerHTML = `<span class="error">${result.message}</span>`;
            }
        } catch (error) {
            statusDiv.innerHTML = `<span class="error">Error sending message.</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
        }
    });
}
