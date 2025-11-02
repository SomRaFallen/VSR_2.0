// Полный рабочий script.js для GitHub Pages + Render

const API_URL = 'https://autorization-hdzm.onrender.com';
let currentUser = null;
let users = [];
let students = [];
let chart = null;

// ------------------ Регистрация, Вход, Смена пароля ------------------
async function sendForm(url, data, msgId){
  const msg = document.getElementById(msgId);
  msg.textContent='';
  try{
    const res = await fetch(`${API_URL}${url}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(data)
    });
    const json = await res.json();
    if(res.ok){
      msg.textContent=json.message;
      msg.className='message';
      if(url==='/login' && json.token){
        localStorage.setItem('token', json.token);
        currentUser=json.user;
        users=json.users;
        students=json.students;
        document.getElementById('registerForm').style.display='none';
        document.getElementById('loginForm').style.display='none';
        document.getElementById('changeForm').style.display='none';
        document.getElementById('dashboard').style.display='flex';
        document.getElementById('userRole').innerText=`${currentUser.username} (${currentUser.role})`;
        initTabs();
      }
    } else {
      msg.textContent=json.error; msg.className='error';
    }
  } catch(e){
    msg.textContent='Ошибка соединения';
    msg.className='error';
  }
}

document.getElementById('registerForm').onsubmit=e=>{
  e.preventDefault();
  sendForm('/register',{
    username:document.getElementById('username').value,
    password:document.getElementById('password').value
  },'regMsg');
};

document.getElementById('loginForm').onsubmit=e=>{
  e.preventDefault();
  sendForm('/login',{
    username:document.getElementById('loginUsername').value,
    password:document.getElementById('loginPassword').value
  },'loginMsg');
};

document.getElementById('changeForm').onsubmit=e=>{
  e.preventDefault();
  sendForm('/change-password',{
    username:document.getElementById('chUsername').value,
    oldPassword:document.getElementById('oldPassword').value,
    newPassword:document.getElementById('newPassword').value
  },'chMsg');
};

// ------------------ Dashboard ------------------
function initTabs(){
  const sidebar = document.getElementById('tabMenu');
  sidebar.innerHTML='';
  const tabs=[
    {name:'Сводная по группе',tab:'groupSummary'},
    {name:'Сводная по ученику',tab:'studentSummary'},
    {name:'Ученики',tab:'students'},
    {name:'Наставники',tab:'mentors'},
    {name:'Сводные наставников',tab:'mentorSummary'},
    {name:'Показатели ученика',tab:'studentIndicators'}
  ];
  tabs.forEach((t,i)=>{
    const div=document.createElement('div'); 
    div.classList.add('sidebar-item');
    if(i===0) div.classList.add('active');
    div.dataset.tab=t.tab;
    div.innerHTML=`<span>${t.name}</span>`;
    div.onclick=()=>{ 
      document.querySelectorAll('.sidebar-item').forEach(s=>s.classList.remove('active')); 
      div.classList.add('active'); 
      selectTab(t.tab); 
    };
    sidebar.appendChild(div);
  });
  selectTab('groupSummary');
}

function selectTab(tabName){
  const main=document.getElementById('cabinetMain');
  main.innerHTML='';

  // Тут можно вызвать реальные функции renderGroupSummary, renderStudentSummary и т.д.
  const h = document.createElement('h2'); 
  h.innerText=`Вкладка: ${tabName}`; 
  main.appendChild(h);
}

// ------------------ Переключение темы ------------------
document.getElementById('themeSelect').onchange=function(e){
  setTheme(e.target.value);
};

function setTheme(theme){
  const root=document.documentElement;
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

// ------------------ Получение видимых учеников ------------------
function getVisibleStudents(){
  if(currentUser.role==='admin') return students;
  if(currentUser.role==='kurator') return students.filter(s=>currentUser.mentors.includes(s.mentorId));
  if(currentUser.role==='mentor') return students.filter(s=>currentUser.students.includes(s.id));
  return [];
}
