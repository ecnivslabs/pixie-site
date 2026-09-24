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

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const spinnerEls = document.querySelectorAll(".spinner-frame");
let spinnerFrame = 0;
if (spinnerEls.length > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(() => {
    spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
    for (const el of spinnerEls) el.textContent = SPINNER_FRAMES[spinnerFrame];
  }, 80);
}

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
