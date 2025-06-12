let fullData = {};
let sortState = { "combined": null, "home": null, "away": null };
let chartRendered = { "chartA": false, "chartC": false, "chartD": false, "attendance": false };

async function loadData() {
  const res = await fetch('cheerleader_stats_data.json');
  fullData = await res.json();
  document.getElementById("loading").style.display = "none";
  ['home', 'away', 'combined'].forEach(type => renderTable(type));
}

function toHalfWidth(str) {
  return str.replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
}

function calcAxisLimit(values) {
  const minRaw = Math.min(...values);
  const maxRaw = Math.max(...values);
  let min = Math.floor((minRaw - 10) / 10) * 10;
  let max = Math.ceil((maxRaw + 10) / 10) * 10;
  min = Math.max(0, min);
  max = Math.min(100, max);
  return { min, max };
}

function renderTable(type) {
  const container = document.querySelector(`#${type} .table-container`);
  container.innerHTML = "";
  let data = fullData[type];
  if (!data || data.length === 0) {
    container.innerHTML = "<div>目前尚無資料</div>";
    return;
  }
  data = [...data];

  if (sortState[type]) {
    const { field, asc } = sortState[type];
    data.sort((a, b) => {
      let valA = a[field], valB = b[field];
      if (field === 'current') {
        const extract = s => s.includes("連勝") ? parseInt(s) : s.includes("連敗") ? -parseInt(s) : 0;
        valA = extract(valA); valB = extract(valB);
      }
      return (valA > valB ? 1 : -1) * (asc ? 1 : -1);
    });
  }

  if (window.innerWidth <= 768) {
    renderCardTable(container, data, type);
  } else {
    renderNormalTable(container, data, type);
  }
}

function renderNormalTable(container, data, type) {
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr>
      <th>照片</th><th data-field="name">成員</th><th data-field="total">出賽數</th>
      <th data-field="win">勝場數</th><th data-field="lose">敗場數</th>
      <th data-field="current">目前連勝/敗</th><th data-field="winRate">勝率</th>
      <th>出勤明細</th></tr></thead><tbody></tbody>`;

  const tbody = table.querySelector('tbody');
  data.forEach(item => {
    const imageName = toHalfWidth(item.name)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '')
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const row = document.createElement('tr');
    row.innerHTML = `<td>
        <img src="images/${imageName}.jpg" onerror="this.src='default.png'" class="avatar-img" onclick="showPhoto('images/${imageName}.jpg')">
      </td>
      <td>${item.name}</td><td>${item.total}</td><td>${item.win}</td><td>${item.lose}</td>
      <td>${item.current}</td><td>${(item.winRate*100).toFixed(1)}%</td>
      <td><button class='view-btn' onclick='showDetail("${item.name}","${type}")'>查看</button></td>`;
    tbody.appendChild(row);
  });

  container.appendChild(table);

  table.querySelectorAll('th[data-field]').forEach(th => {
    th.onclick = () => {
      const field = th.dataset.field;
      if (sortState[type] && sortState[type].field === field)
        sortState[type].asc = !sortState[type].asc;
      else sortState[type] = { field: field, asc: false };
      renderTable(type);
    }
  });
}

function renderCardTable(container, data, type) {
  data.forEach(item => {
    const imageName = toHalfWidth(item.name)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '')
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    
    const card = document.createElement('div');
    card.className = 'mobile-card';
    card.innerHTML = `
      <div class="mobile-header">
        <img src="images/${imageName}.jpg" onerror="this.src='default.png'" class="avatar-img" onclick="showPhoto('images/${imageName}.jpg')">
        <div class="mobile-name">${item.name}</div>
      </div>
      <div class="mobile-data">出賽數：${item.total}</div>
      <div class="mobile-data">勝場數：${item.win}</div>
      <div class="mobile-data">敗場數：${item.lose}</div>
      <div class="mobile-data">目前連勝/敗：${item.current}</div>
      <div class="mobile-data">勝率：${(item.winRate*100).toFixed(1)}%</div>
      <div class="mobile-data"><button class='view-btn' onclick='showDetail("${item.name}","${type}")'>查看出勤明細</button></div>
    `;
    container.appendChild(card);
  });
}
function renderAttendanceTable() {
  const container = document.querySelector('#attendance .table-container');
  container.innerHTML = "";
  const data = [...fullData['combined']].sort((a,b)=>b.total - a.total);

  if (window.innerWidth <= 768) {
    data.forEach(item => {
      const imageName = toHalfWidth(item.name)
        .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '')
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

      const card = document.createElement('div');
      card.className = 'mobile-card';
      card.innerHTML = `
        <div class="mobile-header">
          <img src="images/${imageName}.jpg" onerror="this.src='default.png'" class="avatar-img" onclick="showPhoto('images/${imageName}.jpg')">
          <div class="mobile-name">${item.name}</div>
        </div>
        <div class="mobile-data">出賽數：${item.total}</div>
      `;
      container.appendChild(card);
    });

  } else {
    const table = document.createElement('table');
    table.innerHTML = `<thead><tr><th>成員</th><th>出賽數</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.total}</td>`;
      tbody.appendChild(row);
    });
    container.appendChild(table);
  }
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    const type = e.target.dataset.type;
    document.getElementById(type).classList.add('active');

    document.getElementById("modal").classList.add("hidden");
    document.getElementById("photoModal").classList.add("hidden");

    if (type === 'attendance' && !chartRendered.attendance) { 
      renderAttendanceTable(); 
      chartRendered.attendance = true; 
      return;
    }
    if (type === 'chartA' && !chartRendered.chartA) { renderChartA(); chartRendered.chartA = true; }
    if (type === 'chartC' && !chartRendered.chartC) { renderChartC(); chartRendered.chartC = true; }
    if (type === 'chartD' && !chartRendered.chartD) { renderChartD(); chartRendered.chartD = true; }
    if (['home','away','combined'].includes(type)) {
      renderTable(type);
    }
  });
});
function renderChartA() {
  const ctx = document.getElementById("canvasA").getContext("2d");
  const data = [...fullData['combined']].sort((a,b)=>b.winRate-a.winRate);
  const labels = data.map(d => d.name);
  const winRates = data.map(d => +(d.winRate * 100).toFixed(1));
  const axis = calcAxisLimit(winRates);

  new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: '勝率 %', data: winRates }] },
    options: {
      responsive: true, indexAxis: 'y',
      scales: { x: { min: axis.min, max: axis.max, ticks: { stepSize: 10 } } }
    }
  });
}

function renderChartC() {
  const ctx = document.getElementById("canvasC").getContext("2d");
  const combined = fullData['combined'];
  const home = fullData['home'];
  const away = fullData['away'];
  const labels = combined.map(d => d.name);
  const homeRates = home.map(d => +(d.winRate * 100).toFixed(1));
  const awayRates = away.map(d => +(d.winRate * 100).toFixed(1));
  const allRates = homeRates.concat(awayRates);
  const axis = calcAxisLimit(allRates);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '主場勝率', data: homeRates, backgroundColor:'#99ccff' },
        { label: '客場勝率', data: awayRates, backgroundColor:'#ff99cc' }
      ]
    },
    options: {
      responsive: true, indexAxis: 'y',
      scales: { x: { min: axis.min, max: axis.max, ticks: { stepSize: 10 } } }
    }
  });
}

function renderChartD() {
  const ctx = document.getElementById("canvasD").getContext("2d");
  let data = [...fullData['combined']];
  data = data.map(d => {
    let val = 0;
    if (d.current.includes("連勝")) val = parseInt(d.current);
    if (d.current.includes("連敗")) val = -parseInt(d.current);
    return {...d, streakVal: val};
  }).sort((a,b)=>b.streakVal-a.streakVal);

  const labels = data.map(d => d.name);
  const streaks = data.map(d => d.streakVal);
  const colors = streaks.map(v => v < 0 ? "#ff7777" : "#77b5ff");

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: '目前連勝/連敗', data: streaks, backgroundColor: colors }]
    },
    options: { responsive: true, indexAxis: 'y' }
  });
}
function showDetail(name, type) {
  const item = fullData[type].find(d => d.name === name);
  document.getElementById('modalName').innerText = `${item.name} 出勤明細`;
  const ul = document.getElementById('modalList'); 
  ul.innerHTML = '';

  item.detail.forEach((d, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${d.date}（${d.weekday_fixed}）</span>
      <span>${d.stadium}</span>
      <span>${d.opponent_fixed} ${d.opp_score}：${d.self_score} 啾啾</span>
      <span>${d.result}</span>`;
    ul.appendChild(li);
  });

  document.getElementById("modal").classList.remove("hidden");
}

document.getElementById("modalClose").onclick = () => {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.style.zIndex = "-1";
  modal.style.opacity = "0";
  modal.style.pointerEvents = "none";
  modal.style.display = "none";
};

document.getElementById("modal").addEventListener("click", function(e) {
  if (e.target === e.currentTarget) {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
    modal.style.zIndex = "-1";
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
    modal.style.display = "none";
  }
});

function showPhoto(src) {
  document.getElementById('photoModalImg').src = src;
  document.getElementById('photoModal').classList.remove("hidden");
}

document.getElementById("photoModalClose").onclick = () => {
  const photoModal = document.getElementById("photoModal");
  photoModal.classList.add("hidden");
  photoModal.style.zIndex = "-1";
  photoModal.style.opacity = "0";
  photoModal.style.pointerEvents = "none";
  photoModal.style.display = "none";
};

document.getElementById("photoModal").addEventListener("click", function(e) {
  if (e.target === e.currentTarget) {
    const photoModal = document.getElementById("photoModal");
    photoModal.classList.add("hidden");
    photoModal.style.zIndex = "-1";
    photoModal.style.opacity = "0";
    photoModal.style.pointerEvents = "none";
    photoModal.style.display = "none";
  }
});

loadData();
