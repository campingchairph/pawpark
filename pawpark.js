// ══════════════════════════════════
//  PAWPARK — app logic
// ══════════════════════════════════

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
