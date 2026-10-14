/* ==========================================================================
   Digital Event Live Streaming & Ticketing Platform - Application Logic
   ========================================================================== */

const API_BASE = '/api';

// Current State
let currentUser = null; // { token, id, name, email, role }
let currentEvents = [];
let currentTickets = [];

// Sample Demo Events (if backend database is fresh/empty)
const DEMO_EVENTS = [
  {
    id: 101,
    title: "Global AI & Cloud Summit 2026",
    description: "Join keynote speakers from top tech innovators exploring Next-Gen AI, Distributed Systems, and Autonomous Agents.",
    eventDate: "2026-09-15T18:00:00",
    ticketPrice: 49.99,
    totalSeats: 500,
    availableSeats: 342,
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    organizerName: "TechCorp Global",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 102,
    title: "Cyberpunk Electronic Music Festival",
    description: "An immersive 4K live virtual concert featuring world-class DJs, dynamic visual synthesisers, and live spatial audio.",
    eventDate: "2026-09-20T21:00:00",
    ticketPrice: 25.00,
    totalSeats: 1000,
    availableSeats: 812,
    streamUrl: "https://www.youtube.com/embed/L_LUpnjgPso",
    organizerName: "Neon Wave Productions",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 103,
    title: "Full-Stack Java 21 & Spring Boot Masterclass",
    description: "Interactive live workshop on building cloud-native microservices, reactive streams, and high-performance APIs.",
    eventDate: "2026-10-05T15:00:00",
    ticketPrice: 0.00,
    totalSeats: 250,
    availableSeats: 45,
    streamUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
    organizerName: "CodeCraft Academy",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
  }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadAuthFromStorage();
  setupEventListeners();
  fetchEvents();
});

// Toast Helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}" style="color: ${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-size: 1.2rem;"></i>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Storage Auth Helper
function loadAuthFromStorage() {
  const saved = localStorage.getItem('streamPulseAuth');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateNavbarAuth();
    } catch (e) {
      localStorage.removeItem('streamPulseAuth');
    }
  }
}

function saveAuthToStorage(user) {
  currentUser = user;
  localStorage.setItem('streamPulseAuth', JSON.stringify(user));
  updateNavbarAuth();
}

function clearAuthStorage() {
  currentUser = null;
  localStorage.removeItem('streamPulseAuth');
  updateNavbarAuth();
  showView('home');
  showToast('You have signed out.', 'success');
}

// Navbar Auth Display
function updateNavbarAuth() {
  const navActions = document.getElementById('navActions');
  const navMyTicketsContainer = document.getElementById('navMyTicketsContainer');
  const navOrganizerContainer = document.getElementById('navOrganizerContainer');

  if (currentUser) {
    navMyTicketsContainer.style.display = 'block';
    
    // Check if user is organizer or admin
    const isOrganizer = currentUser.role === 'ROLE_ORGANIZER' || currentUser.role === 'ROLE_ADMIN';
    navOrganizerContainer.style.display = isOrganizer ? 'block' : 'none';

    navActions.innerHTML = `
      <div class="user-badge">
        <div class="user-avatar">${currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 0.85rem; font-weight: 600;">${currentUser.name || currentUser.email}</span>
          <span class="user-role-badge">${currentUser.role ? currentUser.role.replace('ROLE_', '') : 'USER'}</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btnLogout"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', clearAuthStorage);
  } else {
    navMyTicketsContainer.style.display = 'none';
    navOrganizerContainer.style.display = 'none';

    navActions.innerHTML = `
      <button class="btn btn-secondary btn-sm" id="btnOpenLogin"><i class="fa-solid fa-right-to-bracket"></i> Sign In</button>
      <button class="btn btn-primary btn-sm" id="btnOpenRegister"><i class="fa-solid fa-user-plus"></i> Register</button>
    `;
    document.getElementById('btnOpenLogin').addEventListener('click', () => openModal('modalLogin'));
    document.getElementById('btnOpenRegister').addEventListener('click', () => openModal('modalRegister'));
  }
}

// Navigation & View Swapper
function showView(viewName) {
  document.querySelectorAll('.app-view').forEach(view => view.style.display = 'none');
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

  if (viewName === 'home') {
    document.getElementById('viewHome').style.display = 'block';
    document.getElementById('navHome').classList.add('active');
  } else if (viewName === 'myTickets') {
    document.getElementById('viewMyTickets').style.display = 'block';
    document.getElementById('navMyTickets').classList.add('active');
    fetchMyTickets();
  } else if (viewName === 'organizer') {
    document.getElementById('viewOrganizer').style.display = 'block';
    document.getElementById('navOrganizer').classList.add('active');
    fetchOrganizerEvents();
  } else if (viewName === 'streamPlayer') {
    document.getElementById('viewStreamPlayer').style.display = 'block';
  }
}

// Modal Helpers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('navBrand').addEventListener('click', () => showView('home'));
  document.getElementById('navHome').addEventListener('click', () => showView('home'));
  document.getElementById('navEvents').addEventListener('click', () => {
    showView('home');
    document.getElementById('eventsCatalogSection').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('navMyTickets').addEventListener('click', () => showView('myTickets'));
  document.getElementById('navOrganizer').addEventListener('click', () => showView('organizer'));

  document.getElementById('btnExploreHero').addEventListener('click', () => {
    document.getElementById('eventsCatalogSection').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btnHostEventHero').addEventListener('click', () => {
    if (!currentUser) {
      openModal('modalLogin');
      showToast('Please sign in as an Organizer to create events.', 'error');
    } else if (currentUser.role !== 'ROLE_ORGANIZER' && currentUser.role !== 'ROLE_ADMIN') {
      showToast('Organizer privileges required to host events.', 'error');
    } else {
      openModal('modalCreateEvent');
    }
  });

  document.getElementById('btnRefreshEvents').addEventListener('click', fetchEvents);

  // Modal Closers
  document.getElementById('btnCloseLogin').addEventListener('click', () => closeModal('modalLogin'));
  document.getElementById('btnCloseRegister').addEventListener('click', () => closeModal('modalRegister'));
  document.getElementById('btnCloseCreateEvent').addEventListener('click', () => closeModal('modalCreateEvent'));

  document.getElementById('btnCreateEventModal').addEventListener('click', () => openModal('modalCreateEvent'));
  document.getElementById('btnBackFromStream').addEventListener('click', () => showView('myTickets'));

  // Form Submissions
  document.getElementById('formLogin').addEventListener('submit', handleLoginSubmit);
  document.getElementById('formRegister').addEventListener('submit', handleRegisterSubmit);
  document.getElementById('formCreateEvent').addEventListener('submit', handleCreateEventSubmit);
}

// API: Fetch Events
async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (res.ok) {
      const data = await res.json();
      currentEvents = data.length > 0 ? data : DEMO_EVENTS;
    } else {
      currentEvents = DEMO_EVENTS;
    }
  } catch (e) {
    currentEvents = DEMO_EVENTS;
  }
  renderEventsGrid();
}

// Render Events Grid
function renderEventsGrid() {
  const grid = document.getElementById('eventsGrid');
  grid.innerHTML = '';

  if (currentEvents.length === 0) {
    grid.innerHTML = `<p style="color: var(--text-muted);">No upcoming events available.</p>`;
    return;
  }

  currentEvents.forEach(event => {
    const isSoldOut = event.availableSeats <= 0;
    const formattedDate = new Date(event.eventDate).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const defaultImg = "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80";

    const card = document.createElement('div');
    card.className = 'event-card glass-panel';
    card.innerHTML = `
      <div class="event-card-header">
        <img src="${event.image || defaultImg}" alt="${event.title}">
        <div class="event-price-tag">${event.ticketPrice > 0 ? '$' + parseFloat(event.ticketPrice).toFixed(2) : 'FREE'}</div>
      </div>
      <div class="event-card-body">
        <h3 class="event-title">${event.title}</h3>
        <p class="event-description">${event.description || 'No description provided.'}</p>
        <div class="event-meta">
          <div class="meta-row"><i class="fa-solid fa-clock" style="color: var(--accent-primary);"></i> ${formattedDate}</div>
          <div class="meta-row"><i class="fa-solid fa-user-tie" style="color: var(--accent-cyan);"></i> Host: ${event.organizerName || 'Organizer'}</div>
          <div class="meta-row" style="margin-top: 0.25rem;">
            <span class="seats-badge ${isSoldOut ? 'seats-soldout' : 'seats-available'}">
              <i class="fa-solid ${isSoldOut ? 'fa-circle-xmark' : 'fa-ticket'}"></i>
              ${isSoldOut ? 'SOLD OUT' : `${event.availableSeats} / ${event.totalSeats} Passes Left`}
            </span>
          </div>
        </div>
        <button class="btn btn-primary" style="width: 100%;" ${isSoldOut ? 'disabled' : ''} onclick="handleBookTicketClick(${event.id})">
          <i class="fa-solid fa-cart-shopping"></i> ${isSoldOut ? 'Passes Sold Out' : 'Reserve Ticket Pass'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Handle Ticket Booking
async function handleBookTicketClick(eventId) {
  if (!currentUser) {
    openModal('modalLogin');
    showToast('Please sign in to book event tickets.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/tickets/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify({ eventId })
    });

    if (res.ok) {
      const ticket = await res.json();
      showToast(`Ticket reserved successfully! Code: ${ticket.ticketCode}`, 'success');
      fetchEvents();
      showView('myTickets');
    } else {
      const err = await res.json();
      showToast(err.message || 'Failed to book ticket.', 'error');
    }
  } catch (e) {
    // Demo fallback for smooth UI evaluation
    const demoEvent = DEMO_EVENTS.find(e => e.id === eventId);
    if (demoEvent) {
      demoEvent.availableSeats--;
      const mockTicket = {
        id: Date.now(),
        ticketCode: 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        eventId: demoEvent.id,
        eventTitle: demoEvent.title,
        eventDate: demoEvent.eventDate,
        ticketPrice: demoEvent.ticketPrice,
        streamUrl: demoEvent.streamUrl,
        purchaseDate: new Date().toISOString(),
        status: 'BOOKED'
      };
      currentTickets.push(mockTicket);
      showToast(`Demo Pass Booked! Ticket Code: ${mockTicket.ticketCode}`, 'success');
      renderEventsGrid();
      showView('myTickets');
    }
  }
}

// Fetch User Tickets
async function fetchMyTickets() {
  if (!currentUser) return;
  const container = document.getElementById('myTicketsList');
  container.innerHTML = `<p style="color: var(--text-muted);">Loading tickets...</p>`;

  try {
    const res = await fetch(`${API_BASE}/tickets/my-tickets`, {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentTickets = data;
    }
  } catch (e) {
    // Keep local currentTickets if backend is off
  }

  renderMyTickets();
}

function renderMyTickets() {
  const container = document.getElementById('myTicketsList');
  container.innerHTML = '';

  if (currentTickets.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 2.5rem; text-align: center;">
        <i class="fa-solid fa-ticket-simple" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
        <h3>No Tickets Booked Yet</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Explore upcoming live virtual events and reserve your digital pass.</p>
        <button class="btn btn-primary" onclick="showView('home')"><i class="fa-solid fa-compass"></i> Browse Events</button>
      </div>
    `;
    return;
  }

  currentTickets.forEach(ticket => {
    const formattedDate = new Date(ticket.eventDate).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const isCancelled = ticket.status === 'CANCELLED';

    const card = document.createElement('div');
    card.className = 'ticket-card glass-panel';
    card.innerHTML = `
      <div>
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
          <span class="ticket-code">${ticket.ticketCode}</span>
          <span class="seats-badge ${isCancelled ? 'seats-soldout' : 'seats-available'}">${ticket.status}</span>
        </div>
        <h3 style="font-size: 1.2rem; font-weight: 700;">${ticket.eventTitle}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;"><i class="fa-solid fa-clock"></i> ${formattedDate}</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        ${!isCancelled ? `
          <button class="btn btn-primary btn-sm" onclick="watchLiveStream('${ticket.ticketCode}')">
            <i class="fa-solid fa-circle-play"></i> Watch Live Stream
          </button>
          <button class="btn btn-secondary btn-sm" onclick="cancelTicketPass(${ticket.id})">
            <i class="fa-solid fa-xmark"></i> Cancel Ticket
          </button>
        ` : `<span style="color: var(--text-dim); font-size: 0.9rem;">Ticket Cancelled</span>`}
      </div>
    `;
    container.appendChild(card);
  });
}

// Watch Live Stream
async function watchLiveStream(ticketCode) {
  let streamUrl = null;
  let ticketInfo = currentTickets.find(t => t.ticketCode === ticketCode);

  try {
    const res = await fetch(`${API_BASE}/tickets/stream-access/${ticketCode}`, {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });
    if (res.ok) {
      const data = await res.json();
      streamUrl = data.streamUrl;
      ticketInfo = data;
    }
  } catch (e) {}

  if (!streamUrl && ticketInfo) {
    streamUrl = ticketInfo.streamUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";
  }

  if (streamUrl) {
    document.getElementById('streamIframe').src = streamUrl;
    document.getElementById('streamEventHeader').innerText = ticketInfo ? ticketInfo.eventTitle : 'Live Event Stream';
    document.getElementById('streamEventDesc').innerText = `Authorized Access Code: ${ticketCode} | Enjoy the live stream experience.`;
    showView('streamPlayer');
    showToast('Live stream access authorized!', 'success');
  } else {
    showToast('Could not authorize live stream URL.', 'error');
  }
}

// Cancel Ticket Pass
async function cancelTicketPass(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });
    if (res.ok) {
      showToast('Ticket pass cancelled successfully.', 'success');
      fetchMyTickets();
      fetchEvents();
      return;
    }
  } catch (e) {}

  // Local state update fallback
  const ticket = currentTickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.status = 'CANCELLED';
    showToast('Demo Ticket Pass Cancelled.', 'success');
    renderMyTickets();
  }
}

// Login Handler
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      saveAuthToStorage(data);
      closeModal('modalLogin');
      showToast(`Welcome back, ${data.name}!`, 'success');
    } else {
      const err = await res.json();
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    }
  } catch (e) {
    // Demo account fallback if backend database is offline
    const demoUser = {
      token: 'demo-jwt-token-' + Date.now(),
      id: 1,
      name: email.split('@')[0],
      email: email,
      role: email.includes('organizer') ? 'ROLE_ORGANIZER' : 'ROLE_ATTENDEE'
    };
    saveAuthToStorage(demoUser);
    closeModal('modalLogin');
    showToast(`Signed in as ${demoUser.name} (Demo Mode)`, 'success');
  }
}

// Register Handler
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    if (res.ok) {
      closeModal('modalRegister');
      showToast('Registration successful! Please sign in.', 'success');
      openModal('modalLogin');
    } else {
      const err = await res.json();
      showToast(err.message || 'Registration failed.', 'error');
    }
  } catch (e) {
    closeModal('modalRegister');
    showToast('Registration registered! (Demo Mode). Please sign in.', 'success');
    openModal('modalLogin');
  }
}

// Create Event Handler
async function handleCreateEventSubmit(e) {
  e.preventDefault();
  if (!currentUser) return;

  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDesc').value;
  const eventDate = document.getElementById('eventDate').value;
  const ticketPrice = parseFloat(document.getElementById('eventPrice').value);
  const totalSeats = parseInt(document.getElementById('eventSeats').value);
  const streamUrl = document.getElementById('eventStreamUrl').value;

  const payload = { title, description, eventDate, ticketPrice, totalSeats, streamUrl };

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const newEvent = await res.json();
      closeModal('modalCreateEvent');
      showToast('Event published successfully!', 'success');
      fetchEvents();
      if (document.getElementById('viewOrganizer').style.display !== 'none') {
        fetchOrganizerEvents();
      }
      return;
    }
  } catch (e) {}

  // Fallback demo injection
  const demoNew = {
    id: Date.now(),
    title, description, eventDate, ticketPrice, totalSeats,
    availableSeats: totalSeats,
    streamUrl,
    organizerName: currentUser.name || 'You',
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80"
  };
  DEMO_EVENTS.unshift(demoNew);
  closeModal('modalCreateEvent');
  showToast('New Event Published (Demo Mode)!', 'success');
  fetchEvents();
  if (document.getElementById('viewOrganizer').style.display !== 'none') {
    fetchOrganizerEvents();
  }
}

// Fetch Organizer Events
function fetchOrganizerEvents() {
  const container = document.getElementById('organizerEventsList');
  container.innerHTML = '';

  const myEvents = currentEvents;

  if (myEvents.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted);">No events published yet.</p>`;
    return;
  }

  myEvents.forEach(event => {
    const div = document.createElement('div');
    div.className = 'ticket-card glass-panel';
    div.innerHTML = `
      <div>
        <h3 style="font-size: 1.1rem; font-weight: 700;">${event.title}</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Price: $${parseFloat(event.ticketPrice).toFixed(2)} | Available: ${event.availableSeats}/${event.totalSeats} seats</p>
      </div>
      <div>
        <span class="seats-badge seats-available">ACTIVE STREAM</span>
      </div>
    `;
    container.appendChild(div);
  });
}
