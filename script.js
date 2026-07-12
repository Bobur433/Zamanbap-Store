'use strict';

import {
    db,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    getDoc
} from "./firebase.js";


const THEME_KEY = "zamanbap_theme";


/* ---------- helpers ---------- */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


async function getPhones() {

    const snapshot = await getDocs(
        collection(db, "phones")
    );

    return snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}



function formatPrice(value) {

    return `${new Intl.NumberFormat("ru-RU")
        .format(Number(value || 0))} сом`;

}



/* ---------- images ---------- */

function loadImageElement(dataUrl) {

    return new Promise((resolve, reject)=>{

        const img = new Image();

        img.onload = ()=>resolve(img);

        img.onerror = reject;

        img.src = dataUrl;

    });

}



function readFileAsDataUrl(file){

    return new Promise((resolve,reject)=>{

        const reader = new FileReader();

        reader.onload = ()=>resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}



function drawToJpeg(img,maxSide,quality){

    let width = img.width;
    let height = img.height;


    if(width > maxSide || height > maxSide){

        const ratio = Math.min(
            maxSide / width,
            maxSide / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

    }


    const canvas=document.createElement("canvas");

    canvas.width=width;
    canvas.height=height;


    const ctx=canvas.getContext("2d");

    ctx.drawImage(img,0,0,width,height);


    return canvas.toDataURL(
        "image/jpeg",
        quality
    );

}



function sizeOfBase64(data){

    return Math.round(
        data.length * 3 / 4
    );

}



async function compressImageFile(file){

    if(!file) return "";


    const raw = await readFileAsDataUrl(file);

    const img = await loadImageElement(raw);


    let result = drawToJpeg(
        img,
        1280,
        0.75
    );


    let quality=0.75;
    let side=1280;


    while(sizeOfBase64(result)>320000){

        quality-=0.1;
        side*=0.85;


        if(quality<0.35)
            break;


        result = drawToJpeg(
            img,
            side,
            quality
        );

    }


    return result;

}



function setImagePreview(el,url,text){

    if(!el)return;


    if(!url){

        el.innerHTML =
        `<div class="camera-preview-empty">
        ${text}
        </div>`;

        return;

    }


    el.innerHTML =
    `<img src="${url}">`;

}



/* ---------- catalog ---------- */


async function renderCatalog(){

    const grid=document.getElementById(
        "catalogGrid"
    );


    if(!grid)return;


    const phones = await getPhones();



    if(!phones.length){

        grid.innerHTML=`
        <div class="empty-state">
        <h3>Пока нет товаров</h3>
        </div>`;

        return;

    }



    grid.innerHTML = phones.map(phone=>{


        return `

        <article class="product-card">


        <div class="product-image">

        ${
            phone.frontImage
            ?
            `<img src="${phone.frontImage}">`
            :
            "Фото нет"
        }

        </div>



        <p class="section-tag">
        ${escapeHtml(phone.brand)}
        </p>


        <h3>
        ${escapeHtml(phone.model)}
        </h3>


        <b>
        ${formatPrice(phone.price)}
        </b>


        <p>
        ${escapeHtml(phone.memory)}
        </p>


        <a class="btn btn-primary"
        href="product.html?id=${phone.id}">
        Подробнее
        </a>


        </article>

        `;


    }).join("");

}





async function renderProductPage(){

    const box=document.getElementById(
        "productContent"
    );


    if(!box)return;


    const id =
    new URLSearchParams(
        location.search
    ).get("id");



    const snap =
    await getDoc(
        doc(db,"phones",id)
    );



    if(!snap.exists()){

        box.innerHTML=
        "<h2>Товар не найден</h2>";

        return;

    }


    const phone={
        id:snap.id,
        ...snap.data()
    };



    box.innerHTML=`

    <div class="detail-card">


    <img src="${phone.frontImage || ""}">


    <h1>
    ${escapeHtml(phone.model)}
    </h1>


    <h2>
    ${formatPrice(phone.price)}
    </h2>


    <p>
    ${escapeHtml(phone.specs)}
    </p>


    </div>

    `;


}
/* ---------- admin ---------- */


const pendingImages = {
    frontImage: "",
    backImage: ""
};


function resetPendingImages(){

    pendingImages.frontImage = "";
    pendingImages.backImage = "";

}



async function handleImageSelection(
    inputId,
    previewId,
    text,
    key
){

    const input =
    document.getElementById(inputId);


    const preview =
    document.getElementById(previewId);



    if(!input || !preview) return;



    const file = input.files[0];


    if(!file){

        pendingImages[key]="";

        setImagePreview(
            preview,
            "",
            text
        );

        return;

    }



    preview.innerHTML =
    "Сжимаю фото...";



    try{


        const compressed =
        await compressImageFile(file);



        pendingImages[key]=compressed;


        setImagePreview(
            preview,
            compressed,
            text
        );


    }catch(error){

        console.error(error);

        alert(
            "Ошибка обработки фото"
        );

    }

}





async function renderAdminPhones(){


    const box =
    document.getElementById(
        "adminPhones"
    );


    if(!box)return;



    const phones =
    await getPhones();




    if(!phones.length){

        box.innerHTML=
        `
        <div class="empty-state">
        <h3>Список пуст</h3>
        </div>
        `;

        return;

    }




    box.innerHTML =
    phones.map(phone=>`


    <div class="admin-item">


    <div>

    <strong>
    ${escapeHtml(phone.model)}
    </strong>


    <p>
    ${escapeHtml(phone.brand)}
    -
    ${formatPrice(phone.price)}
    </p>


    </div>



    <div>


    <button
    class="btn btn-secondary"
    data-action="edit"
    data-id="${phone.id}">
    Изменить
    </button>



    <button
    class="btn btn-primary"
    data-action="delete"
    data-id="${phone.id}">
    Удалить
    </button>


    </div>


    </div>


    `).join("");

}





async function handleSubmit(event){


    event.preventDefault();



    const form =
    event.currentTarget;



    const model =
    document.getElementById("model")
    .value.trim();



    const brand =
    document.getElementById("brand")
    .value.trim();



    const price =
    document.getElementById("price")
    .value.trim();



    const memory =
    document.getElementById("memory")
    .value.trim();



    const color =
    document.getElementById("color")
    .value.trim();



    const state =
    document.getElementById("state")
    .value;



    const specs =
    document.getElementById("specs")
    .value.trim();



    const features =
    document.getElementById("features")
    .value.trim();



    const defects =
    document.getElementById("defects")
    .value.trim();



    if(!model || !brand || !price){

        alert(
            "Заполни модель, бренд и цену"
        );

        return;

    }





    try{


        await addDoc(
            collection(db,"phones"),
            {

                model,
                brand,
                price,
                memory,
                color,
                state,
                specs,
                features,
                defects,


                frontImage:
                pendingImages.frontImage || "",


                backImage:
                pendingImages.backImage || "",


                createdAt:
                Date.now()

            }
        );




        form.reset();


        resetPendingImages();



        setImagePreview(
            document.getElementById(
                "frontImagePreview"
            ),
            "",
            "Снимок появится здесь"
        );



        setImagePreview(
            document.getElementById(
                "backImagePreview"
            ),
            "",
            "Снимок появится здесь"
        );



        await renderAdminPhones();

        await renderCatalog();



        alert(
            "Телефон добавлен"
        );



    }catch(error){

        console.error(error);


        alert(
            "Ошибка сохранения"
        );

    }


}





async function deletePhone(id){


    await deleteDoc(
        doc(
            db,
            "phones",
            id
        )
    );



    await renderAdminPhones();

    await renderCatalog();


}





async function fillFormForEdit(id){


    const snap =
    await getDoc(
        doc(
            db,
            "phones",
            id
        )
    );



    if(!snap.exists())
        return;



    const phone =
    snap.data();



    document.getElementById("model")
    .value = phone.model || "";



    document.getElementById("brand")
    .value = phone.brand || "";



    document.getElementById("price")
    .value = phone.price || "";



    document.getElementById("memory")
    .value = phone.memory || "";



    document.getElementById("color")
    .value = phone.color || "";



    document.getElementById("state")
    .value = phone.state || "";



    document.getElementById("specs")
    .value = phone.specs || "";



    document.getElementById("features")
    .value = phone.features || "";



    document.getElementById("defects")
    .value = phone.defects || "";



    document.getElementById("phoneId")
    .value = id;


}
/* ---------- admin init ---------- */


function initAdminPage(){


    const form =
    document.getElementById(
        "phoneForm"
    );


    if(!form) return;



    document
    .getElementById("frontImage")
    ?.addEventListener(
        "change",
        ()=>handleImageSelection(
            "frontImage",
            "frontImagePreview",
            "Снимок появится здесь",
            "frontImage"
        )
    );



    document
    .getElementById("backImage")
    ?.addEventListener(
        "change",
        ()=>handleImageSelection(
            "backImage",
            "backImagePreview",
            "Снимок появится здесь",
            "backImage"
        )
    );



    form.addEventListener(
        "submit",
        handleSubmit
    );



    document
    .getElementById("adminPhones")
    ?.addEventListener(
        "click",
        async(event)=>{


            const btn =
            event.target.closest(
                "button[data-action]"
            );


            if(!btn) return;



            const id =
            btn.dataset.id;



            if(
                btn.dataset.action === "delete"
            ){

                if(
                    confirm(
                    "Удалить товар?"
                    )
                ){

                    await deletePhone(id);

                }

            }



            if(
                btn.dataset.action === "edit"
            ){

                await fillFormForEdit(id);

            }


        }
    );



    renderAdminPhones();

}




/* ---------- theme ---------- */


function initTheme(){


    const root =
    document.documentElement;



    const button =
    document.getElementById(
        "themeToggle"
    );



    function apply(theme){


        root.setAttribute(
            "data-theme",
            theme
        );


    }



    const saved =
    localStorage.getItem(
        THEME_KEY
    )
    ||
    "dark";



    apply(saved);



    button?.addEventListener(
        "click",
        ()=>{


            const current =
            localStorage.getItem(
                THEME_KEY
            )
            ||
            "dark";



            const next =
            current === "dark"
            ?
            "light"
            :
            "dark";



            localStorage.setItem(
                THEME_KEY,
                next
            );



            apply(next);


        }
    );


}




/* ---------- particles ---------- */


function createParticles(){


    const box =
    document.getElementById(
        "particles"
    );


    if(!box)return;



    for(
        let i=0;
        i<30;
        i++
    ){


        const p =
        document.createElement(
            "div"
        );


        p.className =
        "particle";


        p.style.left =
        Math.random()*100+"%";


        p.style.top =
        Math.random()*100+"%";


        box.appendChild(p);


    }


}



/* ---------- start ---------- */


async function initApp(){


    initTheme();


    createParticles();



    if(
        document.getElementById(
            "catalogGrid"
        )
    ){

        await renderCatalog();

    }



    if(
        document.getElementById(
            "productContent"
        )
    ){

        await renderProductPage();

    }



    if(
        document.getElementById(
            "phoneForm"
        )
    ){

        initAdminPage();

    }


}



document.addEventListener(
    "DOMContentLoaded",
    initApp
);
