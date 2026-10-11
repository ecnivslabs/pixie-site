const FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSc2PSLuJ3HEVeJk-6bwApAQj8lUVJ-tC6mWmhueQkPsmL4F-A/formResponse";
const ENTRY_NAME = "entry.1674574799";
const ENTRY_EMAIL = "entry.1343311890";

function bindWaitlistForm(form) {
  const container = form.parentElement;
  const fineprint = container.querySelector(".fineprint");
  const success = container.querySelector(".success");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    if (!name || !email) return;

    const button = form.querySelector("button");
    button.disabled = true;
    fineprint.textContent = "Sending your request…";

    const body = new URLSearchParams();
    body.set(ENTRY_NAME, name);
    body.set(ENTRY_EMAIL, email);

    try {
      // Google Forms blocks CORS reads; no-cors gives an opaque response,
      // so success here means the request was sent, not confirmed delivered.
      await fetch(FORM_ACTION, { method: "POST", mode: "no-cors", body });
      form.hidden = true;
      fineprint.hidden = true;
      success.hidden = false;
    } catch {
      fineprint.textContent = "Could not send your request. Please try again.";
      button.disabled = false;
    }
  });
}

for (const form of document.querySelectorAll("form.waitlist")) {
  bindWaitlistForm(form);
}

const SPINNER_FRAMES = ["^.^", "^.^", "^.^", "^.^", "^.^", "-.-", "^.^", "^.^", "^.^", "^.^"];

function bindActivityRow(row) {
  const marker = row.querySelector(".spinner-frame");
  const label = row.querySelector(".activity-text");
  const time = row.querySelector(".activity-time");
  const message = label.textContent;
  const characters = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(message)]
    .map(({ segment }) => segment);
  const letters = characters.map((character) => {
    const span = document.createElement("span");
    span.textContent = character;
    return span;
  });
  const ellipsis = document.createElement("span");
  ellipsis.textContent = "…";
  ellipsis.hidden = true;
  label.replaceChildren(...letters, ellipsis);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const startedAt = Date.now();
  let animationStartedAt = startedAt;
  const measure = document.createElement("canvas").getContext("2d");
  let columns = 0;
  let timer;

  function render() {
    const elapsed = Math.max(0, Date.now() - startedAt);
    const seconds = elapsed < 60000 ? Math.floor(elapsed / 1000) : Math.round(elapsed / 1000);
    const duration = seconds < 60 ? `${seconds}s`
      : seconds < 3600 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      : seconds < 86400 ? `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`
      : `${Math.floor(seconds / 86400)}d ${Math.floor(seconds % 86400 / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
    const fullTime = `(${duration} · esc to interrupt)`;
    const compactTime = `(${duration})`;
    let timeText = fullTime;
    if (columns < fullTime.length + 20) {
      timeText = columns >= compactTime.length + 10 ? compactTime : "";
    }
    time.textContent = timeText;
    time.hidden = !timeText;
    const budget = Math.max(0, columns - 4 - (timeText ? timeText.length + 1 : 0));
    const visible = characters.length <= budget ? characters.length : Math.max(0, budget - 1);
    const animation = reducedMotion.matches ? 0 : Math.max(0, Date.now() - animationStartedAt);
    marker.textContent = SPINNER_FRAMES[Math.floor(animation / 160) % SPINNER_FRAMES.length];
    const displayLength = visible < characters.length ? Math.min(budget, visible + 1) : visible;
    const head = Math.floor(animation / 80) % (displayLength + 10) - 3;
    for (const [index, letter] of letters.entries()) {
      letter.hidden = index >= visible;
      const distance = Math.min(Math.abs(index - head), Math.abs(index - head - 1));
      letter.dataset.tone = reducedMotion.matches || distance === 1 ? "muted"
        : distance === 0 ? "text" : "subtle";
    }
    ellipsis.hidden = visible === characters.length || budget === 0;
    const distance = Math.min(Math.abs(visible - head), Math.abs(visible - head - 1));
    ellipsis.dataset.tone = reducedMotion.matches || distance === 1 ? "muted"
      : distance === 0 ? "text" : "subtle";
  }

  function resize() {
    const style = getComputedStyle(row);
    measure.font = `${style.fontSize} ${style.fontFamily}`;
    columns = Math.floor(row.clientWidth / measure.measureText("0").width);
    render();
  }

  function startClock() {
    clearInterval(timer);
    animationStartedAt = Date.now();
    render();
    timer = setInterval(render, reducedMotion.matches ? 1000 : 80);
  }

  new ResizeObserver(resize).observe(row);
  reducedMotion.addEventListener("change", startClock);
  document.fonts.ready.then(resize);
  resize();
  startClock();
}

for (const row of document.querySelectorAll(".activity-row")) bindActivityRow(row);

for (const group of document.querySelectorAll("[data-tabgroup]")) {
  const tabs = [...group.querySelectorAll("[data-tab]")];
  const panels = group.querySelectorAll("[data-panel]");
  group.querySelector(".cappills").setAttribute("role", "tablist");
  group.querySelector(".cappills").setAttribute("aria-label", "Pixie capabilities");
  function selectTab(tab) {
    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.classList.toggle("active", selected);
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.panel !== tab.dataset.tab;
  }
  for (const panel of panels) {
    panel.id = `${group.dataset.tabgroup}-${panel.dataset.panel}-panel`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `${group.dataset.tabgroup}-${panel.dataset.panel}-tab`);
    panel.tabIndex = 0;
  }
  for (const tab of tabs) {
    tab.id = `${group.dataset.tabgroup}-${tab.dataset.tab}-tab`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `${group.dataset.tabgroup}-${tab.dataset.tab}-panel`);
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let index = tabs.indexOf(tab);
      if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") index = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") index = 0;
      else if (event.key === "End") index = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[index]);
      tabs[index].focus();
    });
  }
  selectTab(tabs.find((tab) => tab.classList.contains("active")) || tabs[0]);
}
