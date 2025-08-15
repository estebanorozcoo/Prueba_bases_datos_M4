
const API = location.origin + '/api';
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let clientsCache = [];        
let clientModal;              
// -------------------- Utilidades --------------------
function showLoading(show = true) {
  const el = $('#loadingSpinner');
  if (!el) return;
  el.classList.toggle('d-none', !show);
}

function showAlert(message, type = 'info') {
  // Borra alerts previos flotantes
  document.querySelectorAll('.alert.position-fixed').forEach(a => a.remove());
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  el.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:300px;';
  el.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

const fmt = (n) => Number(n ?? 0).toLocaleString();
function badgeForStatus(s){ return { PENDING:'secondary', PARTIAL:'warning', PAID:'success', OVERDUE:'danger' }[s] || 'secondary'; }
function badgeForTxn(s){ return { COMPLETED:'success', PENDING:'secondary', FAILED:'danger', CANCELLED:'warning' }[s] || 'secondary'; }

// -------------------- Navegación --------------------
function showSection(id){
  $$('.content-section').forEach(s => s.classList.remove('active'));
  $('#' + id)?.classList.add('active');
  $$('#navbarNav .nav-link').forEach(a => a.classList.toggle('active', a.dataset.section === id));

  // Cargas por sección
  if (id === 'clients') loadClients();
  if (id === 'reports') {
    loadTotalPayments();
    loadPendingInvoices();
    loadTransactions(); 
  }
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a.nav-link[data-section]');
  if (!a) return;
  e.preventDefault();
  showSection(a.dataset.section);
});

// -------------------- Health & Dashboard --------------------
async function loadHealth(){
  try{
    const res = await fetch(`${API}/health`);
    const json = await res.json();
    const ok = json?.database === 'connected';
    $('#dbDot')?.classList.toggle('text-success', ok);
    $('#dbDot')?.classList.toggle('text-danger', !ok);
    if ($('#dbStatus')) $('#dbStatus').textContent = 'Database: ' + (ok ? 'Connected' : 'Disconnected');
  }catch{
    $('#dbDot')?.classList.add('text-danger');
    if ($('#dbStatus')) $('#dbStatus').textContent = 'Database: Error';
  }
}

async function refreshDashboardCounters(){
  try {
    const clients = await (await fetch(`${API}/clients`)).json();
    const total = clients?.data?.length || 0;
    if ($('#totalClients'))  $('#totalClients').textContent = total;
    if ($('#activeClients')) $('#activeClients').textContent = total; 

    const pend = await (await fetch(`${API}/reports/pending-invoices`)).json();
    if ($('#pendingInvoices')) $('#pendingInvoices').textContent = pend?.data?.length || 0;

    const tx = await (await fetch(`${API}/reports/transactions-by-platform`)).json();
    if ($('#totalTransactions')) $('#totalTransactions').textContent = tx?.data?.length || 0;
  } catch (e) {
    console.error('Dashboard counters error:', e);
  }
}

// -------------------- Clients (CRUD) --------------------
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('clientModal');
  if (modalEl) clientModal = new bootstrap.Modal(modalEl);

  // Validación básica en inputs
  const code = $('#clientCode');
  if (code){
    code.addEventListener('input', function(){
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
  }
  [$('#clientFirstName'), $('#clientLastName')].forEach(f => {
    if (!f) return;
    f.addEventListener('input', function(){
      this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    });
  });
});

async function loadClients(){
  showLoading(true);
  try{
    const res = await fetch(`${API}/clients`);
    const json = await res.json();
    clientsCache = json.data || [];
    const rows = clientsCache.map(c => `
      <tr>
        <td>${c.client_code}</td>
        <td>${c.first_name} ${c.last_name}</td>
        <td>${c.email || ''}</td>
        <td>${c.city || ''}</td>
        <td>${c.department || ''}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="editClient(${c.client_id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${c.client_id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
    $('#clientsTableBody').innerHTML = rows || '<tr><td colspan="6" class="text-center">No data</td></tr>';
  }catch(e){
    console.error('loadClients error:', e);
    $('#clientsTableBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading clients</td></tr>';
  }finally{
    showLoading(false);
  }
}

function showClientModal(client = null){
  const form = $('#clientForm');
  if (!form) return;
  form.reset();
  $('#clientId').value = '';
  $('#clientModalTitle').textContent = client ? 'Edit Client' : 'Add New Client';
  if (client){
    $('#clientId').value         = client.client_id;
    $('#clientCode').value       = client.client_code;
    $('#clientFirstName').value  = client.first_name;
    $('#clientLastName').value   = client.last_name;
    $('#clientEmail').value      = client.email || '';
    $('#clientPhone').value      = client.phone || '';
    $('#clientCity').value       = client.city || '';
    $('#clientDepartment').value = client.department || '';
    $('#clientAddress').value    = client.address || '';
  }
  clientModal?.show();
}

function editClient(id){
  const c = clientsCache.find(x => x.client_id === id);
  showClientModal(c || null);
}

async function saveClient(){
  const form = $('#clientForm');
  if (!form) return;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const id = ($('#clientId').value || '').trim();
  const payload = {
    client_code: ($('#clientCode').value || '').toUpperCase(),
    first_name : $('#clientFirstName').value || '',
    last_name  : $('#clientLastName').value  || '',
    email      : $('#clientEmail').value     || '',
    phone      : $('#clientPhone').value     || '',
    city       : $('#clientCity').value      || '',
    department : $('#clientDepartment').value|| '',
    address    : $('#clientAddress').value   || ''
  };

  showLoading(true);
  try{
    const url = id ? `${API}/clients/${id}` : `${API}/clients`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success){
      showAlert(json.message || 'Error saving client', 'danger');
      return;
    }
    clientModal?.hide();
    await loadClients();
    await refreshDashboardCounters();
    showAlert(id ? 'Client updated successfully' : 'Client created successfully', 'success');
  }catch(e){
    console.error('saveClient error:', e);
    showAlert('Error saving client', 'danger');
  }finally{
    showLoading(false);
  }
}

async function deleteClient(id){
  if (!confirm('¿Eliminar cliente (soft delete)?')) return;
  showLoading(true);
  try{
    const res = await fetch(`${API}/clients/${id}`, { method:'DELETE' });
    const json = await res.json();
    if (!json.success){
      showAlert(json.message || 'Error deleting client', 'danger');
      return;
    }
    await loadClients();
    await refreshDashboardCounters();
    showAlert('Client deleted successfully', 'success');
  }catch(e){
    console.error('deleteClient error:', e);
    showAlert('Error deleting client', 'danger');
  }finally{
    showLoading(false);
  }
}

// -------------------- Reports --------------------
async function loadTotalPayments(){
  const el = $('#paymentsTableBody');
  if (!el) return;
  try{
    const res = await fetch(`${API}/reports/total-payments`);
    const json = await res.json();
    const rows = (json.data || []).map(r => `
      <tr>
        <td>${r.client_code}</td>
        <td>${r.client_name}</td>
        <td>${fmt(r.total_paid)}</td>
        <td>${r.total_transactions}</td>
      </tr>
    `).join('');
    el.innerHTML = rows || '<tr><td colspan="4" class="text-center">No data</td></tr>';
  }catch(e){
    console.error('loadTotalPayments error:', e);
    el.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
  }
}

async function loadPendingInvoices(){
  const el = $('#pendingTableBody');
  if (!el) return;
  try{
    const res = await fetch(`${API}/reports/pending-invoices`);
    const json = await res.json();
    const rows = (json.data || []).map(r => `
      <tr>
        <td>${r.invoice_number}</td>
        <td>${r.client_code} - ${r.client_name}</td>
        <td>${r.billing_period}</td>
        <td>${fmt(r.total_amount)}</td>
        <td>${fmt(r.paid_amount)}</td>
        <td>${fmt(r.pending_amount)}</td>
        <td><span class="badge bg-${badgeForStatus(r.status)}">${r.status}</span></td>
      </tr>
    `).join('');
    el.innerHTML = rows || '<tr><td colspan="7" class="text-center">No data</td></tr>';
  }catch(e){
    console.error('loadPendingInvoices error:', e);
    el.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading data</td></tr>';
  }
}

async function loadTransactions(platform = ''){
  const el = $('#transactionsTableBody');
  if (!el) return;
  try{
    const url = platform
      ? `${API}/reports/transactions-by-platform?platform=${encodeURIComponent(platform)}`
      : `${API}/reports/transactions-by-platform`;
    const res = await fetch(url);
    const json = await res.json();

    // Poblar filtro de plataformas la primera vez (sin filtro)
    if (!platform){
      const set = new Set((json.data || []).map(x => x.platform_name));
      const options = ['<option value="">All Platforms</option>', ...[...set].sort().map(p => `<option value="${p}">${p}</option>`)];
      const sel = $('#platformFilter');
      if (sel) sel.innerHTML = options.join('');
    }

    const rows = (json.data || []).map(r => `
      <tr>
        <td>${r.platform_name}</td>
        <td>${r.transaction_reference}</td>
        <td>${r.client_code} - ${r.client_name}</td>
        <td>${r.invoice_number}</td>
        <td>${fmt(r.amount)}</td>
        <td>${r.transaction_date ? new Date(r.transaction_date).toLocaleString() : ''}</td>
        <td><span class="badge bg-${badgeForTxn(r.status)}">${r.status}</span></td>
      </tr>
    `).join('');
    el.innerHTML = rows || '<tr><td colspan="7" class="text-center">No data</td></tr>';
  }catch(e){
    console.error('loadTransactions error:', e);
    el.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading data</td></tr>';
  }
}

function filterTransactionsByPlatform(){
  const p = $('#platformFilter')?.value || '';
  loadTransactions(p);
}

// -------------------- Init --------------------
async function initializeApp(){
  await loadHealth();
  await refreshDashboardCounters();
  await loadClients();
  // precarga reportes para que aparezcan instant en el tab
  loadTotalPayments();
  loadPendingInvoices();
  loadTransactions();
}

document.addEventListener('DOMContentLoaded', initializeApp);

// -------------------- Exports a window (usados por el HTML) --------------------
window.showSection = showSection;
window.loadClients = loadClients;
window.showClientModal = showClientModal;
window.saveClient = saveClient;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.filterTransactionsByPlatform = filterTransactionsByPlatform;
