(function () {
  const API_BASE = (() => {
    if (document.currentScript && document.currentScript.src) {
      return new URL(document.currentScript.src).origin;
    }
    const all = document.querySelectorAll('script[src]');
    for (const s of all) {
      if (s.src && (s.src.includes('/widget.js') || s.src.includes('qiyasi'))) {
        try { return new URL(s.src).origin; } catch {}
      }
    }
    console.warn('[SSM] Could not detect API origin — defaulting to current page origin.');
    return window.location.origin;
  })();

  // ======= CSS =======
  const style = document.createElement("style");
  style.textContent = `
:root{--ssm-c:#0d9488;--ssm-cd:#0a7060;--ssm-cl:#e6f7f5;--ssm-cb:#b2e4de;--ssm-text:#1e2a3e}
#ssm-trigger{display:inline-flex;align-items:center;gap:7px;background:var(--ssm-c);color:#fff;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;font-family:'Segoe UI',Tahoma,Arial,sans-serif;margin-bottom:10px;white-space:nowrap;line-height:1}
#ssm-trigger:hover{background:var(--ssm-cd)}
#ssm-overlay{display:none;position:fixed;inset:0;background:rgba(10,20,40,.55);z-index:99999;justify-content:center;align-items:center;padding:16px;font-family:'Segoe UI',Arial,sans-serif}
#ssm-overlay.open{display:flex}
#ssm-modal{background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.ssm-header{background:var(--ssm-c);padding:20px 24px 16px;border-radius:20px 20px 0 0;color:#fff}
.ssm-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.ssm-title{font-size:17px;font-weight:700}
#ssm-close-btn{background:rgba(255,255,255,.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
#ssm-close-btn:hover{background:rgba(255,255,255,.35)}
.ssm-progress-wrap{display:flex;align-items:center;gap:10px}
.ssm-progress-bar{flex:1;background:rgba(255,255,255,.3);border-radius:99px;height:5px}
.ssm-progress-fill{background:#fff;height:5px;border-radius:99px;transition:width .3s}
.ssm-step-count{font-size:12px;opacity:.85;white-space:nowrap}
.ssm-body{padding:24px;direction:rtl}
.ssm-question{font-size:19px;font-weight:700;color:var(--ssm-text,#000000);margin-bottom:6px;line-height:1.4}
.ssm-hint{font-size:13px;color:#6b7280;margin-bottom:22px}
.ssm-cards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
.ssm-card{flex:1;min-width:100px;max-width:145px;border:2px solid #e5e7eb;border-radius:14px;padding:16px 10px 12px;cursor:pointer;text-align:center;background:#fafafa}
.ssm-card:hover{border-color:var(--ssm-c);background:var(--ssm-cl)}
.ssm-card.active{border-color:var(--ssm-c);background:var(--ssm-cl);box-shadow:0 0 0 3px var(--ssm-cb)}
.ssm-card .card-emoji{font-size:2.6rem;line-height:1;margin:0 auto 10px;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.ssm-card .card-label{font-size:13px;font-weight:700;color:var(--ssm-text,#000000)}
.ssm-number-group{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px}
.ssm-num-btn{width:44px;height:44px;border-radius:50%;border:2px solid var(--ssm-c);background:#fff;color:var(--ssm-c);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700}
.ssm-num-btn:hover{background:var(--ssm-c);color:#fff}
.ssm-num-input{width:100px;text-align:center;font-size:26px;font-weight:700;color:var(--ssm-text,#000000);border:2px solid #e5e7eb;border-radius:12px;padding:8px;outline:none}
.ssm-num-input:focus{border-color:var(--ssm-c)}
.ssm-unit{font-size:16px;color:#6b7280;margin-right:4px}
.ssm-nav{display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:16px;border-top:1px solid #f0f0f0}
.ssm-btn-back{background:none;border:none;color:var(--ssm-c);cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:5px;padding:8px 4px;border-radius:8px}
.ssm-btn-back:hover{background:var(--ssm-cl)}
.ssm-btn-next{background:var(--ssm-c);color:#fff;border:none;padding:12px 28px;border-radius:10px;cursor:pointer;font-size:15px;font-weight:700}
.ssm-btn-next:hover{background:var(--ssm-cd)}
.ssm-result{text-align:center;padding:10px 0}
.ssm-result-icon{font-size:56px;margin-bottom:12px}
.ssm-result-label{font-size:15px;color:#6b7280;margin-bottom:8px}
.ssm-result-size{font-size:72px;font-weight:900;color:var(--ssm-c);line-height:1;margin-bottom:16px}
.ssm-result-msg{font-size:14px;color:#374151;line-height:1.6;margin-bottom:12px}
.ssm-result-alts{font-size:13px;color:#6b7280;margin-bottom:12px}
.ssm-stock-warn{display:inline-block;background:#fff3cd;border:1px solid #ffc107;color:#856404;font-size:13px;font-weight:700;padding:8px 16px;border-radius:10px;margin-bottom:16px}
.ssm-restart{background:#f3f4f6;border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-size:14px;color:#374151}
.ssm-restart:hover{background:#e5e7eb}
.ssm-loading{text-align:center;padding:40px;color:#6b7280}
.ssm-spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:var(--ssm-c);border-radius:50%;animation:ssm-spin .8s linear infinite;margin:0 auto 16px}
@keyframes ssm-spin{to{transform:rotate(360deg)}}
.ssm-card-img{width:100%;aspect-ratio:3/4;border-radius:8px;margin-bottom:8px;background-repeat:no-repeat;overflow:hidden;}
  `;
  document.head.appendChild(style);

  // ======= Brand color =======
  function applyWhiteMode() {
    const r = document.documentElement;
    r.style.setProperty('--ssm-c',    '#6b7280');
    r.style.setProperty('--ssm-cd',   '#4b5563');
    r.style.setProperty('--ssm-cl',   '#f3f4f6');
    r.style.setProperty('--ssm-cb',   '#d1d5db');
    r.style.setProperty('--ssm-text', '#111827');
  }
  function extractColor(el) {
    try {
      const bg = window.getComputedStyle(el).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null;
      const m = bg.match(/\d+/g); if (!m) return null;
      const [r, g, b] = m.map(Number);
      if (r > 240 && g > 240 && b > 240) return null;
      if (r < 30  && g < 30  && b < 30)  return null;
      return { r, g, b };
    } catch { return null; }
  }
  function applyColor({ r, g, b }) {
    const dark   = v => Math.max(0,   Math.round(v * 0.8));
    const light  = v => Math.min(255, Math.round(255 - (255 - v) * 0.12));
    const border = v => Math.min(255, Math.round(255 - (255 - v) * 0.35));
    const root = document.documentElement;
    root.style.setProperty('--ssm-c',  `rgb(${r},${g},${b})`);
    root.style.setProperty('--ssm-cd', `rgb(${dark(r)},${dark(g)},${dark(b)})`);
    root.style.setProperty('--ssm-cl', `rgb(${light(r)},${light(g)},${light(b)})`);
    root.style.setProperty('--ssm-cb', `rgb(${border(r)},${border(g)},${border(b)})`);
  }
  function applyBrandColor(cartBtn) {
    try {
      const c = extractColor(cartBtn);
      if (c) { applyColor(c); return; }
      for (const el of document.querySelectorAll('button,[role="button"],a')) {
        const fc = extractColor(el);
        if (fc) { applyColor(fc); return; }
      }
      applyWhiteMode();
    } catch { applyWhiteMode(); }
  }

  // ======= Quiz steps =======
  const STEPS = [
    {
      id: "gender", type: "cards",
      q: "ما جنسك؟", hint: "اختر للحصول على نتيجة أدق.",
      options: [
        { v: "male",   label: "ذكر",  icon: "👨" },
        { v: "female", label: "أنثى", icon: "👩" },
      ],
    },
    {
      id: "height", type: "number",
      q: "كم طولك؟", hint: "أدخل طولك بالسنتيمتر.",
      unit: "سم", min: 130, max: 220, def: 165,
    },
    {
      id: "weight", type: "number",
      q: "كم وزنك؟", hint: "أدخل وزنك بالكيلوغرام.",
      unit: "كغ", min: 35, max: 200, def: 70,
    },
    {
      id: "shoulders", type: "cards",
      q: "ما شكل كتفيك؟", hint: "اختر الوصف الأقرب لشكل كتفيك.",
      options: [
        { v: "broad",  label: "عريضة", img: "images/q-shoulders-f.jpg", panel: 0 },
        { v: "normal", label: "عادية", img: "images/q-shoulders-f.jpg", panel: 1 },
        { v: "narrow", label: "رقيقة", img: "images/q-shoulders-f.jpg", panel: 2 },
      ],
    },
    {
      id: "chest", type: "cards",
      q: "ما حجم صدرك؟", hint: "اختر الوصف الأقرب لمنطقة الصدر.",
      options: [
        { v: "large",  label: "كبير", img: "images/q-chest-f.jpg", panel: 0 },
        { v: "normal", label: "عادي", img: "images/q-chest-f.jpg", panel: 1 },
        { v: "small",  label: "صغير", img: "images/q-chest-f.jpg", panel: 2 },
      ],
    },
    {
      id: "waist", type: "cards",
      q: "ما حجم خصرك؟", hint: "اختر الوصف الأقرب لمنطقة الخصر.",
      options: [
        { v: "flat",   label: "ضيق",  img: "images/q-waist-f.jpg", panel: 0 },
        { v: "normal", label: "عادي", img: "images/q-waist-f.jpg", panel: 1 },
        { v: "large",  label: "كبير", img: "images/q-waist-f.jpg", panel: 2 },
      ],
    },
    {
      id: "hips", type: "cards",
      q: "ما حجم وركيك؟", hint: "اختر الوصف الأقرب لمنطقة الورك.",
      options: [
        { v: "large",  label: "كبير", img: "images/q-hips-f.jpg", panel: 0 },
        { v: "normal", label: "عادي", img: "images/q-hips-f.jpg", panel: 1 },
        { v: "small",  label: "ضيق",  img: "images/q-hips-f.jpg", panel: 2 },
      ],
    },
  ];

  // ── Module state ──
  let step = 0, answers = {};
  let _sizeChart = null, _merchantTags = [];

  // ======= Helpers =======
  function gid(id) { return document.getElementById(id); }
  function _esc(s) {
    return String(s ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function readProductTitle() {
    const selectors = [
      'h1.product-title','h1.product__title','h1[class*="product"]',
      '.product-title','.product__title','.product-name',
      '[class*="product-title"]','[class*="product-name"]',
      '[itemprop="name"]','h1',
    ];
    for (const sel of selectors) {
      try { const el = document.querySelector(sel); if (el && el.textContent.trim()) return el.textContent.trim(); } catch {}
    }
    return document.title || '';
  }

  function findTagFromTitle() {
    if (!_merchantTags.length) return null;
    const title = readProductTitle().toLowerCase();
    for (const { tag } of _merchantTags) {
      if (tag && title.includes(tag.toLowerCase())) return tag;
    }
    return null;
  }

  function extractProductTag() {
    const meta   = document.querySelector('meta[name="product-tag"]');
    if (meta)   return meta.getAttribute("content");
    const dataEl = document.querySelector('[data-product-tag]');
    if (dataEl) return dataEl.getAttribute("data-product-tag");
    const hidden = document.querySelector('input[name="product-tag"], #product-tag');
    if (hidden) return hidden.value;
    const m = document.body.className.match(/product-tag-([\w-]+)/);
    if (m)      return m[1];
    return findTagFromTitle();
  }

  async function fetchMerchantTags() {
    const url = `${API_BASE}/api/get-tags`;
    try {
      const r = await fetch(url);
      if (!r.ok) return false;
      const data = await r.json();
      if (data && data.tags) _merchantTags = data.tags;
      return true;
    } catch { return false; }
  }

  function normalizeSize(s) {
    const str = s.toString().toUpperCase().trim();
    const letterMatch = str.match(/\b(4XL|3XL|XXL|XL|XS|S|M|L)\b/);
    const numMatch    = str.match(/\b(\d{2,3})\b/);
    return { letter: letterMatch ? letterMatch[1] : null, num: numMatch ? numMatch[1] : null, raw: str };
  }
  function sizesMatch(a, b) {
    const na = normalizeSize(a), nb = normalizeSize(b);
    if (na.raw === nb.raw) return true;
    if (na.letter && nb.letter && na.letter === nb.letter) return true;
    if (na.num   && nb.num   && na.num   === nb.num)   return true;
    return false;
  }
  function isSizeOutOfStock(size) {
    const els = document.querySelectorAll(
      '[data-size],[data-value],.size-option,.variant-option,' +
      'salla-variants button,salla-product-options button,' +
      '[class*="size"] button,[class*="variant"] button,' +
      'label.swatch,.product-form__option button'
    );
    for (const el of els) {
      const txt = (el.textContent||el.getAttribute('data-size')||el.getAttribute('data-value')||el.getAttribute('value')||'').trim();
      if (!sizesMatch(txt, size)) continue;
      if (el.disabled||el.getAttribute('aria-disabled')==='true'||
          el.classList.contains('out-of-stock')||el.classList.contains('unavailable')||
          el.classList.contains('sold-out')||el.classList.contains('disabled')||
          (el.style.opacity && parseFloat(el.style.opacity) < 0.5)) return true;
    }
    return false;
  }

  // ======= Modal =======
  function setupModal() {
    if (document.getElementById("ssm-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "ssm-overlay";
    overlay.innerHTML = `
      <div id="ssm-modal">
        <div class="ssm-header">
          <div class="ssm-header-top">
            <span class="ssm-title">🧥 محدد المقاس الذكي</span>
            <button id="ssm-close-btn">✕</button>
          </div>
          <div class="ssm-progress-wrap">
            <div class="ssm-progress-bar"><div class="ssm-progress-fill" id="ssm-fill"></div></div>
            <span class="ssm-step-count" id="ssm-count"></span>
          </div>
        </div>
        <div class="ssm-body" id="ssm-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    gid("ssm-close-btn").onclick = closeModal;
    overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  }

  // ======= Cart button detection =======
  const CART_KEYWORDS = [
    'add to cart','add to bag','buy now','purchase','order now',
    'ajouter au panier','commander','acheter',
    'أضف للسلة','أضف إلى السلة','إضافة للسلة','اشتر الآن','اطلب الآن','أضف','شراء',
  ];
  const CART_SELECTORS = [
    'salla-add-to-cart','salla-buy-now','salla-add-to-cart button',
    'button[name="add"]','.add-to-cart','.single_add_to_cart_button',
    '.product-form__submit','.btn-add-to-cart','[id*="AddToCart"]',
    '[class*="add-to-cart"]','[class*="addtocart"]','button[type="submit"]',
  ];
  function findCartButton() {
    for (const sel of CART_SELECTORS) {
      try { const el = document.querySelector(sel); if (el) return el; } catch {}
    }
    for (const el of document.querySelectorAll('button,[role="button"],input[type="submit"]')) {
      const txt = (el.textContent || el.value || '').toLowerCase().trim();
      if (CART_KEYWORDS.some(k => txt.includes(k))) return el;
    }
    return null;
  }

  function inject() {
    if (document.getElementById("ssm-trigger")) return;
    const target = findCartButton();
    if (!target) return;
    applyBrandColor(target);
    const btn = document.createElement("button");
    btn.id = "ssm-trigger"; btn.type = "button";
    btn.innerHTML = "📏 احسب مقاسي";
    btn.onclick = () => { setupModal(); openModal(); };
    target.insertAdjacentElement("afterend", btn);
  }

  function openModal()  {
    step = 0; answers = {};
    gid("ssm-overlay").classList.add("open");
    render();
  }
  function closeModal() { gid("ssm-overlay").classList.remove("open"); }

  // ======= Render =======
  function render() {
    const s    = STEPS[step];
    const body = gid("ssm-body");

    gid("ssm-fill").style.width = (((step + 1) / STEPS.length) * 100) + "%";
    gid("ssm-count").textContent = `الخطوة ${step + 1} من ${STEPS.length}`;

    body.innerHTML = "";

    const qEl = document.createElement("div");
    qEl.className = "ssm-question"; qEl.textContent = s.q;
    body.appendChild(qEl);

    const hEl = document.createElement("div");
    hEl.className = "ssm-hint"; hEl.textContent = s.hint;
    body.appendChild(hEl);

    if (s.type === "number") {
      const v = answers[s.id] ?? s.def;
      const group = document.createElement("div");
      group.className = "ssm-number-group";

      const btnM = document.createElement("button");
      btnM.className = "ssm-num-btn"; btnM.textContent = "−";
      btnM.addEventListener("click", () => window._ssm.adj(s.id, -1));

      const inp = document.createElement("input");
      inp.className = "ssm-num-input"; inp.id = "numinput";
      inp.type = "number"; inp.value = String(v);
      inp.min = String(s.min); inp.max = String(s.max);
      inp.addEventListener("input", () => window._ssm.setVal(s.id, +inp.value));

      const btnP = document.createElement("button");
      btnP.className = "ssm-num-btn"; btnP.textContent = "+";
      btnP.addEventListener("click", () => window._ssm.adj(s.id, 1));

      const unit = document.createElement("span");
      unit.className = "ssm-unit"; unit.textContent = s.unit;

      group.appendChild(btnM); group.appendChild(inp);
      group.appendChild(btnP); group.appendChild(unit);
      body.appendChild(group);

    } else if (s.type === "cards") {
      const cards = document.createElement("div");
      cards.className = "ssm-cards";
      for (const o of s.options) {
        const card = document.createElement("div");
        card.className = "ssm-card" + (answers[s.id] === o.v ? " active" : "");
        card.addEventListener("click", () => window._ssm.pick(s.id, o.v));
        if (o.img) {
          const imgDiv = document.createElement("div");
          imgDiv.className = "ssm-card-img";
          const xPct = (o.panel || 0) * 50;
          const gender = answers.gender || "female";
          const suffix = gender === "male" ? "-m.jpg" : "-f.jpg";
          const imgSrc = o.img.replace(/-(f|m)\.jpg$/, suffix);
          imgDiv.style.cssText =
            `background-image:url('${API_BASE}/${imgSrc}');` +
            `background-size:300% auto;` +
            `background-position:${xPct}% 58%;`;
          card.appendChild(imgDiv);
        } else if (o.icon) {
          const ico = document.createElement("div");
          ico.className = "card-emoji"; ico.textContent = o.icon;
          card.appendChild(ico);
        }
        const lbl = document.createElement("div");
        lbl.className = "card-label"; lbl.textContent = o.label;
        card.appendChild(lbl);
        cards.appendChild(card);
      }
      body.appendChild(cards);
    }

    // Nav
    const isLast = step === STEPS.length - 1;
    const nav = document.createElement("div");
    nav.className = "ssm-nav";

    const backBtn = document.createElement("button");
    backBtn.className = "ssm-btn-back";
    backBtn.textContent = step > 0 ? "→ رجوع" : "";
    backBtn.addEventListener("click", () => window._ssm.back());

    const nextBtn = document.createElement("button");
    nextBtn.className = "ssm-btn-next";
    nextBtn.textContent = isLast ? "✨ احسب مقاسي" : "التالي ←";
    nextBtn.addEventListener("click", () => window._ssm.next());

    nav.appendChild(backBtn); nav.appendChild(nextBtn);
    body.appendChild(nav);
  }

  window._ssm = {
    pick(id, v) { answers[id] = v; render(); },
    adj(id, d) {
      const s = STEPS[step];
      answers[id] = Math.min(s.max, Math.max(s.min, (answers[id] ?? s.def) + d));
      const inp = gid("numinput"); if (inp) inp.value = answers[id];
    },
    setVal(id, v) { answers[id] = v; },
    back()  { if (step > 0) { step--; render(); } },
    next() {
      const s = STEPS[step];
      if (s.type === "number") {
        const inp = gid("numinput"); if (inp) answers[s.id] = +inp.value;
        if (!answers[s.id]) { alert("رجاءً أدخل قيمة"); return; }
      }
      if (s.type === "cards" && !answers[s.id]) { alert("رجاءً اختر خياراً"); return; }
      if (step < STEPS.length - 1) { step++; render(); } else { submit(); }
    },
  };

  function showError(msg) {
    const body = gid("ssm-body");
    body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.cssText = "text-align:center;padding:30px 20px";
    const icon = document.createElement("div");
    icon.style.cssText = "font-size:40px;margin-bottom:12px";
    icon.textContent = "⚠️";
    const msgEl = document.createElement("div");
    msgEl.style.cssText = "font-size:15px;color:#374151;line-height:1.7;direction:rtl;margin-bottom:20px";
    msgEl.textContent = msg;
    const btn = document.createElement("button");
    btn.className = "ssm-restart"; btn.textContent = "🔄 أعد المحاولة";
    btn.addEventListener("click", () => { step = 0; answers = {}; render(); });
    wrap.appendChild(icon); wrap.appendChild(msgEl); wrap.appendChild(btn);
    body.appendChild(wrap);
  }

  function submit() {
    gid("ssm-body").innerHTML = `<div class="ssm-loading"><div class="ssm-spinner"></div><p>الخياط الذكي يحلل مقاسك...</p></div>`;

    const tag = extractProductTag();
    if (!tag) { showError("تعذّر تحديد المنتج — يرجى التواصل مع المتجر."); return; }

    fetch(`${API_BASE}/api/calculate-size`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag,
        gender:    answers.gender    || "female",
        height:    answers.height    || 165,
        weight:    answers.weight    || 70,
        shoulders: answers.shoulders || "normal",
        chest:     answers.chest     || "normal",
        waist:     answers.waist     || "normal",
        hips:      answers.hips      || "normal",
        belly:     "average",
        preference:"regular",
      }),
    })
      .then(r => {
        if (r.ok) return r.json();
        return r.json().catch(() => null).then(errBody => {
          if (r.status === 403) showError("هذا المتجر غير مُفعَّل أو غير مُسجَّل في النظام.");
          else if (r.status === 429) showError("طلبات كثيرة — انتظر دقيقة ثم أعد المحاولة.");
          else showError("حدث خطأ أثناء الاتصال بالخادم. أعد المحاولة.");
          console.error("[SSM] API error", r.status, errBody);
          return null;
        });
      })
      .then(data => {
        if (data && data.size) showResult(data);
        else if (data) showError("لم يتمكن النظام من تحديد مقاسك — يبدو أن جدول مقاسات هذا المنتج يحتاج إلى تحديث. يرجى التواصل مع المتجر.");
      })
      .catch(() => showError("تعذّر الاتصال بالخادم — تحقق من الإنترنت وأعد المحاولة."));
  }

  function showResult(data) {
    const size       = data.size;
    const alts       = data.alternatives || [];
    const outOfStock = isSizeOutOfStock(size);
    const body       = gid("ssm-body");
    body.innerHTML   = "";

    const result = document.createElement("div");
    result.className = "ssm-result";

    const iconEl = document.createElement("div");
    iconEl.className = "ssm-result-icon";
    iconEl.textContent = outOfStock ? "😔" : "🎉";
    result.appendChild(iconEl);

    const labelEl = document.createElement("div");
    labelEl.className = "ssm-result-label";
    labelEl.textContent = "المقاس المناسب لك هو";
    result.appendChild(labelEl);

    const sizeEl = document.createElement("div");
    sizeEl.className = "ssm-result-size";
    sizeEl.textContent = size;
    result.appendChild(sizeEl);

    if (alts.length > 0) {
      const altsEl = document.createElement("div");
      altsEl.className = "ssm-result-alts";
      altsEl.textContent = `بدائل محتملة: ${alts.join(" · ")}`;
      result.appendChild(altsEl);
    }

    if (outOfStock) {
      const badge = document.createElement("div");
      badge.className = "ssm-stock-warn";
      badge.textContent = `⚠️ مقاسك ${size} غير متوفر حالياً`;
      result.appendChild(badge);
    }

    const restartBtn = document.createElement("button");
    restartBtn.className = "ssm-restart";
    restartBtn.textContent = "🔄 أعد الحساب";
    restartBtn.addEventListener("click", () => { step = 0; answers = {}; render(); });
    result.appendChild(restartBtn);

    body.appendChild(result);
  }

  // ======= Public API =======
  window.SizeMatcher = {
    init(config = {}) {
      _sizeChart = null;
      let currentIv = null;
      async function startInject() {
        const active = await fetchMerchantTags();
        if (!active) return;
        const old = document.getElementById("ssm-trigger");
        if (old) old.remove();
        _sizeChart = null;
        setupModal(); inject();
        if (currentIv) clearInterval(currentIv);
        let tries = 0;
        currentIv = setInterval(() => {
          inject();
          if (document.getElementById("ssm-trigger") || ++tries > 40) clearInterval(currentIv);
        }, 200);
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startInject);
      } else {
        startInject();
      }
      // SPA navigation
      let lastUrl = location.href;
      setInterval(() => {
        if (location.href !== lastUrl) { lastUrl = location.href; _sizeChart = null; setTimeout(startInject, 300); }
      }, 300);
      const _push = history.pushState.bind(history);
      history.pushState = function (...a) { _push(...a); _sizeChart = null; setTimeout(startInject, 300); };
      window.addEventListener("popstate", () => { _sizeChart = null; setTimeout(startInject, 300); });
    },
    open() { setupModal(); openModal(); },
  };
})();
