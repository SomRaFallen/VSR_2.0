// --- Остальные функции для рендеринга вкладок ---
// renderStudentSummary, renderStudentsTable, renderMentorsTable, renderMentorSummary, renderStudentIndicators
// В них реализованы: таблицы с редактированием, ввод AHT/NSAT, кнопки сохранить с fetch на сервер, графики Chart.js
// Все кнопки, поля и таблицы используют CSS переменные, темы переключаются через setTheme
// --- Рендер сводной по ученику ---
function renderStudentSummary(container){
  let select = document.createElement('select');
  let visibleStudents = getVisibleStudents();
  visibleStudents.forEach(s=>{
    let option = document.createElement('option'); option.value=s.id; option.innerText=s.name;
    select.appendChild(option);
  });
  container.appendChild(select);

  let chartCanvas = document.createElement('canvas'); container.appendChild(chartCanvas);

  select.onchange = ()=>renderStudentChart(select.value, chartCanvas);
  select.onchange();
  
  let btn = document.createElement('button'); btn.innerText='Скачать PNG'; btn.classList.add('action');
  btn.onclick = ()=>{
    if(chart){ 
      let link = document.createElement('a'); 
      link.href = chart.toBase64Image(); 
      link.download='student_chart.png'; 
      link.click();
    }
  };
  container.appendChild(btn);
}

function renderStudentChart(studentId, canvas){
  let s = students.find(st=>st.id==studentId);
  let labels = s.AHT.map(d=>d.date);
  let ahtData = s.AHT.map(d=>d.seconds);
  let nsatData = s.NSAT.map(d=>d.total);
  if(chart) chart.destroy();
  chart = new Chart(canvas, {
    type:'line',
    data:{
      labels:labels,
      datasets:[
        {label:'AHT', data:ahtData, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(), fill:false},
        {label:'NSAT', data:nsatData, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(), fill:false}
      ]
    }
  });
}

// --- Таблица учеников ---
function renderStudentsTable(container){
  let table = document.createElement('table');
  let header = table.insertRow();
  ['Имя','Город','Руководитель','Редактировать'].forEach(h=>{
    let th = header.insertCell(); th.innerText=h;
  });

  getVisibleStudents().forEach(s=>{
    let row = table.insertRow();
    row.insertCell().innerText = s.name;
    row.insertCell().innerText = s.city;
    row.insertCell().innerText = s.supervisor;
    let td = row.insertCell();
    if(currentUser.role==='admin' || currentUser.role==='kurator'){
      let btn = document.createElement('button'); btn.innerText='Редактировать'; btn.classList.add('action');
      btn.onclick=()=>openEditModal(s);
      td.appendChild(btn);
    }
  });

  container.appendChild(table);
}

// --- Таблица наставников ---
function renderMentorsTable(container){
  let table = document.createElement('table');
  let header = table.insertRow();
  ['Наставник','Ученики','Редактировать'].forEach(h=>{ header.insertCell().innerText=h; });
  let mentors = users.filter(u=>u.role==='mentor');
  mentors.forEach(m=>{
    let row = table.insertRow();
    row.insertCell().innerText = m.username;
    row.insertCell().innerText = students.filter(s=>s.mentorId===m.id).map(s=>s.name).join(', ');
    let td = row.insertCell();
    if(currentUser.role==='admin' || currentUser.role==='kurator'){
      let btn = document.createElement('button'); btn.innerText='Редактировать'; btn.classList.add('action');
      btn.onclick=()=>openEditModal(m);
      td.appendChild(btn);
    }
  });
  container.appendChild(table);
}

// --- Сводные по наставникам ---
function renderMentorSummary(container){
  container.innerHTML='';
  let visibleMentors = [];
  if(currentUser.role==='admin') visibleMentors = users.filter(u=>u.role==='mentor');
  if(currentUser.role==='kurator') visibleMentors = users.filter(u=>currentUser.mentors.includes(u.id));

  visibleMentors.forEach(m=>{
    let header = document.createElement('h3'); header.innerText=`Наставник: ${m.username}`;
    container.appendChild(header);

    let table = document.createElement('table');
    let tr = table.insertRow();
    ['Ученик','Дата','Звонки','AHT (сек)','IT-проблем','ACW','Перезвоны','Оценки','Детракторы','Промоутеры','Нейтралы','%NSAT'].forEach(h=>{
      tr.insertCell().innerText=h;
    });

    students.filter(s=>s.mentorId===m.id).forEach(s=>{
      s.AHT.forEach((aht,i)=>{
        let nsat = s.NSAT[i] || {total:0,detractors:0,promoters:0,neutrals:0};
        let row = table.insertRow();
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

    let saveBtn = document.createElement('button'); saveBtn.innerText='Сохранить'; saveBtn.classList.add('action');
    saveBtn.onclick = ()=>saveMentorData(m.id);
    container.appendChild(table);
    container.appendChild(saveBtn);
  });
}

function saveMentorData(mentorId){
  const token = localStorage.getItem('token');
  fetch('https://autorization-hdzm.onrender.com/api/saveMentorData',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
    body:JSON.stringify({mentorId, students: students.filter(s=>s.mentorId===mentorId)})
  }).then(res=>res.json()).then(data=>alert('Данные сохранены на сервере'))
    .catch(err=>alert('Ошибка сохранения'));
}

// --- Показатели отдельного ученика (AHT и NSAT) ---
function renderStudentIndicators(container){
  let select = document.createElement('select');
  getVisibleStudents().forEach(s=>{
    let opt=document.createElement('option'); opt.value=s.id; opt.innerText=s.name;
    select.appendChild(opt);
  });
  container.appendChild(select);

  let tableAHT = document.createElement('table');
  let tableNSAT = document.createElement('table');

  select.onchange = ()=>{
    tableAHT.innerHTML=''; tableNSAT.innerHTML='';
    let s = students.find(st=>st.id==select.value);

    let trAHT = tableAHT.insertRow();
    ['Дата','Звонки','AHT (сек)','IT-проблем','ACW','Перезвоны'].forEach(h=>trAHT.insertCell().innerText=h);
    s.AHT.forEach(a=>{
      let row = tableAHT.insertRow();
      Object.values(a).forEach(v=>{
        let td = row.insertCell(); td.innerText=v;
        if(currentUser.role!=='mentor') td.contentEditable=true;
      });
    });

    let trNSAT = tableNSAT.insertRow();
    ['Дата','Оценки','Детракторы','Промоутеры','Нейтралы','%NSAT'].forEach(h=>trNSAT.insertCell().innerText=h);
    s.NSAT.forEach(n=>{
      let row = tableNSAT.insertRow();
      let percent = n.total>0?Math.round(n.promoters/n.total*100):0;
      [n.date,n.total,n.detractors,n.promoters,n.neutrals,percent+'%'].forEach(v=>{
        let td=row.insertCell(); td.innerText=v;
        if(currentUser.role!=='mentor') td.contentEditable=true;
      });
    });

    if(!container.contains(tableAHT)) container.appendChild(tableAHT);
    if(!container.contains(tableNSAT)) container.appendChild(tableNSAT);
  };
  select.onchange();

  let saveBtn = document.createElement('button'); saveBtn.innerText='Сохранить'; saveBtn.classList.add('action');
  saveBtn.onclick = ()=>{
    let s = students.find(st=>st.id==select.value);
    // Собираем данные из таблиц
    let updatedAHT=[], updatedNSAT=[];
    for(let i=1;i<tableAHT.rows.length;i++){
      let r=tableAHT.rows[i];
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
      let r=tableNSAT.rows[i];
      updatedNSAT.push({
        date:r.cells[0].innerText,
        total:parseInt(r.cells[1].innerText)||0,
        detractors:parseInt(r.cells[2].innerText)||0,
        promoters:parseInt(r.cells[3].innerText)||0,
        neutrals:parseInt(r.cells[4].innerText)||0
      });
    }

    const token = localStorage.getItem('token');
    fetch('https://autorization-hdzm.onrender.com/api/saveStudentData',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body:JSON.stringify({studentId:s.id,AHT:updatedAHT,NSAT:updatedNSAT})
    }).then(res=>res.json()).then(data=>alert('Данные ученика сохранены на сервере'))
      .catch(err=>alert('Ошибка сохранения'));
  };
  container.appendChild(saveBtn);
}
