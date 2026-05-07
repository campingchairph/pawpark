// ══════════════════════════════════
//  PAWPARK · app logic
// ══════════════════════════════════

var booking = {
  station: 'SM North Edsa',
  dogName: '', dogSize: 'S', petNotes: '',
  duration: '30 mins', durationMinutes: 30, durationPrice: 80,
  food: 'Station food (+₱50)', foodPrice: 50,
  dropDate: '', dropTime: '', pickTime: '', payment: 'payGcash'
};

var allBookings = [];
var activeBookingIndex = -1;
var timerInterval = null;
var overtimeCharges = 0;
var cctvInterval = null;
var snackCart = { count: 0, total: 0 };
var leafletMap = null;
var searchDebounce = null;

// ── SCREENS ──
function showScreen(id) {
  var cur = document.querySelector('.screen.active');
  var tgt = document.getElementById(id);
  if (!tgt || cur === tgt) return;
  if (cur) { cur.classList.add('exit'); cur.classList.remove('active'); setTimeout(function() { cur.classList.remove('exit'); }, 320); }
  setTimeout(function() { tgt.classList.add('active'); }, 40);
  if (id === 'screen-bookings') renderBookings();
  if (id === 'screen-home') setTimeout(maybeInitMap, 100);
}

// ── SPLASH ──
window.addEventListener('load', function() {
  setTimeout(function() { showScreen('screen-home'); }, 2500);
});

// ══════════════════════════════════
//  LEAFLET MAP + SEARCH
// ══════════════════════════════════
var stations = [
  { name: 'PawPark SM North', lat: 14.6565, lng: 121.0321, slots: 4, hours: '8am–10pm', color: '#F0615A' },
  { name: 'PawPark Trinoma',  lat: 14.6576, lng: 121.0381, slots: 2, hours: '9am–9pm',  color: '#F5B800' },
  { name: 'PawPark Robinsons',lat: 14.6329, lng: 121.0567, slots: 6, hours: '10am–9pm', color: '#F0615A' }
];

var stationKeys = ['SM North Edsa', 'Trinoma', 'Robinsons Galleria'];

function maybeInitMap() {
  if (leafletMap) { leafletMap.invalidateSize(); return; }
  var el = document.getElementById('leafletMap');
  if (!el || typeof L === 'undefined') return;

  leafletMap = L.map('leafletMap', { zoomControl: false, attributionControl: false })
    .setView([14.6450, 121.0400], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(leafletMap);

  L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

  stations.forEach(function(s, i) {
    var icon = L.divIcon({
      className: '',
      html: '<div style="background:' + s.color + ';width:32px;height:32px;border-radius:50% 50% 50% 0;border:2.5px solid white;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);"><span style="transform:rotate(45deg);font-size:14px;">🐾</span></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
    var marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(leafletMap);
    marker.bindPopup(
      '<div style="font-family:Nunito,sans-serif;min-width:140px;">' +
      '<div style="font-weight:800;font-size:14px;color:#1A0A00;">' + s.name + '</div>' +
      '<div style="font-size:11px;color:#B07A2A;margin:2px 0 6px;">📍 ' + s.hours + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:#16A34A;margin-bottom:8px;">🟢 ' + s.slots + ' slots open</div>' +
      '<button onclick="bookFromMap(' + i + ')" style="background:#F0615A;color:white;border:none;border-radius:999px;padding:7px 14px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer;width:100%;">Book this station</button>' +
      '</div>'
    );
  });
}

function bookFromMap(i) {
  booking.station = stationKeys[i];
  updateStationOpts(i);
  showScreen('screen-book1');
}

function updateStationOpts(idx) {
  ['bsOpt1','bsOpt2','bsOpt3'].forEach(function(id) { rmClass(id,'selected'); });
  addClass('bsOpt' + (idx + 1), 'selected');
}

function toggleMapView() {
  var list = document.getElementById('listView');
  var map = document.getElementById('mapView');
  var btn = document.getElementById('mapToggleBtn');
  if (!list || !map) return;
  if (list.classList.contains('hidden')) {
    list.classList.remove('hidden');
    map.classList.add('hidden');
    btn.textContent = '🗺️ Map';
  } else {
    list.classList.add('hidden');
    map.classList.remove('hidden');
    btn.textContent = '📋 List';
    setTimeout(maybeInitMap, 80);
  }
}

// Nominatim search
function debounceSearch(val) {
  var clearBtn = document.getElementById('mapSearchClear');
  if (clearBtn) { val.length > 0 ? clearBtn.classList.remove('hidden') : clearBtn.classList.add('hidden'); }
  if (searchDebounce) clearTimeout(searchDebounce);
  if (val.length < 2) { hideSuggestions(); return; }
  searchDebounce = setTimeout(function() { fetchSuggestions(val); }, 400);
}

function fetchSuggestions(q) {
  var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + encodeURIComponent(q) + '&countrycodes=ph';
  fetch(url, { headers: { 'Accept-Language': 'en' } })
    .then(function(r) { return r.json(); })
    .then(function(data) { showSuggestions(data); })
    .catch(function() { hideSuggestions(); });
}

function showSuggestions(results) {
  var box = document.getElementById('searchSuggestions');
  if (!box) return;
  if (!results.length) { hideSuggestions(); return; }
  box.innerHTML = results.map(function(r) {
    var short = r.display_name.split(',').slice(0,3).join(', ');
    return '<div class="search-suggestion" onclick="flyToResult(' + r.lat + ',' + r.lon + ',\'' + short.replace(/'/g,"&apos;") + '\')">' +
      '<span class="search-suggestion-ico">📍</span>' + short + '</div>';
  }).join('');
  box.classList.remove('hidden');
}

function hideSuggestions() {
  var box = document.getElementById('searchSuggestions');
  if (box) box.classList.add('hidden');
}

function flyToResult(lat, lon, name) {
  hideSuggestions();
  var inp = document.getElementById('mapSearchInput');
  if (inp) inp.value = name;
  if (leafletMap) leafletMap.flyTo([parseFloat(lat), parseFloat(lon)], 15, { duration: 1.2 });
}

function clearMapSearch() {
  var inp = document.getElementById('mapSearchInput');
  if (inp) inp.value = '';
  hideSuggestions();
  var clearBtn = document.getElementById('mapSearchClear');
  if (clearBtn) clearBtn.classList.add('hidden');
  if (leafletMap) leafletMap.flyTo([14.6450, 121.0400], 13, { duration: 1 });
}

// ── STATION DETAIL ──
function showStationDetail(name) {
  booking.station = name;
  var icons = { 'SM North Edsa':'🏪', 'Trinoma':'🏬', 'Robinsons Galleria':'🛍️' };
  var slots = { 'SM North Edsa':'4 slots open', 'Trinoma':'2 slots open', 'Robinsons Galleria':'6 slots open' };
  setText('stationTitle', 'PawPark ' + name);
  setText('stationDetailName', 'PawPark ' + name);
  setText('stationSlots', slots[name] || '—');
  setText('detailIcon', icons[name] || '🏪');
  showScreen('screen-station');
}

// ── BOOKING FLOW ──
function startBooking() { showScreen('screen-book1'); }
function goStep(n) { if (n === 6) buildSummary(); showScreen('screen-book' + n); }

function selectStation(name, optId) {
  booking.station = name;
  ['bsOpt1','bsOpt2','bsOpt3'].forEach(function(id) { rmClass(id,'selected'); });
  addClass(optId,'selected');
}

function selectSize(sz) {
  booking.dogSize = sz;
  var m = { S:'szS', M:'szM', L:'szL' };
  ['szS','szM','szL'].forEach(function(id) { rmClass(id,'sel'); });
  addClass(m[sz],'sel');
}

function handlePhoto(input) {
  if (input.files && input.files[0]) setText('photoLabel','✅  ' + input.files[0].name);
}

function selectDur(label, price, mins, optId) {
  booking.duration = label; booking.durationPrice = price; booking.durationMinutes = mins;
  ['dur30','dur60','dur120','durCustom'].forEach(function(id) { rmClass(id,'sel'); });
  addClass(optId,'sel');
  var wrap = document.getElementById('customWrap');
  if (wrap) { optId === 'durCustom' ? wrap.classList.remove('hidden') : wrap.classList.add('hidden'); }
}

function calcCustom(v) {
  var m = parseInt(v) || 0;
  booking.duration = m + ' mins'; booking.durationMinutes = m; booking.durationPrice = Math.round(m * 2.5);
}

function selectFood(label, price, optId) {
  booking.food = label; booking.foodPrice = price;
  ['foodStation','foodTreats','foodOwn','foodNone'].forEach(function(id) { rmClass(id,'sel'); });
  ['fdStation','fdTreats','fdOwn','fdNone'].forEach(function(id) { rmClass(id,'sel-dot'); });
  addClass(optId,'sel');
  addClass(optId.replace('food','fd'),'sel-dot');
}

function selectPay(optId) {
  booking.payment = optId;
  ['payGcash','payMaya','payCash'].forEach(function(id) { rmClass(id,'sel'); });
  addClass(optId,'sel');
}

function buildSummary() {
  booking.dogName = val('dogName'); booking.dropDate = val('dropDate');
  booking.dropTime = val('dropTime'); booking.pickTime = val('pickTime');
  var pet = (booking.dogName || 'Your dog') + ' · ' + ({S:'Small',M:'Medium',L:'Large'}[booking.dogSize] || '');
  var sched = booking.dropDate && booking.dropTime ? booking.dropDate + ' @ ' + booking.dropTime : '—';
  setText('sumStation','PawPark ' + booking.station);
  setText('sumPet', pet); setText('sumDur', booking.duration);
  setText('sumFood', booking.food); setText('sumSchedule', sched);
  setText('sumTotal','₱' + (booking.durationPrice + booking.foodPrice));
}

// ── CONFIRM ──
function confirmBooking() {
  booking.dogName = val('dogName') || 'Your pup';
  booking.dropDate = val('dropDate'); booking.dropTime = val('dropTime');
  var id = '#PP-' + Math.floor(10000 + Math.random() * 90000);
  setText('bookingId', id);
  allBookings.unshift({
    id: id, station: 'PawPark ' + booking.station,
    pet: booking.dogName, duration: booking.duration,
    durationMinutes: booking.durationMinutes || 30,
    date: booking.dropDate, time: booking.dropTime,
    food: booking.food, total: booking.durationPrice + booking.foodPrice,
    status: 'Confirmed', checkedIn: false
  });
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
    var statusHtml = isActive
      ? '<span class="bi-status active-st">🟢 Active</span>'
      : '<span class="bi-status ok">' + b.status + '</span>';
    var actionBtn = isActive
      ? '<button class="bi-action-btn" onclick="openActiveBooking(' + i + ')">View live stay 📹</button>'
      : '<button class="bi-checkin-btn" onclick="simulateCheckIn(' + i + ')">Simulate check-in ✓</button>';
    return '<div class="booking-glass">' +
      '<div class="bi-hdr"><span class="bi-name">' + b.station + '</span>' + statusHtml + '</div>' +
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

// ── ACTIVE BOOKING ──
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
  overtimeCharges = 0;
  var durMs = (b.durationMinutes || 30) * 60000;
  var startMs = b.checkInTime || Date.now();

  timerInterval = setInterval(function() {
    var elapsed = Date.now() - startMs;
    var remaining = durMs - elapsed;
    var display = document.getElementById('timerDisplay');
    var fill = document.getElementById('timerBarFill');
    var banner = document.getElementById('overtimeBanner');

    if (remaining > 0) {
      var pct = (remaining / durMs) * 100;
      setText('timerDisplay', pad(Math.floor(remaining/60000)) + ':' + pad(Math.floor((remaining%60000)/1000)));
      setText('timerSub', 'Pick up by ' + pickupTime(startMs + durMs));
      setText('timerLabel', 'Time remaining');
      if (fill) { fill.style.width = pct + '%'; fill.classList.remove('overtime'); }
      if (display) display.classList.remove('overtime');
      if (banner) banner.classList.add('hidden');
    } else {
      var overMs = Math.abs(remaining);
      var newCharges = (Math.floor(overMs / (30 * 60000)) + 1) * 80;
      if (newCharges > overtimeCharges) {
        overtimeCharges = newCharges;
        allBookings[activeBookingIndex].total = (allBookings[activeBookingIndex].total || 0) + 80;
      }
      var slotRemaining = (30 * 60000) - (overMs % (30 * 60000));
      setText('timerDisplay', '+' + pad(Math.floor(overMs/60000)) + ':' + pad(Math.floor((overMs%60000)/1000)));
      setText('timerSub', 'Please pick up your pup');
      setText('timerLabel', 'Overtime');
      setText('otSubText', '₱' + overtimeCharges + ' charged · next in ' + pad(Math.floor(slotRemaining/60000)) + ':' + pad(Math.floor((slotRemaining%60000)/1000)));
      setText('otTotal', '+₱' + overtimeCharges);
      if (fill) { fill.style.width = '100%'; fill.classList.add('overtime'); }
      if (display) display.classList.add('overtime');
      if (banner) banner.classList.remove('hidden');
    }
  }, 1000);
}

function buildFeedingSchedule(b) {
  var list = document.getElementById('feedingSchedule');
  if (!list) return;
  var start = b.checkInTime || Date.now();
  var dur = (b.durationMinutes || 30) * 60000;
  var schedule = [
    { t: start,           label: '💧 Fresh water provided' },
    { t: start + dur*.25, label: '🥣 First feeding check' },
    { t: start + dur*.5,  label: '💧 Water refill' },
    { t: start + dur*.75, label: '🍖 Snack / second feeding' },
    { t: start + dur,     label: '🏁 Pick-up time' }
  ];
  var now = Date.now();
  list.innerHTML = schedule.map(function(s) {
    var done = now > s.t + 60000;
    var due = !done && Math.abs(now - s.t) < 5 * 60000;
    var cls = done ? 'feed-item done' : due ? 'feed-item due' : 'feed-item';
    var ico = done ? '✅' : due ? '🔔' : '⏳';
    var btn = (due && s.label !== '🏁 Pick-up time')
      ? '<button class="remind-btn" onclick="remindStaff(this)">Remind staff</button>' : '';
    return '<div class="' + cls + '"><div class="feed-time">' + formatTime(s.t) + '</div>' +
      '<div class="feed-desc">' + s.label + '</div>' + btn +
      '<div class="feed-status">' + ico + '</div></div>';
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
  document.querySelectorAll('.snack-add').forEach(function(btn) { btn.textContent = '+'; btn.classList.remove('added'); });
  var cr = document.getElementById('snackCartRow');
  if (cr) cr.classList.add('hidden');
  var m = document.getElementById('snackModal');
  if (m) m.classList.remove('hidden');
}

function hideSnackModal() {
  var m = document.getElementById('snackModal');
  if (m) m.classList.add('hidden');
}

function addSnack(idx, price) {
  snackCart.count++; snackCart.total += price;
  var btns = document.querySelectorAll('.snack-add');
  if (btns[idx]) { btns[idx].textContent = '✓'; btns[idx].classList.add('added'); }
  var cr = document.getElementById('snackCartRow');
  var lbl = document.getElementById('snackCartLabel');
  if (cr) cr.classList.remove('hidden');
  if (lbl) lbl.textContent = snackCart.count + ' item' + (snackCart.count > 1 ? 's' : '') + ' · ₱' + snackCart.total;
}

function confirmSnackOrder() {
  hideSnackModal();
  if (activeBookingIndex >= 0) allBookings[activeBookingIndex].total += snackCart.total;
  var pet = activeBookingIndex >= 0 ? allBookings[activeBookingIndex].pet : 'your pup';
  showToast('🦴 Snack ordered! On its way to ' + pet);
  snackCart = { count: 0, total: 0 };
}

// ── CCTV MODAL ──
function showCCTVModal() {
  var m = document.getElementById('cctvModal');
  if (m) m.classList.remove('hidden');
  var el = document.getElementById('cctvTime');
  if (!el) return;
  if (cctvInterval) clearInterval(cctvInterval);
  cctvInterval = setInterval(function() {
    var n = new Date();
    el.textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds());
  }, 1000);
}

function hideCCTVModal() {
  var m = document.getElementById('cctvModal');
  if (m) m.classList.add('hidden');
  if (cctvInterval) { clearInterval(cctvInterval); cctvInterval = null; }
}

// ── TOAST ──
function showToast(msg) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1A1A2E;color:white;padding:12px 20px;border-radius:999px;font-size:13px;font-weight:600;font-family:Nunito,sans-serif;z-index:999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:toastIn .3s ease';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
}

// ── HELPERS ──
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
function addClass(id, cls) { var el = document.getElementById(id); if (el) el.classList.add(cls); }
function rmClass(id, cls) { var el = document.getElementById(id); if (el) el.classList.remove(cls); }
function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2,'0'); }
function pickupTime(ms) { var d = new Date(ms); var h = d.getHours(); var m = d.getMinutes(); var ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(m) + ' ' + ap; }
function formatTime(ms) { return pickupTime(ms); }
