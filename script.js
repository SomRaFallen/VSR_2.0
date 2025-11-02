// ------------------ Данные ------------------
let currentUser = null;

// Пример данных учеников и наставников (можно позже заменить fetch с сервера)
let users = [
    { id:1, username:'Admin', role:'admin', students:[1,2], mentors:[2] },
    { id:2, username:'Kurator', role:'kurator', students:[3,4], mentors:[] },
    { id:3, username:'Mentor', role:'mentor', students:[5], mentors:[] }
];

let students = [
    { id:1, name:'Иванов', city:'Москва', supervisor:'Петров', mentorId:2, AHT:[{date:'2025-11-01', seconds:120}], NSAT:[{date:'2025-11-01', total:5, promotors:3, detractors:1, neutral:1}] },
    { id:2, name:'Петров', city:'Санкт-Петербург', supervisor:'Иванов', mentorId:2, AHT:[{date:'2025-11-01', seconds:100}], NSAT:[{date:'2025-11-01', total:4, promotors:2, detractors:1, neutral:1}] },
    { id:3, name:'Сидоров', city:'Казань', supervisor:'Кузнецов', mentorId:2, AHT:[], NSAT:[] },
    { id:4, name:'Кузнецов', city:'Новосибирск', supervisor:'Смирнов', mentorId:2, AHT:[], NSAT:[] },
    { id:5, name:'Федоров', city:'Екатеринбург', supervisor:'Васильев', mentorId:3, AHT:[], NSAT:[] }
];

// ------------------ Временный вход ------------------
document.getElementById('loginForm').onsubmit = e => {
    e.preventDefault();
    const role = document.getElementById('roleSelect').value;
    const username = document.getElementById('username').value.trim();
    if (!role || !username) return alert('Выберите роль и введите имя');

    currentUser = { username, role };

    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('userRole').innerText = `${currentUser.username} (${currentUser.role})`;

    initTabs();
};

// ------------------ Dashboard ------------------
function initTabs() {
    const sidebar = document.getElementById('tabMenu');
    sidebar.innerHTML = '';

    let tabs = [];
    if (currentUser.role === 'admin') {
        tabs = [
            { name:'Сводная по группе', tab:'groupSummary' },
            { name:'Сводная по ученику', tab:'studentSummary' },
            { name:'Ученики', tab:'students' },
            { name:'Наставники', tab:'mentors' }
        ];
    } else if (currentUser.role === 'kurator') {
        tabs = [
            { name:'Ученики наставников', tab:'students' },
            { name:'Сводные наставников', tab:'mentorSummary' }
        ];
    } else if (currentUser.role === 'mentor') {
        tabs = [
            { name:'Мои ученики', tab:'studentIndicators' }
        ];
    }

    tabs.forEach((t,i)=>{
        const div = document.createElement('div');
        div.classList.add('sidebar-item');
        if(i===0) div.classList.add('active');
        div.dataset.tab=t.tab;
        div.innerHTML = `<span>${t.name}</span>`;
        div.onclick = () => {
            document.querySelectorAll('.sidebar-item').forEach(s=>s.classList.remove('active'));
            div.classList.add('active');
            selectTab(t.tab);
        };
        sidebar.appendChild(div);
    });

    if (tabs.length) selectTab(tabs[0].tab);
}

// ------------------ Вкладки ------------------
function selectTab(tabName) {
    const main = document.getElementById('cabinetMain');
    main.innerHTML = '';

    if(tabName==='groupSummary') renderGroupSummary(main);
    if(tabName==='studentSummary') renderStudentSummary(main);
    if(tabName==='students') renderStudentsTable(main);
    if(tabName==='mentors') renderMentorsTable(main);
    if(tabName==='mentorSummary') renderMentorSummary(main);
    if(tabName==='studentIndicators') renderStudentIndicators(main);
}

// ------------------ Пример функций рендеринга ------------------
function renderGroupSummary(container){
    const table = document.createElement('table');
    const header = table.insertRow();
    ['Куратор','Наставник','Ученик','Город','Руководитель','AHT','NSAT'].forEach(h=>header.insertCell().innerText=h);

    students.forEach(s=>{
        const mentor = users.find(u=>u.id===s.mentorId);
        const kurator = users.find(u=>mentor && mentor.mentors.includes(u.id));
        const row = table.insertRow();
        const ahtAvg = s.AHT.length ? Math.round(s.AHT.reduce((a,b)=>a+b.seconds,0)/s.AHT.length) : 0;
        const nsatPct = s.NSAT.length ? Math.round(s.NSAT.reduce((a,b)=>a+(b.promotors-b.detractors)/b.total*100,0)/s.NSAT.length) : 0;
        [kurator?.username||'', mentor?.username||'', s.name, s.city, s.supervisor, ahtAvg, nsatPct+'%'].forEach(v=>row.insertCell().innerText=v);
    });

    container.appendChild(table);
}

function renderStudentSummary(container){
    const h = document.createElement('h2'); h.innerText='Сводная по ученику'; container.appendChild(h);
    // Можно добавить графики Chart.js
}

function renderStudentsTable(container){
    const table = document.createElement('table');
    const header = table.insertRow();
    ['ID','Имя','Город','Руководитель','Наставник','AHT','NSAT'].forEach(h=>header.insertCell().innerText=h);

    students.forEach(s=>{
        const row = table.insertRow();
        row.insertCell().innerText = s.id;
        row.insertCell().innerText = s.name;
        row.insertCell().innerText = s.city;
        row.insertCell().innerText = s.supervisor;
        const mentor = users.find(u=>u.id===s.mentorId);
        row.insertCell().innerText = mentor?.username||'';
        row.insertCell().innerText = s.AHT.length ? Math.round(s.AHT.reduce((a,b)=>a+b.seconds,0)/s.AHT.length) : 0;
        row.insertCell().innerText = s.NSAT.length ? Math.round(s.NSAT.reduce((a,b)=>a+(b.promotors-b.detractors)/b.total*100,0)/s.NSAT.length)+'%' : '0%';
    });

    container.appendChild(table);
}

function renderMentorsTable(container){
    const h = document.createElement('h2'); h.innerText='Наставники'; container.appendChild(h);
    // Таблица наставников
}

function renderMentorSummary(container){
    const h = document.createElement('h2'); h.innerText='Сводная наставников'; container.appendChild(h);
    // Можно добавить сводные графики
}

function renderStudentIndicators(container){
    const h = document.createElement('h2'); h.innerText='Показатели ученика'; container.appendChild(h);
    // Таблица AHT/NSAT по дням, редактирование, графики
}

// ------------------ Тема ------------------
document.getElementById('themeSelect').onchange = function(e){
    setTheme(e.target.value);
};

function setTheme(theme){
    const root = document.documentElement;
    if(theme==='beeline'){
        root.style.setProperty('--bg-color','#fff');
        root.style.setProperty('--primary-color','#FFD500');
        root.style.setProperty('--secondary-color','#000');
        root.style.setProperty('--accent-color','#e6c500');
        root.style.setProperty('--text-color','#000');
    } else if(theme==='vk'){
        root.style.setProperty('--bg-color','#f5f6fa');
        root.style.setProperty('--primary-color','#5181b8');
        root.style.setProperty('--secondary-color','#fff');
        root.style.setProperty('--accent-color','#3b5998');
        root.style.setProperty('--text-color','#000');
    }
}
