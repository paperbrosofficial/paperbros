/* Paper Bros — admin panel */
(function () {
  'use strict';

  var DRAFT_KEY = 'pb_admin_draft';
  var ORDERS_KEY = 'pb_admin_orders';
  var AUTH_KEY = 'pb_admin_auth';
  var STATUSES = ['New', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  var CATS = window.PB_CATEGORIES;
  var TYPES = window.PB_TYPES;
  var PUBLISHED = window.PB_DEFAULT_DATA;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '৳' + Number(n || 0).toLocaleString('en-US'); }
  function read(k, f) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('Could not save: browser storage is full or blocked', true); } }
  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; }
  function sha256(text) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('Secure context required'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }
  var toastTimer;
  function toast(msg, bad) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600);
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- state ----------
  var draft = read(DRAFT_KEY, null);
  if (!draft || !draft.products || !draft.settings || !draft.subjects) draft = clone(PUBLISHED);
  var orders = read(ORDERS_KEY, []);

  function isDirty() { return JSON.stringify(draft) !== JSON.stringify(PUBLISHED); }
  function saveDraft() {
    if (isDirty()) write(DRAFT_KEY, draft); else localStorage.removeItem(DRAFT_KEY);
    updateDirty();
  }
  function saveOrders() { write(ORDERS_KEY, orders); updateNewCount(); }
  function subjectById(id) { return draft.subjects.find(function (s) { return s.id === id; }); }

  function updateDirty() {
    var d = isDirty();
    $('#draftChip').hidden = !d;
    $('#navDirty').hidden = !d;
    renderPublishStatus();
  }
  function updateNewCount() {
    var n = orders.filter(function (o) { return o.status === 'New'; }).length;
    $('#navNew').hidden = !n;
    $('#navNew').textContent = n;
  }

  // ---------- auth ----------
  function showApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    renderAll();
  }
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('#loginErr');
    err.textContent = '';
    sha256($('#pass').value).then(function (h) {
      if (h === PUBLISHED.settings.adminPassHash || h === draft.settings.adminPassHash) {
        try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (x) { /* ignore */ }
        showApp();
      } else {
        err.textContent = 'Incorrect passcode.';
        var c = $('.login-card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
        $('#pass').select();
      }
    }).catch(function () {
      err.textContent = 'Open this page over https (or localhost) to sign in.';
    });
  });
  $('#logout').addEventListener('click', function () {
    try { sessionStorage.removeItem(AUTH_KEY); } catch (x) { /* ignore */ }
    location.reload();
  });

  // ---------- navigation ----------
  var TITLES = { dashboard: 'Dashboard', orders: 'Orders', products: 'Products', subjects: 'Subjects', settings: 'Settings', publish: 'Publish' };
  function goTo(tab) {
    $$('.side-nav button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    $$('.panel').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== tab; });
    $('#pageTitle').textContent = TITLES[tab];
    $('#sidebar').classList.remove('open');
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'settings') fillSettings();
    window.scrollTo(0, 0);
    try { sessionStorage.setItem('pb_admin_tab', tab); } catch (x) { /* ignore */ }
  }
  $$('.side-nav button').forEach(function (b) { b.addEventListener('click', function () { goTo(b.getAttribute('data-tab')); }); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (g) goTo(g.getAttribute('data-goto'));
  });
  $('#menuToggle').addEventListener('click', function () { $('#sidebar').classList.toggle('open'); });
  function openPreview() { saveDraft(); window.open('index.html?preview=1', '_blank', 'noopener'); }
  $('#previewBtn').addEventListener('click', openPreview);
  $('#previewBtn2').addEventListener('click', openPreview);

  // ---------- modal ----------
  function openModal(html) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    document.body.classList.add('no-scroll');
    var f = $('#modalBody input, #modalBody select, #modalBody textarea');
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal() { $('#modal').hidden = true; document.body.classList.remove('no-scroll'); }
  $('#modal').addEventListener('click', function (e) {
    if (e.target === $('#modal') || e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  // ---------- dashboard ----------
  function renderDashboard() {
    var live = draft.products.filter(function (p) { return p.inStock; }).length;
    var out = draft.products.length - live;
    var pending = orders.filter(function (o) { return o.status === 'Confirmed' || o.status === 'Shipped'; }).length;
    var delivered = orders.filter(function (o) { return o.status === 'Delivered'; });
    var revenue = delivered.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
    $('#kpis').innerHTML =
      kpi('Orders tracked', orders.length, orders.filter(function (o) { return o.status === 'New'; }).length + ' new') +
      kpi('In progress', pending, 'confirmed or shipped') +
      kpi('Delivered revenue', money(revenue), delivered.length + ' delivered orders') +
      kpi('Products live', live, out ? out + ' out of stock' : 'all in stock');
    var recent = orders.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 6);
    $('#recentOrders').innerHTML = recent.length
      ? '<ul class="mini-list">' + recent.map(function (o) {
          return '<li><div><strong>' + esc(o.name) + '</strong><small>' + esc(o.id) + ' · ' + fmtDate(o.date) + '</small></div>' +
            '<div style="text-align:right"><strong>' + money(o.total) + '</strong><br><span class="status st-' + esc(o.status) + '">' + esc(o.status) + '</span></div></li>';
        }).join('') + '</ul>'
      : '<p class="muted">No orders yet. When an order email arrives, paste its import code on the <button class="link" data-goto="orders">Orders</button> page to track it here.</p>';
    $('#dashEmail').textContent = draft.settings.orderEmail;
  }
  function kpi(label, value, sub) {
    return '<div class="kpi"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong><span>' + esc(sub) + '</span></div>';
  }

  // ---------- orders ----------
  $('#orderFilter').innerHTML = '<option value="">All statuses</option>' + STATUSES.map(function (s) { return '<option>' + s + '</option>'; }).join('');

  function parseOrders(text) {
    text = String(text || '').trim();
    var start = text.indexOf('{'), end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('No import code found.');
    var raw = text.slice(start, end + 1);
    var data;
    try { data = JSON.parse(raw); } catch (e) {
      try { data = JSON.parse('[' + raw.replace(/}\s*{/g, '},{') + ']'); } catch (e2) { throw new Error('That code is incomplete. Copy the whole Admin import code.'); }
    }
    var list = Array.isArray(data) ? data : [data];
    list.forEach(function (o) {
      if (!o || !o.id || !Array.isArray(o.items)) throw new Error('That doesn\'t look like a Paper Bros order code.');
    });
    return list;
  }

  $('#importForm').addEventListener('submit', function (e) {
    e.preventDefault();
    try {
      var list = parseOrders($('#importText').value);
      var added = 0, dup = 0;
      list.forEach(function (o) {
        if (orders.some(function (x) { return x.id === o.id; })) { dup++; return; }
        o.status = o.status && STATUSES.indexOf(o.status) !== -1 ? o.status : 'New';
        orders.push(o); added++;
      });
      saveOrders();
      renderOrders();
      $('#importText').value = '';
      toast(added ? added + ' order' + (added > 1 ? 's' : '') + ' added' + (dup ? ' (' + dup + ' already tracked)' : '') : 'That order is already tracked');
    } catch (err) { toast(err.message, true); }
  });

  function renderOrders() {
    var q = $('#orderSearch').value.trim().toLowerCase();
    var st = $('#orderFilter').value;
    var list = orders.filter(function (o) {
      if (st && o.status !== st) return false;
      if (!q) return true;
      return [o.id, o.name, o.phone, o.altPhone, o.city, o.area, o.address, o.school].join(' ').toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });

    if (!list.length) {
      $('#ordersTable').innerHTML = '<div class="empty-row">' + (orders.length ? 'No orders match your search.' : 'No orders tracked yet. Paste an import code from an order email above.') + '</div>';
      return;
    }
    $('#ordersTable').innerHTML = '<table><thead><tr><th>Order</th><th>Customer</th><th>Location</th><th>Items</th><th class="num">Total</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>' +
      list.map(function (o) {
        var count = o.items.reduce(function (n, i) { return n + (Number(i.qty) || 0); }, 0);
        return '<tr>' +
          '<td class="cell-title"><strong>' + esc(o.id) + '</strong><small>' + fmtDate(o.date) + '</small></td>' +
          '<td class="cell-title"><strong>' + esc(o.name) + '</strong><small>' + esc(o.phone) + '</small></td>' +
          '<td>' + esc(o.area) + ', ' + esc(o.city) + '</td>' +
          '<td>' + count + '</td>' +
          '<td class="num"><strong>' + money(o.total) + '</strong></td>' +
          '<td>' + esc(o.payment) + '</td>' +
          '<td><select class="status-select" data-status="' + esc(o.id) + '">' + STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>' +
          '<td class="actions"><button class="icon-act" data-view-order="' + esc(o.id) + '">View</button><button class="icon-act danger" data-del-order="' + esc(o.id) + '">Delete</button></td>' +
          '</tr>';
      }).join('') + '</tbody></table>';
  }
  $('#orderSearch').addEventListener('input', renderOrders);
  $('#orderFilter').addEventListener('change', renderOrders);
  $('#ordersTable').addEventListener('change', function (e) {
    var s = e.target.closest('[data-status]');
    if (!s) return;
    var o = orders.find(function (x) { return x.id === s.getAttribute('data-status'); });
    if (o) { o.status = s.value; saveOrders(); toast(o.id + ' marked ' + o.status); }
  });
  $('#ordersTable').addEventListener('click', function (e) {
    var v = e.target.closest('[data-view-order]');
    if (v) return viewOrder(v.getAttribute('data-view-order'));
    var d = e.target.closest('[data-del-order]');
    if (d) {
      var id = d.getAttribute('data-del-order');
      if (!confirm('Remove order ' + id + ' from this tracker? The original email is not affected.')) return;
      orders = orders.filter(function (o) { return o.id !== id; });
      saveOrders(); renderOrders(); toast('Order removed');
    }
  });

  function viewOrder(id) {
    var o = orders.find(function (x) { return x.id === id; });
    if (!o) return;
    var phone = String(o.phone || '').replace(/\D/g, '');
    var waNum = phone.indexOf('88') === 0 ? phone : '88' + phone;
    var rows = [
      ['Date', fmtDate(o.date)], ['Name', o.name], ['Phone', o.phone], ['WhatsApp / alt', o.altPhone], ['Email', o.email],
      ['School', o.school], ['Exam session', o.session], ['Address', [o.address, o.area, o.city].filter(Boolean).join(', ')],
      ['Payment', o.payment + (o.trx ? ' (TrxID: ' + o.trx + ')' : '')], ['Notes', o.notes]
    ].filter(function (r) { return r[1]; });
    openModal(
      '<h2>Order ' + esc(o.id) + ' <span class="status st-' + esc(o.status) + '">' + esc(o.status) + '</span></h2>' +
      '<dl class="detail-grid">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div class="items-table"><table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Amount</th></tr></thead><tbody>' +
      o.items.map(function (i) { return '<tr><td>' + esc(i.title) + '</td><td class="num">' + esc(i.qty) + '</td><td class="num">' + money(i.price * i.qty) + '</td></tr>'; }).join('') +
      '<tr><td>Subtotal</td><td></td><td class="num">' + money(o.subtotal) + '</td></tr>' +
      '<tr><td>Delivery</td><td></td><td class="num">' + (o.delivery ? money(o.delivery) : 'Free') + '</td></tr>' +
      '<tr><td><strong>Total</strong></td><td></td><td class="num"><strong>' + money(o.total) + '</strong></td></tr>' +
      '</tbody></table></div>' +
      '<div class="modal-actions"><a class="btn btn-ghost" href="tel:' + esc(o.phone) + '">Call</a>' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/' + esc(waNum) + '?text=' + encodeURIComponent('Hi ' + o.name + ', this is Paper Bros about your order ' + o.id + '.') + '">WhatsApp</a>' +
      '<button class="btn btn-primary" data-close>Done</button></div>'
    );
  }

  $('#exportCsv').addEventListener('click', function () {
    if (!orders.length) return toast('No orders to export', true);
    var head = ['Order ID', 'Date', 'Status', 'Name', 'Phone', 'Alt phone', 'Email', 'School', 'Exam session', 'City', 'Area', 'Address', 'Items', 'Subtotal', 'Delivery', 'Total', 'Payment', 'Transaction ID', 'Notes'];
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.join(',')].concat(orders.map(function (o) {
      return [o.id, o.date, o.status, o.name, o.phone, o.altPhone, o.email, o.school, o.session, o.city, o.area, o.address,
        o.items.map(function (i) { return i.title + ' x' + i.qty; }).join('; '), o.subtotal, o.delivery, o.total, o.payment, o.trx, o.notes].map(q).join(',');
    }));
    download('paperbros-orders-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + lines.join('\n'), 'text/csv');
  });

  // ---------- products ----------
  $('#productFilter').innerHTML = '<option value="">All categories</option>' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '">' + esc(CATS[k]) + '</option>'; }).join('');

  function renderProducts() {
    var q = $('#productSearch').value.trim().toLowerCase();
    var cat = $('#productFilter').value;
    var list = draft.products.filter(function (p) {
      var s = subjectById(p.subject) || {};
      if (cat && s.category !== cat) return false;
      if (!q) return true;
      return [p.title, p.paper, s.name, s.code, TYPES[p.type]].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    if (!list.length) { $('#productsTable').innerHTML = '<div class="empty-row">No products found.</div>'; return; }
    $('#productsTable').innerHTML = '<table><thead><tr><th></th><th>Product</th><th>Type</th><th class="num">Price</th><th>In stock</th><th></th></tr></thead><tbody>' +
      list.map(function (p) {
        var s = subjectById(p.subject) || { color: '#999', code: '?', name: 'Missing subject' };
        return '<tr>' +
          '<td style="width:56px">' + (p.image
            ? '<img class="code-chip thumb" src="' + esc(p.image) + '" alt="" onerror="this.outerHTML=\'<span class=&quot;code-chip&quot; style=&quot;--c:' + esc(s.color) + '&quot;>' + esc(s.code) + '</span>\'">'
            : '<span class="code-chip" style="--c:' + esc(s.color) + '">' + esc(s.code) + '</span>') + '</td>' +
          '<td class="cell-title"><strong>' + esc(p.title) + (p.badge ? ' <span class="status st-New">' + esc(p.badge) + '</span>' : '') + '</strong><small>' + esc(s.name) + (p.paper ? ' · ' + esc(p.paper) : '') + '</small></td>' +
          '<td>' + esc(TYPES[p.type] || p.type) + '</td>' +
          '<td class="num"><strong>' + money(p.price) + '</strong>' + (p.oldPrice > p.price ? '<br><small class="muted"><s>' + money(p.oldPrice) + '</s></small>' : '') + '</td>' +
          '<td><label class="switch"><input type="checkbox" data-stock="' + esc(p.id) + '"' + (p.inStock ? ' checked' : '') + '><span></span></label></td>' +
          '<td class="actions"><button class="icon-act" data-edit-product="' + esc(p.id) + '">Edit</button><button class="icon-act" data-dup-product="' + esc(p.id) + '">Duplicate</button><button class="icon-act danger" data-del-product="' + esc(p.id) + '">Delete</button></td>' +
          '</tr>';
      }).join('') + '</tbody></table>';
  }
  $('#productSearch').addEventListener('input', renderProducts);
  $('#productFilter').addEventListener('change', renderProducts);
  $('#productsTable').addEventListener('change', function (e) {
    var c = e.target.closest('[data-stock]');
    if (!c) return;
    var p = draft.products.find(function (x) { return x.id === c.getAttribute('data-stock'); });
    if (p) { p.inStock = c.checked; saveDraft(); toast(p.title + (p.inStock ? ' is in stock' : ' marked out of stock')); }
  });
  $('#productsTable').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit-product]');
    if (ed) return productForm(draft.products.find(function (p) { return p.id === ed.getAttribute('data-edit-product'); }));
    var du = e.target.closest('[data-dup-product]');
    if (du) {
      var src = draft.products.find(function (p) { return p.id === du.getAttribute('data-dup-product'); });
      var copy = clone(src); copy.title = src.title + ' (copy)'; copy.id = uniqueId(slug(copy.title));
      draft.products.splice(draft.products.indexOf(src) + 1, 0, copy);
      saveDraft(); renderProducts(); toast('Product duplicated');
      return;
    }
    var de = e.target.closest('[data-del-product]');
    if (de) {
      var p = draft.products.find(function (x) { return x.id === de.getAttribute('data-del-product'); });
      if (!confirm('Delete "' + p.title + '"? You can undo this with "Discard unpublished changes" until you publish.')) return;
      draft.products = draft.products.filter(function (x) { return x !== p; });
      saveDraft(); renderProducts(); toast('Product deleted');
    }
  });
  $('#addProduct').addEventListener('click', function () { productForm(null); });

  function uniqueId(base) {
    var id = base, n = 2;
    while (draft.products.some(function (p) { return p.id === id; })) id = base + '-' + n++;
    return id;
  }

  function productForm(p) {
    var isNew = !p;
    if (!draft.subjects.length) { toast('Add a subject first', true); return; }
    p = p || { subject: draft.subjects[0] && draft.subjects[0].id, type: 'topical', title: '', paper: '', price: '', oldPrice: 0, badge: '', desc: '', inStock: true };
    openModal(
      '<h2>' + (isNew ? 'Add product' : 'Edit product') + '</h2>' +
      '<form id="productForm">' +
      '<div class="field"><label>Title *</label><input name="title" required value="' + esc(p.title) + '" placeholder="e.g. Physics P1"></div>' +
      '<div class="grid-2">' +
        '<div class="field"><label>Subject *</label><select name="subject" required>' + draft.subjects.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === p.subject ? ' selected' : '') + '>' + esc(s.name) + ' (' + esc(s.code) + ')</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Type *</label><select name="type">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (k === p.type ? ' selected' : '') + '>' + esc(TYPES[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Price (৳) *</label><input name="price" type="number" min="0" step="1" required value="' + esc(p.price) + '"></div>' +
        '<div class="field"><label>Original price (৳, shows as crossed out)</label><input name="oldPrice" type="number" min="0" step="1" value="' + esc(p.oldPrice || '') + '" placeholder="Optional"></div>' +
        '<div class="field"><label>Paper</label><input name="paper" value="' + esc(p.paper) + '" placeholder="e.g. Paper 1 (optional)"></div>' +
        '<div class="field"><label>Badge</label><input name="badge" value="' + esc(p.badge) + '" placeholder="e.g. Bestseller, New (optional)"></div>' +
      '</div>' +
      '<div class="field"><label>Description</label><textarea name="desc" rows="3">' + esc(p.desc) + '</textarea></div>' +
      '<div class="cover-field">' +
        '<img id="coverPreview" alt="" ' + (p.image ? 'src="' + esc(p.image) + '"' : 'hidden') + '>' +
        '<div class="field"><label>Cover image</label><input name="image" value="' + esc(p.image || '') + '" placeholder="assets/covers/' + esc(p.id || 'product-id') + '.jpg">' +
        '<small class="muted">Put the cover picture in the <code>assets/covers</code> folder of your site and type its path here. Leave it empty to use the coloured cover.</small></div>' +
      '</div>' +
      '<label class="check"><input type="checkbox" name="inStock"' + (p.inStock ? ' checked' : '') + '> In stock</label>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">' + (isNew ? 'Add product' : 'Save changes') + '</button></div>' +
      '</form>'
    );
    var imgInput = $('#productForm').elements.image, preview = $('#coverPreview');
    preview.onerror = function () { preview.hidden = true; };
    imgInput.addEventListener('change', function () {
      var v = imgInput.value.trim();
      preview.hidden = !v;
      if (v) preview.src = v;
    });
    $('#productForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target.elements;
      var price = Math.round(Number(f.price.value));
      if (!f.title.value.trim() || !(price >= 0) || f.price.value === '') { toast('Title and price are required', true); return; }
      var data = {
        subject: f.subject.value, type: f.type.value, title: f.title.value.trim(), paper: f.paper.value.trim(),
        price: price, oldPrice: Math.round(Number(f.oldPrice.value)) || 0, badge: f.badge.value.trim(),
        desc: f.desc.value.trim(), image: f.image.value.trim(), inStock: f.inStock.checked
      };
      if (isNew) { data.id = uniqueId(slug(data.title)); draft.products.push(data); }
      else Object.assign(p, data);
      saveDraft(); closeModal(); renderProducts();
      toast(isNew ? 'Product added' : 'Product saved');
    });
  }

  // ---------- subjects ----------
  function renderSubjects() {
    if (!draft.subjects.length) { $('#subjectsTable').innerHTML = '<div class="empty-row">No subjects yet.</div>'; return; }
    $('#subjectsTable').innerHTML = '<table><thead><tr><th>Colour</th><th>Subject</th><th>Code</th><th>Category</th><th class="num">Products</th><th></th></tr></thead><tbody>' +
      draft.subjects.map(function (s, i) {
        var n = draft.products.filter(function (p) { return p.subject === s.id; }).length;
        return '<tr><td><span class="swatch" style="--c:' + esc(s.color) + '"></span></td>' +
          '<td><strong>' + esc(s.name) + '</strong></td><td>' + esc(s.code) + '</td><td>' + esc(CATS[s.category] || s.category) + '</td>' +
          '<td class="num">' + n + '</td>' +
          '<td class="actions">' +
            '<button class="icon-act" data-move-subject="' + i + '" data-dir="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button>' +
            '<button class="icon-act" data-move-subject="' + i + '" data-dir="1"' + (i === draft.subjects.length - 1 ? ' disabled' : '') + ' aria-label="Move down">↓</button>' +
            '<button class="icon-act" data-edit-subject="' + esc(s.id) + '">Edit</button>' +
            '<button class="icon-act danger" data-del-subject="' + esc(s.id) + '">Delete</button></td></tr>';
      }).join('') + '</tbody></table>';
  }
  $('#subjectsTable').addEventListener('click', function (e) {
    var mv = e.target.closest('[data-move-subject]');
    if (mv && !mv.disabled) {
      var i = Number(mv.getAttribute('data-move-subject')), j = i + Number(mv.getAttribute('data-dir'));
      var tmp = draft.subjects[i]; draft.subjects[i] = draft.subjects[j]; draft.subjects[j] = tmp;
      saveDraft(); renderSubjects(); return;
    }
    var ed = e.target.closest('[data-edit-subject]');
    if (ed) return subjectForm(subjectById(ed.getAttribute('data-edit-subject')));
    var de = e.target.closest('[data-del-subject]');
    if (de) {
      var s = subjectById(de.getAttribute('data-del-subject'));
      var n = draft.products.filter(function (p) { return p.subject === s.id; }).length;
      if (n) { toast('Move or delete its ' + n + ' product' + (n > 1 ? 's' : '') + ' first', true); return; }
      if (!confirm('Delete subject "' + s.name + '"?')) return;
      draft.subjects = draft.subjects.filter(function (x) { return x !== s; });
      saveDraft(); renderSubjects(); toast('Subject deleted');
    }
  });
  $('#addSubject').addEventListener('click', function () { subjectForm(null); });

  function subjectForm(s) {
    var isNew = !s;
    s = s || { name: '', code: '', category: 'sciences', color: '#1d4ed8' };
    openModal(
      '<h2>' + (isNew ? 'Add subject' : 'Edit subject') + '</h2>' +
      '<form id="subjectForm"><div class="grid-2">' +
        '<div class="field"><label>Name *</label><input name="name" required value="' + esc(s.name) + '" placeholder="e.g. Islamiyat"></div>' +
        '<div class="field"><label>Syllabus code *</label><input name="code" required value="' + esc(s.code) + '" placeholder="e.g. 2058"></div>' +
        '<div class="field"><label>Category</label><select name="category">' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (k === s.category ? ' selected' : '') + '>' + esc(CATS[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Cover colour</label><input name="color" type="color" value="' + esc(s.color) + '"></div>' +
      '</div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">' + (isNew ? 'Add subject' : 'Save changes') + '</button></div></form>'
    );
    $('#subjectForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target.elements;
      var data = { name: f.name.value.trim(), code: f.code.value.trim(), category: f.category.value, color: f.color.value };
      if (!data.name || !data.code) { toast('Name and code are required', true); return; }
      if (isNew) {
        var base = slug(data.name), id = base, n = 2;
        while (subjectById(id)) id = base + '-' + n++;
        data.id = id; draft.subjects.push(data);
      } else Object.assign(s, data);
      saveDraft(); closeModal(); renderSubjects(); renderProducts();
      toast(isNew ? 'Subject added' : 'Subject saved');
    });
  }

  // ---------- settings ----------
  function fillSettings() {
    var f = $('#settingsForm').elements, s = draft.settings;
    ['orderEmail', 'web3formsKey', 'hotline', 'whatsapp', 'location', 'instagram', 'facebook', 'announcement', 'deliveryInsideDhaka', 'deliveryOutsideDhaka', 'freeShippingThreshold', 'deliveryTime']
      .forEach(function (k) { f[k].value = s[k] == null ? '' : s[k]; });
    f.cod.checked = !!s.payment.cod;
    f.bkashWhatsapp.checked = !!s.payment.bkashWhatsapp;
    f.bkash.value = s.payment.bkash || '';
    f.nagad.value = s.payment.nagad || '';
  }
  $('#settingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target.elements, s = draft.settings;
    if (!f.orderEmail.checkValidity()) { toast('Enter a valid order email', true); f.orderEmail.focus(); return; }
    if (!f.cod.checked && !f.bkashWhatsapp.checked && !f.bkash.value.trim() && !f.nagad.value.trim()) { toast('Enable at least one payment method', true); return; }
    ['orderEmail', 'web3formsKey', 'hotline', 'location', 'instagram', 'facebook', 'announcement', 'deliveryTime'].forEach(function (k) { s[k] = f[k].value.trim(); });
    s.whatsapp = f.whatsapp.value.replace(/\D/g, '');
    ['deliveryInsideDhaka', 'deliveryOutsideDhaka', 'freeShippingThreshold'].forEach(function (k) { s[k] = Math.max(0, Math.round(Number(f[k].value) || 0)); });
    s.payment = { cod: f.cod.checked, bkashWhatsapp: f.bkashWhatsapp.checked, bkash: f.bkash.value.trim(), nagad: f.nagad.value.trim() };
    saveDraft(); fillSettings();
    toast('Settings saved. Publish to make them live.');
  });
  $('#passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var a = $('#newPass').value, b = $('#newPass2').value;
    if (a.length < 6) return toast('Use at least 6 characters', true);
    if (a !== b) return toast('Passcodes don\'t match', true);
    sha256(a).then(function (h) {
      draft.settings.adminPassHash = h;
      saveDraft(); e.target.reset();
      toast('Passcode changed. Publish data.js to apply it.');
    });
  });

  // ---------- publish ----------
  function renderPublishStatus() {
    var el = $('#publishStatus');
    if (!el) return;
    if (isDirty()) {
      el.innerHTML = '<span class="dot" style="background:#fb923c"></span><div><h2>You have unpublished changes</h2><p>Visitors still see the old version. Download <code>data.js</code> and upload it to publish.</p></div>';
    } else {
      el.innerHTML = '<span class="dot" style="background:#15803d"></span><div><h2>Everything is published</h2><p>The website matches what you see here.</p></div>';
    }
  }
  function dataFile() {
    return '/*\n * Paper Bros — store data\n * Generated by the admin page on ' + new Date().toLocaleString('en-GB') + '.\n' +
      ' * Replace assets/js/data.js on your website with this file to publish.\n */\n' +
      'window.PB_CATEGORIES = ' + JSON.stringify(CATS, null, 2) + ';\n\n' +
      'window.PB_TYPES = ' + JSON.stringify(TYPES, null, 2) + ';\n\n' +
      'window.PB_DEFAULT_DATA = ' + JSON.stringify(draft, null, 2) + ';\n';
  }
  $('#downloadData').addEventListener('click', function () {
    download('data.js', dataFile(), 'text/javascript');
    toast('data.js downloaded. Upload it to assets/js/ on your site.');
  });
  $('#discardDraft').addEventListener('click', function () {
    if (!isDirty()) return toast('No unpublished changes');
    if (!confirm('Discard all unpublished changes and go back to the live version?')) return;
    draft = clone(PUBLISHED);
    saveDraft(); renderAll(); toast('Changes discarded');
  });
  $('#backupOrders').addEventListener('click', function () {
    download('paperbros-orders-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(orders, null, 2), 'application/json');
  });
  function readFile(input, cb) {
    var file = input.files && input.files[0];
    if (!file) return;
    var r = new FileReader();
    r.onload = function () { cb(String(r.result)); input.value = ''; };
    r.readAsText(file);
  }
  $('#restoreOrders').addEventListener('change', function (e) {
    readFile(e.target, function (text) {
      try {
        var list = JSON.parse(text);
        if (!Array.isArray(list)) throw new Error();
        var added = 0;
        list.forEach(function (o) {
          if (o && o.id && Array.isArray(o.items) && !orders.some(function (x) { return x.id === o.id; })) { orders.push(o); added++; }
        });
        saveOrders(); renderOrders(); renderDashboard();
        toast(added + ' order' + (added === 1 ? '' : 's') + ' restored');
      } catch (x) { toast('That isn\'t an orders backup file', true); }
    });
  });
  $('#loadData').addEventListener('change', function (e) {
    readFile(e.target, function (text) {
      try {
        var m = text.match(/PB_DEFAULT_DATA\s*=\s*([\s\S]*?);?\s*$/);
        var d = JSON.parse(m ? m[1].replace(/;\s*$/, '') : text);
        if (!d.products || !d.settings || !d.subjects) throw new Error();
        if (!confirm('Replace the current draft with this file?')) return;
        draft = d; saveDraft(); renderAll(); toast('Data file loaded');
      } catch (x) { toast('Could not read that file', true); }
    });
  });

  // ---------- init ----------
  function renderAll() {
    renderDashboard(); renderOrders(); renderProducts(); renderSubjects(); fillSettings(); updateDirty(); updateNewCount();
  }
  var authed = false;
  try { authed = sessionStorage.getItem(AUTH_KEY) === '1'; } catch (x) { /* ignore */ }
  if (authed) {
    showApp();
    var last = null;
    try { last = sessionStorage.getItem('pb_admin_tab'); } catch (x) { /* ignore */ }
    if (last && TITLES[last]) goTo(last);
  }
})();
