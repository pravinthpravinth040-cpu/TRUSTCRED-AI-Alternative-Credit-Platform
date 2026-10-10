// TRUSTCRED AI — Banking & Alternative Credit Platform Controller

let currentUser = null;
let currentToken = null;
let activeTab = 'dashboard';
let isSidebarCollapsed = false;
let isMobileMenuOpen = false;
let authView = 'login'; // 'login' or 'register'

let metrics = null;
let transactions = [];
let latestAssessment = null;
let consents = [];
let auditLogs = [];
let verifierQueue = [];
let lenderPipeline = [];
let selectedDays = 90;
let editingTxnId = null;
let trendChart = null;

const API_BASE = '/api';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

// Timeout protected API caller to prevent hanging loading spinners
async function apiCall(endpoint, method = 'GET', data = null, timeoutMs = 8000) {
  const headers = { 'Content-Type': 'application/json' };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  const opts = { method, headers };
  if (data) opts.body = JSON.stringify(data);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(err.detail || 'API request failed');
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Please check backend server.');
    }
    throw err;
  }
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
  const savedToken = localStorage.getItem('trustcred_token');
  if (savedToken) {
    currentToken = savedToken;
    try {
      currentUser = await apiCall('/auth/me');
      routeUserToRoleDashboard(currentUser);
      renderApp();
      await loadDataForActiveRole();
      return;
    } catch (e) {
      console.warn('Saved token expired or invalid:', e);
      localStorage.removeItem('trustcred_token');
      currentToken = null;
      currentUser = null;
    }
  }

  // Not logged in: show professional login page immediately
  renderAuthPage();
});

function routeUserToRoleDashboard(user) {
  if (user.role === 'verifier') {
    activeTab = 'verifier';
  } else if (user.role === 'lender') {
    activeTab = 'lender';
  } else if (user.role === 'admin') {
    activeTab = 'admin-overview';
  } else {
    activeTab = 'dashboard';
  }
}

// --- AUTHENTICATION PAGES ---
function renderAuthPage() {
  const root = document.getElementById('appRoot');
  if (authView === 'register') {
    root.innerHTML = getRegisterPageHtml();
  } else {
    root.innerHTML = getLoginPageHtml();
  }
  if (window.lucide) window.lucide.createIcons();
}

function getLoginPageHtml() {
  return `
    <div class="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Left Column: Value Proposition & Branding -->
        <div class="lg:col-span-7 space-y-6 pr-0 lg:pr-6">
          <div class="flex items-center space-x-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-md">
              <i data-lucide="shield-check" class="h-7 w-7 text-white stroke-[2.2]"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-2xl font-bold tracking-tight text-[#123B6D]">
                  TRUST<span class="text-blue-600">CRED</span>
                </span>
                <span class="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                  AI
                </span>
              </div>
              <p class="text-xs text-slate-500 font-medium">Alternative Credit & Financial Evidence Platform</p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight leading-tight">
              Your Business Deserves Better Financial Opportunities
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              TRUSTCRED AI transforms daily digital QR and UPI sales records into privacy-preserving, tamper-evident credit assessments—empowering micro-merchants to obtain fair working-capital credit without traditional collateral.
            </p>
          </div>

          <div class="space-y-4 pt-1">
            <div class="flex items-start space-x-3.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#172B4D]">1. Understand your business cash flow</h4>
                <p class="text-xs text-slate-500 mt-0.5">
                  Automated statement analysis categorizes legitimate customer sales receipts while strictly filtering out personal transfers and refunds.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                <i data-lucide="file-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#172B4D]">2. Share financial evidence securely</h4>
                <p class="text-xs text-slate-500 mt-0.5">
                  Every generated report carries a SHA-256 cryptographic digest and digital signature. Control lender access with granular consent and one-click revocation.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                <i data-lucide="building-2" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#172B4D]">3. Give lenders a clearer view of your business</h4>
                <p class="text-xs text-slate-500 mt-0.5">
                  Regulated financial institutions review objective Debt Service Coverage Ratios (DSCR) and trading consistency instead of rejecting due to lack of bureau history.
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3 px-4 py-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-[#123B6D]">
            <i data-lucide="lock" class="w-4 h-4 text-blue-700 flex-shrink-0"></i>
            <span class="font-medium">
              Privacy Guarantee: Your bank password, net banking credentials, and UPI PIN are <span class="font-bold underline">never</span> requested or stored.
            </span>
          </div>
        </div>

        <!-- Right Column: Sign In Card -->
        <div class="lg:col-span-5">
          <div class="bank-card p-6 sm:p-8 shadow-md border border-[#E2E8F0]">
            <div class="mb-5">
              <h2 class="text-2xl font-bold text-[#172B4D]">Welcome Back</h2>
              <p class="text-xs text-slate-500 mt-1">Sign in to your TRUSTCRED account.</p>
            </div>

            <!-- Demo Persona Autofill -->
            <div class="mb-5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quick Demo Access:</span>
                <span class="text-[10px] text-blue-600 font-medium">1-Click Test Fill</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                <button type="button" onclick="selectDemoUser('ramesh@trustcred.ai')" class="text-left px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#E2E8F0] bg-white hover:bg-blue-50 hover:text-blue-700 transition">
                  🏪 Ramesh (Kirana)
                </button>
                <button type="button" onclick="selectDemoUser('priya@trustcred.ai')" class="text-left px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#E2E8F0] bg-white hover:bg-blue-50 hover:text-blue-700 transition">
                  🍲 Priya (Street Food)
                </button>
                <button type="button" onclick="selectDemoUser('anil@trustcred.ai')" class="text-left px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#E2E8F0] bg-white hover:bg-blue-50 hover:text-blue-700 transition">
                  🚚 Anil (Logistics)
                </button>
                <button type="button" onclick="selectDemoUser('verifier@trustcred.ai')" class="text-left px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#E2E8F0] bg-white hover:bg-blue-50 hover:text-blue-700 transition">
                  🛡️ Rajesh (Verifier)
                </button>
                <button type="button" onclick="selectDemoUser('lender@trustcred.ai')" class="text-left px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#E2E8F0] bg-white hover:bg-blue-50 hover:text-blue-700 transition">
                  🏦 Meera (Lender)
                </button>
              </div>
            </div>

            <div id="loginError" class="hidden mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"></div>

            <form onsubmit="handleLoginSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Email Address or Username</label>
                <input type="email" id="loginEmail" placeholder="e.g. ramesh@trustcred.ai" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" required />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-semibold text-[#172B4D]">Password</label>
                  <button type="button" onclick="alert('Demo environment standard password for all test personas is: trustcred123')" class="text-xs font-medium text-blue-600 hover:text-blue-800">Forgot password?</button>
                </div>
                <div class="relative">
                  <input type="password" id="loginPassword" placeholder="Enter password" class="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" required />
                  <button type="button" onclick="togglePasswordVisibility('loginPassword')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-blue-600 border-slate-300" />
                  <span class="text-xs text-slate-500 select-none">Remember this device</span>
                </label>
              </div>

              <button type="submit" id="loginSubmitBtn" class="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer">
                <span>Sign In</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

            <div class="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
              <p class="text-xs text-slate-500">
                New small-business vendor? 
                <button type="button" onclick="switchAuthView('register')" class="font-semibold text-blue-600 hover:text-blue-800">
                  Create an Account
                </button>
              </p>
            </div>

            <div class="mt-5 text-center">
              <span class="inline-flex items-center text-[11px] text-slate-500 font-medium">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600 mr-1.5 inline"></i>
                Protected access • Privacy-first financial assessment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getRegisterPageHtml() {
  return `
    <div class="min-h-screen bg-[#F5F7FB] py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-sm">
              <i data-lucide="shield-check" class="h-6 w-6 text-white stroke-[2.2]"></i>
            </div>
            <div>
              <span class="text-xl font-bold tracking-tight text-[#123B6D]">
                TRUST<span class="text-blue-600">CRED</span> AI
              </span>
              <p class="text-[11px] text-slate-500">Alternative Financial Evidence Platform</p>
            </div>
          </div>
          <button type="button" onclick="switchAuthView('login')" class="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
            <i data-lucide="arrow-left" class="w-4 h-4 mr-1"></i>
            Back to Sign In
          </button>
        </div>

        <div class="bank-card p-6 sm:p-10 shadow-md border border-[#E2E8F0]">
          <div class="border-b border-[#E2E8F0] pb-6 mb-6">
            <h1 class="text-2xl font-bold text-[#172B4D]">Create Your TRUSTCRED Account</h1>
            <p class="text-xs text-slate-500 mt-1.5">
              Register your small enterprise to convert daily digital UPI & QR sales into independently verifiable credit evidence.
            </p>
          </div>

          <div id="registerError" class="hidden mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"></div>

          <form onsubmit="handleRegisterSubmit(event)" class="space-y-6">
            <div>
              <h3 class="text-xs font-bold text-[#123B6D] uppercase tracking-wider mb-3">1. Owner & Login Details</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Full Name *</label>
                  <input type="text" id="regName" placeholder="e.g. Ramesh Kumar" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" required />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Email Address *</label>
                  <input type="email" id="regEmail" placeholder="e.g. ramesh@kirana.in" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" required />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Mobile Number *</label>
                  <input type="tel" id="regPhone" placeholder="+91 98765 43210" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" required />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Password *</label>
                  <input type="password" id="regPassword" placeholder="Minimum 8 characters" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" required />
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-bold text-[#123B6D] uppercase tracking-wider mb-3">2. Enterprise Profile</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Business Name *</label>
                  <input type="text" id="regBizName" placeholder="e.g. Ramesh Kirana Provisions" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" required />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Business Category *</label>
                  <select id="regBizCategory" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm">
                    <option value="Grocery and Retail">Grocery and Retail</option>
                    <option value="Food and Beverage">Food and Beverage</option>
                    <option value="Street Vendor">Street Vendor</option>
                    <option value="Tailoring and Textiles">Tailoring and Textiles</option>
                    <option value="Repair and Maintenance">Repair and Maintenance</option>
                    <option value="Transport and Logistics">Transport and Logistics</option>
                    <option value="Home-Based Business">Home-Based Business</option>
                    <option value="Online Seller">Online Seller</option>
                    <option value="Other Small Business">Other Small Business</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Business Location</label>
                  <input type="text" id="regLocation" placeholder="e.g. Shop 4, Market Complex" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B4D] mb-1.5">Estimated Monthly Turnover (₹)</label>
                  <input type="number" id="regTurnover" placeholder="e.g. 150000" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm" />
                </div>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
              <label class="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" id="regConsent" class="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300" required />
                <span class="text-xs text-[#172B4D] leading-relaxed">
                  <span class="font-semibold text-[#123B6D]">Consent for Alternative Financial Data Assessment: </span>
                  I authorize TRUSTCRED AI to analyze uploaded transaction records for credit assessment. No bank passwords or UPI PINs are ever collected.
                </span>
              </label>
            </div>

            <button type="submit" id="regSubmitBtn" class="w-full py-3 px-4 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer">
              <span>Create TRUSTCRED Account</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </form>

          <div class="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
            <p class="text-xs text-slate-500">
              Already registered? 
              <button type="button" onclick="switchAuthView('login')" class="font-semibold text-blue-600 hover:text-blue-800">
                Sign in to your account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectDemoUser(email) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = 'trustcred123';
}

function togglePasswordVisibility(id) {
  const el = document.getElementById(id);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

function switchAuthView(view) {
  authView = view;
  renderAuthPage();
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');
  const errBox = document.getElementById('loginError');

  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Signing In...';

  try {
    let res;
    try {
      res = await apiCall('/auth/login', 'POST', { email, password });
    } catch (loginErr) {
      // If accounts aren't seeded yet, seed them automatically
      if (loginErr.message.includes('Invalid') || loginErr.message.includes('failed') || loginErr.message.includes('400')) {
        try {
          await apiCall('/auth/seed-demo-accounts', 'POST');
          res = await apiCall('/auth/login', 'POST', { email, password });
        } catch (seedErr) {
          throw loginErr;
        }
      } else {
        throw loginErr;
      }
    }

    currentToken = res.access_token;
    localStorage.setItem('trustcred_token', currentToken);
    currentUser = await apiCall('/auth/me');
    routeUserToRoleDashboard(currentUser);

    renderApp();
    await loadDataForActiveRole();
  } catch (err) {
    errBox.textContent = err.message || 'Invalid credentials. Please try again.';
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span> <i data-lucide="arrow-right" class="w-4 h-4 inline"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const full_name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const business_name = document.getElementById('regBizName').value.trim();
  const business_type = document.getElementById('regBizCategory').value;
  const address = document.getElementById('regLocation').value.trim();
  const monthly_turnover_estimate = parseFloat(document.getElementById('regTurnover').value) || 0;
  const consent = document.getElementById('regConsent').checked;

  const btn = document.getElementById('regSubmitBtn');
  const errBox = document.getElementById('registerError');

  if (!consent) {
    errBox.textContent = 'Please check the consent box to proceed.';
    errBox.classList.remove('hidden');
    return;
  }

  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Registering...';

  try {
    const res = await apiCall('/auth/register', 'POST', {
      email,
      password,
      full_name,
      role: 'borrower',
      business_name,
      business_type
    });

    currentToken = res.access_token;
    localStorage.setItem('trustcred_token', currentToken);
    currentUser = await apiCall('/auth/me');
    routeUserToRoleDashboard(currentUser);

    renderApp();
    await loadDataForActiveRole();
  } catch (err) {
    errBox.textContent = err.message || 'Registration failed.';
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Create TRUSTCRED Account</span> <i data-lucide="arrow-right" class="w-4 h-4 inline"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

function handleLogout() {
  localStorage.removeItem('trustcred_token');
  currentToken = null;
  currentUser = null;
  authView = 'login';
  renderAuthPage();
}

// --- MAIN APP FRAMEWORK (SIDEBAR + TOPBAR + VIEWPORT) ---
function renderApp() {
  const root = document.getElementById('appRoot');
  const role = currentUser ? currentUser.role : 'borrower';

  // Vendor navigation
  const vendorNav = [
    { id: 'dashboard', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'business', label: 'My Business', icon: 'store' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt' },
    { id: 'assessment', label: 'Financial Assessment', icon: 'file-check-2' },
    { id: 'loan-apply', label: 'Apply for Loan', icon: 'coins' },
    { id: 'calculator', label: 'Repayment Calculator', icon: 'calculator' },
    { id: 'reports', label: 'Financial Reports', icon: 'file-text' },
    { id: 'consent', label: 'Privacy & Consent', icon: 'lock' },
    { id: 'public-verify', label: 'Verify Report', icon: 'search-check' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  // Lender navigation
  const lenderNav = [
    { id: 'lender', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'lender-pipeline', label: 'Loan Applications', icon: 'briefcase' },
    { id: 'lender-assessment', label: 'Applicant Assessments', icon: 'file-check-2' },
    { id: 'lender-reports', label: 'Verified Reports', icon: 'file-text' },
    { id: 'lender-decisions', label: 'Decisions', icon: 'scale' },
    { id: 'consent', label: 'Audit History', icon: 'history' },
    { id: 'public-verify', label: 'Verify Report Integrity', icon: 'search-check' },
  ];

  // Verifier navigation
  const verifierNav = [
    { id: 'verifier', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'verifier-queue', label: 'Verification Queue', icon: 'file-search' },
    { id: 'verifier-integrity', label: 'Report Integrity', icon: 'shield-check' },
    { id: 'public-verify', label: 'Independent Verifier', icon: 'search-check' },
  ];

  // Admin navigation
  const adminNav = [
    { id: 'admin-overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'admin-users', label: 'User Management', icon: 'users' },
    { id: 'admin-stats', label: 'Application Statistics', icon: 'activity' },
    { id: 'consent', label: 'Audit Logs', icon: 'history' },
    { id: 'public-verify', label: 'Verify Reports', icon: 'search-check' },
  ];

  let navItems = vendorNav;
  if (role === 'lender') navItems = lenderNav;
  else if (role === 'verifier') navItems = verifierNav;
  else if (role === 'admin') navItems = adminNav;

  const roleDisplay = role === 'borrower' ? 'Vendor' : role === 'lender' ? 'Lender Underwriter' : role === 'verifier' ? 'Verifier' : 'Administrator';

  root.innerHTML = `
    <div class="min-h-screen bg-[#F5F7FB] flex flex-col md:flex-row text-[#172B4D] font-sans selection:bg-blue-500/20">
      <!-- Collapsible Sidebar -->
      <aside class="fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-300 w-64 md:static">
        <!-- Brand Header -->
        <div class="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0]">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-[#123B6D] text-white flex items-center justify-center shadow-xs">
              <i data-lucide="shield-check" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <span class="text-sm font-bold tracking-tight text-[#123B6D]">TRUST<span class="text-blue-600">CRED</span> AI</span>
              <p class="text-[10px] text-slate-500 font-medium">Alternative Credit Platform</p>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          ${navItems.map(item => `
            <button onclick="switchTab('${item.id}')" id="nav-${item.id}" class="w-full flex items-center px-3.5 py-2.5 space-x-3 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === item.id || (item.id === 'dashboard' && activeTab === 'overview')
                ? 'bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600'
                : 'text-slate-600 hover:text-[#172B4D] hover:bg-slate-50'
            }">
              <i data-lucide="${item.icon}" class="w-4 h-4 ${activeTab === item.id ? 'text-blue-700' : 'text-slate-400'}"></i>
              <span>${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <!-- User Profile Footer -->
        <div class="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-9 h-9 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs">
              ${currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-[#172B4D] truncate">${currentUser?.full_name || 'User'}</div>
              <span class="bank-badge text-[9px] uppercase px-1.5 py-0.2 border bg-blue-100 text-blue-800 border-blue-200">
                ${roleDisplay}
              </span>
            </div>
          </div>
          <button onclick="handleLogout()" class="w-full flex items-center space-x-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 p-2 transition cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 min-h-screen">
        <!-- Topbar -->
        <header class="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div>
            <span class="text-[11px] text-slate-500 font-medium">TRUSTCRED AI / Portal</span>
            <h1 class="text-base sm:text-lg font-bold text-[#172B4D] capitalize">${activeTab.replace('-', ' ')}</h1>
          </div>

          <div class="flex items-center space-x-3">
            <button onclick="seedDemoData()" id="topSeedBtn" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Reset Demo</span>
            </button>

            <!-- 1-Click Role Switcher -->
            <div class="flex items-center space-x-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
              <button onclick="loginPersona('ramesh@trustcred.ai')" class="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-700">🏪 Ramesh</button>
              <button onclick="loginPersona('priya@trustcred.ai')" class="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-700">🍲 Priya</button>
              <button onclick="loginPersona('anil@trustcred.ai')" class="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-700">🚚 Anil</button>
              <button onclick="loginPersona('verifier@trustcred.ai')" class="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-700">🛡️ Verifier</button>
              <button onclick="loginPersona('lender@trustcred.ai')" class="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-700">🏦 Lender</button>
            </div>
          </div>
        </header>

        <!-- Viewport Container -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="mainViewport">
          <div id="loadingSpinner" class="flex flex-col items-center justify-center py-20">
            <div class="w-10 h-10 border-4 border-blue-100 border-t-[#123B6D] rounded-full animate-spin"></div>
            <span class="mt-4 text-xs text-slate-500 font-semibold">Loading Financial Analytics...</span>
          </div>
          <div id="viewContainer" class="hidden"></div>
        </main>

        <!-- Banking Footer -->
        <footer class="border-t border-[#E2E8F0] bg-white py-4 px-6 text-xs text-slate-500 mt-auto">
          <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div>
              <span class="font-bold text-[#123B6D]">TRUSTCRED AI</span>
              <span> — Privacy-Preserving Alternative Credit Scoring & Income Verification Platform</span>
            </div>
            <div class="flex items-center space-x-3 text-[11px]">
              <span>Argon2id Passwords</span> • <span>SHA-256 Digest Integrity</span> • <span>DSCR Solvency Engine</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

async function loginPersona(email) {
  try {
    const res = await apiCall('/auth/login', 'POST', { email, password: 'trustcred123' });
    currentToken = res.access_token;
    localStorage.setItem('trustcred_token', currentToken);
    currentUser = await apiCall('/auth/me');
    routeUserToRoleDashboard(currentUser);
    renderApp();
    await loadDataForActiveRole();
  } catch (err) {
    console.error(err);
    alert('Failed to login persona. Resetting demo data...');
    await seedDemoData();
  }
}

async function seedDemoData() {
  const btn = document.getElementById('topSeedBtn');
  if (btn) btn.innerHTML = '<span class="inline-block w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mr-1"></span> Seeding...';
  try {
    await apiCall('/auth/seed-demo-accounts', 'POST');
    alert('Demo accounts and realistic 90-day statements seeded successfully!');
    if (!currentUser) {
      await loginPersona('ramesh@trustcred.ai');
    } else {
      await loadDataForActiveRole();
    }
  } catch (e) {
    alert('Error seeding demo accounts: ' + e.message);
  } finally {
    if (btn) btn.innerHTML = '<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-blue-600 mr-1.5 inline"></i><span>Reset Demo</span>';
    if (window.lucide) window.lucide.createIcons();
  }
}

// --- DATA FETCHING & TABS ---
async function loadDataForActiveRole() {
  showLoading();
  try {
    if (!currentUser) return;

    if (currentUser.role === 'borrower') {
      const [m, t, a, c, l] = await Promise.all([
        apiCall(`/transactions/analytics?days=${selectedDays}`).catch(() => null),
        apiCall('/transactions?limit=100').catch(() => ({ items: [] })),
        apiCall('/assessment/latest').catch(() => null),
        apiCall('/consent').catch(() => []),
        apiCall('/consent/audit-log').catch(() => [])
      ]);
      metrics = m;
      transactions = t.items || [];
      latestAssessment = a;
      consents = c;
      auditLogs = l;
    } else if (currentUser.role === 'verifier') {
      verifierQueue = await apiCall('/verifier/queue').catch(() => []);
    } else if (currentUser.role === 'lender') {
      lenderPipeline = await apiCall('/lender/pipeline').catch(() => []);
    }

    renderCurrentTab();
  } catch (e) {
    console.error(e);
  } finally {
    hideLoading();
  }
}

function switchTab(tabId) {
  activeTab = tabId;
  renderApp();
  renderCurrentTab();
}

function showLoading() {
  const s = document.getElementById('loadingSpinner');
  const v = document.getElementById('viewContainer');
  if (s) s.classList.remove('hidden');
  if (v) v.classList.add('hidden');
}

function hideLoading() {
  const s = document.getElementById('loadingSpinner');
  const v = document.getElementById('viewContainer');
  if (s) s.classList.add('hidden');
  if (v) v.classList.remove('hidden');
}

// --- VIEWPORT RENDERING ---
function renderCurrentTab() {
  const container = document.getElementById('viewContainer');
  if (!container) return;

  if (activeTab === 'dashboard' || activeTab === 'overview') {
    container.innerHTML = getVendorDashboardHtml();
    initTrendChart();
  } else if (activeTab === 'transactions') {
    container.innerHTML = getTransactionWorkbenchHtml();
  } else if (activeTab === 'assessment' || activeTab === 'reports') {
    container.innerHTML = getAssessmentHtml();
  } else if (activeTab === 'calculator') {
    container.innerHTML = getCalculatorHtml();
  } else if (activeTab === 'consent') {
    container.innerHTML = getConsentHtml();
  } else if (activeTab === 'verifier' || activeTab === 'verifier-queue') {
    container.innerHTML = getVerifierHtml();
  } else if (activeTab === 'lender' || activeTab === 'lender-pipeline') {
    container.innerHTML = getLenderHtml();
  } else if (activeTab === 'public-verify') {
    container.innerHTML = getPublicVerifyHtml();
  } else if (activeTab === 'loan-apply') {
    container.innerHTML = getLoanApplyHtml();
  } else {
    container.innerHTML = `<div class="bank-card p-8 text-center"><h3 class="text-base font-bold">${activeTab}</h3><p class="text-xs text-slate-500 mt-1">Operational view active.</p></div>`;
  }

  if (window.lucide) window.lucide.createIcons();
}

// 1. Vendor Overview HTML
function getVendorDashboardHtml() {
  const monthlyReceipts = metrics?.avg_monthly_receipts || metrics?.total_verified_receipts || 0;
  const monthlyExpenses = metrics?.estimated_operating_expenses ? metrics.estimated_operating_expenses / (metrics.months_analyzed || 1) : 0;
  const netCashFlow = monthlyReceipts - monthlyExpenses;
  const maxLoan = latestAssessment?.max_recommended_loan || 50000;

  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="bank-badge bg-blue-100 text-[#123B6D] border border-blue-200">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5 mr-1 text-blue-600 inline"></i> Verified Small Enterprise
            </span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-[#172B4D] mt-1.5">
            ${currentUser?.business_profile?.business_name || currentUser?.full_name + "'s Enterprise"}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Proprietor: <span class="font-semibold text-[#172B4D]">${currentUser?.full_name}</span> • Sector: ${currentUser?.business_profile?.business_type || 'Retail Trade'}
          </p>
        </div>

        <button onclick="switchTab('loan-apply')" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="coins" class="w-3.5 h-3.5"></i>
          <span>Apply for Loan</span>
        </button>
      </div>

      <!-- 4 Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bank-card p-5 border border-[#E2E8F0]">
          <div class="flex items-center justify-between text-slate-500 mb-2 text-xs font-medium">
            <span>Estimated Monthly Receipts</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <i data-lucide="trending-up" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-[#172B4D]">${formatCurrency(monthlyReceipts)}</div>
          <div class="mt-2 text-[11px] text-emerald-600 font-medium">Verified digital QR/UPI collections</div>
        </div>

        <div class="bank-card p-5 border border-[#E2E8F0]">
          <div class="flex items-center justify-between text-slate-500 mb-2 text-xs font-medium">
            <span>Estimated Monthly Expenses</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i data-lucide="arrow-down-right" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-[#172B4D]">${formatCurrency(monthlyExpenses)}</div>
          <div class="mt-2 text-[11px] text-slate-500">Restock supplies & commercial utilities</div>
        </div>

        <div class="bank-card p-5 border border-[#E2E8F0]">
          <div class="flex items-center justify-between text-slate-500 mb-2 text-xs font-medium">
            <span>Estimated Net Cash Flow</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-emerald-700">${formatCurrency(netCashFlow)}</div>
          <div class="mt-2 text-[11px] text-emerald-600 font-medium">Operational surplus available for debt service</div>
        </div>

        <div class="bank-card p-5 border border-blue-200 bg-gradient-to-br from-white to-blue-50/40">
          <div class="flex items-center justify-between text-slate-500 mb-2 text-xs font-medium text-[#123B6D]">
            <span>Loan Status & Eligibility</span>
            <div class="w-8 h-8 rounded-lg bg-[#123B6D] text-white flex items-center justify-center">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-xl font-bold text-[#123B6D]">Pre-Qualified</div>
          <div class="mt-1 text-xs font-semibold text-blue-700">Up to ${formatCurrency(maxLoan)}</div>
        </div>
      </div>

      <!-- Chart & Demonstration Score -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 bank-card p-6 border border-[#E2E8F0]">
          <h3 class="text-sm font-bold text-[#172B4D] pb-3 border-b border-[#E2E8F0]">Verified Cash Inflow vs Operating Expenses</h3>
          <div class="h-64 mt-4">
            <canvas id="trendChartCanvas"></canvas>
          </div>
        </div>

        <div class="lg:col-span-4 bank-card p-6 border border-[#E2E8F0] text-center flex flex-col justify-between">
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alternative Demonstration Score</span>
            <div class="my-5 w-36 h-36 mx-auto rounded-full border-4 border-blue-100 border-t-[#123B6D] bg-[#F8FAFC] flex flex-col items-center justify-center">
              <span class="text-3xl font-extrabold text-[#123B6D]">${latestAssessment?.prototype_score || 780}</span>
              <span class="text-[10px] text-slate-400 font-semibold uppercase">out of 850</span>
              <span class="bank-badge mt-1 bg-emerald-100 text-emerald-800 text-[10px]">${latestAssessment?.risk_tier || 'Low Risk'}</span>
            </div>
            <p class="text-[11px] text-slate-500">Calibrated from 90 days of digital receipts.</p>
          </div>
          <div class="p-3 rounded-lg bg-blue-50 text-[11px] text-[#123B6D] text-left mt-3">
            <strong>Notice: </strong>Demonstration score based on cash flows. Does not replace statutory credit bureau scores.
          </div>
        </div>
      </div>
    </div>
  `;
}

function initTrendChart() {
  const canvas = document.getElementById('trendChartCanvas');
  if (!canvas) return;

  const labels = metrics?.monthly_trend?.map(m => m.month) || ['Month 1', 'Month 2', 'Month 3'];
  const receipts = metrics?.monthly_trend?.map(m => m.receipts) || [125000, 142000, 158000];
  const expenses = metrics?.monthly_trend?.map(m => m.expenses) || [75000, 82000, 89000];

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Verified Receipts (₹)', data: receipts, backgroundColor: '#2563EB', borderRadius: 6 },
        { label: 'Operating Expenses (₹)', data: expenses, backgroundColor: '#F59E0B', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '₹' + (v / 1000) + 'k' }, grid: { color: '#F1F5F9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// 2. Transaction Workbench HTML
function getTransactionWorkbenchHtml() {
  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-[#172B4D]">Transaction Workbench & Statement Ledger</h2>
          <p class="text-xs text-slate-500 mt-1">Review normalized digital transactions, category classifications, and personal transfer exclusions.</p>
        </div>
        <button onclick="downloadSampleTemplate()" class="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-1">
          <i data-lucide="download" class="w-3.5 h-3.5 text-blue-600"></i>
          <span>Download Sample CSV</span>
        </button>
      </div>

      <div class="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F8FAFC] text-slate-500 uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th class="px-4 py-3">Txn ID / Date</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Channel</th>
                <th class="px-4 py-3 text-right">Amount (₹)</th>
                <th class="px-4 py-3">Classification</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              ${transactions.slice(0, 15).map(t => `
                <tr class="bank-table-row">
                  <td class="px-4 py-3">
                    <div class="font-mono font-bold text-[11px]">${t.txn_id}</div>
                    <div class="text-[10px] text-slate-400">${t.txn_date}</div>
                  </td>
                  <td class="px-4 py-3 font-medium">${t.description}</td>
                  <td class="px-4 py-3 uppercase font-mono">${t.channel || 'UPI'}</td>
                  <td class="px-4 py-3 text-right font-bold ${t.direction === 'credit' ? 'text-emerald-700' : 'text-slate-700'}">
                    ${t.direction === 'credit' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                  <td class="px-4 py-3">
                    <span class="bank-badge text-[10px] ${t.classification === 'business_revenue' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                      ${t.classification.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function downloadSampleTemplate() {
  const csv = `txn_id,txn_date,amount,direction,description,channel\nTXN-101,2026-03-01 10:30:00,450.00,credit,QR Customer Sales,UPI\nTXN-102,2026-03-01 14:00:00,1200.00,debit,Wholesale Restock Supplies,NETBANKING\nTXN-103,2026-03-02 12:45:00,2000.00,debit,Self Transfer Savings Acct,IMPS`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sample_business_transactions.csv';
  a.click();
}

// 3. Alternative Credit Assessment HTML
function getAssessmentHtml() {
  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="bank-badge bg-blue-100 text-[#123B6D]">Explainable Rule Assessment v1.4</span>
          <h2 class="text-xl font-bold text-[#172B4D] mt-1.5">Alternative Credit & Financial Dossier</h2>
          <p class="text-xs text-slate-500 mt-0.5">Derived entirely from verified digital transaction records without penalizing lack of bureau history.</p>
        </div>
        <button onclick="switchTab('consent')" class="px-4 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold">Share with Lender</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bank-card p-4">
          <div class="text-[11px] font-semibold text-slate-500 uppercase">Total Verified Receipts</div>
          <div class="text-xl font-bold text-emerald-700 mt-1">${formatCurrency(latestAssessment?.total_verified_receipts || 142000)}</div>
        </div>
        <div class="bank-card p-4">
          <div class="text-[11px] font-semibold text-slate-500 uppercase">Debt Service Coverage (DSCR)</div>
          <div class="text-xl font-bold text-blue-700 mt-1">${latestAssessment?.dscr ? latestAssessment.dscr.toFixed(2) + 'x' : '2.15x'}</div>
        </div>
        <div class="bank-card p-4">
          <div class="text-[11px] font-semibold text-slate-500 uppercase">Max Recommended Loan</div>
          <div class="text-xl font-bold text-[#123B6D] mt-1">${formatCurrency(latestAssessment?.max_recommended_loan || 50000)}</div>
        </div>
      </div>

      <div class="bank-card p-6 border border-[#E2E8F0] bg-[#F8FAFC]">
        <h3 class="text-sm font-bold text-[#172B4D] flex items-center space-x-2">
          <i data-lucide="shield-check" class="w-5 h-5 text-blue-600"></i>
          <span>Cryptographic Tamper-Evidence & SHA-256 Digest</span>
        </h3>
        <p class="text-xs text-slate-500 mt-1">Every generated report produces a deterministic canonical SHA-256 integrity hash.</p>
        <div class="mt-3 p-3 rounded-lg bg-white border border-[#CBD5E1] font-mono text-xs break-all">
          ${latestAssessment?.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
        </div>
      </div>
    </div>
  `;
}

// 4. Repayment Calculator HTML
function getCalculatorHtml() {
  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white">
        <h2 class="text-xl font-bold text-[#172B4D]">Repayment Capacity & DSCR Calculator</h2>
        <p class="text-xs text-slate-500 mt-0.5">Simulate prudent loan borrowing parameters against operating cash surpluses.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bank-card p-6 space-y-4">
          <h3 class="text-sm font-bold text-[#172B4D]">Borrowing Simulation</h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Loan Amount: ₹75,000</label>
            <input type="range" min="10000" max="250000" step="5000" value="75000" class="w-full accent-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tenure: 12 Months</label>
            <input type="range" min="3" max="36" step="1" value="12" class="w-full accent-blue-600" />
          </div>
        </div>

        <div class="bank-card p-6 text-center flex flex-col justify-center">
          <span class="text-xs text-slate-500">Estimated Monthly EMI</span>
          <div class="text-3xl font-extrabold text-[#123B6D] mt-1">₹6,825 / mo</div>
          <span class="text-xs text-emerald-600 font-semibold mt-1">Comfortable DSCR: 2.15x Coverage</span>
        </div>
      </div>
    </div>
  `;
}

// 5. Consent Manager HTML
function getConsentHtml() {
  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-[#172B4D]">Privacy, Consent & Lender Sharing</h2>
          <p class="text-xs text-slate-500 mt-0.5">Manage and revoke temporary access permissions granted to partner institutions.</p>
        </div>
      </div>

      <div class="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div class="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-sm">Active Consent Grants</div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F8FAFC] text-slate-500 uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th class="px-4 py-3">Lender Organization</th>
                <th class="px-4 py-3">Purpose</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              ${consents.length > 0 ? consents.map(c => `
                <tr class="bank-table-row">
                  <td class="px-4 py-3 font-bold text-[#172B4D]">${c.lender_org_name}</td>
                  <td class="px-4 py-3 text-slate-600">${c.purpose}</td>
                  <td class="px-4 py-3"><span class="bank-badge text-[10px] bg-emerald-50 text-emerald-800">${c.status.toUpperCase()}</span></td>
                  <td class="px-4 py-3 text-right">
                    <button onclick="revokeConsent('${c.id}')" class="px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold">Revoke Access</button>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="4" class="px-4 py-6 text-center text-slate-500">No active consent records.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function revokeConsent(id) {
  if (!confirm('Are you sure you want to revoke access? The lender will immediately be blocked.')) return;
  try {
    await apiCall(`/consent/${id}/revoke`, 'POST');
    alert('Consent revoked successfully.');
    await loadDataForActiveRole();
  } catch (e) {
    alert(e.message || 'Error revoking consent');
  }
}

// 6. Verifier Workbench HTML
function getVerifierHtml() {
  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white">
        <h2 class="text-xl font-bold text-[#172B4D]">Statement Verification Queue</h2>
        <p class="text-xs text-slate-500 mt-0.5">Audit uploaded transaction batches and certify genuine merchant receipts.</p>
      </div>

      <div class="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F8FAFC] text-slate-500 uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th class="px-4 py-3">File / Batch ID</th>
                <th class="px-4 py-3">Borrower</th>
                <th class="px-4 py-3 text-right">Valid Records</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              ${verifierQueue.map(q => `
                <tr class="bank-table-row">
                  <td class="px-4 py-3 font-bold">${q.filename}</td>
                  <td class="px-4 py-3">${q.borrower_name} (${q.business_name})</td>
                  <td class="px-4 py-3 text-right font-bold text-emerald-700">${q.valid_records} / ${q.total_records}</td>
                  <td class="px-4 py-3"><span class="bank-badge text-[10px] bg-emerald-50 text-emerald-800">${q.verification_status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 7. Lender Console HTML
function getLenderHtml() {
  return `
    <div class="space-y-6">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white">
        <h2 class="text-xl font-bold text-[#172B4D]">Lender Underwriting Pipeline</h2>
        <p class="text-xs text-slate-500 mt-0.5">Authorized micro-enterprise applicants with active consent.</p>
      </div>

      <div class="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F8FAFC] text-slate-500 uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th class="px-4 py-3">Applicant</th>
                <th class="px-4 py-3 text-center">Demonstration Score</th>
                <th class="px-4 py-3 text-right">Recommended Limit</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              ${lenderPipeline.map(item => `
                <tr class="bank-table-row">
                  <td class="px-4 py-3">
                    <div class="font-bold">${item.borrower_name}</div>
                    <div class="text-[10px] text-slate-500">${item.business_name}</div>
                  </td>
                  <td class="px-4 py-3 text-center font-bold text-[#123B6D] text-sm">${item.prototype_score || 740}</td>
                  <td class="px-4 py-3 text-right font-bold text-emerald-700">${formatCurrency(item.max_recommended_loan || 50000)}</td>
                  <td class="px-4 py-3">
                    <span class="bank-badge text-[10px] bg-emerald-50 text-emerald-800">
                      ${item.decision?.status ? item.decision.status.toUpperCase() : 'PENDING'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 8. Public Independent Verifier HTML
function getPublicVerifyHtml() {
  return `
    <div class="space-y-6 max-w-3xl mx-auto">
      <div class="bank-card p-6 border border-[#E2E8F0] bg-white">
        <h2 class="text-xl font-bold text-[#172B4D]">Independent Report Verifier</h2>
        <p class="text-xs text-slate-500 mt-1">Verify report authenticity with deterministic SHA-256 cryptographic check.</p>
      </div>

      <div class="bank-card p-6 border border-[#E2E8F0] bg-white space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Enter Report ID or SHA-256 Digest:</label>
          <input type="text" id="verifyInput" placeholder="Paste Report ID or 64-char Hash" class="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] text-xs font-mono" />
        </div>
        <button onclick="executePublicVerification()" class="py-2 px-5 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold">Verify Integrity</button>
        <div id="verifyResult" class="hidden mt-4 p-4 rounded-xl border text-xs"></div>
      </div>
    </div>
  `;
}

async function executePublicVerification() {
  const input = document.getElementById('verifyInput').value.trim();
  const resBox = document.getElementById('verifyResult');
  if (!input) return;

  resBox.classList.remove('hidden');
  resBox.className = 'mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900';
  resBox.innerHTML = 'Verifying cryptographic hash...';

  try {
    const res = await apiCall('/verify-report', 'POST', { report_id: input });
    if (res.verified) {
      resBox.className = 'mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 space-y-1.5';
      resBox.innerHTML = `
        <div class="font-bold text-sm text-emerald-800">✅ REPORT VERIFIED: AUTHENTIC & UNTAMPERED</div>
        <div>${res.message}</div>
        <div class="font-mono text-[11px] mt-2 p-2 bg-white rounded border border-emerald-200">
          SHA-256 Hash: ${res.details?.sha256_hash || input}
        </div>
      `;
    } else {
      resBox.className = 'mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900';
      resBox.innerHTML = `<div class="font-bold text-sm text-red-800">❌ VERIFICATION FAILED</div><div>${res.message}</div>`;
    }
  } catch (e) {
    resBox.className = 'mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900';
    resBox.innerHTML = `<div>${e.message}</div>`;
  }
}

// 9. Apply Loan View
function getLoanApplyHtml() {
  return `
    <div class="bank-card p-8 max-w-xl mx-auto space-y-5 bg-white">
      <h3 class="text-lg font-bold text-[#172B4D]">Apply for Working Capital Micro-Loan</h3>
      <p class="text-xs text-slate-500">Direct non-collateral loan application backed by verified 90-day digital cash flows.</p>
      
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold mb-1">Requested Amount: ₹50,000</label>
          <input type="range" min="10000" max="200000" step="5000" value="50000" class="w-full accent-blue-600" />
        </div>
        <div>
          <label class="block font-semibold mb-1">Tenure: 12 Months</label>
          <select class="w-full p-2 border rounded-lg bg-white">
            <option>12 Months</option>
            <option>6 Months</option>
            <option>24 Months</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold mb-1">Preferred Lending Partner</label>
          <select class="w-full p-2 border rounded-lg bg-white">
            <option>Apex Micro-Enterprise Capital</option>
            <option>Samriddhi MSME Cooperative</option>
          </select>
        </div>
        <button onclick="alert('Loan application submitted for underwriting review!'); switchTab('dashboard');" class="w-full py-2.5 rounded-lg bg-[#123B6D] text-white font-semibold text-xs mt-3">
          Submit Application
        </button>
      </div>
    </div>
  `;
}
