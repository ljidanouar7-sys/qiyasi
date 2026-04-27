(function () {
  const API_BASE = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin;

  // ======= CSS =======
  const style = document.createElement("style");
  style.textContent = `
:root{--ssm-c:#0d9488;--ssm-cd:#0a7060;--ssm-cl:#e6f7f5;--ssm-cb:#b2e4de}
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
.ssm-progress-fill{background:#fff;height:5px;border-radius:99px}
.ssm-step-count{font-size:12px;opacity:.85;white-space:nowrap}
.ssm-body{padding:24px;direction:rtl}
.ssm-question{font-size:19px;font-weight:700;color:#1e2a3e;margin-bottom:6px;line-height:1.4}
.ssm-hint{font-size:13px;color:#6b7280;margin-bottom:22px}
.ssm-cards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
.ssm-card{flex:1;min-width:120px;max-width:145px;border:2px solid #e5e7eb;border-radius:14px;padding:16px 10px 12px;cursor:pointer;text-align:center;background:#fafafa}
.ssm-card.ssm-card-emoji{min-width:90px;max-width:130px}
.ssm-card.ssm-card-img{min-width:110px;max-width:170px;padding:10px 8px 8px;}
.ssm-card:hover{border-color:var(--ssm-c);background:var(--ssm-cl)}
.ssm-card.active{border-color:var(--ssm-c);background:var(--ssm-cl);box-shadow:0 0 0 3px var(--ssm-cb)}
.ssm-card svg{display:block;margin:0 auto 10px}
.ssm-card .card-emoji{font-size:2.6rem;line-height:1;margin:0 auto 10px;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.ssm-card .card-label{font-size:13px;font-weight:700;color:#1e2a3e}
.ssm-card .card-sub{font-size:11px;color:#6b7280;margin-top:3px}
.ssm-number-group{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px}
.ssm-num-btn{width:44px;height:44px;border-radius:50%;border:2px solid var(--ssm-c);background:#fff;color:var(--ssm-c);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700}
.ssm-num-btn:hover{background:var(--ssm-c);color:#fff}
.ssm-num-input{width:100px;text-align:center;font-size:26px;font-weight:700;color:#1e2a3e;border:2px solid #e5e7eb;border-radius:12px;padding:8px;outline:none}
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
.ssm-result-reasoning{font-size:12px;color:#6b7280;background:#f9fafb;border-radius:8px;padding:8px 12px;margin-bottom:16px;line-height:1.6;text-align:right;direction:rtl}
.ssm-result-disclaimer{font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;padding:8px 12px;border-radius:8px;margin-bottom:16px;direction:rtl;text-align:right}
.ssm-stock-warn{display:inline-block;background:#fff3cd;border:1px solid #ffc107;color:#856404;font-size:13px;font-weight:700;padding:8px 16px;border-radius:10px;margin-bottom:16px}
.ssm-restart{background:#f3f4f6;border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-size:14px;color:#374151}
.ssm-restart:hover{background:#e5e7eb}
.ssm-loading{text-align:center;padding:40px;color:#6b7280}
.ssm-spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:var(--ssm-c);border-radius:50%;animation:ssm-spin .8s linear infinite;margin:0 auto 16px}
@keyframes ssm-spin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(style);

  // ======= Auto-detect brand color =======
  function applyBrandColor(cartBtn) {
    try {
      const bg = window.getComputedStyle(cartBtn).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
      const m = bg.match(/\d+/g);
      if (!m) return;
      const [r, g, b] = m.map(Number);
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max - min < 30) return;
      if (r > 240 && g > 240 && b > 240) return;
      const dark   = v => Math.max(0,   Math.round(v * 0.8));
      const light  = v => Math.min(255, Math.round(255 - (255 - v) * 0.12));
      const border = v => Math.min(255, Math.round(255 - (255 - v) * 0.35));
      const root = document.documentElement;
      root.style.setProperty('--ssm-c',  `rgb(${r},${g},${b})`);
      root.style.setProperty('--ssm-cd', `rgb(${dark(r)},${dark(g)},${dark(b)})`);
      root.style.setProperty('--ssm-cl', `rgb(${light(r)},${light(g)},${light(b)})`);
      root.style.setProperty('--ssm-cb', `rgb(${border(r)},${border(g)},${border(b)})`);
    } catch(e) {}
  }


  // ======= Fixed quiz steps =======
  const STEPS = [
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
      q: "ما شكل كتفيك؟", hint: "إذا كنت مترددًا، اختر متوسطة.",
      options: [
        { v: "narrow",  label: "ضيقة",   imgSrc: "q-shoulders.jpg", imgPos: "0%"   },
        { v: "average", label: "متوسطة", imgSrc: "q-shoulders.jpg", imgPos: "50%"  },
        { v: "wide",    label: "عريضة",  imgSrc: "q-shoulders.jpg", imgPos: "100%" },
      ],
    },
    {
      id: "belly", type: "cards",
      q: "ما شكل بطنك؟", hint: "إذا كنت مترددًا، اختر متوسطة.",
      options: [
        { v: "flat",    label: "ضيقة",   imgSrc: "q-belly.jpg", imgPos: "0%"   },
        { v: "average", label: "متوسطة", imgSrc: "q-belly.jpg", imgPos: "50%"  },
        { v: "big",     label: "كبيرة",  imgSrc: "q-belly.jpg", imgPos: "100%" },
      ],
    },
    {
      id: "user_preference", type: "cards",
      q: "كيف تفضل المقاس؟", hint: "تؤثر هذه الإجابة على اختيار المقاس النهائي.",
      options: [
        { v: "fitted",  label: "مقيد",   imgSrc: "q-fit.jpg", imgPos: "0%"   },
        { v: "regular", label: "عادي",   imgSrc: "q-fit.jpg", imgPos: "50%"  },
        { v: "loose",   label: "واسع",   imgSrc: "q-fit.jpg", imgPos: "100%" },
      ],
    },
  ];

  let step = 0, answers = {};
  let _sizeChart = null;
  let _merchantTags = [];

  function gid(id) { return document.getElementById(id); }

  // ======= Read product title from page =======
  function readProductTitle() {
    const selectors = [
      'h1.product-title', 'h1.product__title', 'h1[class*="product"]',
      '.product-title', '.product__title', '.product-name',
      '[class*="product-title"]', '[class*="product-name"]',
      '[itemprop="name"]', 'h1',
    ];
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) return el.textContent.trim();
      } catch(e) {}
    }
    return document.title || '';
  }

  // ======= Match product title against merchant tags =======
  function findTagFromTitle() {
    if (!_merchantTags.length) return null;
    const title = readProductTitle().toLowerCase();
    for (const { tag } of _merchantTags) {
      if (tag && title.includes(tag.toLowerCase())) return tag;
    }
    return null;
  }

  // ======= Extract product tag =======
  function extractProductTag() {
    const meta = document.querySelector('meta[name="product-tag"]');
    if (meta) return meta.getAttribute("content");
    const dataEl = document.querySelector('[data-product-tag]');
    if (dataEl) return dataEl.getAttribute("data-product-tag");
    const hidden = document.querySelector('input[name="product-tag"], #product-tag');
    if (hidden) return hidden.value;
    const m = document.body.className.match(/product-tag-([\w-]+)/);
    if (m) return m[1];
    return findTagFromTitle();
  }

  // ======= Fetch merchant tags =======
  function fetchMerchantTags() {
    fetch(`${API_BASE}/api/get-tags`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data.tags) _merchantTags = data.tags; })
      .catch(() => {});
  }

  function fallbackSize(ans) {
    const h = ans.height || 165, w = ans.weight || 70;
    const bmi = w / Math.pow(h / 100, 2);
    return bmi < 18.5 ? "S" : bmi < 23 ? "M" : bmi < 27 ? "L" : "XL";
  }

  // ======= Size normalization =======
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

  // ======= Check if recommended size is out of stock =======
  function isSizeOutOfStock(size) {
    const els = document.querySelectorAll(
      '[data-size],[data-value],.size-option,.variant-option,' +
      'salla-variants button,salla-product-options button,' +
      '[class*="size"] button,[class*="variant"] button,' +
      'label.swatch,.product-form__option button'
    );
    for (const el of els) {
      const txt = (
        el.textContent ||
        el.getAttribute('data-size') ||
        el.getAttribute('data-value') ||
        el.getAttribute('value') || ''
      ).trim();
      if (!sizesMatch(txt, size)) continue;
      if (
        el.disabled ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.classList.contains('out-of-stock') ||
        el.classList.contains('unavailable') ||
        el.classList.contains('sold-out') ||
        el.classList.contains('disabled') ||
        (el.style.opacity && parseFloat(el.style.opacity) < 0.5)
      ) return true;
    }
    return false;
  }

  // ======= Auto-detect stock from DOM =======
  function buildStockFromDOM() {
    const stock = {};
    const els = document.querySelectorAll(
      '[data-size],[data-value],.size-option,.variant-option,' +
      'salla-variants button,salla-product-options button,' +
      '[class*="size"] button,[class*="variant"] button,' +
      'label.swatch,.product-form__option button'
    );
    for (const el of els) {
      const txt = (
        el.textContent ||
        el.getAttribute('data-size') ||
        el.getAttribute('data-value') ||
        el.getAttribute('value') || ''
      ).trim();
      if (!txt || txt.length > 25) continue;
      const isOOS = el.disabled ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.classList.contains('out-of-stock') ||
        el.classList.contains('unavailable') ||
        el.classList.contains('sold-out') ||
        el.classList.contains('disabled') ||
        (el.style.opacity && parseFloat(el.style.opacity) < 0.5);
      stock[txt] = isOOS ? 0 : 1;
    }
    return Object.keys(stock).length > 0 ? stock : null;
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
    'button[name="add"]','.add-to-cart','.single_add_to_cart_button',
    '.product-form__submit','.btn-add-to-cart','[id*="AddToCart"]',
    '[class*="add-to-cart"]','[class*="addtocart"]','salla-add-to-cart button',
    'button[type="submit"]',
  ];

  function findCartButton() {
    for (const sel of CART_SELECTORS) {
      try { const el = document.querySelector(sel); if (el) return el; } catch(e) {}
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
    btn.id = "ssm-trigger";
    btn.type = "button";
    btn.innerHTML = "📏 احسب مقاسي";
    btn.onclick = () => { setupModal(); openModal(); };
    target.insertAdjacentElement("afterend", btn);
  }

  function openModal()  { step = 0; answers = {}; gid("ssm-overlay").classList.add("open"); render(); }
  function closeModal() { gid("ssm-overlay").classList.remove("open"); }

  // ======= Render =======
  function render() {
    const s = STEPS[step];

    // Update header progress
    gid("ssm-fill").style.width = (((step + 1) / STEPS.length) * 100) + "%";
    gid("ssm-count").textContent = `الخطوة ${step + 1} من ${STEPS.length}`;

    let html = `<div class="ssm-question">${s.q}</div><div class="ssm-hint">${s.hint}</div>`;

    if (s.type === "number") {
      const v = answers[s.id] ?? s.def;
      html += `<div class="ssm-number-group">
        <button class="ssm-num-btn" onclick="window._ssm.adj('${s.id}',-1)">−</button>
        <input  class="ssm-num-input" id="numinput" type="number" value="${v}" min="${s.min}" max="${s.max}" oninput="window._ssm.setVal('${s.id}',+this.value)"/>
        <button class="ssm-num-btn" onclick="window._ssm.adj('${s.id}',1)">+</button>
        <span class="ssm-unit">${s.unit}</span>
      </div>`;
    } else if (s.type === "cards") {
      const isEmoji = s.options.some(o => o.icon);
      const isImg   = s.options.some(o => o.imgSrc);
      html += `<div class="ssm-cards">${s.options.map(o => {
        const imgDiv = o.imgSrc
          ? `<div style="width:100%;height:175px;overflow:hidden;border-radius:8px;">
              <div style="width:100%;height:260px;background-image:url('${API_BASE}/images/${o.imgSrc}');background-size:300% auto;background-position:${o.imgPos} top;background-repeat:no-repeat;margin-top:-55px;"></div>
             </div>`
          : o.svg
            ? o.svg
            : `<div class="card-emoji">${o.icon}</div>`;
        return `<div class="ssm-card ${isEmoji ? "ssm-card-emoji" : ""} ${isImg ? "ssm-card-img" : ""} ${answers[s.id] === o.v ? "active" : ""}" onclick="window._ssm.pick('${s.id}','${o.v}')">
          ${o.imgSrc ? `<div class="card-label" style="margin-bottom:8px">${o.label}</div>` : ""}
          ${imgDiv}
          ${!o.imgSrc ? `<div class="card-label">${o.label}</div>` : ""}
          ${!o.imgSrc && o.sub ? `<div class="card-sub">${o.sub}</div>` : ""}
        </div>`;
      }).join("")}</div>`;
    }

    const isLast = step === STEPS.length - 1;
    html += `<div class="ssm-nav">
      <button class="ssm-btn-back" onclick="window._ssm.back()">${step > 0 ? "&#8594; رجوع" : ""}</button>
      <button class="ssm-btn-next" onclick="window._ssm.next()">${isLast ? "✨ احسب مقاسي" : "التالي &#8592;"}</button>
    </div>`;

    gid("ssm-body").innerHTML = html;
  }

  window._ssm = {
    pick(id, v) {
      answers[id] = v; // saved to local state immediately
      render();
    },
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

  function submit() {
    gid("ssm-body").innerHTML = `<div class="ssm-loading"><div class="ssm-spinner"></div><p>الخياط الذكي يحلل مقاسك...</p></div>`;

    const tag = extractProductTag();
    console.log("[SSM] submit — tag:", tag, "| answers:", JSON.stringify(answers));

    if (!tag) {
      console.log("[SSM] No tag found — using BMI fallback");
      setTimeout(() => showResult(fallbackSize(answers), true), 600);
      return;
    }

    const stock_info      = window._ssm_stock || buildStockFromDOM();
    const lang            = document.documentElement.lang || navigator.language || 'ar';
    const user_preference = answers.user_preference || "regular";

    fetch(`${API_BASE}/api/calculate-size`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, answers, stock_info, lang, user_preference }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        console.log("[SSM] API response:", data);
        if (data && data.size) {
          if (data.sizeChart) _sizeChart = data.sizeChart;
          showResult(
            data.size,
            false,
            data.status === "out_of_stock",
            data.message   || "",
            data.reasoning || "",
            data.disclaimer || null
          );
        } else {
          console.log("[SSM] API failed — using BMI fallback");
          showResult(fallbackSize(answers), true, false, "", "", null);
        }
      })
      .catch(err => {
        console.log("[SSM] Error:", err, "— using BMI fallback");
        showResult(fallbackSize(answers), true, false, "", "", null);
      });
  }

  function showResult(size, isFallback, forceOutOfStock, apiMessage, reasoning, disclaimer) {
    const outOfStock = forceOutOfStock || isSizeOutOfStock(size);

    let stockBadge = "", msg = "";
    if (outOfStock) {
      stockBadge = `<div class="ssm-stock-warn">⚠️ مقاسك ${size} غير متوفر حالياً</div>`;
      msg = apiMessage || `مقاسك هو <strong>${size}</strong>، لكنه غير متوفر. تواصل مع المتجر.`;
    } else if (isFallback) {
      msg = `مقاس تقديري: <strong>${size}</strong> — بناءً على طولك ووزنك.<br/><span style="color:#9ca3af;font-size:12px">للدقة الكاملة: تأكد أن المنتج عنده رمز فئة في متجرك</span>`;
    } else {
      msg = apiMessage || `بناءً على إجاباتك، ننصحك بمقاس <strong>${size}</strong>.<br/>إذا كنت بين مقاسين، ننصح بالأكبر للراحة.`;
    }

    const icon = outOfStock ? "😔" : "🎉";

    // Reasoning block — shown only when not a fallback result
    const reasoningHtml = (reasoning && !isFallback)
      ? `<div class="ssm-result-reasoning">💡 ${reasoning}</div>`
      : "";

    // Disclaimer block — shown when merchant set product as oversized but user prefers fitted
    const disclaimerHtml = disclaimer
      ? `<div class="ssm-result-disclaimer">ℹ️ ${disclaimer}</div>`
      : "";

    const body = gid("ssm-body");
    body.innerHTML = `
      <div class="ssm-result">
        <div class="ssm-result-icon">${icon}</div>
        <div class="ssm-result-label">المقاس المناسب لك هو</div>
        <div class="ssm-result-size">${size}</div>
        ${stockBadge}
        <div class="ssm-result-msg">${msg}</div>
        ${reasoningHtml}
        ${disclaimerHtml}
        <button class="ssm-restart" onclick="window._ssm_restart()">🔄 أعد الحساب</button>
      </div>`;

    window._ssm_restart = () => { step = 0; answers = {}; render(); };
  }

  // ======= Public API =======
  window.SizeMatcher = {
    init(config = {}) {
      _sizeChart = null;
      fetchMerchantTags();

      let currentIv = null;
      function startInject() {
        const old = document.getElementById("ssm-trigger");
        if (old) old.remove();
        _sizeChart = null;
        setupModal();
        inject();
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
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          _sizeChart = null;
          setTimeout(startInject, 300);
        }
      }, 300);

      const _push = history.pushState.bind(history);
      history.pushState = function (...a) {
        _push(...a); _sizeChart = null; setTimeout(startInject, 300);
      };
      window.addEventListener("popstate", () => { _sizeChart = null; setTimeout(startInject, 300); });
    },
    open() { setupModal(); openModal(); },
  };
})();
