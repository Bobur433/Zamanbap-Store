'use strict';

const STORAGE_KEY = 'zamanbap_store_phones_v1';
const THEME_KEY = 'zamanbap_theme';

/* ---------- helpers ---------- */

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getPhones() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        console.error('getPhones failed', error);
        return [];
    }
}

function savePhones(phones) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phones));
}

function generateId() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `phone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    readFileAsDataUrl(file).then((dataUrl) => setImagePreview(preview, dataUrl, emptyText));
}

/* ---------- visual fx (index page only) ---------- */

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const fragment = document.createDocumentFragment();
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
        fragment.appendChild(particle);
    }
    container.appendChild(fragment);
}

function startAnimations() {
    const elements = document.querySelectorAll('[data-animate]');
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => entry.target.classList.add('animated'), Number(delay));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach((el) => observer.observe(el));
}

function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
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
        });
    }, { threshold: 0.5 });
    counters.forEach((counter) => observer.observe(counter));
}

/* ---------- navigation ---------- */

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    const handleScroll = () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        navMenu.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            const navbar = document.getElementById('navbar');
            if (!target || !navbar) return;
            event.preventDefault();
            const offset = navbar.offsetHeight + 20;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

/* ---------- catalog / product page ---------- */

function renderCatalog() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    const phones = getPhones();

    if (!phones.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Пока нет товаров</h3>
                <p>Каталог будет наполняться после добавления телефона через админ-панель.</p>
            </div>`;
        return;
    }

    grid.innerHTML = phones.map((phone) => {
        const imageMarkup = phone.frontImage
            ? `<img src="${phone.frontImage}" alt="${escapeHtml(phone.model)}" loading="lazy">`
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
                <a class="btn btn-primary" href="product.html?id=${encodeURIComponent(phone.id)}">Подробнее</a>
            </article>`;
    }).join('');
}

function renderProductPage() {
    const container = document.getElementById('productContent');
    if (!container) return;
    const id = new URLSearchParams(window.location.search).get('id');
    const phone = getPhones().find((item) => item.id === id);

    if (!phone) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Телефон не найден</h3>
                <p>Возможно, товар был удалён из базы магазина.</p>
            </div>`;
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
        </article>`;
}

/* ---------- admin page ---------- */

function renderAdminPhones() {
    const container = document.getElementById('adminPhones');
    if (!container) return;
    const phones = getPhones();

    if (!phones.length) {
        container.innerHTML = '<div class="empty-state"><h3>Список пуст</h3><p>Добавьте первый телефон через форму выше.</p></div>';
        return;
    }

    container.innerHTML = phones.map((phone) => `
        <div class="admin-item">
            <div>
                <strong>${escapeHtml(phone.model)}</strong>
                <p>${escapeHtml(phone.brand)} • ${formatPrice(phone.price)}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" type="button" data-action="edit" data-id="${phone.id}">Редактировать</button>
                <button class="btn btn-primary" type="button" data-action="delete" data-id="${phone.id}">Удалить</button>
            </div>
        </div>`).join('');
}

function setFormMode(submitButton, mode) {
    if (!submitButton) return;
    submitButton.textContent = mode === 'edit' ? 'Сохранить изменения' : 'Добавить телефон';
}

function flashSection(section) {
    if (!section) return;
    section.classList.remove('form-flash');
    // force reflow so the animation can restart on repeated taps
    void section.offsetWidth;
    section.classList.add('form-flash');
}

async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
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

    if (submitButton) submitButton.disabled = true;

    try {
        const phones = getPhones();
        const currentPhone = phones.find((item) => item.id === idField.value);
        const [frontImage, backImage] = await Promise.all([
            readFileAsDataUrl(frontImageFile),
            readFileAsDataUrl(backImageFile)
        ]);

        const phoneData = {
            id: idField.value || generateId(),
            model, brand, price, memory, color, state, specs, features, defects,
            frontImage: frontImage || currentPhone?.frontImage || '',
            backImage: backImage || currentPhone?.backImage || ''
        };

        const index = phones.findIndex((item) => item.id === phoneData.id);
        if (index >= 0) phones[index] = phoneData;
        else phones.unshift(phoneData);

        savePhones(phones);

        form.reset();
        idField.value = '';
        setFormMode(submitButton, 'add');
        setImagePreview(document.getElementById('frontImagePreview'), '', 'Снимок появится здесь');
        setImagePreview(document.getElementById('backImagePreview'), '', 'Снимок появится здесь');
        renderCatalog();
        renderAdminPhones();
        alert('Телефон сохранён и появился в каталоге');
    } catch (error) {
        console.error('handleSubmit failed', error);
        alert('Не удалось сохранить товар. Скорее всего, фотографии слишком тяжёлые для памяти браузера — попробуйте снимки поменьше или без одной из фотографий.');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function fillFormForEdit(id) {
    const phone = getPhones().find((item) => item.id === id);
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

    const form = document.getElementById('phoneForm');
    setFormMode(form.querySelector('button[type="submit"]'), 'edit');
    flashSection(form.closest('section'));

    const formTop = form.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: formTop, behavior: 'smooth' });
    document.getElementById('model').focus({ preventScroll: true });
}

function deletePhone(id) {
    const phones = getPhones().filter((item) => item.id !== id);
    savePhones(phones);
    renderCatalog();
    renderAdminPhones();
}

function initAdminPage() {
    const form = document.getElementById('phoneForm');
    if (!form) return;

    const resetButton = document.getElementById('resetForm');
    const newPhoneButton = document.getElementById('openAddPhoneButton');
    const submitButton = form.querySelector('button[type="submit"]');
    const formSection = form.closest('section');

    document.querySelectorAll('[data-trigger-image]').forEach((button) => {
        button.addEventListener('click', () => {
            document.getElementById(button.dataset.triggerImage)?.click();
        });
    });

    document.getElementById('frontImage')?.addEventListener('change', () => {
        handleImageSelection('frontImage', 'frontImagePreview', 'Снимок появится здесь');
    });
    document.getElementById('backImage')?.addEventListener('change', () => {
        handleImageSelection('backImage', 'backImagePreview', 'Снимок появится здесь');
    });

    // "Добавить телефон" в шапке: явно сбрасывает форму в режим добавления
    // (полезно, если до этого редактировали товар) и всегда даёт видимый
    // отклик — подсветку блока и фокус на первом поле — даже если форма
    // и так была видна на экране. Один click-обработчик, без конфликтов.
    newPhoneButton?.addEventListener('click', () => {
        form.reset();
        document.getElementById('phoneId').value = '';
        document.getElementById('frontImage').value = '';
        document.getElementById('backImage').value = '';
        setImagePreview(document.getElementById('frontImagePreview'), '', 'Снимок появится здесь');
        setImagePreview(document.getElementById('backImagePreview'), '', 'Снимок появится здесь');
        setFormMode(submitButton, 'add');
        flashSection(formSection);

        const formTop = formSection.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: formTop, behavior: 'smooth' });
        document.getElementById('model')?.focus({ preventScroll: true });
    });

    submitButton?.addEventListener('click', (event) => {
        if (!form.checkValidity()) {
            event.preventDefault();
            form.reportValidity();
        }
    });

    form.addEventListener('submit', handleSubmit);

    resetButton?.addEventListener('click', () => {
        form.reset();
        document.getElementById('phoneId').value = '';
        document.getElementById('frontImage').value = '';
        document.getElementById('backImage').value = '';
        setImagePreview(document.getElementById('frontImagePreview'), '', 'Снимок появится здесь');
        setImagePreview(document.getElementById('backImagePreview'), '', 'Снимок появится здесь');
        setFormMode(submitButton, 'add');
    });

    document.getElementById('adminPhones')?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const { action, id } = button.dataset;
        if (action === 'edit') return fillFormForEdit(id);
        if (action === 'delete' && confirm('Удалить телефон из магазина?')) deletePhone(id);
    });

    renderAdminPhones();
}

/* ---------- theme ---------- */

function initTheme() {
    const htmlRoot = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    const getSystemTheme = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const applyTheme = (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        if (theme === 'system') htmlRoot.removeAttribute('data-theme');
        else htmlRoot.setAttribute('data-theme', theme);
        if (themeIcon) themeIcon.textContent = resolved === 'light' ? '🌙' : '☀️';
    };

    const setTheme = (theme) => {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
    };

    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

    themeToggle?.addEventListener('click', () => {
        const current = localStorage.getItem(THEME_KEY) || 'dark';
        setTheme(current === 'light' ? 'dark' : 'light');
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
        const current = localStorage.getItem(THEME_KEY);
        if (!current || current === 'system') applyTheme(getSystemTheme());
    };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
}

/* ---------- boot ---------- */

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