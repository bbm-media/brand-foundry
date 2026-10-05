// The setup invitation can be dismissed; Brand Settings is always a normal link.
(async () => {
  try {
    const response = await fetch('/api/brand');
    if (!response.ok) return;
    const { brand, setup } = await response.json();
    document.documentElement.style.setProperty('--accent', brand.accent);
    document.documentElement.style.setProperty('--accent-soft', brand.accentSoft);
    if (location.pathname !== '/' && location.pathname !== '/index.html') return;
    if (setup !== 'new') return;
    const dialog = document.createElement('dialog');
    dialog.className = 'brand-invite';
    dialog.innerHTML = '<h2>Make this your studio</h2><p>Add your colors, fonts, and handle. Your starter templates will be ready for your brand.</p><a class="brand-action" href="/settings.html">Set up my brand</a> <button type="button">Skip for now</button><p class="sub">You can do this anytime in Brand Settings.</p><p role="status"></p>';
    const skip = async () => {
      try {
        const result = await fetch('/api/brand/dismiss', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
        if (!result.ok) throw new Error('Could not save your preference. Try again.');
        dialog.close(); dialog.remove();
      } catch (e) { dialog.querySelector('[role=status]').textContent = e.message; }
    };
    dialog.querySelector('button').onclick = skip;
    dialog.addEventListener('cancel', event => { event.preventDefault(); skip(); });
    document.body.append(dialog); dialog.showModal();
  } catch { /* The library remains usable if the setup invitation cannot load. */ }
})();
