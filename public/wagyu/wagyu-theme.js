/* Wagyu-Design für den Kaufprozess: markiert Wagyu-Dialoge mit der Klasse .wx-theme (Aussehen in wagyu-event.css).
   - Ticket-Dialog (.fj-ticket-dialog): immer Wagyu.
   - Warenkorb/Kasse (.cart-dialog): nur, wenn Wagyu-Plätze im Warenkorb liegen. Reine Gutschein-Warenkörbe bleiben im feine-jungs-Stil.
   - Abdunkelung hinter einem Wagyu-Dialog: .wx-overlay.
   Ändert nur Klassen, keine Inhalte und keine Kauflogik. */
(function () {
  function hasWagyu(dlg) {
    var items = dlg.querySelectorAll('.cart-item');
    for (var i = 0; i < items.length; i++) { if (/Wagyu/i.test(items[i].textContent || '')) return true; }
    return false;
  }
  function mark() {
    var any = false;
    var dialogs = document.querySelectorAll('[role=dialog].fj-ticket-dialog, [role=dialog].cart-dialog');
    for (var i = 0; i < dialogs.length; i++) {
      var d = dialogs[i];
      var on = d.classList.contains('fj-ticket-dialog') || hasWagyu(d);
      if (d.classList.contains('wx-theme') !== on) d.classList.toggle('wx-theme', on);
      if (on) any = true;
    }
    var ov = document.querySelectorAll('[data-slot=dialog-overlay]');
    for (var j = 0; j < ov.length; j++) { if (ov[j].classList.contains('wx-overlay') !== any) ov[j].classList.toggle('wx-overlay', any); }
  }
  // Direkt im Observer (läuft vor dem nächsten Zeichnen) → kein kurzes Aufblitzen im alten Stil.
  function start() { mark(); new MutationObserver(mark).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
