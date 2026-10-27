const roomsData = [
  { id: 'garden', name: 'Garden Room', type: 'room', tag: 'A QUIET LITTLE RETREAT', price: 1800, capacity: 2, desc: 'A comfortable base for couples or solo travelers who want a restful reset.', amenities: ['🛏️ Cozy sleeping space', '❄️ Air-conditioned*', '🚿 Private bath*'], image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80' },
  { id: 'deluxe', name: 'Deluxe Escape', type: 'room', tag: 'A LITTLE EXTRA COMFORT', price: 2500, capacity: 3, desc: 'A little more room to stretch out, recharge, and enjoy time away.', amenities: ['🛏️ Spacious layout*', '❄️ Air-conditioned*', '☕ Relaxing corner*'], image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80' },
  { id: 'family', name: 'Family Haven', type: 'family', tag: 'MADE FOR TOGETHERNESS', price: 3800, capacity: 5, desc: 'A flexible family-style option for sharing stories and making memories.', amenities: ['👨‍👩‍👧‍👦 Family-friendly*', '🛏️ Multiple beds*', '🧳 Extra space*'], image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80' },
  { id: 'barkada', name: 'Barkada Stay', type: 'group', tag: 'BRING YOUR PEOPLE', price: 4800, capacity: 8, desc: 'A group-oriented sample option for friends and small celebrations.', amenities: ['👥 Group layout*', '🛏️ Shared stay*', '🎉 Gather together*'], image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80' },
  { id: 'suite', name: 'Signature Suite', type: 'family', tag: 'A SPECIAL OCCASION', price: 4200, capacity: 4, desc: 'A premium-style concept for celebrations and a memorable escape.', amenities: ['✨ Premium feel*', '🛋️ Lounge space*', '🌿 Restful atmosphere'], image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80' },
  { id: 'group', name: 'Group Retreat', type: 'group', tag: 'ROOM FOR THE WHOLE CREW', price: 6500, capacity: 10, desc: 'A larger sample option for bigger groups planning a shared getaway.', amenities: ['👥 Up to 10 guests*', '🧳 Flexible setup*', '🌴 Group getaway'], image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80' }
];

let activeFilter = 'all';
let selectedRoom = null;
const $ = id => document.getElementById(id);
const peso = amount => '₱' + Number(amount).toLocaleString('en-PH');

function localISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setupDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  $('checkin').min = localISO(today);
  $('checkout').min = localISO(tomorrow);
  $('checkin').value = localISO(today);
  $('checkout').value = localISO(tomorrow);
  $('mCheckin').min = localISO(today);
  $('mCheckout').min = localISO(tomorrow);
  $('mCheckin').value = localISO(today);
  $('mCheckout').value = localISO(tomorrow);
}

function renderRooms(list = roomsData) {
  const root = $('rooms');
  root.innerHTML = '';
  if (!list.length) {
    root.innerHTML = '<div class="empty">No sample accommodations match those filters. Try another stay type or fewer guests.</div>';
    return;
  }
  list.forEach(room => {
    const card = document.createElement('article');
    card.className = 'room-card';
    card.innerHTML = `<div class="room-photo" style="background-image:url('${room.image}')"><span class="room-tag">${room.tag}</span></div>
      <div class="room-body"><div class="room-title-line"><h3 class="room-title">${room.name}</h3><div class="price">${peso(room.price)}<small>sample / night</small></div></div>
      <p class="room-desc">${room.desc}</p><div class="amenities">${room.amenities.map(item => `<span>${item}</span>`).join('')}</div>
      <div class="room-foot"><span class="capacity">♙ Up to ${room.capacity} guests*</span><button class="btn btn-outline" data-book="${room.id}">Choose stay ↗</button></div></div>`;
    root.appendChild(card);
  });
  root.querySelectorAll('[data-book]').forEach(button => {
    button.addEventListener('click', () => openBooking(roomsData.find(room => room.id === button.dataset.book)));
  });
}

function applyFilters() {
  const guestCount = Number($('guests').value);
  renderRooms(roomsData.filter(room => (activeFilter === 'all' || room.type === activeFilter) && guestCount <= room.capacity));
}

function syncDateFields(source) {
  const checkinId = source === 'main' ? 'checkin' : 'mCheckin';
  const checkoutId = source === 'main' ? 'checkout' : 'mCheckout';
  const checkin = $(checkinId).value;
  const checkout = $(checkoutId).value;
  const nextDay = checkin ? new Date(`${checkin}T12:00:00`) : new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  $(checkoutId).min = checkin || localISO(nextDay);
  if (checkin && checkout && checkout <= checkin) $(checkoutId).value = localISO(nextDay);
  if (source === 'main') {
    $('mCheckin').value = $('checkin').value;
    $('mCheckout').value = $('checkout').value;
  } else {
    $('checkin').value = $('mCheckin').value;
    $('checkout').value = $('mCheckout').value;
  }
  updateSummary();
}

function openBooking(room) {
  selectedRoom = room || selectedRoom || roomsData[0];
  $('modalRoomName').textContent = `${selectedRoom.name} · sample rate ${peso(selectedRoom.price)} per night`;
  $('summaryRoom').textContent = selectedRoom.name;
  $('mGuests').value = $('guests').value;
  $('mCheckin').value = $('checkin').value;
  $('mCheckout').value = $('checkout').value;
  $('bookingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateSummary();
  setTimeout(() => $('guestName').focus(), 50);
}

function closeBooking() {
  $('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
}

function updateSummary() {
  if (!$('mCheckin').value || !$('mCheckout').value || !selectedRoom) return;
  const start = new Date(`${$('mCheckin').value}T12:00:00`);
  const end = new Date(`${$('mCheckout').value}T12:00:00`);
  const nights = Math.round((end - start) / 86400000);
  const roomCount = Number($('mRooms').value || 1);
  $('summaryDates').textContent = nights > 0 ? `${nights} night${nights === 1 ? '' : 's'} · ${$('mGuests').value} guest(s) · ${roomCount} room(s)` : 'Choose a check-out date after check-in.';
  $('summaryTotal').textContent = nights > 0 ? peso(nights * selectedRoom.price * roomCount) : '₱—';
}

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3300);
}

$('filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
  applyFilters();
});

$('searchBtn').addEventListener('click', () => {
  syncDateFields('main');
  activeFilter = $('stayType').value;
  document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button.dataset.filter === activeFilter));
  applyFilters();
  $('stay').scrollIntoView({ behavior: 'smooth' });
  const hasMatches = roomsData.some(room => (activeFilter === 'all' || room.type === activeFilter) && Number($('guests').value) <= room.capacity);
  toast(hasMatches ? 'Showing sample stays for your search.' : 'No sample stay matches. Try fewer guests or another stay type.');
});

$('guests').addEventListener('change', applyFilters);
['checkin', 'checkout'].forEach(id => $(id).addEventListener('change', () => syncDateFields('main')));
['mCheckin', 'mCheckout', 'mGuests', 'mRooms'].forEach(id => $(id).addEventListener('change', () => {
  if (id === 'mCheckin' || id === 'mCheckout') syncDateFields('modal');
  else updateSummary();
}));
$('closeModal').addEventListener('click', closeBooking);
$('bookingModal').addEventListener('click', event => { if (event.target === $('bookingModal')) closeBooking(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeBooking(); });

$('bookingForm').addEventListener('submit', event => {
  event.preventDefault();
  if ($('mCheckout').value <= $('mCheckin').value) {
    toast('Check-out must be after check-in.');
    return;
  }
  const nights = Math.round((new Date(`${$('mCheckout').value}T12:00:00`) - new Date(`${$('mCheckin').value}T12:00:00`)) / 86400000);
  const total = nights * selectedRoom.price * Number($('mRooms').value);
  const request = `VICENTA RESORT — SAMPLE BOOKING REQUEST\nName: ${$('guestName').value}\nEmail: ${$('guestEmail').value}\nMobile: ${$('guestPhone').value || 'Not provided'}\nAccommodation: ${selectedRoom.name}\nCheck-in: ${$('mCheckin').value}\nCheck-out: ${$('mCheckout').value}\nGuests: ${$('mGuests').value}\nRooms: ${$('mRooms').value}\nEstimated sample total: ${peso(total)}\nSpecial requests: ${$('guestNotes').value || 'None'}\n\nNOT A CONFIRMED BOOKING. Please contact Vicenta Resort to verify rates and availability.`;
  const blob = new Blob([request], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vicenta-resort-booking-request.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  closeBooking();
  toast('Request summary downloaded. No reservation was sent.');
});

$('menuToggle').addEventListener('click', () => {
  const isOpen = $('nav').classList.toggle('open');
  $('menuToggle').setAttribute('aria-expanded', String(isOpen));
});
$('nav').querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  $('nav').classList.remove('open');
  $('menuToggle').setAttribute('aria-expanded', 'false');
}));
$('year').textContent = new Date().getFullYear();
setupDates();
renderRooms();
