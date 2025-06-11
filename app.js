let fullData = {};

async function loadData() {
  const res = await fetch('./cheerleader_stats_data.json');
  fullData = await res.json();

  updateDate(fullData.date);
  renderMainTable("home");
  renderAttendanceChart();
  renderWinRateChart();
  renderHomeAwayChart();
  renderStreakChart();
}

function updateDate(dateStr) {
  document.getElementById("titleDate").innerText = `（截至 ${dateStr}）`;
}
function renderMainTable(tab) {
  const tbody = document.querySelector("#mainTable tbody");
  tbody.innerHTML = "";

  let data = [];
  if (tab === "home") data = fullData.home;
  else if (tab === "away") data = fullData.away;
  else data = fullData.combined;

  data.forEach(player => {
    const tr = document.createElement("tr");

    const imgTd = document.createElement("td");
    const img = document.createElement("img");
    img.src = player.photo || "./images/default.jpg";
    img.onerror = () => { img.src = "./images/default.jpg"; };
    img.addEventListener("click", () => showPhoto(player));
    imgTd.appendChild(img);

    const nameTd = document.createElement("td");
    nameTd.innerText = player.name;

    const gameTd = document.createElement("td");
    gameTd.innerText = player.total;

    const winTd = document.createElement("td");
    winTd.innerText = player.win;

    const loseTd = document.createElement("td");
    loseTd.innerText = player.lose;

    const streakTd = document.createElement("td");
    streakTd.innerText = `${Math.abs(player.streak)}連${player.streak > 0 ? '勝' : player.streak < 0 ? '敗' : ''}`;

    const rateTd = document.createElement("td");
    rateTd.innerText = `${(player.winRate * 100).toFixed(1)}%`;

    const btnTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.innerText = "查看";
    btn.className = "detail-btn";
    btn.addEventListener("click", () => showDetail(player));
    btnTd.appendChild(btn);

    tr.appendChild(imgTd);
    tr.appendChild(nameTd);
    tr.appendChild(gameTd);
    tr.appendChild(winTd);
    tr.appendChild(loseTd);
    tr.appendChild(streakTd);
    tr.appendChild(rateTd);
    tr.appendChild(btnTd);
    tbody.appendChild(tr);
  });
}
function renderTotalGames() {
  const tbody = document.querySelector("#totalTable tbody");
  tbody.innerHTML = "";

  let list = [...fullData.combined];
  list.sort((a, b) => (b.totalHome ?? 0) - (a.totalHome ?? 0));

  list.forEach(player => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.innerText = player.name;

    const homeTd = document.createElement("td");
    homeTd.innerText = player.totalHome ?? 0;

    const awayTd = document.createElement("td");
    awayTd.innerText = player.totalAway ?? 0;

    const totalTd = document.createElement("td");
    totalTd.innerText = player.total;

    tr.appendChild(nameTd);
    tr.appendChild(homeTd);
    tr.appendChild(awayTd);
    tr.appendChild(totalTd);
    tbody.appendChild(tr);
  });
}
function renderWinRateChart() {
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

function renderHomeAwayChart() {
  const ctx = document.getElementById("chartC").getContext("2d");
  const merged = fullData.combined.map(c => {
    const home = fullData.home.find(h => h.name === c.name);
    const away = fullData.away.find(a => a.name === c.name);
    return {
      name: c.name,
      homeRate: home ? +(home.winRate * 100).toFixed(1) : 0,
      awayRate: away ? +(away.winRate * 100).toFixed(1) : 0
    };
  }).sort((a, b) => b.homeRate - a.homeRate);

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

function renderStreakChart() {
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
function showDetail(player) {
  const modal = document.getElementById("detailModal");
  const content = document.getElementById("modalContent");
  content.innerHTML = `<h2>${player.name} 出勤明細</h2>`;

  player.detail.forEach(d => {
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

function showPhoto(player) {
  const modal = document.getElementById("photoModal");
  const modalImg = document.getElementById("modalImage");
  const imgPath = `images/${player.name.replace(/\s/g, '').replace(/[^\w]/g, '')}.jpg`;
  modalImg.src = imgPath;
  modal.classList.remove("hidden");
}

document.getElementById("photoModal").addEventListener("click", function(e) {
  if (e.target === e.currentTarget) this.classList.add("hidden");
});

document.getElementById("detailModal").addEventListener("click", function(e) {
  if (e.target === e.currentTarget) this.classList.add("hidden");
});

// 啟動點
loadData();
