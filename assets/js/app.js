/* Paper Bros — storefront logic */
(function () {
  'use strict';

  var CART_KEY = 'pb_cart_v1';
  var BKASH_WA = 'bKash (via WhatsApp)';
  var DRAFT_KEY = 'pb_admin_draft';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/';

  var PREVIEW = new URLSearchParams(location.search).has('preview');
  var DATA = (function () {
    if (PREVIEW) {
      try {
        var d = JSON.parse(localStorage.getItem(DRAFT_KEY));
        if (d && d.products && d.settings) return d;
      } catch (e) { /* ignore */ }
    }
    return window.PB_DEFAULT_DATA;
  })();
  var S = DATA.settings;
  var CATS = window.PB_CATEGORIES;
  var TYPES = window.PB_TYPES;
  var SUBJ = {};
  DATA.subjects.forEach(function (s) { SUBJ[s.id] = s; });
  var PRODUCTS = DATA.products.filter(function (p) { return SUBJ[p.subject]; });
  var BY_ID = {};
  PRODUCTS.forEach(function (p) { BY_ID[p.id] = p; });

  // ---------- helpers ----------
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '৳' + Number(n || 0).toLocaleString('en-US'); }
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ } }
  function read(key, fallback) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function waNumber() { return String(S.whatsapp || S.hotline || '').replace(/\D/g, ''); }
  function telHref(n) { return 'tel:' + String(n || '').replace(/[^\d+]/g, ''); }
  function isPhone(v) { return /^(?:\+?88)?01[3-9]\d{8}$/.test(String(v).replace(/[\s-]/g, '')); }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  // ---------- static content from settings ----------
  function fillSettings() {
    if (PREVIEW) $('#previewBar').hidden = false;
    var ann = $('#announce');
    ann.innerHTML = S.announcement ? esc(S.announcement).replace(/(Free shipping[^·]*|Free preview[^·]*|Cash on Delivery|bKash)/gi, '<b>$1</b>') : '';

    var free = Number(S.freeShippingThreshold) || 0;
    $('#heroFree').textContent = free > 0 ? 'Free shipping over ' + money(free) : 'Delivery all over Bangladesh';
    $('#heroDelivery').textContent = 'Delivery in ' + S.deliveryTime;
    $('#stepDelivery').textContent = 'Your books are delivered to your door in ' + S.deliveryTime + '.';
    $('#faqTime').textContent = 'Usually ' + S.deliveryTime + ' after we confirm your order.';
    $('#faqDelivery').textContent =
      'Inside Dhaka: ' + money(S.deliveryInsideDhaka) + '. Outside Dhaka: ' + money(S.deliveryOutsideDhaka) + '.' +
      (free > 0 ? ' Orders of ' + money(free) + ' or more ship free.' : '');
    var pay = [];
    if (S.payment.bkashWhatsapp && waNumber()) pay.push('Pay with bKash: choose "bKash (pay on WhatsApp)" at checkout, then message us on WhatsApp (' + S.hotline + ') and we\'ll send you our bKash number.');
    if (S.payment.cod) pay.push('Cash on delivery is also available: pay the rider when your order arrives.');
    if (S.payment.bkash) pay.push('bKash: send money to ' + S.payment.bkash + ' and enter the transaction ID at checkout.');
    if (S.payment.nagad) pay.push('Nagad: send money to ' + S.payment.nagad + ' and enter the transaction ID at checkout.');
    $('#faqPayment').textContent = pay.join(' ');

    $('#statSubjects').textContent = DATA.subjects.length;
    $('#statProducts').textContent = PRODUCTS.length;

    var h = $('#cHotline'); h.textContent = S.hotline; h.href = telHref(S.hotline);
    var e = $('#cEmail'); e.textContent = S.orderEmail; e.href = 'mailto:' + S.orderEmail;
    $('#cLocation').textContent = S.location;
    var wa = $('#cWhatsapp');
    if (waNumber()) wa.href = 'https://wa.me/' + waNumber(); else wa.hidden = true;

    $('#footerContact').innerHTML =
      '<li><a href="' + esc(telHref(S.hotline)) + '">' + esc(S.hotline) + '</a></li>' +
      '<li><a href="mailto:' + esc(S.orderEmail) + '">' + esc(S.orderEmail) + '</a></li>' +
      '<li>' + esc(S.location) + '</li>';
    $('#footerCats').innerHTML = Object.keys(CATS).map(function (k) {
      return '<li><a href="#catalog" data-cat="' + k + '">' + esc(CATS[k]) + '</a></li>';
    }).join('') + '<li><a href="#catalog" data-cat="notes">Revision Notes</a></li>';

    var soc = [];
    if (S.instagram) soc.push('<a href="' + esc(S.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>');
    if (S.facebook) soc.push('<a href="' + esc(S.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z" fill="currentColor"/></svg></a>');
    if (waNumber()) soc.push('<a href="https://wa.me/' + waNumber() + '" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></a>');
    $('#socials').innerHTML = soc.join('');
    $('#year').textContent = new Date().getFullYear();
  }

  // Use real cover pages in the hero when products have them (one per subject).
  function heroCovers() {
    var seen = {}, picks = [];
    PRODUCTS.forEach(function (p) {
      if (p.image && p.type !== 'formulas' && !seen[p.subject]) { seen[p.subject] = 1; picks.push(p); }
    });
    // Prefer subject notes (the most colourful covers) for the hero stack.
    picks.sort(function (a, b) { return (b.type === 'notes') - (a.type === 'notes'); });
    picks = picks.slice(0, 3);
    if (picks.length < 3) return;
    ['.paper-1', '.paper-2', '.paper-3'].forEach(function (sel, i) {
      var el = $(sel), p = picks[i];
      var img = new Image();
      img.onload = function () {
        el.classList.add('paper-img');
        el.innerHTML = '';
        el.appendChild(img);
      };
      img.alt = '';
      img.src = p.image;
    });
  }

  function hasPreview(p) { return !!(p.previews && p.previews.length); }
  function slugName(s) { return String(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  // Product view: cover, details, free preview downloads, other versions, add to cart
  function openLightbox(id) {
    var p = BY_ID[id];
    if (!p) return;
    var s = SUBJ[p.subject];
    var box = $('#lightbox');
    var img = $('#lightboxImg'), alt = $('#lightboxAlt');
    if (p.image) { img.src = p.image; img.alt = p.title + ' cover page'; img.hidden = false; alt.hidden = true; }
    else { img.hidden = true; alt.hidden = false; alt.style.setProperty('--c', s.color); alt.innerHTML = textCover(p); }
    $('#lbMeta').textContent = s.name + ' ' + s.code + ' · ' + (TYPES[p.type] || '');
    $('#lightboxTitle').textContent = p.title;
    $('#lightboxPrice').innerHTML = money(p.price) + (p.oldPrice && p.oldPrice > p.price ? ' <s>' + money(p.oldPrice) + '</s>' : '');
    $('#lbDesc').textContent = p.desc || '';
    var pv = hasPreview(p) ? p.previews : [];
    $('#lbPreviews').innerHTML = pv.length
      ? '<h4>Free preview</h4><p class="muted small">See sample pages before you buy. No sign-up needed.</p>' +
        pv.map(function (f) {
          var name = 'PaperBros-' + slugName(p.title) + (pv.length > 1 ? '-' + slugName(f.label) : '') + '-Preview.pdf';
          return '<a class="pv-file" href="' + esc(f.file) + '" download="' + esc(name) + '" target="_blank" rel="noopener">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v6m-3-3 3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<span><strong>' + esc(f.label || 'Preview') + '</strong><small>PDF' + (f.size ? ' · ' + esc(f.size) : '') + '</small></span><em>Download</em></a>';
        }).join('')
      : '';
    // Other versions of the same notes (e.g. handwritten vs book format)
    var siblings = PRODUCTS.filter(function (q) { return q.id !== p.id && q.subject === p.subject && q.type === p.type && p.type === 'notes'; });
    $('#lbVersions').innerHTML = siblings.length
      ? '<h4>Also available</h4>' + siblings.map(function (q) {
          return '<button class="pv-version" data-zoom="' + esc(q.id) + '"><span>' + esc(q.title) + '</span><b>' + money(q.price) + '</b></button>';
        }).join('')
      : '';
    var add = $('#lightboxAdd');
    add.setAttribute('data-add', p.id);
    add.disabled = !p.inStock;
    add.textContent = p.inStock ? 'Add to cart · ' + money(p.price) : 'Sold out';
    box.hidden = false;
    box.scrollTop = 0;
    document.body.classList.add('no-scroll');
  }
  function closeLightbox() {
    $('#lightbox').hidden = true;
    if ($('#checkoutModal').hidden && !$('#drawer').classList.contains('open')) document.body.classList.remove('no-scroll');
  }

  // If a cover image is missing, fall back to the coloured text cover.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    var id = img.getAttribute('data-cover');
    if (id && BY_ID[id]) {
      var cover = img.closest('.cover');
      if (cover) { cover.classList.remove('has-img'); cover.innerHTML = (cover.querySelector('.badge') ? cover.querySelector('.badge').outerHTML : '') + textCover(BY_ID[id]); }
    } else if (img.classList.contains('cart-thumb-img')) {
      img.style.visibility = 'hidden';
    }
  }, true);

  // ---------- subjects ----------
  function renderSubjects() {
    $('#subjectGrid').innerHTML = DATA.subjects.map(function (s) {
      var n = PRODUCTS.filter(function (p) { return p.subject === s.id; }).length;
      return '<button class="subject" data-subject="' + esc(s.id) + '" style="--c:' + esc(s.color) + '">' +
        '<span class="subject-code">' + esc(s.code) + '</span>' +
        '<span><strong>' + esc(s.name) + '</strong><small>' + n + ' item' + (n === 1 ? '' : 's') + '</small></span></button>';
    }).join('');
  }

  // ---------- catalog ----------
  var state = { cat: 'all', q: '', sort: 'default', subject: '' };

  function renderChips() {
    var defs = [['all', 'All items']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k]]; })).concat([['notes', 'Revision Notes']]);
    $('#chips').innerHTML = defs.map(function (d) {
      var n = PRODUCTS.filter(function (p) { return matchesCat(p, d[0]); }).length;
      if (!n && d[0] !== 'all') return '';
      return '<button class="chip' + (state.cat === d[0] ? ' active' : '') + '" role="tab" aria-selected="' + (state.cat === d[0]) + '" data-cat="' + d[0] + '">' +
        esc(d[1]) + '<span class="n">' + n + '</span></button>';
    }).join('');
  }

  function matchesCat(p, cat) {
    if (cat === 'all') return true;
    if (cat === 'notes') return p.type === 'notes' || p.type === 'formulas';
    return SUBJ[p.subject].category === cat;
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      if (!matchesCat(p, state.cat)) return false;
      if (state.subject && p.subject !== state.subject) return false;
      if (!q) return true;
      var s = SUBJ[p.subject];
      return [p.title, p.paper, p.desc, s.name, s.code, TYPES[p.type]].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    var order = {};
    DATA.subjects.forEach(function (s, i) { order[s.id] = i; });
    var sorters = {
      'default': function (a, b) { return order[a.subject] - order[b.subject]; },
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      'name': function (a, b) { return a.title.localeCompare(b.title); }
    };
    return list.slice().sort(sorters[state.sort] || sorters['default']);
  }

  function textCover(p) {
    var s = SUBJ[p.subject];
    var typeLabel = (p.type === 'topical' ? 'Topical' : TYPES[p.type] || '') + (p.paper ? ' · ' + p.paper : '');
    return '<span class="book"><span class="cover-code">' + esc(s.code) + '</span>' +
      '<span class="cover-subject">' + esc(s.name) + '</span>' +
      '<span class="cover-type">' + esc(typeLabel) + '</span></span>';
  }

  function productCard(p) {
    var s = SUBJ[p.subject];
    var inCart = cart[p.id];
    var badge = !p.inStock ? '<span class="badge out">Out of stock</span>' : (p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '');
    var old = p.oldPrice && p.oldPrice > p.price ? '<s>' + money(p.oldPrice) + '</s>' : '';
    var btn = !p.inStock
      ? '<button class="btn btn-ghost add-btn" disabled>Sold out</button>'
      : '<button class="btn btn-primary add-btn' + (inCart ? ' added' : '') + '" data-add="' + esc(p.id) + '">' + (inCart ? 'In cart (' + inCart + ')' : 'Add to cart') + '</button>';
    var cover = p.image
      ? '<div class="cover has-img" style="--c:' + esc(s.color) + '" data-pid="' + esc(p.id) + '">' + badge +
          '<button class="cover-btn" data-zoom="' + esc(p.id) + '" aria-label="View ' + esc(p.title) + ' details' + (hasPreview(p) ? ' and free preview' : '') + '">' +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + ' cover page" loading="lazy" data-cover="' + esc(p.id) + '"></button></div>'
      : '<div class="cover" style="--c:' + esc(s.color) + '">' + badge + '<button class="cover-btn" data-zoom="' + esc(p.id) + '" aria-label="View ' + esc(p.title) + ' details">' + textCover(p) + '</button></div>';
    var preview = hasPreview(p)
      ? '<button class="preview-link" data-zoom="' + esc(p.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v6m-3-3 3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Free preview (PDF)</button>'
      : '';
    return '<article class="product' + (p.inStock ? '' : ' is-out') + '">' + cover +
      '<div class="product-body">' +
        '<p class="product-meta">' + esc(TYPES[p.type] || '') + '</p>' +
        '<h3><button class="title-btn" data-zoom="' + esc(p.id) + '">' + esc(p.title) + '</button></h3>' +
        '<p class="desc">' + esc(p.desc) + '</p>' + preview +
        '<div class="product-foot"><span class="price">' + money(p.price) + old + '</span>' + btn + '</div>' +
      '</div></article>';
  }

  function renderProducts() {
    var list = filtered();
    $('#productGrid').innerHTML = list.map(productCard).join('');
    $('#emptyState').hidden = list.length > 0;
    var label = list.length + ' product' + (list.length === 1 ? '' : 's');
    if (state.subject) label += ' in ' + SUBJ[state.subject].name + ' · <a href="#" id="clearSubject">show all subjects</a>';
    $('#resultCount').innerHTML = label;
    var cs = $('#clearSubject');
    if (cs) cs.addEventListener('click', function (e) { e.preventDefault(); state.subject = ''; renderProducts(); });
  }

  function setCategory(cat) {
    state.cat = cat; state.subject = '';
    renderChips(); renderProducts();
  }

  // ---------- cart ----------
  var cart = read(CART_KEY, {});
  Object.keys(cart).forEach(function (id) { if (!BY_ID[id] || !BY_ID[id].inStock) delete cart[id]; });

  function cartLines() {
    return Object.keys(cart).map(function (id) { return { p: BY_ID[id], qty: cart[id] }; }).filter(function (l) { return l.p; });
  }
  function subtotal() { return cartLines().reduce(function (sum, l) { return sum + l.p.price * l.qty; }, 0); }
  function itemCount() { return cartLines().reduce(function (n, l) { return n + l.qty; }, 0); }

  function deliveryFee(city, sub) {
    if (!city) return null;
    var free = Number(S.freeShippingThreshold) || 0;
    if (free > 0 && sub >= free) return 0;
    return city === 'Dhaka' ? Number(S.deliveryInsideDhaka) || 0 : Number(S.deliveryOutsideDhaka) || 0;
  }

  function saveCart() { store(CART_KEY, cart); renderCart(); renderProducts(); }

  function addToCart(id) {
    var p = BY_ID[id];
    if (!p || !p.inStock) return;
    cart[id] = Math.min((cart[id] || 0) + 1, 20);
    saveCart();
    var btn = $('#cartBtn');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    toast(p.title + ' added to cart');
  }

  function renderCart() {
    var lines = cartLines();
    var count = itemCount();
    $('#cartCount').textContent = count;
    if (!lines.length) {
      $('#cartItems').innerHTML = '<div class="cart-empty"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><p>Your cart is empty.</p><a href="#catalog" class="btn btn-ghost" data-close-drawer>Browse catalog</a></div>';
      $('#cartFoot').hidden = true;
      return;
    }
    $('#cartFoot').hidden = false;
    $('#cartItems').innerHTML = lines.map(function (l) {
      var s = SUBJ[l.p.subject];
      var thumb = l.p.image
        ? '<img class="cart-thumb cart-thumb-img" src="' + esc(l.p.image) + '" alt="">'
        : '<span class="cart-thumb" style="--c:' + esc(s.color) + '">' + esc(s.code) + '</span>';
      return '<div class="cart-item">' + thumb +
        '<div><strong>' + esc(l.p.title) + '</strong><small>' + money(l.p.price) + ' each</small></div>' +
        '<div class="cart-right"><strong>' + money(l.p.price * l.qty) + '</strong>' +
          '<div class="qty"><button data-dec="' + esc(l.p.id) + '" aria-label="Decrease">−</button><span>' + l.qty + '</span><button data-inc="' + esc(l.p.id) + '" aria-label="Increase">+</button></div>' +
          '<button class="remove" data-remove="' + esc(l.p.id) + '">Remove</button></div>' +
        '</div>';
    }).join('');
    var sub = subtotal();
    $('#cartSubtotal').textContent = money(sub);
    var free = Number(S.freeShippingThreshold) || 0;
    var meter = $('#freeMeter');
    if (free > 0) {
      var pct = Math.min(100, Math.round(sub / free * 100));
      meter.innerHTML = (sub >= free ? 'You\'ve unlocked <b>free shipping</b>!' : 'Add <b>' + money(free - sub) + '</b> more for free shipping') +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>';
      meter.hidden = false;
    } else meter.hidden = true;
  }

  function openDrawer() {
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#overlay').hidden = false;
    document.body.classList.add('no-scroll');
  }
  function closeDrawer() {
    $('#drawer').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
    $('#overlay').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  // ---------- checkout ----------
  function renderPayOptions() {
    var opts = [];
    if (S.payment.bkashWhatsapp && waNumber()) opts.push({ v: BKASH_WA, t: 'bKash (pay on WhatsApp)', d: 'Place your order, then pay by bKash through WhatsApp', wa: true });
    if (S.payment.cod) opts.push({ v: 'Cash on Delivery', t: 'Cash on delivery', d: 'Pay the rider when your order arrives' });
    if (S.payment.bkash) opts.push({ v: 'bKash', t: 'bKash', d: 'Send money first, then enter the transaction ID', num: S.payment.bkash });
    if (S.payment.nagad) opts.push({ v: 'Nagad', t: 'Nagad', d: 'Send money first, then enter the transaction ID', num: S.payment.nagad });
    if (!opts.length) opts.push({ v: 'Cash on Delivery', t: 'Cash on delivery', d: 'Pay the rider when your order arrives' });
    $('#payOptions').innerHTML = opts.map(function (o, i) {
      return '<label class="pay-opt' + (o.wa ? ' pay-bkash' : '') + '"><input type="radio" name="payment" value="' + esc(o.v) + '"' + (o.num ? ' data-num="' + esc(o.num) + '"' : '') + (o.wa ? ' data-wa="1"' : '') + (i === 0 ? ' checked' : '') + '>' +
        '<span><strong>' + esc(o.t) + '</strong><small>' + esc(o.d) + '</small></span></label>';
    }).join('');
    updatePayNote();
  }

  function updatePayNote() {
    var sel = $('input[name="payment"]:checked');
    var num = sel && sel.getAttribute('data-num');
    var note = $('#payNote');
    if (sel && sel.hasAttribute('data-wa')) {
      var fee2 = deliveryFee($('#oCity').value, subtotal());
      note.innerHTML = 'After you place the order, tap <b>Pay with bKash on WhatsApp</b>. We\'ll send you our bKash number on WhatsApp (' + esc(S.hotline) + ') to pay <b>' + money(subtotal() + (fee2 || 0)) + '</b>' + (fee2 == null ? ' plus delivery' : '') + '. Your order is confirmed once we receive the payment.';
      note.hidden = false;
      $('#trxField').hidden = true;
      return;
    }
    if (num) {
      var city = $('#oCity').value;
      var fee = deliveryFee(city, subtotal());
      var total = subtotal() + (fee || 0);
      note.innerHTML = 'Send <b>' + money(total) + '</b>' + (fee == null ? ' (plus delivery)' : '') + ' to <b>' + esc(num) + '</b> via ' + esc(sel.value) + ' (Send Money), then enter the transaction ID below.';
      note.hidden = false;
      $('#trxField').hidden = false;
    } else {
      note.hidden = true;
      $('#trxField').hidden = true;
    }
  }

  function renderSummary() {
    var lines = cartLines();
    $('#summaryItems').innerHTML = lines.map(function (l) {
      return '<li><span>' + esc(l.p.title) + ' × ' + l.qty + '</span><span>' + money(l.p.price * l.qty) + '</span></li>';
    }).join('');
    var sub = subtotal();
    var fee = deliveryFee($('#oCity').value, sub);
    $('#sumSubtotal').textContent = money(sub);
    $('#sumDelivery').textContent = fee == null ? 'Select city' : (fee === 0 ? 'Free' : money(fee));
    $('#sumTotal').textContent = money(sub + (fee || 0));
    $('#sumEta').textContent = 'Estimated delivery: ' + S.deliveryTime + '.';
    updatePayNote();
  }

  function openCheckout() {
    if (!itemCount()) { toast('Your cart is empty'); return; }
    closeDrawer();
    $('#checkoutView').hidden = false;
    $('#successView').hidden = true;
    $('#orderStatus').textContent = '';
    $('#orderStatus').className = 'form-status';
    renderPayOptions();
    renderSummary();
    $('#checkoutModal').hidden = false;
    document.body.classList.add('no-scroll');
    setTimeout(function () { $('#oName').focus(); }, 50);
  }
  function closeModal() {
    $('#checkoutModal').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function setError(input, msg) {
    var f = input.closest('.field');
    if (!f) return;
    var e = f.querySelector('.err');
    if (msg) {
      f.classList.add('invalid');
      if (!e) { e = document.createElement('span'); e.className = 'err'; f.appendChild(e); }
      e.textContent = msg;
    } else {
      f.classList.remove('invalid');
      if (e) e.remove();
    }
  }

  function validate(form, rules) {
    var first = null;
    rules.forEach(function (r) {
      var el = form.elements[r.name];
      if (!el || el.closest('[hidden]')) return;
      var v = el.value.trim();
      var msg = '';
      if (r.required && !v) msg = r.label + ' is required';
      else if (v && r.check && !r.check(v)) msg = r.msg;
      setError(el, msg);
      if (msg && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }

  function makeOrderId() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return 'PB-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  // POST JSON with a hard time limit so the customer is never left waiting forever.
  var SEND_TIMEOUT_MS = 15000;
  function postJSON(url, body) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer;
    var timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        reject(new Error('the email service took too long to respond'));
      }, SEND_TIMEOUT_MS);
    });
    var req = fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok || String(j.success) !== 'true') throw new Error(j.message || 'the email service returned an error (' + res.status + ')');
        return j;
      });
    }, function (err) {
      throw new Error(err && err.name === 'AbortError' ? 'the email service took too long to respond' : 'could not reach the email service');
    });
    return Promise.race([req, timeout]).then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
  }

  // Web3Forms (if an access key is set in admin Settings) — reliable, free up to 250 emails/month.
  function viaWeb3Forms(payload) {
    var body = { access_key: S.web3formsKey, subject: payload._subject, from_name: 'Paper Bros Website', botcheck: !!payload._honey };
    Object.keys(payload).forEach(function (k) { if (k.charAt(0) !== '_') body[k] = payload[k]; });
    return postJSON('https://api.web3forms.com/submit', body);
  }
  // FormSubmit — no account needed, but needs a one-time activation and is sometimes down.
  function viaFormSubmit(payload) {
    return postJSON(FORM_ENDPOINT + S.orderEmail, payload);
  }

  // Try each configured service in turn; succeed as soon as one delivers.
  function sendToEmail(payload) {
    var senders = [];
    if (S.web3formsKey) senders.push(viaWeb3Forms);
    senders.push(viaFormSubmit);
    var errors = [];
    return senders.reduce(function (chain, send) {
      return chain.catch(function (err) {
        if (err) errors.push(err.message);
        return send(payload);
      });
    }, Promise.reject(null)).catch(function (err) {
      errors.push(err.message);
      throw new Error(errors[errors.length - 1]);
    });
  }

  function waOrderText(o) {
    var bkash = o.payment === BKASH_WA;
    return 'Hi Paper Bros! I placed order ' + o.id + '.\n' +
      o.items.map(function (i) { return '• ' + i.title + ' × ' + i.qty; }).join('\n') +
      '\nTotal: ' + money(o.total) + '\nName: ' + o.name + '\nPhone: ' + o.phone + '\nAddress: ' + o.address + ', ' + o.area + ', ' + o.city +
      (bkash ? '\n\nI want to pay ' + money(o.total) + ' by bKash. Please send me your bKash number.' : '');
  }

  function submitOrder(e) {
    e.preventDefault();
    var form = $('#orderForm');
    var ok = validate(form, [
      { name: 'name', label: 'Full name', required: true },
      { name: 'phone', label: 'Phone number', required: true, check: isPhone, msg: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)' },
      { name: 'altPhone', check: isPhone, msg: 'Enter a valid mobile number or leave it blank' },
      { name: 'email', check: isEmail, msg: 'Enter a valid email or leave it blank' },
      { name: 'city', label: 'City / region', required: true },
      { name: 'area', label: 'Area / thana', required: true },
      { name: 'address', label: 'Full address', required: true },
      { name: 'trx', label: 'Transaction ID', required: true }
    ]);
    if (!ok) return;
    if (!itemCount()) { toast('Your cart is empty'); return; }

    var f = form.elements;
    var sub = subtotal();
    var fee = deliveryFee(f.city.value, sub) || 0;
    var payment = (form.querySelector('input[name="payment"]:checked') || {}).value || 'Cash on Delivery';
    var order = {
      id: makeOrderId(),
      date: new Date().toISOString(),
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      altPhone: f.altPhone.value.trim(),
      email: f.email.value.trim(),
      school: f.school.value.trim(),
      session: f.session.value,
      city: f.city.value,
      area: f.area.value.trim(),
      address: f.address.value.trim(),
      payment: payment,
      trx: $('#trxField').hidden ? '' : f.trx.value.trim(),
      notes: f.notes.value.trim(),
      items: cartLines().map(function (l) { return { id: l.p.id, title: l.p.title, qty: l.qty, price: l.p.price }; }),
      subtotal: sub,
      delivery: fee,
      total: sub + fee
    };

    var payload = {
      _subject: 'New order ' + order.id + ' – ' + order.name + ' – ' + money(order.total),
      _template: 'table',
      _captcha: 'false',
      _honey: form.elements._honey.value,
      'Order ID': order.id,
      'Order date': new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
      'Student name': order.name,
      'Phone': order.phone,
      'WhatsApp / alternate': order.altPhone || '—',
      'School / college': order.school || '—',
      'Exam session': order.session || '—',
      'City / region': order.city,
      'Area / thana': order.area,
      'Full address': order.address,
      'Items': order.items.map(function (i) { return i.title + ' × ' + i.qty + ' = ' + money(i.price * i.qty); }).join(' | '),
      'Subtotal': money(order.subtotal),
      'Delivery charge': order.delivery ? money(order.delivery) : 'Free',
      'TOTAL PAYABLE': money(order.total),
      'Payment method': order.payment,
      'Transaction ID': order.trx || '—',
      'Order notes': order.notes || '—',
      'Admin import code': JSON.stringify(order)
    };
    if (order.email) payload.email = order.email;

    var btn = $('#placeOrder');
    var status = $('#orderStatus');
    btn.disabled = true;
    btn.textContent = 'Placing order…';
    status.className = 'form-status';
    status.textContent = '';
    var slowTimer = setTimeout(function () { status.textContent = 'Still sending, please wait a few more seconds…'; }, 7000);

    sendToEmail(payload).then(function () {
      cart = {};
      saveCart();
      form.reset();
      $('#successId').textContent = order.id;
      var wa = $('#successWa');
      var payBkash = order.payment === BKASH_WA;
      if (waNumber()) { wa.href = 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(waOrderText(order)); wa.hidden = false; }
      else wa.hidden = true;
      wa.textContent = payBkash ? 'Pay with bKash on WhatsApp' : 'Confirm on WhatsApp';
      $('#successNote').innerHTML = payBkash
        ? '<b>One more step:</b> tap the green button to message us on WhatsApp. We\'ll send you our bKash number so you can pay <b>' + money(order.total) + '</b>. Your order is confirmed once we receive the payment.'
        : 'We\'ve received your order and will call you on <strong>' + esc(order.phone) + '</strong> to confirm it. Keep this ID handy if you contact us.';
      $('#successNote').classList.toggle('pay-step', payBkash);
      $('#checkoutView').hidden = true;
      $('#successView').hidden = false;
      $('#checkoutModal').scrollTop = 0;
    }).catch(function (err) {
      status.className = 'form-status bad';
      var wa = waNumber()
        ? '<a class="btn btn-whatsapp btn-block" href="https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(waOrderText(order)) + '" target="_blank" rel="noopener">Send this order on WhatsApp</a>'
        : '';
      status.innerHTML = '<span class="fail-box"><strong>We couldn\'t send your order online right now.</strong>' +
        'Your cart is saved. ' + (wa ? 'Send the order to us on WhatsApp (it\'s already written for you), or call ' : 'Please call ') +
        '<a href="' + esc(telHref(S.hotline)) + '">' + esc(S.hotline) + '</a>.' + wa +
        '<small>Details: ' + esc(err.message) + '</small></span>';
    }).then(function () {
      clearTimeout(slowTimer);
      btn.disabled = false;
      btn.textContent = 'Place order';
    });
  }

  // ---------- contact form ----------
  function submitContact(e) {
    e.preventDefault();
    var form = $('#contactForm');
    var ok = validate(form, [
      { name: 'name', label: 'Your name', required: true },
      { name: 'phone', label: 'Phone', required: true, check: isPhone, msg: 'Enter a valid Bangladeshi mobile number' },
      { name: 'email', check: isEmail, msg: 'Enter a valid email or leave it blank' },
      { name: 'message', label: 'Message', required: true }
    ]);
    if (!ok) return;
    var f = form.elements;
    var payload = {
      _subject: 'Website message from ' + f.name.value.trim(),
      _template: 'table',
      _captcha: 'false',
      _honey: f._honey.value,
      'Name': f.name.value.trim(),
      'Phone': f.phone.value.trim(),
      'Message': f.message.value.trim()
    };
    if (f.email.value.trim()) payload.email = f.email.value.trim();
    var btn = form.querySelector('button[type="submit"]');
    var status = $('#contactStatus');
    btn.disabled = true; btn.textContent = 'Sending…';
    status.className = 'form-status'; status.textContent = '';
    sendToEmail(payload).then(function () {
      form.reset();
      status.className = 'form-status ok';
      status.textContent = 'Thanks! Your message has been sent. We\'ll get back to you soon.';
    }).catch(function (err) {
      status.className = 'form-status bad';
      status.textContent = 'Sorry, your message could not be sent (' + err.message + '). Please call ' + S.hotline + '.';
    }).then(function () { btn.disabled = false; btn.textContent = 'Send message'; });
  }

  // ---------- events ----------
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var zoom = t.closest('[data-zoom]');
      if (zoom) { openLightbox(zoom.getAttribute('data-zoom')); return; }
      if (t.closest('[data-close-lightbox]') || t === $('#lightbox')) { closeLightbox(); return; }
      var add = t.closest('[data-add]');
      if (add) { addToCart(add.getAttribute('data-add')); if (add.id === 'lightboxAdd') closeLightbox(); return; }
      var inc = t.closest('[data-inc]');
      if (inc) { var id = inc.getAttribute('data-inc'); cart[id] = Math.min(cart[id] + 1, 20); saveCart(); return; }
      var dec = t.closest('[data-dec]');
      if (dec) { var d = dec.getAttribute('data-dec'); cart[d] -= 1; if (cart[d] <= 0) delete cart[d]; saveCart(); return; }
      var rem = t.closest('[data-remove]');
      if (rem) { delete cart[rem.getAttribute('data-remove')]; saveCart(); return; }
      var chip = t.closest('.chip[data-cat], .footer-links a[data-cat]');
      if (chip) { setCategory(chip.getAttribute('data-cat')); return; }
      var subj = t.closest('[data-subject]');
      if (subj) {
        state.cat = 'all'; state.q = ''; $('#search').value = '';
        state.subject = subj.getAttribute('data-subject');
        renderChips(); renderProducts();
        $('#catalog').scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (t.closest('[data-close-drawer]')) { closeDrawer(); return; }
      if (t.closest('[data-close]')) { closeModal(); return; }
      if (t === $('#checkoutModal')) closeModal();
    });

    $('#cartBtn').addEventListener('click', openDrawer);
    $('#closeDrawer').addEventListener('click', closeDrawer);
    $('#overlay').addEventListener('click', closeDrawer);
    $('#checkoutBtn').addEventListener('click', openCheckout);
    $('#orderForm').addEventListener('submit', submitOrder);
    $('#contactForm').addEventListener('submit', submitContact);
    $('#oCity').addEventListener('change', renderSummary);
    $('#payOptions').addEventListener('change', updatePayNote);
    $$('#orderForm input, #orderForm select, #orderForm textarea, #contactForm input, #contactForm textarea').forEach(function (el) {
      el.addEventListener('input', function () { if (el.closest('.field.invalid')) setError(el, ''); });
    });

    var searchTimer;
    $('#search').addEventListener('input', function (e) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { state.q = e.target.value; renderProducts(); }, 120);
    });
    $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; renderProducts(); });
    $('#clearFilters').addEventListener('click', function () {
      state = { cat: 'all', q: '', sort: state.sort, subject: '' };
      $('#search').value = '';
      renderChips(); renderProducts();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!$('#lightbox').hidden) closeLightbox();
      else if (!$('#checkoutModal').hidden) closeModal();
      else if ($('#drawer').classList.contains('open')) closeDrawer();
      else closeMenu();
    });

    // mobile menu
    var menuBtn = $('#menuBtn'), nav = $('#nav'), header = $('.site-header');
    function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    menuBtn.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });

    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- init ----------
  fillSettings();
  heroCovers();
  renderSubjects();
  renderChips();
  renderProducts();
  renderCart();
  bind();
})();
