let fullData = {};

async function loadData() {
  const res = await fetch("cheerleader_stats_data.json");
  fullData = await res.json();
  document.getElementById("updateDate").innerText = getUpdateDate();
  renderAllTables();
  renderChartA();
  renderChartC();
  renderChartD();
}

function getUpdateDate() {
  const dates = fullData.combined.flatMap(d => d.detail.map(g => g.date));
  const maxDate = dates.sort().slice(-1)[0];
  return maxDate;
}

function calcAxisLimit(dataArr) {
  const minRaw = Math.min(...dataArr);
  const maxRaw = Math.max(...dataArr);
  let min = Math.floor(minRaw - 10);
  let max = Math.ceil(maxRaw + 10);
  if (min < 0) min = 0;
  if (max > 100) max = 100;
  return { min, max };
}
function renderAllTables() {
  renderMainTable("homeTable", fullData.home);
  renderMainTable("awayTable", fullData.away);
  renderMainTable("totalTable", fullData.combined);
  renderAttendanceTable();
}

function renderMainTable(tableId, data) {
  const table = document.getElementById(tableId);
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
    const imgPath = `images/${d.name.replace(/\s+/g,'')}.jpg`;
    tr.innerHTML = `
      <td><img src="${imgPath}" class="avatar" onerror="this.src='images/default.png'"></td>
      <td>${d.name}</td>
      <td>${d.total}</td>
      <td>${d.current}</td>
      <td>${(d.winRate * 100).toFixed(1)}%</td>
      <td><button onclick="showDetail('${d.name}','${tableId.includes('home')?'home':tableId.includes('away')?'away':'combined'}')">查看</button></td>
    `;
    table.appendChild(tr);
  });
}

function renderAttendanceTable() {
  const table = document.getElementById("attendTable");
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
}
function renderChartA() {
  const ctx = document.getElementById("chartA").getContext("2d");
  const sorted = [...fullData.combined].sort((a, b) => b.winRate - a.winRate);
  const labels = sorted.map(d => d.name);
  const winRates = sorted.map(d => +(d.winRate * 100).toFixed(1));

  const axis = calcAxisLimit(winRates);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "勝率 %",
        data: winRates,
        backgroundColor: "rgba(0, 162, 255, 0.4)",
        borderColor: "#00A2FF",
        borderWidth: 1
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
  const ctx = document.getElementById("chartC").getContext("2d");

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
  const ctx = document.getElementById("chartD").getContext("2d");

  const data = fullData.combined.map(d => {
    let streak = 0;
    if (d.current.includes("連勝")) streak = parseInt(d.current);
    if (d.current.includes("連敗")) streak = -parseInt(d.current);
    return { name: d.name, streak: streak };
  }).sort((a, b) => b.streak - a.streak);

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
