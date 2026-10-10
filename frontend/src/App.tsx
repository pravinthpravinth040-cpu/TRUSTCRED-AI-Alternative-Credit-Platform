import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegistrationPage } from './components/RegistrationPage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { VendorDashboard } from './components/VendorDashboard';
import { TransactionWorkbench } from './components/TransactionWorkbench';
import { CreditAssessmentView } from './components/CreditAssessmentView';
import { RepaymentCalculator } from './components/RepaymentCalculator';
import { ConsentManager } from './components/ConsentManager';
import { VerifierWorkbench } from './components/VerifierWorkbench';
import { LenderConsole } from './components/LenderConsole';
import { PublicReportVerifier } from './components/PublicReportVerifier';
import { AdminDashboard } from './components/AdminDashboard';
import { ApplyLoanModal } from './components/ApplyLoanModal';
import { LoadingState, ErrorState } from './components/common/LoadingState';
import { 
  User, 
  FinancialMetrics, 
  AssessmentReport, 
  Transaction, 
  ConsentGrant, 
  AuditLogItem, 
  VerifierQueueItem, 
  LenderPipelineItem 
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isInitializingAuth, setIsInitializingAuth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);

  // Financial & platform data states
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentReport | null>(null);
  const [consents, setConsents] = useState<ConsentGrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [verifierQueue, setVerifierQueue] = useState<VerifierQueueItem[]>([]);
  const [lenderPipeline, setLenderPipeline] = useState<LenderPipelineItem[]>([]);
  const [selectedDays, setSelectedDays] = useState<number | null>(90);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingSeed, setIsLoadingSeed] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Safe Authentication Initialization on Mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const savedToken = localStorage.getItem('trustcred_token');
      if (!savedToken) {
        setIsInitializingAuth(false);
        return;
      }

      try {
        const user = await api.getMe();
        setCurrentUser(user);
        routeUserToRoleDashboard(user);
        await refreshAllData(user);
      } catch (err) {
        console.warn('Session expired or invalid, displaying login page:', err);
        localStorage.removeItem('trustcred_token');
        setCurrentUser(null);
      } finally {
        setIsInitializingAuth(false);
      }
    };

    checkExistingSession();
  }, []);

  // Helper to direct user to authorized role dashboard
  const routeUserToRoleDashboard = (user: User) => {
    if (user.role === 'verifier') {
      setActiveTab('verifier');
    } else if (user.role === 'lender') {
      setActiveTab('lender');
    } else if (user.role === 'admin') {
      setActiveTab('admin-overview');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Switch Active Demo Persona
  const handleSwitchPersona = async (email: string) => {
    setIsLoading(true);
    try {
      let loginRes;
      try {
        loginRes = await api.login(email, 'trustcred123');
      } catch (e) {
        // If accounts don't exist yet, seed them!
        await api.seedDemoAccounts();
        loginRes = await api.login(email, 'trustcred123');
      }

      localStorage.setItem('trustcred_token', loginRes.access_token);
      const meRes = await api.getMe();
      setCurrentUser(meRes);
      routeUserToRoleDashboard(meRes);

      await refreshAllData(meRes);
      showToast(`Switched active role to ${meRes.full_name} (${meRes.role.toUpperCase()})`);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Persona switch failed. Click Reset Demo Data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Seed Demo Accounts & Initial Setup
  const handleSeedDemo = async () => {
    setIsLoadingSeed(true);
    try {
      await api.seedDemoAccounts();
      showToast('Demo personas and realistic 90-day statements seeded successfully!');
      if (currentUser) {
        await refreshAllData(currentUser);
      } else {
        await handleSwitchPersona('ramesh@trustcred.ai');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Error seeding demo data: ' + e.message, 'error');
    } finally {
      setIsLoadingSeed(false);
    }
  };

  // Refresh Data for Active Role
  const refreshAllData = async (user?: User) => {
    const u = user || currentUser;
    if (!u) return;

    try {
      if (u.role === 'borrower') {
        const [mRes, tRes, aRes, cRes, logRes] = await Promise.all([
          api.getAnalytics(selectedDays || undefined).catch(() => null),
          api.getTransactions({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
          api.getLatestAssessment().catch(() => null),
          api.listConsents().catch(() => []),
          api.getAuditLogs().catch(() => [])
        ]);

        if (mRes) setMetrics(mRes);
        if (tRes) {
          setTransactions(tRes.items || []);
          setTotalTransactions(tRes.total || 0);
        }
        if (aRes) setLatestAssessment(aRes);
        if (cRes) setConsents(cRes);
        if (logRes) setAuditLogs(logRes);
      } else if (u.role === 'verifier') {
        const qRes = await api.getVerifierQueue().catch(() => []);
        setVerifierQueue(qRes);
      } else if (u.role === 'lender') {
        const pRes = await api.getLenderPipeline().catch(() => []);
        setLenderPipeline(pRes);
      } else if (u.role === 'admin') {
        const logRes = await api.getAuditLogs().catch(() => []);
        if (logRes) setAuditLogs(logRes);
      }
    } catch (e) {
      console.error('Data refresh error:', e);
    }
  };

  // Action Handlers
  const handleFilterDays = async (days: number | null) => {
    setSelectedDays(days);
    try {
      const m = await api.getAnalytics(days || undefined);
      setMetrics(m);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    try {
      const res = await api.uploadStatement(file);
      showToast(`Statement '${file.name}' processed: ${res.summary.valid_records} valid records found.`);
      await refreshAllData();
      setActiveTab('transactions');
    } catch (e: any) {
      showToast(e.message || 'File upload failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async (persona: string) => {
    setIsLoading(true);
    try {
      await api.loadSample(persona);
      showToast(`Realistic 90-day statement loaded for ${persona}!`);
      await refreshAllData();
      setActiveTab('dashboard');
    } catch (e: any) {
      showToast(e.message || 'Failed to load sample', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverrideClassification = async (txnId: string, classification: string) => {
    await api.overrideClassification(txnId, classification);
    showToast('Transaction reclassified successfully.');
    await refreshAllData();
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.generateAssessment();
      setLatestAssessment(res.report ? {
        ...res.report,
        ...res.assessment,
        prototype_score: res.assessment.prototype_score
      } : res);
      showToast('Assessment recomputed and cryptographically signed.');
      await refreshAllData();
    } catch (e: any) {
      showToast(e.message || 'Report generation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantConsent = async (lenderOrgName: string, purpose: string, validityDays: number) => {
    if (!latestAssessment) throw new Error('No assessment to share');
    await api.grantConsent(latestAssessment.id || latestAssessment.report_id, lenderOrgName, purpose, validityDays);
    showToast(`Access granted to ${lenderOrgName}.`);
    await refreshAllData();
  };

  const handleRevokeConsent = async (consentId: string) => {
    await api.revokeConsent(consentId);
    showToast('Lender access revoked. Future access is blocked.');
    await refreshAllData();
  };

  const handleVerifyBatch = async (batchId: string, status: string, notes?: string) => {
    await api.verifyBatch(batchId, status, notes);
    showToast(`Batch marked as '${status.toUpperCase()}'.`);
    await refreshAllData();
  };

  const handleRecordLenderDecision = async (reportId: string, decisionData: any) => {
    await api.recordLenderDecision(reportId, decisionData);
    showToast(`Lending decision recorded as '${decisionData.decision.toUpperCase()}'.`);
    await refreshAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('trustcred_token');
    setCurrentUser(null);
    setAuthView('login');
    showToast('You have been securely signed out.', 'info');
  };

  const handleLoginSuccess = async (user: User, token: string) => {
    setCurrentUser(user);
    routeUserToRoleDashboard(user);
    showToast(`Welcome back, ${user.full_name}!`);
    await refreshAllData(user);
  };

  const handleRegisterSuccess = async (user: User, token: string) => {
    setCurrentUser(user);
    routeUserToRoleDashboard(user);
    showToast(`Account created successfully! Welcome to TRUSTCRED AI.`);
    await refreshAllData(user);
  };

  // 1. Initial Auth Loading Screen (never hangs indefinitely)
  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
        <LoadingState 
          message="Connecting to TRUSTCRED AI..." 
          subtext="Initializing secure banking session" 
        />
      </div>
    );
  }

  // 2. Unauthenticated State: Professional Banking Login or Registration Page
  if (!currentUser) {
    if (authView === 'register') {
      return (
        <RegistrationPage
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  // 3. Authenticated State: Full Banking Portal with Collapsible Sidebar & Topbar
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col md:flex-row text-text-main font-sans selection:bg-blue-500/20">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
          notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : notification.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Banking Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Topbar */}
        <Topbar
          currentUser={currentUser}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onSwitchPersona={handleSwitchPersona}
          onSeedDemo={handleSeedDemo}
          isLoadingSeed={isLoadingSeed}
          onLogout={handleLogout}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Vendor Views */}
          {(activeTab === 'dashboard' || activeTab === 'overview') && (
            <VendorDashboard
              currentUser={currentUser}
              metrics={metrics}
              assessment={latestAssessment}
              selectedDays={selectedDays}
              onFilterDays={handleFilterDays}
              onUploadFile={handleUploadFile}
              onLoadSample={handleLoadSample}
              onNavigateTab={setActiveTab}
              onOpenLoanModal={() => setShowLoanModal(true)}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'business' && (
            <div className="bank-card p-6 border border-[#E2E8F0] bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-base font-bold text-[#172B4D]">
                  {currentUser.business_profile?.business_name || 'My Enterprise Profile'}
                </h3>
                <span className="bank-badge bg-blue-50 text-blue-700 border border-blue-200">
                  {currentUser.business_profile?.business_type || 'Retail Trade'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-text-secondary block">Enterprise Proprietor:</span>
                  <span className="font-bold text-text-main text-sm">{currentUser.full_name}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-text-secondary block">Trading Location:</span>
                  <span className="font-bold text-text-main text-sm">{currentUser.business_profile?.address || 'Verified Commercial Location'}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-text-secondary block">Contact Number:</span>
                  <span className="font-bold text-text-main text-sm">{currentUser.business_profile?.phone || '+91 98765 43210'}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-text-secondary block">Years in Active Trade:</span>
                  <span className="font-bold text-text-main text-sm">{currentUser.business_profile?.years_in_business || 2.5} Years</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="px-4 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold"
                >
                  View Digital Transactions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <TransactionWorkbench
              transactions={transactions}
              totalTransactions={totalTransactions}
              onOverrideClassification={handleOverrideClassification}
              isLoading={isLoading}
              onRefresh={() => refreshAllData()}
            />
          )}

          {(activeTab === 'assessment' || activeTab === 'reports') && (
            <CreditAssessmentView
              assessment={latestAssessment}
              currentUser={currentUser}
              onGenerateReport={handleGenerateReport}
              onGrantConsent={() => setActiveTab('consent')}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'loan-apply' && (
            <div className="bank-card p-6 border border-[#E2E8F0] bg-white">
              <h3 className="text-base font-bold text-[#172B4D] mb-4">
                Working Capital Loan Facility
              </h3>
              <p className="text-xs text-text-secondary mb-6">
                Apply for non-collateral working capital financing supported by your verified 90-day digital QR and UPI sales cash flow history.
              </p>
              <button
                onClick={() => setShowLoanModal(true)}
                className="px-5 py-2.5 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-bold transition shadow-xs"
              >
                Open Loan Application Form
              </button>
            </div>
          )}

          {activeTab === 'calculator' && (
            <RepaymentCalculator
              metrics={metrics}
            />
          )}

          {activeTab === 'consent' && (
            <ConsentManager
              consents={consents}
              auditLogs={auditLogs}
              latestAssessment={latestAssessment}
              currentUser={currentUser}
              onGrantConsent={handleGrantConsent}
              onRevokeConsent={handleRevokeConsent}
              onPreviewReport={() => setActiveTab('assessment')}
              isLoading={isLoading}
              onRefresh={() => refreshAllData()}
            />
          )}

          {/* Verifier Views */}
          {(activeTab === 'verifier' || activeTab === 'verifier-queue' || activeTab === 'verifier-integrity' || activeTab === 'verifier-history') && (
            <VerifierWorkbench
              queue={verifierQueue}
              onVerifyBatch={handleVerifyBatch}
              isLoading={isLoading}
              onRefresh={() => refreshAllData()}
            />
          )}

          {/* Lender Views */}
          {(activeTab === 'lender' || activeTab === 'lender-pipeline' || activeTab === 'lender-assessment' || activeTab === 'lender-reports' || activeTab === 'lender-decisions') && (
            <LenderConsole
              pipeline={lenderPipeline}
              onRecordDecision={handleRecordLenderDecision}
              isLoading={isLoading}
              onRefresh={() => refreshAllData()}
            />
          )}

          {/* Admin Views */}
          {(activeTab.startsWith('admin-')) && (
            <AdminDashboard
              currentUser={currentUser}
              auditLogs={auditLogs}
              onRefresh={() => refreshAllData()}
              isLoading={isLoading}
            />
          )}

          {/* Independent Verifier View */}
          {activeTab === 'public-verify' && (
            <PublicReportVerifier />
          )}

          {/* Settings / Help Views */}
          {(activeTab === 'settings' || activeTab === 'help') && (
            <div className="bank-card p-8 border border-[#E2E8F0] bg-white text-center max-w-lg mx-auto">
              <h3 className="text-base font-bold text-[#172B4D]">
                {activeTab === 'settings' ? 'Account & Security Settings' : 'Support & Knowledge Center'}
              </h3>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                {activeTab === 'settings' 
                  ? 'Manage authentication protocols, Argon2id passwords, and institutional data sharing policies.'
                  : 'For assistance with statement parsing or lender loan reviews, contact support@trustcred.ai.'
                }
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-lg bg-[#123B6D] text-white text-xs font-semibold"
                >
                  Return to Financial Overview
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Banking Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white py-4 px-6 text-xs text-text-secondary mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div>
              <span className="font-bold text-[#123B6D]">TRUSTCRED AI</span>
              <span className="hidden sm:inline"> — Privacy-Preserving Alternative Credit Scoring & Income Verification Platform</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-text-secondary">
              <span>Argon2id Passwords</span>
              <span>•</span>
              <span>SHA-256 Digest Integrity</span>
              <span>•</span>
              <span>HMAC Platform Signatures</span>
              <span>•</span>
              <span>DSCR Solvency Engine</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Apply Loan Modal */}
      <ApplyLoanModal
        currentUser={currentUser}
        assessment={latestAssessment}
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        onSubmitSuccess={(app) => {
          showToast(`Loan application of ₹${app.loanAmount.toLocaleString('en-IN')} submitted to ${app.lenderPartner}!`);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
};

export default App;
