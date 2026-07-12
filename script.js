'use strict';

import {
    db,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "./firebase.js";


const THEME_KEY = "zamanbap_theme";


// ---------- helpers ----------

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


function formatPrice(value) {
    return `${new Intl.NumberFormat("ru-RU").format(Number(value || 0))} сом`;
}


// ---------- FIREBASE ----------


async function getPhones() {

    const snapshot = await getDocs(
        collection(db, "phones")
    );


    return snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));

}



// ---------- CATALOG ----------


async function renderCatalog() {

    const grid = document.getElementById("catalogGrid");

    if (!grid) return;


    const phones = await getPhones();



    if (!phones.length) {

        grid.innerHTML = `
        <div class="empty-state">
            <h3>Пока нет товаров</h3>
            <p>Добавьте телефоны через админ-панель.</p>
        </div>
        `;

        return;
    }



    grid.innerHTML = phones.map(phone => `

    <article class="product-card">

        <div class="product-image">

        ${
            phone.frontImage
            ?
            `<img src="${phone.frontImage}"
            loading="lazy">`
            :
            `<div class="photo-placeholder">
            Фото нет
            </div>`
        }

        </div>


        <p class="section-tag">
        ${escapeHtml(phone.brand)}
        </p>


        <h3>
        ${escapeHtml(phone.model)}
        </h3>


        <p class="product-price">
        ${formatPrice(phone.price)}
        </p>



        <div class="product-meta">

            <span>
            ${escapeHtml(phone.memory || "")}
            </span>

            <span>
            ${escapeHtml(phone.color || "")}
            </span>

            <span>
            ${escapeHtml(phone.state || "")}
            </span>

        </div>



        <a class="btn btn-primary"
        href="product.html?id=${phone.id}">
        Подробнее
        </a>


    </article>


    `).join("");

}





// ---------- PRODUCT PAGE ----------


async function renderProductPage(){

    const container =
    document.getElementById("productContent");


    if(!container) return;



    const id =
    new URLSearchParams(location.search)
    .get("id");



    const phones =
    await getPhones();



    const phone =
    phones.find(p=>p.id===id);



    if(!phone){

        container.innerHTML =
        `
        <div class="empty-state">
        <h3>Телефон не найден</h3>
        </div>
        `;

        return;
    }




    container.innerHTML =
    `

    <article class="detail-card">

    <h1>
    ${escapeHtml(phone.model)}
    </h1>


    <p class="product-price">
    ${formatPrice(phone.price)}
    </p>



    <img 
    src="${phone.frontImage || ""}"
    style="max-width:400px;">



    <p>
    ${escapeHtml(phone.specs || "")}
    </p>



    </article>

    `;


}
// ---------- ADMIN ----------


async function renderAdminPhones(){

    const container =
    document.getElementById("adminPhones");


    if(!container) return;



    const phones =
    await getPhones();



    if(!phones.length){

        container.innerHTML =
        `
        <div class="empty-state">
            <h3>Список пуст</h3>
            <p>Добавьте первый телефон.</p>
        </div>
        `;

        return;
    }




    container.innerHTML =
    phones.map(phone=>`

    <div class="admin-item">

        <div>

            <strong>
            ${escapeHtml(phone.model)}
            </strong>


            <p>
            ${escapeHtml(phone.brand)}
            |
            ${formatPrice(phone.price)}
            </p>

        </div>



        <button 
        class="btn btn-primary"
        data-delete="${phone.id}">
        Удалить
        </button>


    </div>


    `).join("");

}



// ---------- ADD PHONE ----------


async function handleSubmit(event){

    event.preventDefault();



    const form =
    event.currentTarget;



    const data = {

        model:
        document.getElementById("model").value.trim(),


        brand:
        document.getElementById("brand").value.trim(),


        price:
        document.getElementById("price").value.trim(),


        memory:
        document.getElementById("memory").value.trim(),


        color:
        document.getElementById("color").value.trim(),


        state:
        document.getElementById("state").value,


        specs:
        document.getElementById("specs").value.trim(),


        features:
        document.getElementById("features").value.trim(),


        defects:
        document.getElementById("defects").value.trim(),


        frontImage:"",

        backImage:"",


        createdAt:
        new Date()

    };



    if(!data.model || !data.brand || !data.price){

        alert("Заполните модель, бренд и цену");

        return;
    }




    try{


        await addDoc(
            collection(db,"phones"),
            data
        );


        alert("Телефон добавлен");


        form.reset();


        renderAdminPhones();


        renderCatalog();



    }
    catch(error){

        console.error(error);

        alert("Ошибка сохранения");

    }



}




// ---------- DELETE ----------


async function deletePhone(id){


    await deleteDoc(
        doc(db,"phones",id)
    );


    renderAdminPhones();

    renderCatalog();

}




// ---------- EVENTS ----------


function initAdminPage(){


    const form =
    document.getElementById("phoneForm");


    if(!form) return;



    form.addEventListener(
        "submit",
        handleSubmit
    );



    const list =
    document.getElementById("adminPhones");



    if(list){

        list.addEventListener(
        "click",
        event=>{


            const button =
            event.target.closest("[data-delete]");


            if(!button) return;



            if(confirm("Удалить товар?")){

                deletePhone(
                    button.dataset.delete
                );

            }


        });

    }



    renderAdminPhones();

}



// ---------- THEME ----------


function initTheme(){


    const button =
    document.getElementById("themeToggle");


    if(!button) return;



    button.addEventListener(
    "click",
    ()=>{


        const html =
        document.documentElement;


        const current =
        html.dataset.theme;


        if(current==="dark"){

            html.dataset.theme="light";

        }
        else{

            html.dataset.theme="dark";

        }


    });


}





// ---------- START ----------


function initApp(){


    initTheme();


    if(document.getElementById("catalogGrid")){

        renderCatalog();

    }



    if(document.getElementById("productContent")){

        renderProductPage();

    }



    if(document.getElementById("phoneForm")){

        initAdminPage();

    }


}



document.addEventListener(
"DOMContentLoaded",
initApp
);