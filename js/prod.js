document.addEventListener('DOMContentLoaded', function () {
  const words = s => (s.trim().match(/[\p{L}\p{N}'’\-]+/gu) || []).length;

  // Word count of model texts
  document.querySelectorAll('[data-count]').forEach(function (el) {
    const out = el.parentElement.querySelector('[data-count-out]');
    if (out) out.textContent = words(el.textContent);
  });

  const txt = document.getElementById('txt');
  if (!txt) return;
  const kind = document.getElementById('kind'), target = document.getElementById('target');
  const check = document.getElementById('check');

  const LISTS = {
    cr: ['لا يوجد «je» ولا رأي شخصي', 'accroche في البداية (auteur + titre + sujet)', '4–5 أفكار رئيسية مرتبة كترتيب النص',
      'إعادة صياغة (لا نقل حرفي)', 'روابط منطقية بين الأفكار', 'ضمير الغائب وأفعال الكلام (souligner, expliquer…)',
      'عدد الكلمات ضمن ±10% من المطلوب', 'إملاء: ≤ 10 أخطاء، تطابق الفعل والفاعل'],
    libre: ['المناسبة والمخاطَب مذكوران في المقدمة', '2–3 حجج مدعّمة بأمثلة', 'خاتمة بدعوة مباشرة (impératif / je vous invite)',
      'vous/nous متسق مع المخاطَب', 'جمل قصيرة وروابط واضحة', 'عدد الكلمات ضمن ±10% من المطلوب',
      'الدعامة مناسبة (facebook, forum, mur…)', 'إملاء: ≤ 10 أخطاء، أزمنة صحيحة'],
  };
  function drawCheck() {
    const k = kind.value;
    const saved = BG.load('prod.check.' + k, {});
    check.innerHTML = LISTS[k].map((t, i) => `<li><input type="checkbox" id="ck${i}" data-i="${i}" ${saved[i] ? 'checked' : ''}><label for="ck${i}" style="font-weight:400;margin:0">${t}</label></li>`).join('');
  }
  check.addEventListener('change', function (e) {
    const k = kind.value, saved = BG.load('prod.check.' + k, {});
    saved[e.target.dataset.i] = e.target.checked; BG.save('prod.check.' + k, saved);
  });

  function analyse() {
    const t = txt.value;
    const w = words(t);
    const sentences = (t.match(/[^.!?…]+[.!?…]+/g) || []).length || (t.trim() ? 1 : 0);
    const lines = t ? t.split(/\n/).filter(l => l.trim()).length : 0;
    document.getElementById('cW').textContent = w;
    document.getElementById('cS').textContent = sentences;
    document.getElementById('cL').textContent = lines;
    const tg = +target.value;
    const st = document.getElementById('cStatus');
    if (!w) st.textContent = '';
    else if (w < tg * 0.9) { st.textContent = 'أقل من المطلوب (' + (tg - w) + ' كلمة ناقصة)'; st.className = 'no'; }
    else if (w > tg * 1.1) { st.textContent = 'أكثر من المطلوب (+' + (w - tg) + ')'; st.className = 'no'; }
    else { st.textContent = 'ضمن المجال المقبول ✓'; st.className = 'ok'; }

    const warns = [];
    const lower = ' ' + t.toLowerCase().replace(/[’]/g, "'") + ' ';
    if (kind.value === 'cr' && /(^|[^\p{L}])(je|j'|me|mon|ma|mes|à mon avis|nous pensons)(?=[^\p{L}]|$)/u.test(lower))
      warns.push('وُجد ضمير المتكلم أو عبارة رأي («je», «mon avis»…): ممنوع في compte rendu objectif.');
    if (kind.value === 'libre' && w > 20 && !/(vous|nous)/.test(lower))
      warns.push('لا يوجد «vous/nous»: الـ appel يخاطب الجمهور مباشرة.');
    if (kind.value === 'libre' && w > 40 && !/(!|\b(protégez|participez|rejoignez|agissez|refusez|partagez|choisissez|évitez|soyez|n'attendez)\b|invite|appelons|il faut|il est temps)/.test(lower))
      warns.push('لم أجد صيغة حثّ (أمر، «il faut»، «je vous invite»…) في النص.');
    // repetitions: words (>4 letters) used 4+ times
    const freq = {};
    (t.toLowerCase().match(/[\p{L}']{5,}/gu) || []).forEach(x => (freq[x] = (freq[x] || 0) + 1));
    const rep = Object.entries(freq).filter(([, n]) => n >= 4).map(([k, n]) => k + ' ×' + n);
    if (rep.length) warns.push('تكرار: ' + rep.slice(0, 5).join('، ') + ' — استعمل مرادفات.');
    if (w > 15 && sentences && w / sentences > 35) warns.push('الجمل طويلة جداً (متوسط ' + Math.round(w / sentences) + ' كلمة): قسّمها.');
    document.getElementById('warns').innerHTML = warns.map(x => `<div class="callout warn">${BG.esc(x)}</div>`).join('');
    BG.save('prod.draft', t);
  }

  txt.value = BG.load('prod.draft', '');
  [txt, kind, target].forEach(e => e.addEventListener('input', analyse));
  kind.addEventListener('change', drawCheck);
  drawCheck(); analyse();

  // open tab from hash (#cr, #appel, #grille)
  const h = location.hash.slice(1);
  const map = { cr: 'tab-cr', appel: 'tab-appel', tool: 'tab-tool' };
  if (map[h]) document.getElementById(map[h]).click();

  // launched from "Today": finishing the writing exercise completes the day's main task
  if (BG.param('task') === 'main') {
    const row = document.getElementById('toolDone');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn'; b.textContent = 'أنهيت الكتابة، عُد إلى اليوم';
    b.addEventListener('click', function () { BG.markDone('main', 'كتابة نص قصير'); location.href = 'index.html'; });
    row.appendChild(b);
  }
});
