document.addEventListener('DOMContentLoaded', function () {
  const art = document.querySelector('article.ex-fr');
  const year = art.dataset.year;
  const s = BG.param('s');                      // suggested sujet from "Today"
  if (s === '1' || s === '2') {
    document.querySelectorAll('.pills a[data-s]').forEach(a => { if (a.dataset.s === s) a.setAttribute('aria-current', 'true'); });
    if (!location.hash) document.getElementById('s' + s).scrollIntoView();
  }
  document.getElementById('doneBtn').addEventListener('click', function () {
    const key = BG.param('k') || (s ? year + '-' + s : null);
    if (key) {
      const seen = BG.load('texts', []);
      if (seen.indexOf(key) < 0) { seen.push(key); BG.save('texts', seen); }
    }
    BG.markDone('main', 'نص: بكالوريا ' + year + (s ? ' — ' + (s === '1' ? 'الموضوع الأول' : 'الموضوع الثاني') : ''));
    location.href = '../index.html';
  });
});
