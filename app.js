let fullData = [];
let currentSort = 'winRate';

async function loadData() {
  const res = await fetch('cheerleader_stats_data.json');
  const json = await res.json();
  fullData = [...json.combined];
  renderCards();
  document.getElementById("loading").classList.add("hidden");
}

function sortBy(field) {
  currentSort = field;
  renderCards();
}

function renderCards() {
  let sortedData = [...fullData];

  sortedData.sort((a, b) => {
    let valA = (fieldValue(a, currentSort));
    let valB = (fieldValue(b, currentSort));
    return valB - valA;
  });

  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  sortedData.forEach(d => {
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

function showDetail(name) {
  const d = fullData.find(d => d.name === name);
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

document.getElementById("photoModalClose").onclick = () => {
  document.getElementById("photoModal").classList.add("hidden");
};

loadData();
