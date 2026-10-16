// Shared light/dark switch. Applied before paint (see the inline snippet in each
// page's <head>) so there's no flash of the wrong theme on load.
//
// Order of precedence: saved choice → OS preference → light (the paper look).
(function () {
  const KEY = "studio-theme";
  const saved = localStorage.getItem(KEY);
  const osDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initial = saved || (osDark ? "dark" : "light");
  document.documentElement.dataset.theme = initial;

  window.mountThemeSwitch = function (mountId) {
    const host = document.getElementById(mountId);
    if (!host) return;
    host.className = "themeswitch";
    host.innerHTML = `<button data-t="light" title="Light mode" aria-label="Light mode">☀</button>
                      <button data-t="dark" title="Dark mode" aria-label="Dark mode">☾</button>`;
    const paint = () => host.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", b.dataset.t === document.documentElement.dataset.theme));
    host.querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        document.documentElement.dataset.theme = b.dataset.t;
        localStorage.setItem(KEY, b.dataset.t);
        paint();
      };
    });
    paint();
    // Follow the OS only while the user hasn't made an explicit choice.
    window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", (e) => {
      if (localStorage.getItem(KEY)) return;
      document.documentElement.dataset.theme = e.matches ? "light" : "dark";
      paint();
    });
  };
})();
