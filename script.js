let currentUser = null;

// ------------------ Временный вход ------------------
document.getElementById('loginForm').onsubmit = e => {
  e.preventDefault();
  const role = document.getElementById('roleSelect').value;
  const username = document.getElementById('username').value.trim();
  if (!role || !username) return alert('Выберите роль и введите имя');

  // Сохраняем пользователя
  currentUser = { username, role };

  // Скрываем форму, показываем dashboard
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
      { name: 'Сводная по группе', tab: 'groupSummary' },
      { name: 'Сводная по ученику', tab: 'studentSummary' },
      { name: 'Ученики', tab: 'students' },
      { name: 'Наставники', tab: 'mentors' }
    ];
  } else if (currentUser.role === 'kurator') {
    tabs = [
      { name: 'Ученики наставников', tab: 'students' },
      { name: 'Сводная наставников', tab: 'mentorSummary' }
    ];
  } else if (currentUser.role === 'mentor') {
    tabs = [
      { name: 'Мои ученики', tab: 'studentIndicators' }
    ];
  }

  tabs.forEach((t, i) => {
    const div = document.createElement('div');
    div.classList.add('sidebar-item');
    if (i === 0) div.classList.add('active');
    div.dataset.tab = t.tab;
    div.innerHTML = `<span>${t.name}</span>`;
    div.onclick = () => {
      document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
      div.classList.add('active');
      selectTab(t.tab);
    };
    sidebar.appendChild(div);
  });

  if (tabs.length) selectTab(tabs[0].tab);
}

function selectTab(tabName) {
  const main = document.getElementById('cabinetMain');
  main.innerHTML = '';
  const h = document.createElement('h2');
  h.innerText = `Вкладка: ${tabName}`;
  main.appendChild(h);
}
