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
  const tabs = group.querySelectorAll("[data-tab]");
  const panels = group.querySelectorAll("[data-panel]");
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      for (const t of tabs) t.classList.toggle("active", t === tab);
      for (const panel of panels) panel.hidden = panel.dataset.panel !== target;
    });
  }
}
