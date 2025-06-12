let fullData = {};
let sortState = { "combined": null, "home": null, "away": null };
let chartRendered = { "chartA": false, "chartC": false, "chartD": false, "attendance": false };

// 目前畫面模式狀態 (table 或 card)
let currentMode = (window.innerWidth <= 768) ? "card" : "table";

async function loadData() {
  const res = await fetch('cheerleader_stats_data.json');
  fullData = await res.json();
  document.getElementById("loading").style.display = "none";

  // 預設先 render 三個 table/card 區塊
  ['home', 'away', 'combined'].forEach(type => renderTable(type));

  window.addEventListener("resize", () => {
    const newMode = (window.innerWidth <= 768) ? "card" : "table";
    if (newMode !== currentMode) {
      currentMode = newMode;
      ['home', 'away', 'combined'].forEach(type => renderTable(type));
      if (chartRendered.attendance) {
        renderAttendanceTable();
      }
    }
  });
}

function toHalfWidth(str) {
  return str.replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, ' ');
}

function renderTable(type) {
  const container = document.getElementById(type);
  container.innerHTML = "";

  if (window.innerWidth <= 768) {
    renderCardTable(container, [...fullData[type]], type);
  } else {
    renderNormalTable(container, [...fullData[type]], type);
  }
}
function renderNormalTable(container, data, type) {
  const table = document.createElement('table');
  table.innerHTML = `
  <thead><tr>
  <th>WS</th><th>排名</th><th>成員</th><th>出賽數</th><th>勝場數</th>
  <th>敗場數</th><th>目前連勝/敗</th><th>勝率</th><th>出勤明細</th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  
  data.sort((a, b) => b.winRate - a.winRate);
  data.forEach((d, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i+1}</td>
      <td>${i+1}</td>
      <td>${d.name}</td>
      <td>${d.total}</td>
      <td>${d.win}</td>
      <td>${d.lose}</td>
      <td>${d.current}</td>
      <td>${(d.winRate*100).toFixed(1)}%</td>
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

  if (window.innerWidth <= 768) {
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
