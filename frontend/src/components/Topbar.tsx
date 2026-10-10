import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  RefreshCw, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Check, 
  ExternalLink,
  Lock,
  Building
} from 'lucide-react';
import { User } from '../types';

interface TopbarProps {
  currentUser: User | null;
  activeTab: string;
  onOpenMobileMenu: () => void;
  onSwitchPersona: (email: string) => void;
  onSeedDemo: () => void;
  isLoadingSeed: boolean;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  activeTab,
  onOpenMobileMenu,
  onSwitchPersona,
  onSeedDemo,
  isLoadingSeed,
  onLogout
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const demoPersonas = [
    { label: '🏪 Ramesh Kumar (Kirana)', email: 'ramesh@trustcred.ai', role: 'Vendor' },
    { label: '🍲 Priya Sharma (Street Food)', email: 'priya@trustcred.ai', role: 'Vendor' },
    { label: '🚚 Anil Verma (Freight)', email: 'anil@trustcred.ai', role: 'Vendor' },
    { label: '🛡️ Rajesh Sen (Verifier)', email: 'verifier@trustcred.ai', role: 'Verifier' },
    { label: '🏦 Meera Kapoor (Lender)', email: 'lender@trustcred.ai', role: 'Lender' },
  ];

  // Friendly title mapping
  const titleMap: Record<string, { title: string; category: string }> = {
    'dashboard': { title: 'Financial Overview', category: 'Vendor Portal' },
    'business': { title: 'My Enterprise Profile', category: 'Vendor Portal' },
    'transactions': { title: 'Transaction Workbench', category: 'Cash Flow Analysis' },
    'assessment': { title: 'Alternative Credit Assessment', category: 'Credit Dossier' },
    'loan-apply': { title: 'Apply for Business Loan', category: 'Working Capital' },
    'calculator': { title: 'Repayment Capacity Calculator', category: 'DSCR Affordability' },
    'reports': { title: 'Financial Evidence Reports', category: 'Audit Dossiers' },
    'consent': { title: 'Privacy & Sharing Consent', category: 'Access Control' },
    'public-verify': { title: 'Independent Report Verifier', category: 'Cryptographic Audit' },
    'settings': { title: 'Account Settings', category: 'Configuration' },
    'help': { title: 'Help & Knowledge Center', category: 'Support' },
    'lender': { title: 'Lender Underwriting Overview', category: 'Institutional Portal' },
    'lender-pipeline': { title: 'Loan Application Pipeline', category: 'Institutional Portal' },
    'lender-assessment': { title: 'Applicant Credit Dossiers', category: 'Institutional Portal' },
    'lender-reports': { title: 'Verified Cryptographic Reports', category: 'Institutional Portal' },
    'lender-decisions': { title: 'Underwriting Decisions', category: 'Institutional Portal' },
    'verifier': { title: 'Verification Operations Queue', category: 'Verification Agency' },
    'verifier-queue': { title: 'Statement Anomaly Audits', category: 'Verification Agency' },
    'verifier-integrity': { title: 'Report Cryptographic Integrity', category: 'Verification Agency' },
    'verifier-history': { title: 'Historical Audit Verifications', category: 'Verification Agency' },
    'admin-overview': { title: 'Platform Administration', category: 'System Operations' },
    'admin-users': { title: 'User & Organization Management', category: 'System Operations' },
    'admin-stats': { title: 'Credit Platform Statistics', category: 'System Operations' },
    'admin-health': { title: 'Platform Health & Security', category: 'System Operations' },
  };

  const currentView = titleMap[activeTab] || { title: 'TRUSTCRED AI', category: 'Portal' };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Page Title / Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-text-main hover:bg-slate-100"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-[11px] text-text-secondary font-medium">
            <span>{currentView.category}</span>
            <span>/</span>
            <span className="text-[#123B6D] font-semibold">{currentView.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#172B4D] leading-tight">
            {currentView.title}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Demo Switcher, Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Reset Demo Data button */}
        <button
          onClick={onSeedDemo}
          disabled={isLoadingSeed}
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-text-secondary hover:text-text-main hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          title="Reset demonstration database to factory 90-day statements"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingSeed ? 'animate-spin' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* 1-Click Demo Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/60 text-xs font-semibold text-blue-700 transition cursor-pointer"
          >
            <span className="hidden md:inline text-[11px] font-normal text-blue-600 mr-0.5">Role:</span>
            <span className="truncate max-w-[120px]">{currentUser?.full_name?.split(' ')[0] || 'Persona'}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-64 bank-card shadow-xl p-2 z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-[#E2E8F0] mb-1">
                Switch Demo Persona
              </div>
              <div className="space-y-1">
                {demoPersonas.map((p) => {
                  const isCurrent = currentUser?.email === p.email;
                  return (
                    <button
                      key={p.email}
                      onClick={() => {
                        setShowPersonaMenu(false);
                        onSwitchPersona(p.email);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                        isCurrent ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-text-main hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div>{p.label}</div>
                        <div className="text-[10px] text-text-secondary">{p.role}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-text-main hover:bg-slate-100 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bank-card shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold text-text-main">System Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="divide-y divide-[#E2E8F0] py-1 text-xs">
                <div className="py-2.5 space-y-0.5">
                  <div className="font-semibold text-text-main text-[11px] flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    Statement Verified
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">
                    Your 90-day digital QR transaction batch was verified with 100% cryptographic integrity.
                  </p>
                  <span className="text-[9px] text-slate-400">10 mins ago</span>
                </div>
                <div className="py-2.5 space-y-0.5">
                  <div className="font-semibold text-text-main text-[11px] flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                    Consent Active
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">
                    Apex Micro-Enterprise Capital was granted access to your alternative cash-flow dossier.
                  </p>
                  <span className="text-[9px] text-slate-400">2 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bank-card shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                <p className="text-xs font-bold text-text-main truncate">{currentUser?.full_name}</p>
                <p className="text-[11px] text-text-secondary truncate">{currentUser?.email}</p>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3 py-1.5 rounded-md text-xs text-text-secondary hover:text-text-main hover:bg-slate-50 flex items-center space-x-2"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profile Overview</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
