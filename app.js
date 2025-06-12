let fullData = {};
let currentTab = "combined";
let currentSort = "winRate";
let chart = null;

async function loadData() {
  const res = await fetch('cheerleader_stats_data.json');
  fullData = await res.json();
  document.getElementById("loading").classList.add("hidden");
  renderTab();
}

function renderTab() {
  document.getElementById("chartContainer").classList.add("hidden");
  document.getElementById("cardContainer").classList.remove("hidden");
  document.querySelector(".sort-bar").classList.remove("hidden");

  if (currentTab === "attendance") {
    renderAttendance();
  } else if (currentTab === "chartA") {
    renderChartA();
  } else if (currentTab === "chartC") {
    renderChartC();
  } else if (currentTab === "chartD") {
    renderChartD();
  } else {
    renderCards();
  }
}

function sortBy(field) {
  currentSort = field;
  renderCards();
}

function fieldValue(obj, field) {
  if (field === 'current') {
    if (obj.current.includes("連勝")) return parseInt(obj.current);
    if (obj.current.includes("連敗")) return -parseInt(obj.current);
    return 0;
  }
  return obj[field] ?? 0;
}

function sanitizeName(name) {
  return name.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
}

function renderCards() {
  let data = [...fullData[currentTab]];
  data.sort((a, b) => fieldValue(b, currentSort) - fieldValue(a, currentSort));

  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  data.forEach(d => {
    const card = document.createElement("div");
    card.className = "card";
    const imageName = sanitizeName(d.name);
    card.innerHTML = `
      <img src="images/${imageName}.jpg" onerror="this.src='default.png'" alt="${d.name}">
      <div class="card-content">
        <h3>${d.name}</h3>
        <p>出賽數：${d.total}</p>
        <p>勝場數：${d.win}</p>
        <p>敗場數：${d.lose}</p>
        <p>連勝/敗：${d.current}</p>
        <p>勝率：${(d.winRate*100).toFixed(1)}%</p>
        <button onclick="showDetail('${d.name}')">出勤明細</button>
      </div>
    `;
    container.appendChild(card);
  });
}
function renderAttendance() {
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";
  document.querySelector(".sort-bar").classList.add("hidden");

  let data = [...fullData['combined']].sort((a, b) => b.total - a.total);
  data.forEach(d => {
    const card = document.createElement("div");
    card.className = "card";
    const imageName = sanitizeName(d.name);
    card.innerHTML = `
      <img src="images/${imageName}.jpg" onerror="this.src='default.png'" alt="${d.name}">
      <div class="card-content">
        <h3>${d.name}</h3>
        <p>出賽數：${d.total}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderChartA() {
  switchToChart();
  let data = [...fullData['combined']].sort((a, b) => b.winRate - a.winRate);
  const labels = data.map(d => d.name);
  const winRates = data.map(d => +(d.winRate * 100).toFixed(1));

  chart = new Chart(document.getElementById("chartCanvas"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: '勝率 %', data: winRates, backgroundColor: '#ff9999' }]
    },
    options: { indexAxis: 'y', responsive: true }
  });
}

function renderChartC() {
  switchToChart();
  const combined = fullData['combined'];
  const home = fullData['home'];
  const away = fullData['away'];
  const labels = combined.map(d => d.name);
  const homeRates = home.map(d => +(d.winRate * 100).toFixed(1));
  const awayRates = away.map(d => +(d.winRate * 100).toFixed(1));

  chart = new Chart(document.getElementById("chartCanvas"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '主場勝率', data: homeRates, backgroundColor: '#99ccff' },
        { label: '客場勝率', data: awayRates, backgroundColor: '#ff99cc' }
      ]
    },
    options: { indexAxis: 'y', responsive: true }
  });
}
function renderChartD() {
  switchToChart();
  let data = [...fullData['combined']].map(d => {
    let val = 0;
    if (d.current.includes("連勝")) val = parseInt(d.current);
    if (d.current.includes("連敗")) val = -parseInt(d.current);
    return {...d, streakVal: val};
  }).sort((a, b) => b.streakVal - a.streakVal);

  const labels = data.map(d => d.name);
  const streaks = data.map(d => d.streakVal);
  const colors = streaks.map(v => v < 0 ? "#ff7777" : "#77b5ff");

  chart = new Chart(document.getElementById("chartCanvas"), {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: '目前連勝/連敗', data: streaks, backgroundColor: colors }] },
    options: { indexAxis: 'y', responsive: true }
  });
}

function switchToChart() {
  document.getElementById("cardContainer").classList.add("hidden");
  document.getElementById("chartContainer").classList.remove("hidden");
  document.querySelector(".sort-bar").classList.add("hidden");
  if (chart) chart.destroy();
}

function showDetail(name) {
  const d = fullData[currentTab].find(d => d.name === name);
  document.getElementById("modalName").innerText = name + " 出勤明細";
  const ul = document.getElementById("modalList");
  ul.innerHTML = "";

  d.detail.forEach(record => {
    const li = document.createElement("li");
    li.innerHTML = `${record.date}（${record.weekday_fixed}） ${record.stadium} ${record.opponent_fixed} ${record.opp_score}:${record.self_score} ${record.result}`;
    ul.appendChild(li);
  });

  document.getElementById("modal").classList.remove("hidden");
}

document.getElementById("modalClose").onclick = () => {
  document.getElementById("modal").classList.add("hidden");
};

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;
    renderTab();
  });
});

loadData();
