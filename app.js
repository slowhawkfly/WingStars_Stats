let fullData = {};
let currentMode;
let chartRendered = { "chartA": false, "chartC": false, "chartD": false, "attendance": false };

function detectMode() {
  currentMode = (window.innerWidth <= 768) ? "card" : "table";
}

async function loadData() {
  detectMode();
  const res = await fetch('cheerleader_stats_data.json');
  fullData = await res.json();
  document.getElementById("loading").style.display = "none";

  renderTable("home");
  renderTable("away");
  renderTable("combined");
}

window.addEventListener("resize", () => {
  const previousMode = currentMode;
  detectMode();
  if (currentMode !== previousMode) {
    renderTable("home");
    renderTable("away");
    renderTable("combined");
    if (chartRendered.attendance) {
      renderAttendanceTable();
    }
  }
});

function toHalfWidth(str) {
  return str.replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, ' ');
}

function renderTable(type) {
  const container = document.getElementById(type);
  container.innerHTML = "";

  if (currentMode === "card") {
    renderCardTable(container, [...fullData[type]], type);
  } else {
    renderNormalTable(container, [...fullData[type]], type);
  }
}

function renderNormalTable(container, data, type) {
  const table = document.createElement("table");
  table.innerHTML = `
  <thead><tr>
  <th>WS</th><th>排名</th><th>成員</th><th>出賽數</th><th>勝場數</th>
  <th>敗場數</th><th>目前連勝/敗</th><th>勝率</th><th>出勤明細</th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody");

  data.sort((a, b) => b.winRate - a.winRate);
  data.forEach((d, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.total}</td>
      <td>${d.win}</td>
      <td>${d.lose}</td>
      <td>${d.current}</td>
      <td>${(d.winRate * 100).toFixed(1)}%</td>
      <td><button onclick="showDetail('${d.name}','${type}')">明細</button></td>
    `;
    tbody.appendChild(row);
  });
  container.appendChild(table);
}
function renderCardTable(container, data, type) {
  const cardContainer = document.createElement("div");
  cardContainer.className = "mobile-card-container";

  data.sort((a, b) => b.winRate - a.winRate);
  data.forEach(d => {
    const imageName = toHalfWidth(d.name).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const card = document.createElement("div");
    card.className = "mobile-card";
    card.innerHTML = `
      <img src="images/${imageName}.jpg" alt="${d.name}" onerror="this.src='default.png'">
      <div class="mobile-card-content">
        <h3>${d.name}</h3>
        <p>出賽數：${d.total}</p>
        <p>勝場數：${d.win}</p>
        <p>敗場數：${d.lose}</p>
        <p>目前連勝/敗：${d.current}</p>
        <p>勝率：${(d.winRate * 100).toFixed(1)}%</p>
        <button onclick="showDetail('${d.name}','${type}')">明細</button>
      </div>
    `;
    cardContainer.appendChild(card);
  });

  container.appendChild(cardContainer);
}

function renderAttendanceTable() {
  const container = document.querySelector('#attendance');
  container.innerHTML = "";
  const data = [...fullData['combined']].sort((a, b) => b.total - a.total);

  if (currentMode === "card") {
    const cardContainer = document.createElement("div");
    cardContainer.className = "mobile-card-container";
    data.forEach(d => {
      const imageName = toHalfWidth(d.name).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
      const card = document.createElement("div");
      card.className = "mobile-card";
      card.innerHTML = `
        <img src="images/${imageName}.jpg" alt="${d.name}" onerror="this.src='default.png'">
        <div class="mobile-card-content">
          <h3>${d.name}</h3>
          <p>出賽數：${d.total}</p>
        </div>
      `;
      cardContainer.appendChild(card);
    });
    container.appendChild(cardContainer);
  } else {
    const table = document.createElement("table");
    table.innerHTML = `<thead><tr><th>成員</th><th>出賽數</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");
    data.forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${d.name}</td><td>${d.total}</td>`;
      tbody.appendChild(row);
    });
    container.appendChild(table);
  }
}
function renderChartA() {
  const ctx = document.getElementById("canvasA").getContext("2d");
  const data = [...fullData['combined']].sort((a, b) => b.winRate - a.winRate);
  const labels = data.map(d => d.name);
  const winRates = data.map(d => +(d.winRate * 100).toFixed(1));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: '勝率 %', data: winRates, backgroundColor: '#ff9999' }]
    },
    options: { responsive: true, indexAxis: 'y' }
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

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '主場勝率', data: homeRates, backgroundColor: '#99ccff' },
        { label: '客場勝率', data: awayRates, backgroundColor: '#ff99cc' }
      ]
    },
    options: { responsive: true, indexAxis: 'y' }
  });
}

function renderChartD() {
  const ctx = document.getElementById("canvasD").getContext("2d");
  let data = [...fullData['combined']].map(d => {
    let val = 0;
    if (d.current.includes("連勝")) val = parseInt(d.current);
    if (d.current.includes("連敗")) val = -parseInt(d.current);
    return {...d, streakVal: val};
  }).sort((a, b) => b.streakVal - a.streakVal);

  const labels = data.map(d => d.name);
  const streaks = data.map(d => d.streakVal);
  const colors = streaks.map(v => v < 0 ? "#ff7777" : "#77b5ff");

  new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: '目前連勝/連敗', data: streaks, backgroundColor: colors }] },
    options: { responsive: true, indexAxis: 'y' }
  });
}
function showDetail(name, type) {
  const d = fullData[type].find(d => d.name === name);
  const modal = document.getElementById("modal");
  const modalImage = document.getElementById("modalImage");
  const modalText = document.getElementById("modalText");
  modalImage.src = `images/${name}.jpg`;

  const details = d.detail || [];
  const detailHtml = details.length > 0
    ? `<ul>${details.map(g => `<li>${g.date}（${g.weekday_fixed}）${g.stadium} ${g.opponent_fixed} ${g.opp_score}:${g.self_score} ${g.result}</li>`).join('')}</ul>`
    : "<p>無出勤資料</p>";

  modalText.innerHTML = `<h3>${d.name} 出勤明細</h3>${detailHtml}`;
  modal.classList.remove("hidden");
}

document.querySelector(".close-button").onclick = () => {
  document.getElementById("modal").classList.add("hidden");
};

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
    document.getElementById(tab.dataset.type).classList.add("active");

    if (tab.dataset.type === "attendance" && !chartRendered.attendance) {
      renderAttendanceTable();
      chartRendered.attendance = true;
    }
    if (tab.dataset.type === "chartA" && !chartRendered.chartA) {
      renderChartA();
      chartRendered.chartA = true;
    }
    if (tab.dataset.type === "chartC" && !chartRendered.chartC) {
      renderChartC();
      chartRendered.chartC = true;
    }
    if (tab.dataset.type === "chartD" && !chartRendered.chartD) {
      renderChartD();
      chartRendered.chartD = true;
    }
  });
});

loadData();
