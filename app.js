let fullData = {};

async function loadData() {
  const res = await fetch('cheerleader_stats_data.json');
  fullData = await res.json();
  renderCards('home');
}

function renderCards(mode) {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const data = fullData[mode] || [];
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = `images/${item.name}.jpg`;
    img.onerror = () => { img.src = "default.png"; }
    img.onclick = () => showModal(item.name);

    const info = document.createElement("div");
    info.innerHTML = `
      <h3>${item.name}</h3>
      <p>出賽數：${item.total}</p>
      <p>勝場數：${item.win}</p>
      <p>敗場數：${item.lose}</p>
      <p>勝率：${(item.total > 0 ? (item.win / item.total * 100).toFixed(1) : "0.0")}%</p>
      <p>目前連勝/敗：${item.current}</p>
    `;

    card.appendChild(img);
    card.appendChild(info);
    content.appendChild(card);
  });
}
function renderAttendance() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const data = fullData['combined'] || [];
  const sorted = [...data].sort((a, b) => b.total - a.total);

  sorted.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>排名 ${index + 1} - ${item.name}</h3>
      <p>出賽數：${item.total}</p>
    `;
    content.appendChild(card);
  });
}

function renderWinRate() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const data = fullData['combined'] || [];
  const sorted = [...data].sort((a, b) => {
    const wa = (a.total > 0) ? a.win / a.total : 0;
    const wb = (b.total > 0) ? b.win / b.total : 0;
    return wb - wa;
  });

  sorted.forEach((item, index) => {
    const winRateCalc = (item.total > 0) ? item.win / item.total : 0;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>排名 ${index + 1} - ${item.name}</h3>
      <p>勝率：${(winRateCalc*100).toFixed(1)}%</p>
      <p>出賽數：${item.total}</p>
    `;
    content.appendChild(card);
  });
}

function renderCompare() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const homeData = fullData['home'] || [];
  const awayData = fullData['away'] || [];

  homeData.forEach(home => {
    const away = awayData.find(a => a.name === home.name);
    const homeRate = (home.total > 0) ? (home.win / home.total * 100).toFixed(1) : "0.0";
    const awayRate = (away && away.total > 0) ? (away.win / away.total * 100).toFixed(1) : "0.0";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${home.name}</h3>
      <p>主場勝率：${homeRate}%</p>
      <p>客場勝率：${awayRate}%</p>
    `;
    content.appendChild(card);
  });
}
function renderStreak() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const data = fullData['combined'] || [];

  const sorted = [...data].sort((a, b) => {
    const aNum = parseInt(a.current.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.current.replace(/\D/g, '')) || 0;
    return bNum - aNum;
  });

  sorted.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>排名 ${index + 1} - ${item.name}</h3>
      <p>目前連勝/敗：${item.current}</p>
      <p>出賽數：${item.total}</p>
    `;
    content.appendChild(card);
  });
}

function showModal(name) {
  const allData = [...fullData['home'], ...fullData['away'], ...fullData['combined']];
  const record = allData.find(item => item.name === name);
  if (!record || !record.detail) return;

  let detailText = `${name} 出勤明細：\n\n`;
  record.detail.forEach(row => {
    detailText += `${row.date} (${row.weekday_fixed}) - ${row.stadium} - 對 ${row.opponent_fixed} - ${row.self_score}:${row.opp_score} - ${row.result}\n`;
  });

  alert(detailText);
}

function closePhotoModal() {
  document.getElementById("photoModal").classList.add("hidden");
}

function closeDetailModal() {
  document.getElementById("detailModal").classList.add("hidden");
}

loadData();
