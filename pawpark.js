// ===== STATE =====
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

// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
  var screens = document.querySelectorAll('.screen');
  var target = document.getElementById(id);
  screens.forEach(function(s) {
    if (s.classList.contains('active')) {
      s.classList.add('slide-out');
      s.classList.remove('active');
      setTimeout(function() { s.classList.remove('slide-out'); }, 260);
    }
  });
  setTimeout(function() {
    target.classList.add('active');
  }, 30);
}

// ===== SPLASH → HOME =====
window.addEventListener('load', function() {
  setTimeout(function() {
    showScreen('screen-home');
  }, 2400);
});

// ===== HOME =====
function toggleMapView() {
  var list = document.getElementById('listView');
  var map = document.getElementById('mapView');
  var btn = document.getElementById('mapToggleBtn');
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

// ===== STATION DETAIL =====
function showStationDetail(name) {
  booking.station = name;
  var icons = { 'SM North Edsa': '🏪', 'Trinoma': '🏬', 'Robinsons Galleria': '🛍️' };
  var slots = { 'SM North Edsa': '4 slots open', 'Trinoma': '2 slots open', 'Robinsons Galleria': '6 slots open' };
  document.getElementById('stationTitle').textContent = 'PawPark ' + name;
  document.getElementById('stationDetailName').textContent = 'PawPark ' + name;
  document.getElementById('stationSlots').textContent = slots[name] || '—';
  document.querySelector('.station-photo-icon').textContent = icons[name] || '🏪';
  showScreen('screen-station');
}

// ===== BOOKING FLOW =====
function startBooking() {
  showScreen('screen-book1');
}

function goStep(step) {
  if (step === 6) { buildSummary(); }
  showScreen('screen-book' + step);
}

// Step 1 — station select
function selectStation(name, optId) {
  booking.station = name;
  var opts = ['bsOpt1', 'bsOpt2', 'bsOpt3'];
  opts.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.remove('selected');
    }
  });
  var sel = document.getElementById(optId);
  if (sel) sel.classList.add('selected');
}

// Step 2 — pet details
function selectSize(size) {
  booking.dogSize = size;
  ['szS', 'szM', 'szL'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });
  var map = { 'S': 'szS', 'M': 'szM', 'L': 'szL' };
  var el = document.getElementById(map[size]);
  if (el) el.classList.add('selected');
}

function handlePhoto(input) {
  if (input.files && input.files[0]) {
    document.getElementById('photoLabel').textContent = '✅ ' + input.files[0].name;
  }
}

// Step 3 — duration
function selectDur(label, price, optId) {
  booking.duration = label;
  booking.durationPrice = price;
  ['dur30', 'dur60', 'dur120', 'durCustom'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });
  var el = document.getElementById(optId);
  if (el) el.classList.add('selected');
  var wrap = document.getElementById('customTimeWrap');
  if (optId === 'durCustom') {
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
  }
}

function calcCustom(mins) {
  var m = parseInt(mins) || 0;
  var price = Math.round(m * 2.5);
  booking.duration = m + ' mins';
  booking.durationPrice = price;
}

// Step 4 — food
function selectFood(label, price, optId) {
  booking.food = label;
  booking.foodPrice = price;
  var foodOpts = ['foodStation', 'foodTreats', 'foodOwn', 'foodNone'];
  var radios = ['fradStation', 'fradTreats', 'fradOwn', 'fradNone'];
  foodOpts.forEach(function(id, i) {
    var el = document.getElementById(id);
    var rad = document.getElementById(radios[i]);
    if (el) el.classList.remove('selected');
    if (rad) { rad.textContent = '○'; rad.classList.remove('selected-radio'); }
  });
  var sel = document.getElementById(optId);
  if (sel) sel.classList.add('selected');
  var radId = optId.replace('food', 'frad');
  var rad = document.getElementById(radId);
  if (rad) { rad.textContent = '●'; rad.classList.add('selected-radio'); }
}

// Step 6 — summary
function buildSummary() {
  booking.dogName = (document.getElementById('dogName') || {}).value || '';
  booking.petNotes = (document.getElementById('petNotes') || {}).value || '';
  booking.dropDate = (document.getElementById('dropDate') || {}).value || '';
  booking.dropTime = (document.getElementById('dropTime') || {}).value || '';
  booking.pickTime = (document.getElementById('pickTime') || {}).value || '';

  document.getElementById('sumStation').textContent = 'PawPark ' + booking.station;
  var petLabel = booking.dogName ? booking.dogName + ' (' + booking.dogSize + ')' : booking.dogSize + ' dog';
  document.getElementById('sumPet').textContent = petLabel;
  document.getElementById('sumDur').textContent = booking.duration;
  document.getElementById('sumFood').textContent = booking.food;
  var sched = booking.dropDate && booking.dropTime ? booking.dropDate + ' @ ' + booking.dropTime : '—';
  document.getElementById('sumSchedule').textContent = sched;
  var total = booking.durationPrice + booking.foodPrice;
  document.getElementById('sumTotal').textContent = '₱' + total;
}

function selectPay(optId) {
  booking.payment = optId;
  ['payGcash', 'payMaya', 'payCash'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });
  var el = document.getElementById(optId);
  if (el) el.classList.add('selected');
}

// ===== CONFIRM BOOKING =====
function confirmBooking() {
  booking.dogName = (document.getElementById('dogName') || {}).value || 'Your pup';
  booking.dropDate = (document.getElementById('dropDate') || {}).value || '';
  booking.dropTime = (document.getElementById('dropTime') || {}).value || '';
  booking.pickTime = (document.getElementById('pickTime') || {}).value || '';

  var id = '#PP-' + Math.floor(10000 + Math.random() * 90000);
  document.getElementById('bookingId').textContent = id;

  allBookings.unshift({
    id: id,
    station: 'PawPark ' + booking.station,
    pet: booking.dogName || 'Dog',
    duration: booking.duration,
    date: booking.dropDate,
    time: booking.dropTime,
    total: booking.durationPrice + booking.foodPrice,
    status: 'Confirmed'
  });

  showScreen('screen-confirm');
  var anim = document.getElementById('confirmAnim');
  anim.style.animation = 'none';
  void anim.offsetHeight;
  anim.style.animation = '';
}

// ===== MY BOOKINGS =====
function renderBookings() {
  var list = document.getElementById('bookingsList');
  var empty = document.getElementById('noBookings');
  if (!allBookings.length) {
    if (list) list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (list) {
    list.innerHTML = allBookings.map(function(b) {
      return '<div class="booking-item">' +
        '<div class="bi-header">' +
          '<span class="bi-name">' + b.station + '</span>' +
          '<span class="bi-status confirmed">' + b.status + '</span>' +
        '</div>' +
        '<div class="bi-row">🐶 ' + b.pet + ' · ' + b.duration + '</div>' +
        (b.date ? '<div class="bi-row">📅 ' + b.date + (b.time ? ' @ ' + b.time : '') + '</div>' : '') +
        '<div class="bi-row">💰 ₱' + b.total + ' · ' + b.id + '</div>' +
      '</div>';
    }).join('');
  }
}

// Hook bookings render on screen show
var origShowScreen = showScreen;
showScreen = function(id) {
  if (id === 'screen-bookings') { renderBookings(); }
  origShowScreen(id);
};
