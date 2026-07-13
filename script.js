'use strict';

import {
    db,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "./firebase.js";

const THEME_KEY = "zamanbap_theme";

// ---------- LOADER (аварийное скрытие) ----------

function hideLoader() {
    const loader = document.getElementById('loader') || document.querySelector('.loader');
    if (loader) loader.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', hideLoader);
window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 3000);

// ---------- HELPERS ----------

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(Number(value || 0)) + " сом";
}

// ---------- FIREBASE ----------

async function getPhones() {
    const snapshot = await getDocs(collection(db, "phones"));
    return snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}

// ---------- CATALOG ----------

async function renderCatalog() {
    const grid = document.getElementById("catalogGrid");
    if (!grid) return;

    let phones = [];
    try {
        phones = await getPhones();
    } catch (error) {
        console.error('renderCatalog: getPhones failed', error);
        grid.innerHTML = `<div class="empty-state"><h3>Ошибка загрузки каталога</h3><p>Проверьте подключение к интернету и попробуйте обновить страницу.</p></div>`;
        return;
    }

    if (!phones.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Пока нет товаров</h3>
                <p>Добавьте телефон через админку</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = phones.map(phone => `
        <article class="product-card">
            <div class="product-image">
                ${
                    phone.frontImage
                        ? `<img src="${phone.frontImage}" alt="${escapeHtml(phone.model)}" loading="lazy">`
                        : `<div class="photo-placeholder">Фото нет</div>`
                }
            </div>
            <p class="section-tag">${escapeHtml(phone.brand)}</p>
            <h3>${escapeHtml(phone.model)}</h3>
            <p class="product-price">${formatPrice(phone.price)}</p>
            <div class="product-meta">
                <span>${escapeHtml(phone.memory || '')}</span>
                <span>${escapeHtml(phone.color || '')}</span>
                <span>${escapeHtml(phone.state || '')}</span>
            </div>
            <a class="btn btn-primary" href="product.html?id=${phone.id}">Подробнее</a>
        </article>
    `).join("");
}

// ---------- PRODUCT ----------

async function renderProductPage() {
    const container = document.getElementById("productContent");
    if (!container) return;

    const id = new URLSearchParams(location.search).get("id");

    let phones = [];
    try {
        phones = await getPhones();
    } catch (error) {
        console.error('renderProductPage: getPhones failed', error);
        container.innerHTML = `<div class="empty-state"><h3>Ошибка загрузки</h3></div>`;
        return;
    }

    const phone = phones.find(p => p.id === id);

    if (!phone) {
        container.innerHTML = `<div class="empty-state"><h3>Телефон не найден</h3></div>`;
        return;
    }

    container.innerHTML = `
        <article class="detail-card">
            <h1>${escapeHtml(phone.model)}</h1>
            <p class="product-price">${formatPrice(phone.price)}</p>
            <img src="${phone.frontImage || ''}" class="detail-image">
            <p>${escapeHtml(phone.specs || '')}</p>
        </article>
    `;
}

// ---------- ADMIN ----------

async function renderAdminPhones() {
    const box = document.getElementById("adminPhones");
    if (!box) return;

    let phones = [];
    try {
        phones = await getPhones();
    } catch (error) {
        console.error('renderAdminPhones: getPhones failed', error);
        box.innerHTML = `<div class="empty-state"><h3>Ошибка загрузки списка</h3></div>`;
        return;
    }

    if (!phones.length) {
        box.innerHTML = `<div class="empty-state"><h3>Список пуст</h3></div>`;
        return;
    }

    box.innerHTML = phones.map(phone => `
        <div class="admin-item">
            <div>
                <strong>${escapeHtml(phone.model)}</strong>
                <p>${escapeHtml(phone.brand)} | ${formatPrice(phone.price)}</p>
            </div>
            <button class="btn btn-primary" data-delete="${phone.id}">Удалить</button>
        </div>
    `).join("");
}

// ---------- CAMERA / PHOTOS ----------

const capturedImages = { frontImage: "", backImage: "" };

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Фото с камеры телефона может весить несколько МБ — сжимаем перед сохранением в Firestore (лимит документа 1 МБ)
async function compressImage(file, maxDim = 1280, quality = 0.72) {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale) || 1;
    canvas.height = Math.round(img.height * scale) || 1;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", quality);
}

function renderImagePreview(inputId, dataUrl) {
    const preview = document.getElementById(`${inputId}Preview`);
    if (!preview) return;

    if (dataUrl) {
        preview.classList.add("is-filled");
        preview.innerHTML = `<img src="${dataUrl}" alt="Превью фото">`;
    } else {
        preview.classList.remove("is-filled");
        preview.innerHTML = `<div class="camera-preview-empty">Снимок появится здесь</div>`;
    }
}

function resetCameraFields() {
    capturedImages.frontImage = "";
    capturedImages.backImage = "";
    renderImagePreview("frontImage", "");
    renderImagePreview("backImage", "");
}

function initCameraFields() {
    document.querySelectorAll("[data-trigger-image]").forEach(button => {
        button.addEventListener("click", () => {
            document.getElementById(button.dataset.triggerImage)?.click();
        });
    });

    ["frontImage", "backImage"].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                const compressed = await compressImage(file);
                capturedImages[inputId] = compressed;
                renderImagePreview(inputId, compressed);
            } catch (error) {
                console.error("Не удалось обработать фото", error);
                alert("Не удалось загрузить фото. Попробуйте ещё раз.");
            } finally {
                input.value = "";
            }
        });
    });
}

// ---------- ADD ----------

async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;

    const phone = {
        model: document.getElementById("model").value.trim(),
        brand: document.getElementById("brand").value.trim(),
        price: Number(document.getElementById("price").value),
        memory: document.getElementById("memory").value.trim(),
        color: document.getElementById("color").value.trim(),
        state: document.getElementById("state").value,
        specs: document.getElementById("specs").value.trim(),
        features: document.getElementById("features").value.trim(),
        defects: document.getElementById("defects").value.trim(),
        frontImage: capturedImages.frontImage,
        backImage: capturedImages.backImage,
        createdAt: Date.now()
    };

    if (!phone.model || !phone.brand || !phone.price) {
        alert("Заполните модель, бренд и цену");
        return;
    }

    try {
        await addDoc(collection(db, "phones"), phone);
        alert("Телефон добавлен");
        form.reset();
        resetCameraFields();
        renderAdminPhones();
        renderCatalog();
    } catch (error) {
        console.error('handleSubmit failed', error);
        alert("Ошибка сохранения. Смотри Console (F12).");
    }
}

// ---------- DELETE ----------

async function deletePhone(id) {
    try {
        await deleteDoc(doc(db, "phones", id));
        renderAdminPhones();
        renderCatalog();
    } catch (error) {
        console.error('deletePhone failed', error);
        alert("Ошибка удаления. Смотри Console (F12).");
    }
}

// ---------- ADMIN INIT ----------

function initAdmin() {
    const form = document.getElementById("phoneForm");
    if (!form) return;

    form.addEventListener("submit", handleSubmit);
    document.getElementById("resetForm")?.addEventListener("click", () => {
        form.reset();
        resetCameraFields();
    });

    initCameraFields();

    document.getElementById("adminPhones")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-delete]");
        if (btn && confirm("Удалить товар?")) {
            deletePhone(btn.dataset.delete);
        }
    });

    renderAdminPhones();
}

// ---------- THEME ----------

function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem(THEME_KEY);

    if (saved) html.dataset.theme = saved;

    document.getElementById("themeToggle")?.addEventListener("click", () => {
        const theme = html.dataset.theme === "dark" ? "light" : "dark";
        html.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
    });
}

// ---------- START ----------

function initApp() {
    initTheme();

    if (document.getElementById("catalogGrid")) renderCatalog();
    if (document.getElementById("productContent")) renderProductPage();
    if (document.getElementById("phoneForm")) initAdmin();
}

document.addEventListener("DOMContentLoaded", initApp);