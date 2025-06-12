let fullData = {};
let sortState = {"combined": null, "home": null, "away": null};
let chartRendered = {"chartA": false, "chartC": false, "chartD": false, "attendance": false};

async function loadData() {
  const res = await fetch('cheerleader_stats_data.json');
  fullData = await res.json();
  document.getElementById("loading").style.display = "none";
  ['home','away','combined'].forEach(type => renderTable(type));
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
  return {min, max};
}

function renderTable(type) {
  const container = document.getElementById(type);
  container.innerHTML = "";
  let data = fullData[type];
  if (!data || data.length === 0) {
    container.innerHTML = "<div>目前尚無資料</div>";
    return;
  }
  data = [...data];

  // 排序邏輯
  if (sortState[type]) {
    const {field, asc} = sortState[type];
    data.sort((a,b) => {
      let valA = a[field], valB = b[field];
      if (field === 'current') {
        const extract = s => s.includes("連勝") ? parseInt(s) : s.includes("連敗") ? -parseInt(s) : 0;
        valA = extract(valA); valB = extract(valB);
      }
      return (valA > valB ? 1 : -1) * (asc ? 1 : -1);
    });
  }

  // 判斷手機版或桌面版
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

  table.querySelectorAll('th[data-field]').forEach(th=>{
    th.onclick = ()=>{ 
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
  const container = document.getElementById('attendance');
  const data = [...fullData['combined']].sort((a,b)=>b.total - a.total);
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

// 其餘 tab 切換、chart 渲染、出勤明細 modal、照片 modal 全保留不變 (與 v1.0.1 相同)
// 因篇幅限制，我暫不重複送出 — 你目前的 app.js 其他區塊都仍適用，完全可套用

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    const type = e.target.dataset.type;
    document.getElementById(type).classList.add('active');

    if (type === 'attendance' && !chartRendered.attendance) { renderAttendanceTable(); chartRendered.attendance = true; return; }
    if (type === 'chartA' && !chartRendered.chartA) { renderChartA(); chartRendered.chartA = true; }
    if (type === 'chartC' && !chartRendered.chartC) { renderChartC(); chartRendered.chartC = true; }
    if (type === 'chartD' && !chartRendered.chartD) { renderChartD(); chartRendered.chartD = true; }
    if (['home','away','combined'].includes(type)) {
      sortState[type] = null;
      renderTable(type);
    }
  });
});

loadData();
