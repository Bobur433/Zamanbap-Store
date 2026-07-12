const STORAGE_KEY = 'zamanbap_store_phones_v1';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getPhones() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (error) { return []; }
}

function savePhones(phones) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phones));
}

function generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `phone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPrice(value) {
    const number = Number(value || 0);
    return `${new Intl.NumberFormat('ru-RU').format(number)} сом`;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function setImagePreview(previewElement, dataUrl, emptyText) {
    if (!previewElement) return;
    if (!dataUrl) {
        previewElement.innerHTML = `<div class="camera-preview-empty">${emptyText}</div>`;
        previewElement.classList.remove('is-filled');
        return;
    }

    previewElement.innerHTML = `<img src="${dataUrl}" alt="Предпросмотр фотографии">`;
    previewElement.classList.add('is-filled');
}

function handleImageSelection(inputId, previewId, emptyText) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    const file = input.files[0];
    if (!file) {
        setImagePreview(preview, '', emptyText);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(preview, reader.result, emptyText);
    reader.readAsDataURL(file);
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 32; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 3 + 1) + 'px';
        particle.style.height = particle.style.width;
        particle.style.opacity = Math.random() * 0.3 + 0.15;
        particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
        particle.style.animationDelay = Math.random() * 4 + 's';
        container.appendChild(particle);
    }
}

function startAnimations() {
    const elements = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => entry.target.classList.add('animated'), Number(delay));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(el => observer.observe(el));
}

function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = Number(entry.target.dataset.count);
                const duration = 1800;
                const step = target / (duration / 16);
                let current = 0;
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    entry.target.textContent = Math.floor(current);
                }, 16);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
}

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    function handleScroll() {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            event.preventDefault();
            const offset = document.getElementById('navbar').offsetHeight + 20;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

function renderCatalog() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    const phones = getPhones();
    if (!phones.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Пока нет товаров</h3>
                <p>Каталог будет наполняться после добавления телефона через админ-панель.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = phones.map((phone) => {
        const imageMarkup = phone.frontImage
            ? `<img src="${phone.frontImage}" alt="${escapeHtml(phone.model)}">`
            : '<div class="photo-placeholder">Фото скоро появится</div>';
        return `
            <article class="product-card">
                <div class="product-image">${imageMarkup}</div>
                <div>
                    <p class="section-tag">${escapeHtml(phone.brand)}</p>
                    <h3>${escapeHtml(phone.model)}</h3>
                    <p class="product-price">${formatPrice(phone.price)}</p>
                </div>
                <div class="product-meta">
                    <span>${escapeHtml(phone.memory || 'Память не указана')}</span>
                    <span>${escapeHtml(phone.color || 'Цвет не указан')}</span>
                    <span>${escapeHtml(phone.state || 'Состояние не указано')}</span>
                </div>
                <p>${escapeHtml(phone.specs || 'Характеристики будут добавлены владельцем')}</p>
                <a class="btn btn-primary" href="product.html?id=${phone.id}">Подробнее</a>
            </article>
        `;
    }).join('');
}

function renderProductPage() {
    const container = document.getElementById('productContent');
    if (!container) return;
    const id = new URLSearchParams(window.location.search).get('id');
    const phone = getPhones().find(item => item.id === id);
    if (!phone) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Телефон не найден</h3>
                <p>Возможно, товар был удалён из базы магазина.</p>
            </div>
        `;
        return;
    }

    const frontImage = phone.frontImage
        ? `<img src="${phone.frontImage}" alt="${escapeHtml(phone.model)} — передняя сторона">`
        : '<div class="photo-placeholder">Фото скоро появится</div>';
    const backImage = phone.backImage
        ? `<img src="${phone.backImage}" alt="${escapeHtml(phone.model)} — задняя сторона">`
        : '<div class="photo-placeholder">Фото скоро появится</div>';

    container.innerHTML = `
        <article class="detail-card">
            <div class="detail-layout">
                <div class="detail-image-grid">
                    <div class="detail-image">${frontImage}</div>
                    <div class="detail-image">${backImage}</div>
                </div>
                <div>
                    <p class="section-tag">${escapeHtml(phone.brand)}</p>
                    <h1>${escapeHtml(phone.model)}</h1>
                    <p class="product-price">${formatPrice(phone.price)}</p>
                    <div class="product-meta" style="margin: 1rem 0;">
                        <span>${escapeHtml(phone.memory || 'Память не указана')}</span>
                        <span>${escapeHtml(phone.color || 'Цвет не указан')}</span>
                        <span>${escapeHtml(phone.state || 'Состояние не указано')}</span>
                    </div>
                    <div class="detail-list">
                        <div><strong>Характеристики</strong><p>${escapeHtml(phone.specs || 'Не указано')}</p></div>
                        <div><strong>Особенности</strong><p>${escapeHtml(phone.features || 'Не указано')}</p></div>
                        <div><strong>Дефекты</strong><p>${escapeHtml(phone.defects || 'Дефектов нет')}</p></div>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderAdminPhones() {
    const container = document.getElementById('adminPhones');
    if (!container) return;
    const phones = getPhones();
    if (!phones.length) {
        container.innerHTML = '<div class="empty-state"><h3>Список пуст</h3><p>Добавьте первый телефон через форму.</p></div>';
        return;
    }
    container.innerHTML = phones.map(phone => `
        <div class="admin-item">
            <div>
                <strong>${escapeHtml(phone.model)}</strong>
                <p>${escapeHtml(phone.brand)} • ${formatPrice(phone.price)}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" type="button" data-action="edit" data-id="${phone.id}">Редактировать</button>
                <button class="btn btn-primary" type="button" data-action="delete" data-id="${phone.id}">Удалить</button>
            </div>
        </div>
    `).join('');
}

async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const idField = document.getElementById('phoneId');
    const model = document.getElementById('model').value.trim();
    const brand = document.getElementById('brand').value.trim();
    const price = document.getElementById('price').value.trim();
    const memory = document.getElementById('memory').value.trim();
    const color = document.getElementById('color').value.trim();
    const state = document.getElementById('state').value;
    const specs = document.getElementById('specs').value.trim();
    const features = document.getElementById('features').value.trim();
    const defects = document.getElementById('defects').value.trim();
    const frontImageFile = document.getElementById('frontImage').files[0];
    const backImageFile = document.getElementById('backImage').files[0];

    if (!model || !brand || !price) {
        alert('Заполните название модели, бренд и цену');
        return;
    }

    const phones = getPhones();
    const currentPhone = phones.find(item => item.id === idField.value);
    const frontImage = await readFileAsDataUrl(frontImageFile);
    const backImage = await readFileAsDataUrl(backImageFile);

    const phoneData = {
        id: idField.value || generateId(),
        model,
        brand,
        price,
        memory,
        color,
        state,
        specs,
        features,
        defects,
        frontImage: frontImage || currentPhone?.frontImage || '',
        backImage: backImage || currentPhone?.backImage || ''
    };

    const index = phones.findIndex(item => item.id === phoneData.id);
    if (index >= 0) phones[index] = phoneData;
    else phones.unshift(phoneData);

    savePhones(phones);
    form.reset();
    idField.value = '';
    document.querySelector('.phone-form button[type="submit"]').textContent = 'Добавить телефон';
    renderCatalog();
    renderAdminPhones();
    alert('Телефон сохранён и появился в каталоге');
}

function fillFormForEdit(id) {
    const phone = getPhones().find(item => item.id === id);
    if (!phone) return;
    document.getElementById('phoneId').value = phone.id;
    document.getElementById('model').value = phone.model || '';
    document.getElementById('brand').value = phone.brand || '';
    document.getElementById('price').value = phone.price || '';
    document.getElementById('memory').value = phone.memory || '';
    document.getElementById('color').value = phone.color || '';
    document.getElementById('state').value = phone.state || 'Новое';
    document.getElementById('specs').value = phone.specs || '';
    document.getElementById('features').value = phone.features || '';
    document.getElementById('defects').value = phone.defects || '';
    setImagePreview(document.getElementById('frontImagePreview'), phone.frontImage || '', 'Снимок появится здесь');
    setImagePreview(document.getElementById('backImagePreview'), phone.backImage || '', 'Снимок появится здесь');
    document.querySelector('.phone-form button[type="submit"]').textContent = 'Сохранить изменения';
    document.getElementById('model').focus();
}

function deletePhone(id) {
    const phones = getPhones().filter(item => item.id !== id);
    savePhones(phones);
    renderCatalog();
    renderAdminPhones();
}

function initAdminPage() {
    const form = document.getElementById('phoneForm');
    const resetButton = document.getElementById('resetForm');
    if (!form) return;

    document.querySelectorAll('[data-trigger-image]').forEach((button) => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.triggerImage);
            if (input) input.click();
        });
    });

    document.getElementById('frontImage')?.addEventListener('change', () => {
        handleImageSelection('frontImage', 'frontImagePreview', 'Снимок появится здесь');
    });
    document.getElementById('backImage')?.addEventListener('change', () => {
        handleImageSelection('backImage', 'backImagePreview', 'Снимок появится здесь');
    });

    form.addEventListener('submit', handleSubmit);
    resetButton?.addEventListener('click', () => {
        form.reset();
        document.getElementById('phoneId').value = '';
        document.getElementById('frontImage').value = '';
        document.getElementById('backImage').value = '';
        setImagePreview(document.getElementById('frontImagePreview'), '', 'Снимок появится здесь');
        setImagePreview(document.getElementById('backImagePreview'), '', 'Снимок появится здесь');
        document.querySelector('.phone-form button[type="submit"]').textContent = 'Добавить телефон';
    });

    document.getElementById('adminPhones')?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (action === 'edit') return fillFormForEdit(id);
        if (action === 'delete' && confirm('Удалить телефон из магазина?')) deletePhone(id);
    });
    renderAdminPhones();
}

function initTheme() {
    const THEME_KEY = 'zamanbap_theme';
    const htmlRoot = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    function updateThemeIcon(currentTheme) {
        if (themeIcon) {
            themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'system') {
            theme = getSystemTheme();
            htmlRoot.removeAttribute('data-theme');
        } else {
            htmlRoot.setAttribute('data-theme', theme);
        }
        updateThemeIcon(theme);
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
    }

    function toggleTheme() {
        const current = localStorage.getItem(THEME_KEY) || 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        setTheme(next);
    }

    // Initialize theme on page load
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);

    // Add click listener to toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
        const current = localStorage.getItem(THEME_KEY);
        if (current === 'system' || !current) {
            applyTheme(getSystemTheme());
        }
    });
}

function initApp() {
    initTheme();
    createParticles();
    startAnimations();
    animateCounters();
    initNavigation();
    initSmoothScroll();
    if (document.getElementById('catalogGrid')) renderCatalog();
    if (document.getElementById('productContent')) renderProductPage();
    if (document.getElementById('phoneForm')) initAdminPage();

    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) setTimeout(() => loader.classList.add('hidden'), 900);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
