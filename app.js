let fullData = {};
let chartRendered = {"home": false, "away": false, "combined": false, "attendance": false, "winrate": false, "homeaway": false, "streak": false};

async function loadData() {
  const res = await fetch("cheerleader_stats_data.json");
  fullData = await res.json();
  document.getElementById("loading").style.display = "none";
  switchTab('home');
}

function calcAxisLimit(values) {
  const min = Math.max(0, Math.floor(Math.min(...values) - 10));
  const max = Math.min(100, Math.ceil(Math.max(...values) + 10));
  return {min, max};
}

function toStreakValue(currentStr) {
  if (currentStr.includes("連勝")) return parseInt(currentStr);
  if (currentStr.includes("連敗")) return -parseInt(currentStr);
  return 0;
}

function switchTab(type) {
  const main = document.getElementById("mainContent");
  main.innerHTML = "";

  if (type === "home" || type === "away" || type === "total") {
    renderMainTable(type);
  }
  if (type === "attendance") {
    renderAttendanceTable();
  }
  if (type === "winrate") {
    renderChartA();
  }
  if (type === "homeaway") {
    renderChartC();
  }
  if (type === "streak") {
    renderChartD();
  }
}
function renderMainTable(type) {
  const data = (type === 'home') ? fullData.home :
               (type === 'away') ? fullData.away :
               fullData.combined;

  const table = document.createElement("table");
  table.innerHTML = `
    <tr>
      <th>照片</th>
      <th>成員</th>
      <th>出賽數</th>
      <th>目前連勝/敗</th>
      <th>勝率</th>
      <th>出勤明細</th>
    </tr>`;

  data.forEach(d => {
    const tr = document.createElement("tr");
    const imageName = d.name.replace(/\s+/g, '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const imgPath = `images/${imageName}.jpg`;

    tr.innerHTML = `
      <td><img src="${imgPath}" class="avatar" onerror="this.src='images/default.png'" onclick="showPhoto('${imgPath}')"></td>
      <td>${d.name}</td>
      <td>${d.total}</td>
      <td>${d.current}</td>
      <td>${(d.winRate * 100).toFixed(1)}%</td>
      <td><button onclick="showDetail('${d.name}','${type}')">查看</button></td>
    `;
    table.appendChild(tr);
  });

  document.getElementById("mainContent").appendChild(table);
}

function renderAttendanceTable() {
  const table = document.createElement("table");
  table.innerHTML = `
    <tr>
      <th>成員</th>
      <th>主場</th>
      <th>客場</th>
      <th>總出賽</th>
    </tr>`;

  const data = fullData.combined.map(d => {
    const homeObj = fullData.home.find(h => h.name === d.name);
    const awayObj = fullData.away.find(a => a.name === d.name);
    return {
      name: d.name,
      home: homeObj ? homeObj.total : 0,
      away: awayObj ? awayObj.total : 0,
      total: d.total
    };
  }).sort((a,b)=>b.home - a.home);

  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name}</td>
      <td>${d.home}</td>
      <td>${d.away}</td>
      <td>${d.total}</td>
    `;
    table.appendChild(tr);
  });

  document.getElementById("mainContent").appendChild(table);
}
function renderChartA() {
  const ctx = createChartCanvas();

  const data = [...fullData.combined].sort((a,b)=>b.winRate-a.winRate);
  const labels = data.map(d => d.name);
  const winRates = data.map(d => +(d.winRate * 100).toFixed(1));
  const axis = calcAxisLimit(winRates);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "勝率 %",
        data: winRates,
        backgroundColor: "rgba(0, 162, 255, 0.4)",
        borderColor: "#00A2FF"
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          min: axis.min,
          max: axis.max,
          ticks: { stepSize: 10, callback: v => `${v}%` }
        }
      }
    }
  });
}

function renderChartC() {
  const ctx = createChartCanvas();

  const merged = fullData.combined.map(c => {
    const home = fullData.home.find(h => h.name === c.name);
    const away = fullData.away.find(a => a.name === c.name);
    return {
      name: c.name,
      homeRate: home ? +(home.winRate * 100).toFixed(1) : 0,
      awayRate: away ? +(away.winRate * 100).toFixed(1) : 0
    };
  }).sort((a,b) => b.homeRate - a.homeRate);

  const labels = merged.map(d => d.name);
  const homeRates = merged.map(d => d.homeRate);
  const awayRates = merged.map(d => d.awayRate);
  const axis = calcAxisLimit([...homeRates, ...awayRates]);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "主場勝率", data: homeRates, backgroundColor: "rgba(0, 162, 255, 0.4)" },
        { label: "客場勝率", data: awayRates, backgroundColor: "rgba(255, 99, 132, 0.4)" }
      ]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          min: axis.min,
          max: axis.max,
          ticks: { stepSize: 10, callback: v => `${v}%` }
        }
      }
    }
  });
}

function renderChartD() {
  const ctx = createChartCanvas();

  const data = fullData.combined.map(d => {
    let streak = 0;
    if (d.current.includes("連勝")) streak = parseInt(d.current);
    if (d.current.includes("連敗")) streak = -parseInt(d.current);
    return { name: d.name, streak: streak };
  }).sort((a,b)=>b.streak-a.streak);

  const labels = data.map(d => d.name);
  const streaks = data.map(d => d.streak);
  const colors = streaks.map(v => v < 0 ? "#FF6666" : "#3399FF");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "目前連勝/連敗",
        data: streaks,
        backgroundColor: colors
      }]
    },
    options: {
      indexAxis: 'y'
    }
  });
}

function createChartCanvas() {
  const main = document.getElementById("mainContent");
  main.innerHTML = "";
  const canvas = document.createElement("canvas");
  main.appendChild(canvas);
  return canvas.getContext("2d");
}
function showDetail(name, type) {
  const source = type === "home" ? fullData.home :
                 type === "away" ? fullData.away :
                 fullData.combined;

  const item = source.find(d => d.name === name);
  const modal = document.getElementById("detailModal");
  const content = document.getElementById("modalContent");
  content.innerHTML = `<h2>${item.name} 出勤明細</h2>`;

  item.detail.forEach(d => {
    const row = document.createElement("div");
    row.className = "detail-row";
    row.innerHTML = `
      <span>${d.date}（${d.weekday_fixed}）</span>
      <span>${d.stadium}</span>
      <span>${d.opponent_fixed} ${d.self_score}：${d.opp_score} 啾啾</span>
      <span>${d.result}</span>`;
    content.appendChild(row);
  });

  modal.classList.remove("hidden");
}

function showPhoto(src) {
  const modal = document.getElementById("photoModal");
  const img = document.getElementById("modalImage");
  img.src = src;
  modal.classList.remove("hidden");
}

document.getElementById("detailModal").addEventListener("click", function(e) {
  if (e.target === e.currentTarget) this.classList.add("hidden");
});

document.getElementById("photoModal").addEventListener("click", function(e) {
  if (e.target === e.currentTarget) this.classList.add("hidden");
});

// 非常關鍵！loadData() 正確啟動點
loadData();
