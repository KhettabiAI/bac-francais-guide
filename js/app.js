/* Common helpers — namespace BG. All data stays in localStorage (per browser). */
(function () {
  const PREFIX = 'bg.';
  const BG = (window.BG = {});

  BG.load = function (key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  };
  BG.save = function (key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch (e) { BG.toast('تعذّر الحفظ في المتصفح'); return false; }
  };
  BG.dayMs = 86400000;
  BG.todayStr = function (d) {
    d = d || new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };
  BG.addDays = function (dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return BG.todayStr(d);
  };
  BG.daysBetween = function (a, b) {
    return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / BG.dayMs);
  };
  BG.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  BG.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  BG.shuffle = function (a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  BG.toast = function (msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  // Shared error log (used by quiz, annales, tracker)
  BG.addError = function (err) {
    const log = BG.load('errors', []);
    log.unshift(Object.assign({ id: BG.uid(), date: BG.todayStr(), reviews: [], resolved: false }, err));
    BG.save('errors', log);
  };
  BG.ERR_TYPES = {
    texte: 'لم أفهم النص',
    question: 'لم أفهم السؤال',
    vocab: 'ضعف المفردات',
    ref: 'إحالة (مرجعية) خاطئة',
    releve: 'استخراج غير دقيق',
    limite: 'تجاوز الأسطر/الكلمات',
    langue: 'لغة (نحو/إملاء)',
    args: 'نقص حجج/أفكار',
    autre: 'أخرى',
  };

  // Theme
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('themeBtn');
    if (btn) btn.addEventListener('click', function () {
      const cur = document.documentElement.getAttribute('data-theme');
      const isDark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      const next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('bg.theme', next); } catch (e) {}
    });

    // Generic tabs: <div class="tabs" role="tablist" data-tabs> buttons[role=tab][aria-controls]
    document.querySelectorAll('[data-tabs]').forEach(function (list) {
      const tabs = list.querySelectorAll('[role="tab"]');
      function select(tab) {
        tabs.forEach(t => {
          const on = t === tab;
          t.setAttribute('aria-selected', on);
          t.tabIndex = on ? 0 : -1;
          const p = document.getElementById(t.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
      }
      tabs.forEach(t => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', e => {
          const arr = Array.from(tabs); let i = arr.indexOf(t);
          const rtl = getComputedStyle(list).direction === 'rtl';
          if (e.key === 'ArrowRight') i += rtl ? -1 : 1;
          else if (e.key === 'ArrowLeft') i += rtl ? 1 : -1;
          else return;
          e.preventDefault();
          const n = arr[(i + arr.length) % arr.length]; select(n); n.focus();
        });
      });
    });
  });
})();
