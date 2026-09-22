const demoItems = [
  { id: "demo-1", name: "디지털 현미경", category: "생명과학", quantity: 8, location: "과학실 A · 2번장", detail: "USB 연결형 · 500배", updatedAt: "2026-09-22T09:30:00+09:00" },
  { id: "demo-2", name: "유리 비커 500 mL", category: "화학", quantity: 24, location: "화학 준비실 · 1번장", detail: "내열 유리", updatedAt: "2026-09-22T09:30:00+09:00" },
  { id: "demo-3", name: "디지털 멀티미터", category: "물리", quantity: 6, location: "물리 준비실 · 계측장", detail: "전압·전류·저항 측정", updatedAt: "2026-09-22T09:30:00+09:00" },
  { id: "demo-4", name: "천체 망원경", category: "지구과학", quantity: 2, location: "지구과학실 · 보관함", detail: "굴절식 · 삼각대 포함", updatedAt: "2026-09-22T09:30:00+09:00" },
  { id: "demo-5", name: "전자저울", category: "화학", quantity: 0, location: "화학 준비실 · 계측대", detail: "0.01 g 단위", updatedAt: "2026-09-22T09:30:00+09:00" },
  { id: "demo-6", name: "힘 센서", category: "물리", quantity: 4, location: "과학실 B · 3번장", detail: "데이터 로거 연결형", updatedAt: "2026-09-22T09:30:00+09:00" }
];

const state = { items: [], query: "", category: "전체" };
const ui = {
  form: document.querySelector("#searchForm"),
  input: document.querySelector("#searchInput"),
  clear: document.querySelector("#clearButton"),
  filters: document.querySelector(".quick-filters"),
  grid: document.querySelector("#itemGrid"),
  loading: document.querySelector("#loadingGrid"),
  empty: document.querySelector("#emptyState"),
  summary: document.querySelector("#resultSummary"),
  notice: document.querySelector("#notice"),
  dataStatus: document.querySelector("#dataStatus"),
  lastUpdated: document.querySelector("#lastUpdated")
};

const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("ko-KR");
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function itemMatches(item) {
  const categoryMatches = state.category === "전체" || item.category === state.category;
  const searchable = normalize([item.name, item.category, item.location, item.detail].join(" "));
  return categoryMatches && searchable.includes(normalize(state.query));
}

function render() {
  const filtered = state.items.filter(itemMatches);
  ui.summary.textContent = state.query || state.category !== "전체"
    ? `조건에 맞는 교구 ${filtered.length}개`
    : `전체 교구 ${filtered.length}개`;
  ui.empty.hidden = filtered.length !== 0;
  ui.grid.innerHTML = filtered.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const available = quantity > 0;
    return `
      <article class="item-card">
        <div class="card-top">
          <span class="category">${escapeHtml(item.category || "미분류")}</span>
          <span class="availability ${available ? "" : "out"}">${available ? "보유 중" : "재고 없음"}</span>
        </div>
        <h3>${escapeHtml(item.name || "이름 없음")}</h3>
        <p class="item-detail">${escapeHtml(item.detail || "상세 정보 없음")}</p>
        <div class="card-bottom">
          <span class="location">${escapeHtml(item.location || "위치 미등록")}</span>
          <span class="quantity"><strong>${quantity}</strong><span>보유 수량</span></span>
        </div>
      </article>`;
  }).join("");
}

function setConnectionStatus(type, text) {
  ui.dataStatus.className = `status-pill ${type}`;
  ui.dataStatus.innerHTML = `<span class="status-dot"></span>${escapeHtml(text)}`;
}

function setLastUpdated(items) {
  const timestamps = items.map(item => new Date(item.updatedAt)).filter(date => !Number.isNaN(date.getTime()));
  if (!timestamps.length) {
    ui.lastUpdated.textContent = "마지막 업데이트: 기록 없음";
    return;
  }
  const latest = new Date(Math.max(...timestamps));
  ui.lastUpdated.textContent = `마지막 업데이트: ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(latest)}`;
}

async function loadInventory() {
  const config = window.APP_CONFIG ?? {};
  try {
    if (config.mode !== "firebase") {
      state.items = demoItems;
      ui.notice.hidden = false;
      ui.notice.textContent = "현재 샘플 데이터를 표시하고 있습니다. config.js에 Firebase 정보를 입력하면 실제 재고를 조회합니다.";
      setConnectionStatus("online", "샘플 데이터");
    } else {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
      const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
      const app = initializeApp(config.firebase);
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, config.collectionName || "inventory"));
      state.items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConnectionStatus("online", "데이터 연결됨");
    }
    setLastUpdated(state.items);
  } catch (error) {
    console.error("재고 데이터 로딩 실패:", error);
    state.items = [];
    ui.notice.hidden = false;
    ui.notice.textContent = "재고 데이터를 불러오지 못했습니다. Firebase 설정과 Firestore 읽기 권한을 확인하세요.";
    setConnectionStatus("error", "연결 오류");
    ui.lastUpdated.textContent = "마지막 업데이트: 불러오기 실패";
  } finally {
    ui.loading.hidden = true;
    render();
  }
}

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = ui.input.value;
  render();
  document.querySelector("#inventoryTitle").scrollIntoView({ behavior: "smooth", block: "start" });
});

ui.input.addEventListener("input", () => {
  ui.clear.hidden = !ui.input.value;
  state.query = ui.input.value;
  render();
});

ui.clear.addEventListener("click", () => {
  ui.input.value = "";
  state.query = "";
  ui.clear.hidden = true;
  ui.input.focus();
  render();
});

ui.filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  ui.filters.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
  render();
});

loadInventory();
