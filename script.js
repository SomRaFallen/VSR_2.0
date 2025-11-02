const API_URL = 'https://autorization-hdzm.onrender.com/api';
let currentUser = null;
let users = [];
let students = [];
let chart = null;

// ---------------------------- Логин через сервер ----------------------------
document.getElementById('loginBtn').onclick = async function() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      users = data.users;
      students = data.students;
      showCabinet();
    } else {
      document.getElementById('loginError').innerText = 'Неверный логин или пароль';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('loginError').innerText = 'Ошибка соединения с сервером';
  }
};

// ---------------------------- Отображение кабинета ----------------------------
function showCabinet() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('cabinet').style.display = 'flex';
  document.getElementById('userRole').innerText = `${currentUser.username} (${currentUser.role})`;
  initTabs();
}

// ---------------------------- Инициализация боковой панели ----------------------------
function initTabs() {
  const sidebar = document.getElementById('tabMenu');
  sidebar.innerHTML = '';
  const tabs = [
    { name: 'Сводная по группе', tab: 'groupSummary' },
    { name: 'Сводная по ученику', tab: 'studentSummary' },
    { name: 'Ученики', tab: 'students' },
    { name: 'Наставники', tab: 'mentors' },
    { name: 'Сводные наставников', tab: 'mentorSummary' },
    { name: 'Показатели ученика', tab: 'studentIndicators' }
  ];
  tabs.forEach((t, i) => {
    const div = document.createElement('div');
    div.classList.add('sidebar-item');
    if (i === 0) div.classList.add('active');
    div.dataset.tab = t.tab;
    div.innerHTML = `<img src="icons/${t.tab}.svg" alt="${t.name}"/><span>${t.name}</span>`;
    div.onclick = function() {
      document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
      div.classList.add('active');
      selectTab(t.tab);
    };
    sidebar.appendChild(div);
  });
  selectTab('groupSummary');
}

// ---------------------------- Переключение вкладок ----------------------------
function selectTab(tabName) {
  const main = document.getElementById('cabinetMain');
  main.innerHTML = '';
  if (tabName === 'groupSummary') renderGroupSummary(main);
  if (tabName === 'studentSummary') renderStudentSummary(main);
  if (tabName === 'students') renderStudentsTable(main);
  if (tabName === 'mentors') renderMentorsTable(main);
  if (tabName === 'mentorSummary') renderMentorSummary(main);
  if (tabName === 'studentIndicators') renderStudentIndicators(main);
}

// ---------------------------- Переключение темы ----------------------------
document.getElementById('themeSelect').onchange = function(e) {
  setTheme(e.target.value);
};
function setTheme(theme) {
  const root = document.documentElement;
  if (theme === 'beeline') {
    root.style.setProperty('--bg-color', '#fff');
    root.style.setProperty('--primary-color', '#FFD500');
    root.style.setProperty('--secondary-color', '#000');
    root.style.setProperty('--accent-color', '#e6c500');
    root.style.setProperty('--text-color', '#000');
  } else if (theme === 'vk') {
    root.style.setProperty('--bg-color', '#f5f6fa');
    root.style.setProperty('--primary-color', '#5181b8');
    root.style.setProperty('--secondary-color', '#fff');
    root.style.setProperty('--accent-color', '#3b5998');
    root.style.setProperty('--text-color', '#000');
  }
}

// ---------------------------- Модальные окна редактирования ----------------------------
function openEditModal(entity) {
  document.getElementById('editModal').style.display = 'flex';
  document.getElementById('editName').value = entity.name || '';
  document.getElementById('editCity').value = entity.city || '';
  document.getElementById('editSupervisor').value = entity.supervisor || '';
  document.getElementById('saveEditBtn').onclick = function() {
    entity.name = document.getElementById('editName').value;
    entity.city = document.getElementById('editCity').value;
    entity.supervisor = document.getElementById('editSupervisor').value;
    selectTab('students');
    closeModal();
  };
}
function closeModal() {
  document.getElementById('editModal').style.display = 'none';
}

// ---------------------------- Вспомогательные функции ----------------------------
function getVisibleStudents() {
  if (currentUser.role === 'admin') return students;
  if (currentUser.role === 'kurator') return students.filter(s => currentUser.mentors.includes(s.mentorId));
  if (currentUser.role === 'mentor') return students.filter(s => currentUser.students.includes(s.id));
  return [];
}
function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// ---------------------------- Рендер групповой сводной ----------------------------
function renderGroupSummary(container) {
  const table = document.createElement('table');
  const header = table.insertRow();
  ['Куратор','Наставник','Ученик','Город','Руководитель','AHT','NSAT'].forEach(h=>{
    const th = header.insertCell(); th.innerText = h;
  });
  getVisibleStudents().forEach(s=>{
    const mentor = users.find(u=>u.id === s.mentorId);
    const kurator = users.find(u=>u.id === mentor?.kuratorId);
    const row = table.insertRow();
    [kurator?.username || '', mentor?.username || '', s.name, s.city, s.supervisor,
      avg(s.AHT?.map(a=>a.seconds)||[]), avg(s.NSAT?.map(n=>n.total)||[])].forEach(v=>{
        const td = row.insertCell(); td.innerText = v;
    });
  });
  container.appendChild(table);
}

// ---------------------------- Рендер сводной по ученику ----------------------------
function renderStudentSummary(container) {
  const select = document.createElement('select');
  getVisibleStudents().forEach(s=>{
    const opt = document.createElement('option'); opt.value = s.id; opt.innerText = s.name;
    select.appendChild(opt);
  });
  container.appendChild(select);

  const chartCanvas = document.createElement('canvas');
  container.appendChild(chartCanvas);

  select.onchange = function() {
    const s = students.find(st=>st.id==select.value);
    const labels = s.AHT.map(a=>a.date);
    const ahtData = s.AHT.map(a=>a.seconds);
    const nsatData = s.NSAT.map(n=>n.total);
    if(chart) chart.destroy();
    chart = new Chart(chartCanvas, {
      type:'line',
      data:{labels:labels,datasets:[
        {label:'AHT', data:ahtData, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(), fill:false},
        {label:'NSAT', data:nsatData, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(), fill:false}
      ]}
    });
  };
  select.onchange();

  const btn = document.createElement('button'); btn.innerText='Скачать PNG'; btn.classList.add('action');
  btn.onclick = function() {
    if(chart){
      const link = document.createElement('a');
      link.href = chart.toBase64Image();
      link.download='student_chart.png';
      link.click();
    }
  };
  container.appendChild(btn);
}

// ---------------------------- Рендер таблицы учеников ----------------------------
function renderStudentsTable(container){
  const table = document.createElement('table');
  const header = table.insertRow();
  ['Имя','Город','Руководитель','Редактировать'].forEach(h=>header.insertCell().innerText=h);

  getVisibleStudents().forEach(s=>{
    const row = table.insertRow();
    row.insertCell().innerText = s.name;
    row.insertCell().innerText = s.city;
    row.insertCell().innerText = s.supervisor;
    const td = row.insertCell();
    if(currentUser.role==='admin' || currentUser.role==='kurator'){
      const btn = document.createElement('button'); btn.innerText='Редактировать'; btn.classList.add('action');
      btn.onclick=()=>openEditModal(s);
      td.appendChild(btn);
    }
  });
  container.appendChild(table);
}

// ---------------------------- Рендер таблицы наставников ----------------------------
function renderMentorsTable(container){
  const table = document.createElement('table');
  const header = table.insertRow();
  ['Наставник','Ученики','Редактировать'].forEach(h=>header.insertCell().innerText=h);
  const mentors = users.filter(u=>u.role==='mentor');
  mentors.forEach(m=>{
    const row = table.insertRow();
    row.insertCell().innerText = m.username;
    row.insertCell().innerText = students.filter(s=>s.mentorId===m.id).map(s=>s.name).join(', ');
    const td = row.insertCell();
    if(currentUser.role==='admin' || currentUser.role==='kurator'){
      const btn = document.createElement('button'); btn.innerText='Редактировать'; btn.classList.add('action');
      btn.onclick=()=>openEditModal(m);
      td.appendChild(btn);
    }
  });
  container.appendChild(table);
}

// ---------------------------- Рендер сводных по наставникам ----------------------------
function renderMentorSummary(container){
  container.innerHTML='';
  let visibleMentors = [];
  if(currentUser.role==='admin') visibleMentors = users.filter(u=>u.role==='mentor');
  if(currentUser.role==='kurator') visibleMentors = users.filter(u=>currentUser.mentors.includes(u.id));

  visibleMentors.forEach(m=>{
    const header = document.createElement('h3'); header.innerText=`Наставник: ${m.username}`;
    container.appendChild(header);

    const table = document.createElement('table');
    const tr = table.insertRow();
    ['Ученик','Дата','Звонки','AHT (сек)','IT-проблем','ACW','Перезвоны','Оценки','Детракторы','Промоутеры','Нейтралы','%NSAT'].forEach(h=>{
      tr.insertCell().innerText=h;
    });

    students.filter(s=>s.mentorId===m.id).forEach(s=>{
      s.AHT.forEach((aht,i)=>{
        const nsat = s.NSAT[i] || {total:0,detractors:0,promoters:0,neutrals:0};
        const row = table.insertRow();
        row.insertCell().innerText = s.name;
        row.insertCell().innerText = aht.date;
        row.insertCell().innerText = aht.calls;
        row.insertCell().innerText = aht.seconds;
        row.insertCell().innerText = aht.itProblem;
        row.insertCell().innerText = aht.acw;
        row.insertCell().innerText = aht.callbacks;
        row.insertCell().innerText = nsat.total;
        row.insertCell().innerText = nsat.detractors;
        row.insertCell().innerText = nsat.promoters;
        row.insertCell().innerText = nsat.neutrals;
        row.insertCell().innerText = nsat.total>0?Math.round(nsat.promoters/nsat.total*100)+'%':'0%';
      });
    });

    const saveBtn = document.createElement('button'); saveBtn.innerText='Сохранить'; saveBtn.classList.add('action');
    saveBtn.onclick = function(){
      saveMentorData(m.id);
    };
    container.appendChild(table);
    container.appendChild(saveBtn);
  });
}

function saveMentorData(mentorId){
  const token = localStorage.getItem('token');
  fetch(`${API_URL}/saveMentorData`,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
    body:JSON.stringify({mentorId, students: students.filter(s=>s.mentorId===mentorId)})
  }).then(res=>res.json()).then(data=>alert('Данные сохранены на сервере'))
    .catch(err=>alert('Ошибка сохранения'));
}

// ---------------------------- Рендер показателей ученика (AHT/NSAT) ----------------------------
function renderStudentIndicators(container){
  const select = document.createElement('select');
  getVisibleStudents().forEach(s=>{
    const opt=document.createElement('option'); opt.value=s.id; opt.innerText=s.name;
    select.appendChild(opt);
  });
  container.appendChild(select);

  const tableAHT = document.createElement('table');
  const tableNSAT = document.createElement('table');

  select.onchange = function(){
    tableAHT.innerHTML=''; tableNSAT.innerHTML='';
    const s = students.find(st=>st.id==select.value);

    const trAHT = tableAHT.insertRow();
    ['Дата','Звонки','AHT (сек)','IT-проблем','ACW','Перезвоны'].forEach(h=>trAHT.insertCell().innerText=h);
    s.AHT.forEach(a=>{
      const row = tableAHT.insertRow();
      Object.values(a).forEach(v=>{
        const td = row.insertCell(); td.innerText=v;
        if(currentUser.role!=='mentor') td.contentEditable=true;
      });
    });

    const trNSAT = tableNSAT.insertRow();
    ['Дата','Оценки','Детракторы','Промоутеры','Нейтралы','%NSAT'].forEach(h=>trNSAT.insertCell().innerText=h);
    s.NSAT.forEach(n=>{
      const row = tableNSAT.insertRow();
      const percent = n.total>0?Math.round(n.promoters/n.total*100):0;
      [n.date,n.total,n.detractors,n.promoters,n.neutrals,percent+'%'].forEach(v=>{
        const td=row.insertCell(); td.innerText=v;
        if(currentUser.role!=='mentor') td.contentEditable=true;
      });
    });

    if(!container.contains(tableAHT)) container.appendChild(tableAHT);
    if(!container.contains(tableNSAT)) container.appendChild(tableNSAT);
  };
  select.onchange();

  const saveBtn=document.createElement('button'); saveBtn.innerText='Сохранить'; saveBtn.classList.add('action');
  saveBtn.onclick=function(){
    const s = students.find(st=>st.id==select.value);
    let updatedAHT=[], updatedNSAT=[];
    for(let i=1;i<tableAHT.rows.length;i++){
      const r=tableAHT.rows[i];
      updatedAHT.push({
        date:r.cells[0].innerText,
        calls:parseInt(r.cells[1].innerText)||0,
        seconds:parseInt(r.cells[2].innerText)||0,
        itProblem:parseInt(r.cells[3].innerText)||0,
        acw:parseInt(r.cells[4].innerText)||0,
        callbacks:parseInt(r.cells[5].innerText)||0
      });
    }
    for(let i=1;i<tableNSAT.rows.length;i++){
      const r=tableNSAT.rows[i];
      updatedNSAT.push({
        date:r.cells[0].innerText,
        total:parseInt(r.cells[1].innerText)||0,
        detractors:parseInt(r.cells[2].innerText)||0,
        promoters:parseInt(r.cells[3].innerText)||0,
        neutrals:parseInt(r.cells[4].innerText)||0
      });
    }

    const token = localStorage.getItem('token');
    fetch(`${API_URL}/saveStudentData`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body:JSON.stringify({studentId:s.id,AHT:updatedAHT,NSAT:updatedNSAT})
    }).then(res=>res.json()).then(data=>alert('Данные ученика сохранены на сервере'))
      .catch(err=>alert('Ошибка сохранения'));
  };
  container.appendChild(saveBtn);
}
