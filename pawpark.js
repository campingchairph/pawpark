// ══════════════════════════════════
//  PAWPARK — app logic
// ══════════════════════════════════

var booking = {
  station: 'SM North Edsa',
  dogName: '',
  dogSize: 'S',
  petNotes: '',
  duration: '30 mins',
  durationMinutes: 30,
  durationPrice: 80,
  food: 'Station food (+₱50)',
  foodPrice: 50,
  dropDate: '',
  dropTime: '',
  pickTime: '',
  payment: 'payGcash'
};

var allBookings = [];
var activeBookingIndex = -1;

// timer state
var timerInterval = null;
var timerStartMs = 0;
var timerDurationMs = 0;
var overtimeCharges = 0;
var overtimeInterval = null;

// snack cart
var snackCart = { count: 0, total: 0 };
var snackNames = ['Milk-bone treat pack', 'Chicken jerky strips', 'Cheese bites', 'Sweet potato chews'];
var snackPrices = [45, 65, 55, 50];

// CCTV
var cctvInterval = null;

// ── SCREEN TRANSITIONS ──
function showScreen(id) {
  var current = document.querySelector('.screen.active');
  var target = document.getElementById(id);
  if (!target || current === target) return;
  if (current) {
    current.classList.add('exit');
    current.classList.remove('active');
    setTimeout(function() { current.classList.remove('exit'); }, 300);
  }
  setTimeout(function() { target.classList.add('active'); }, 40);
  if (id === 'screen-bookings') renderBookings();
}

// ── SPLASH ──
window.addEventListener('load', function() {
  setTimeout(function() { showScreen('screen-home'); }, 2500);
});

// ── HOME ──
function toggleMapView() {
  var list = document.getElementById('listView');
  var map = document.getElementById('mapView');
  var btn = document.getElementById('mapToggleBtn');
  if (!list || !map) return;
  if (list.classList.contains('hidden')) {
    list.classList.remove('hidden');
    map.classList.add('hidden');
    btn.textContent = '🗺 Map';
  } else {
    list.classList.add('hidden');
    map.classList.remove('hidden');
    btn.textContent = '📋 List';
  }
}

// ── STATION DETAIL ──
function showStationDetail(name) {
  booking.station = name;
  var icons = { 'SM North Edsa': '🏪', 'Trinoma': '🏬', 'Robinsons Galleria': '🛍️' };
  var slots = { 'SM North Edsa': '4 slots open', 'Trinoma': '2 slots open', 'Robinsons Galleria': '6 slots open' };
  setText('stationTitle', 'PawPark ' + name);
  setText('stationDetailName', 'PawPark ' + name);
  setText('stationSlots', slots[name] || '—');
  setText('detailIcon', icons[name] || '🏪');
  showScreen('screen-station');
}

// ── BOOKING FLOW ──
function startBooking() { showScreen('screen-book1'); }

function goStep(n) {
  if (n === 6) buildSummary();
  showScreen('screen-book' + n);
}

function selectStation(name, optId) {
  booking.station = name;
  ['bsOpt1','bsOpt2','bsOpt3'].forEach(function(id) { rmClass(id, 'selected'); });
  addClass(optId, 'selected');
}

function selectSize(sz) {
  booking.dogSize = sz;
  var map = { S:'szS', M:'szM', L:'szL' };
  ['szS','szM','szL'].forEach(function(id) { rmClass(id, 'sel'); });
  addClass(map[sz], 'sel');
}

function handlePhoto(input) {
  if (input.files && input.files[0]) setText('photoLabel', '✅  ' + input.files[0].name);
}

function selectDur(label, price, optId) {
  booking.duration = label;
  booking.durationPrice = price;
  booking.durationMinutes = label === '30 mins' ? 30 : label === '1 hour' ? 60 : label === '2 hours' ? 120 : 0;
  ['dur30','dur60','dur120','durCustom'].forEach(function(id) { rmClass(id, 'sel'); });
  addClass(optId, 'sel');
  var wrap = document.getElementById('customWrap');
  if (wrap) { optId === 'durCustom' ? wrap.classList.remove('hidden') : wrap.classList.add('hidden'); }
}

function calcCustom(val) {
  var m = parseInt(val) || 0;
  booking.duration = m + ' mins';
  booking.durationMinutes = m;
  booking.durationPrice = Math.round(m * 2.5);
}

function selectFood(label, price, optId) {
  booking.food = label;
  booking.foodPrice = price;
  ['foodStation','foodTreats','foodOwn','foodNone'].forEach(function(id) { rmClass(id, 'sel'); });
  ['fdStation','fdTreats','fdOwn','fdNone'].forEach(function(id) { rmClass(id, 'sel-dot'); });
  addClass(optId, 'sel');
  addClass(optId.replace('food', 'fd'), 'sel-dot');
}

function selectPay(optId) {
  booking.payment = optId;
  ['payGcash','payMaya','payCash'].forEach(function(id) { rmClass(id, 'sel'); });
  addClass(optId, 'sel');
}

function buildSummary() {
  booking.dogName = val('dogName');
  booking.dropDate = val('dropDate');
  booking.dropTime = val('dropTime');
  booking.pickTime = val('pickTime');
  var pet = (booking.dogName || 'Your dog') + ' · ' + ({S:'Small',M:'Medium',L:'Large'}[booking.dogSize] || '');
  var sched = booking.dropDate && booking.dropTime ? booking.dropDate + ' @ ' + booking.dropTime : '—';
  setText('sumStation', 'PawPark ' + booking.station);
  setText('sumPet', pet);
  setText('sumDur', booking.duration);
  setText('sumFood', booking.food);
  setText('sumSchedule', sched);
  setText('sumTotal', '₱' + (booking.durationPrice + booking.foodPrice));
}

// ── CONFIRM ──
function confirmBooking() {
  booking.dogName = val('dogName') || 'Your pup';
  booking.dropDate = val('dropDate');
  booking.dropTime = val('dropTime');
  booking.pickTime = val('pickTime');

  var id = '#PP-' + Math.floor(10000 + Math.random() * 90000);
  setText('bookingId', id);

  var b = {
    id: id,
    station: 'PawPark ' + booking.station,
    pet: booking.dogName,
    duration: booking.duration,
    durationMinutes: booking.durationMinutes || 30,
    date: booking.dropDate,
    time: booking.dropTime,
    food: booking.food,
    total: booking.durationPrice + booking.foodPrice,
    status: 'Confirmed',
    checkedIn: false
  };

  allBookings.unshift(b);
  setText('bookingId', id);
  showScreen('screen-confirm');
  var paw = document.getElementById('confirmPaw');
  if (paw) { paw.style.animation = 'none'; void paw.offsetWidth; paw.style.animation = ''; }
}

// ── MY BOOKINGS ──
function renderBookings() {
  var list = document.getElementById('bookingsList');
  var empty = document.getElementById('noBookings');
  if (!list) return;
  if (!allBookings.length) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  list.innerHTML = allBookings.map(function(b, i) {
    var isActive = b.checkedIn && b.status === 'Active';
    var statusClass = isActive ? 'ok' : 'ok';
    var statusLabel = isActive ? '🟢 Active' : b.status;
    var actionBtn = b.checkedIn
      ? '<button class="feed-remind-btn" style="margin-top:10px;width:100%;padding:10px 0;font-size:13px;" onclick="openActiveBooking(' + i + ')">View live stay →</button>'
      : '<button class="feed-remind-btn" style="margin-top:10px;width:100%;padding:10px 0;font-size:13px;background:var(--text-mid);" onclick="simulateCheckIn(' + i + ')">Simulate check-in ✓</button>';
    return '<div class="booking-item">' +
      '<div class="bi-hdr">' +
        '<span class="bi-name">' + b.station + '</span>' +
        '<span class="bi-status ok">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="bi-row">🐶 ' + b.pet + ' &nbsp;·&nbsp; ' + b.duration + '</div>' +
      (b.date ? '<div class="bi-row">📅 ' + b.date + (b.time ? ' @ ' + b.time : '') + '</div>' : '') +
      '<div class="bi-row">💰 ₱' + b.total + ' &nbsp;·&nbsp; ' + b.id + '</div>' +
      actionBtn +
    '</div>';
  }).join('');
}

function simulateCheckIn(i) {
  allBookings[i].checkedIn = true;
  allBookings[i].status = 'Active';
  allBookings[i].checkInTime = Date.now();
  renderBookings();
}

// ── ACTIVE BOOKING SCREEN ──
function openActiveBooking(i) {
  activeBookingIndex = i;
  var b = allBookings[i];
  setText('activeTitle', b.pet + "'s stay");
  setText('cctvPetName', 'Watching ' + b.pet);
  startCountdown(b);
  buildFeedingSchedule(b);
  showScreen('screen-active');
}

function startCountdown(b) {
  if (timerInterval) clearInterval(timerInterval);
  if (overtimeInterval) clearInterval(overtimeInterval);

  var durationMs = (b.durationMinutes || 30) * 60 * 1000;
  var checkInMs = b.checkInTime || Date.now();
  timerStartMs = checkInMs;
  timerDurationMs = durationMs;
  overtimeCharges = 0;

  var display = document.getElementById('timerDisplay');
  var sub = document.getElementById('timerSub');
  var fill = document.getElementById('timerBarFill');
  var label = document.getElementById('timerLabel');
  var banner = document.getElementById('overtimeBanner');

  timerInterval = setInterval(function() {
    var elapsed = Date.now() - timerStartMs;
    var remaining = timerDurationMs - elapsed;

    if (remaining > 0) {
      // counting down
      var pct = (remaining / timerDurationMs) * 100;
      var mm = Math.floor(remaining / 60000);
      var ss = Math.floor((remaining % 60000) / 1000);
      setText('timerDisplay', pad(mm) + ':' + pad(ss));
      setText('timerSub', 'Pick up by ' + pickupTime(timerStartMs + timerDurationMs));
      if (fill) { fill.style.width = pct + '%'; fill.classList.remove('overtime'); }
      if (display) display.classList.remove('overtime');
      if (label) label.textContent = 'Time remaining';
      if (banner) banner.classList.add('hidden');
    } else {
      // overtime
      var overMs = Math.abs(remaining);
      var currentSlot = Math.floor(overMs / (30 * 60000));
      var newCharges = (currentSlot + 1) * 80;

      if (newCharges > overtimeCharges) {
        overtimeCharges = newCharges;
        b.total = (b.total || 0) + 80;
        // update allBookings total
        allBookings[activeBookingIndex].total = b.total;
      }

      var slotMs = overMs % (30 * 60000);
      var slotRemaining = (30 * 60000) - slotMs;
      var mm = Math.floor(slotRemaining / 60000);
      var ss = Math.floor((slotRemaining % 60000) / 1000);

      setText('timerDisplay', '+' + pad(Math.floor(overMs / 60000)) + ':' + pad(Math.floor((overMs % 60000) / 1000)));
      setText('timerSub', 'Please pick up your pup');
      setText('otSubText', '₱' + overtimeCharges + ' charged · next in ' + pad(mm) + ':' + pad(ss));
      setText('otTotal', '+₱' + overtimeCharges);
      if (fill) { fill.style.width = '100%'; fill.classList.add('overtime'); }
      if (display) display.classList.add('overtime');
      if (label) label.textContent = 'Overtime';
      if (banner) banner.classList.remove('hidden');
    }
  }, 1000);
}

function buildFeedingSchedule(b) {
  var list = document.getElementById('feedingSchedule');
  if (!list) return;
  var checkIn = b.checkInTime || Date.now();
  var durMs = (b.durationMinutes || 30) * 60000;
  var midpoint = checkIn + (durMs / 2);
  var quarter = checkIn + (durMs / 4);
  var threeQ = checkIn + (durMs * 3 / 4);

  var schedule = [
    { time: checkIn,     label: '💧 Fresh water provided',    type: 'water' },
    { time: quarter,     label: '🥣 First feeding check',      type: 'food' },
    { time: midpoint,    label: '💧 Water refill',             type: 'water' },
    { time: threeQ,      label: '🍖 Snack / second feeding',   type: 'food' },
    { time: checkIn + durMs, label: '🏁 Pick-up time',         type: 'pickup' }
  ];

  var now = Date.now();
  list.innerHTML = schedule.map(function(s) {
    var done = now > s.time + 60000;
    var due = !done && Math.abs(now - s.time) < 5 * 60000;
    var cls = done ? 'feed-item done' : due ? 'feed-item due' : 'feed-item';
    var icon = done ? '✅' : due ? '🔔' : '⏳';
    var timeStr = formatTime(s.time);
    var remindBtn = due && s.type !== 'pickup'
      ? '<button class="feed-remind-btn" onclick="remindStaff(this)">Remind staff</button>'
      : '';
    return '<div class="' + cls + '">' +
      '<div class="feed-time">' + timeStr + '</div>' +
      '<div class="feed-desc">' + s.label + '</div>' +
      remindBtn +
      '<div class="feed-status">' + icon + '</div>' +
    '</div>';
  }).join('');
}

function remindStaff(btn) {
  btn.textContent = 'Sent ✓';
  btn.style.background = 'var(--green)';
  btn.disabled = true;
}

// ── SNACK MODAL ──
function showSnackModal() {
  snackCart = { count: 0, total: 0 };
  updateCartRow();
  // reset add buttons
  document.querySelectorAll('.snack-add-btn').forEach(function(btn) {
    btn.textContent = '+';
    btn.classList.remove('added');
  });
  var m = document.getElementById('snackModal');
  if (m) m.classList.remove('hidden');
}

function hideSnackModal() {
  var m = document.getElementById('snackModal');
  if (m) m.classList.add('hidden');
}

function addSnack(idx, price) {
  snackCart.count++;
  snackCart.total += price;
  updateCartRow();
  var btns = document.querySelectorAll('.snack-add-btn');
  if (btns[idx]) {
    btns[idx].textContent = '✓';
    btns[idx].classList.add('added');
  }
}

function updateCartRow() {
  var row = document.getElementById('snackCartRow');
  var lbl = document.getElementById('snackCartLabel');
  if (!row) return;
  if (snackCart.count > 0) {
    row.classList.remove('hidden');
    if (lbl) lbl.textContent = snackCart.count + ' item' + (snackCart.count > 1 ? 's' : '') + ' · ₱' + snackCart.total;
  } else {
    row.classList.add('hidden');
  }
}

function confirmSnackOrder() {
  hideSnackModal();
  if (activeBookingIndex >= 0) {
    allBookings[activeBookingIndex].total += snackCart.total;
  }
  snackCart = { count: 0, total: 0 };
  // show brief toast
  showToast('🦴 Snack ordered! On its way to ' + (allBookings[activeBookingIndex] ? allBookings[activeBookingIndex].pet : 'your pup'));
}

// ── CCTV MODAL ──
function showCCTVModal() {
  var m = document.getElementById('cctvModal');
  if (m) m.classList.remove('hidden');
  startCCTVClock();
}
function hideCCTVModal() {
  var m = document.getElementById('cctvModal');
  if (m) m.classList.add('hidden');
  if (cctvInterval) { clearInterval(cctvInterval); cctvInterval = null; }
}
function startCCTVClock() {
  var el = document.getElementById('cctvTime');
  if (!el) return;
  if (cctvInterval) clearInterval(cctvInterval);
  cctvInterval = setInterval(function() {
    var n = new Date();
    el.textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds());
  }, 1000);
}

// ── TOAST ──
function showToast(msg) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1A1A2E;color:white;padding:12px 20px;border-radius:999px;font-size:13px;font-weight:600;font-family:Nunito,sans-serif;z-index:999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:toastIn 0.3s ease';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
}

// ── HELPERS ──
function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}
function val(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}
function addClass(id, cls) {
  var el = document.getElementById(id);
  if (el) el.classList.add(cls);
}
function rmClass(id, cls) {
  var el = document.getElementById(id);
  if (el) el.classList.remove(cls);
}
function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}
function pickupTime(ms) {
  var d = new Date(ms);
  var h = d.getHours();
  var m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + pad(m) + ' ' + ampm;
}
function formatTime(ms) {
  var d = new Date(ms);
  var h = d.getHours();
  var m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + pad(m) + ' ' + ampm;
}

var booking = {
  station: 'SM North Edsa',
  dogName: '',
  dogSize: 'S',
  petNotes: '',
  duration: '30 mins',
  durationPrice: 80,
  food: 'Station food (+₱50)',
  foodPrice: 50,
  dropDate: '',
  dropTime: '',
  pickTime: '',
  payment: 'payGcash'
};

var allBookings = [];
var cctvInterval = null;

// ── SCREEN TRANSITIONS ──
function showScreen(id) {
  var current = document.querySelector('.screen.active');
  var target = document.getElementById(id);
  if (!target || current === target) return;

  if (current) {
    current.classList.add('exit');
    current.classList.remove('active');
    setTimeout(function() {
      current.classList.remove('exit');
    }, 300);
  }

  setTimeout(function() {
    target.classList.add('active');
  }, 40);

  if (id === 'screen-bookings') renderBookings();
}

// ── SPLASH → HOME ──
window.addEventListener('load', function() {
  setTimeout(function() {
    showScreen('screen-home');
  }, 2500);
});

// ── HOME ──
function toggleMapView() {
  var list = document.getElementById('listView');
  var map = document.getElementById('mapView');
  var btn = document.getElementById('mapToggleBtn');
  if (!list || !map) return;
  if (list.classList.contains('hidden')) {
    list.classList.remove('hidden');
    map.classList.add('hidden');
    btn.textContent = '🗺 Map';
  } else {
    list.classList.add('hidden');
    map.classList.remove('hidden');
    btn.textContent = '📋 List';
  }
}

// ── STATION DETAIL ──
function showStationDetail(name) {
  booking.station = name;
  var icons = { 'SM North Edsa': '🏪', 'Trinoma': '🏬', 'Robinsons Galleria': '🛍️' };
  var slots = { 'SM North Edsa': '4 slots open', 'Trinoma': '2 slots open', 'Robinsons Galleria': '6 slots open' };

  var titleEl = document.getElementById('stationTitle');
  var nameEl = document.getElementById('stationDetailName');
  var slotsEl = document.getElementById('stationSlots');
  var iconEl = document.getElementById('detailIcon');

  if (titleEl) titleEl.textContent = 'PawPark ' + name;
  if (nameEl) nameEl.textContent = 'PawPark ' + name;
  if (slotsEl) slotsEl.textContent = slots[name] || '—';
  if (iconEl) iconEl.textContent = icons[name] || '🏪';

  showScreen('screen-station');
}

// ── BOOKING FLOW ──
function startBooking() {
  showScreen('screen-book1');
}

function goStep(n) {
  if (n === 6) buildSummary();
  showScreen('screen-book' + n);
}

// Step 1
function selectStation(name, optId) {
  booking.station = name;
  ['bsOpt1', 'bsOpt2', 'bsOpt3'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });
  var el = document.getElementById(optId);
  if (el) el.classList.add('selected');
}

// Step 2
function selectSize(sz) {
  booking.dogSize = sz;
  var map = { S: 'szS', M: 'szM', L: 'szL' };
  ['szS', 'szM', 'szL'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('sel');
  });
  var el = document.getElementById(map[sz]);
  if (el) el.classList.add('sel');
}

function handlePhoto(input) {
  if (input.files && input.files[0]) {
    var lbl = document.getElementById('photoLabel');
    if (lbl) lbl.textContent = '✅  ' + input.files[0].name;
  }
}

// Step 3
function selectDur(label, price, optId) {
  booking.duration = label;
  booking.durationPrice = price;
  ['dur30', 'dur60', 'dur120', 'durCustom'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('sel');
  });
  var el = document.getElementById(optId);
  if (el) el.classList.add('sel');
  var wrap = document.getElementById('customWrap');
  if (wrap) {
    if (optId === 'durCustom') wrap.classList.remove('hidden');
    else wrap.classList.add('hidden');
  }
}

function calcCustom(val) {
  var m = parseInt(val) || 0;
  booking.duration = m + ' mins';
  booking.durationPrice = Math.round(m * 2.5);
}

// Step 4
function selectFood(label, price, optId) {
  booking.food = label;
  booking.foodPrice = price;
  var opts = ['foodStation', 'foodTreats', 'foodOwn', 'foodNone'];
  var dots = ['fdStation', 'fdTreats', 'fdOwn', 'fdNone'];
  opts.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('sel');
  });
  dots.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('sel-dot');
  });
  var selEl = document.getElementById(optId);
  if (selEl) selEl.classList.add('sel');
  var dotId = optId.replace('food', 'fd');
  var dotEl = document.getElementById(dotId);
  if (dotEl) dotEl.classList.add('sel-dot');
}

// Step 6 summary
function buildSummary() {
  var dogNameEl = document.getElementById('dogName');
  var petNotesEl = document.getElementById('petNotes');
  var dropDateEl = document.getElementById('dropDate');
  var dropTimeEl = document.getElementById('dropTime');
  var pickTimeEl = document.getElementById('pickTime');

  booking.dogName = dogNameEl ? dogNameEl.value : '';
  booking.petNotes = petNotesEl ? petNotesEl.value : '';
  booking.dropDate = dropDateEl ? dropDateEl.value : '';
  booking.dropTime = dropTimeEl ? dropTimeEl.value : '';
  booking.pickTime = pickTimeEl ? pickTimeEl.value : '';

  var petLabel = (booking.dogName || 'Your dog') + ' · ' + ({ S: 'Small', M: 'Medium', L: 'Large' }[booking.dogSize] || '');
  var schedLabel = booking.dropDate && booking.dropTime
    ? booking.dropDate + ' @ ' + booking.dropTime
    : '—';

  var s = document.getElementById('sumStation');
  var p = document.getElementById('sumPet');
  var d = document.getElementById('sumDur');
  var f = document.getElementById('sumFood');
  var sc = document.getElementById('sumSchedule');
  var t = document.getElementById('sumTotal');

  if (s) s.textContent = 'PawPark ' + booking.station;
  if (p) p.textContent = petLabel;
  if (d) d.textContent = booking.duration;
  if (f) f.textContent = booking.food;
  if (sc) sc.textContent = schedLabel;
  if (t) t.textContent = '₱' + (booking.durationPrice + booking.foodPrice);
}

function selectPay(optId) {
  booking.payment = optId;
  ['payGcash', 'payMaya', 'payCash'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('sel');
  });
  var el = document.getElementById(optId);
  if (el) el.classList.add('sel');
}

// ── CONFIRM ──
function confirmBooking() {
  var dogNameEl = document.getElementById('dogName');
  var dropDateEl = document.getElementById('dropDate');
  var dropTimeEl = document.getElementById('dropTime');

  booking.dogName = dogNameEl ? (dogNameEl.value || 'Your pup') : 'Your pup';
  booking.dropDate = dropDateEl ? dropDateEl.value : '';
  booking.dropTime = dropTimeEl ? dropTimeEl.value : '';

  var id = '#PP-' + Math.floor(10000 + Math.random() * 90000);
  var idEl = document.getElementById('bookingId');
  if (idEl) idEl.textContent = id;

  allBookings.unshift({
    id: id,
    station: 'PawPark ' + booking.station,
    pet: booking.dogName,
    duration: booking.duration,
    date: booking.dropDate,
    time: booking.dropTime,
    total: booking.durationPrice + booking.foodPrice,
    status: 'Confirmed'
  });

  showScreen('screen-confirm');

  // re-trigger confirm animation
  var paw = document.getElementById('confirmPaw');
  if (paw) {
    paw.style.animation = 'none';
    void paw.offsetWidth;
    paw.style.animation = '';
  }
}

// ── CCTV MODAL ──
function showCCTVModal() {
  var modal = document.getElementById('cctvModal');
  if (modal) modal.classList.remove('hidden');
  startCCTVClock();
}

function hideCCTVModal() {
  var modal = document.getElementById('cctvModal');
  if (modal) modal.classList.add('hidden');
  if (cctvInterval) { clearInterval(cctvInterval); cctvInterval = null; }
}

function startCCTVClock() {
  var el = document.getElementById('cctvTime');
  if (!el) return;
  if (cctvInterval) clearInterval(cctvInterval);
  cctvInterval = setInterval(function() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    el.textContent = h + ':' + m + ':' + s;
  }, 1000);
}

// ── MY BOOKINGS ──
function renderBookings() {
  var list = document.getElementById('bookingsList');
  var empty = document.getElementById('noBookings');
  if (!list) return;

  if (!allBookings.length) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  list.innerHTML = allBookings.map(function(b) {
    return '<div class="booking-item">' +
      '<div class="bi-hdr">' +
        '<span class="bi-name">' + b.station + '</span>' +
        '<span class="bi-status ok">' + b.status + '</span>' +
      '</div>' +
      '<div class="bi-row">🐶 ' + b.pet + ' &nbsp;·&nbsp; ' + b.duration + '</div>' +
      (b.date ? '<div class="bi-row">📅 ' + b.date + (b.time ? ' @ ' + b.time : '') + '</div>' : '') +
      '<div class="bi-row">💰 ₱' + b.total + ' &nbsp;·&nbsp; ' + b.id + '</div>' +
    '</div>';
  }).join('');
}
