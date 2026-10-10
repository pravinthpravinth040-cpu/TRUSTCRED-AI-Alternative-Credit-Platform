import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Store, 
  Receipt, 
  FileCheck2, 
  Coins, 
  Calculator, 
  FileText, 
  Lock, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Users, 
  Activity, 
  History, 
  ShieldAlert, 
  Briefcase, 
  SearchCheck,
  CheckCircle,
  FileSearch,
  Scale
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onLogout
}) => {
  const role = currentUser?.role || 'borrower';

  // Vendor navigation items
  const vendorNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'business', label: 'My Business', icon: Store },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'assessment', label: 'Financial Assessment', icon: FileCheck2 },
    { id: 'loan-apply', label: 'Apply for Loan', icon: Coins },
    { id: 'calculator', label: 'Repayment Calculator', icon: Calculator },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
    { id: 'consent', label: 'Privacy & Consent', icon: Lock },
    { id: 'public-verify', label: 'Verify Report', icon: SearchCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  // Lender navigation items
  const lenderNav = [
    { id: 'lender', label: 'Overview', icon: LayoutDashboard },
    { id: 'lender-pipeline', label: 'Loan Applications', icon: Briefcase },
    { id: 'lender-assessment', label: 'Applicant Assessments', icon: FileCheck2 },
    { id: 'lender-reports', label: 'Verified Reports', icon: FileText },
    { id: 'lender-decisions', label: 'Decisions', icon: Scale },
    { id: 'consent', label: 'Audit History', icon: History },
    { id: 'public-verify', label: 'Verify Report Integrity', icon: SearchCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Verifier navigation items
  const verifierNav = [
    { id: 'verifier', label: 'Overview', icon: LayoutDashboard },
    { id: 'verifier-queue', label: 'Verification Queue', icon: FileSearch },
    { id: 'verifier-integrity', label: 'Report Integrity', icon: ShieldCheck },
    { id: 'verifier-history', label: 'Verification History', icon: History },
    { id: 'public-verify', label: 'Independent Verifier', icon: SearchCheck },
  ];

  // Admin navigation items
  const adminNav = [
    { id: 'admin-overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'admin-users', label: 'User Management', icon: Users },
    { id: 'admin-stats', label: 'Application Statistics', icon: Activity },
    { id: 'admin-health', label: 'System Health', icon: ShieldAlert },
    { id: 'consent', label: 'Audit Logs', icon: History },
    { id: 'public-verify', label: 'Verify Reports', icon: SearchCheck },
  ];

  let navItems = vendorNav;
  if (role === 'lender') navItems = lenderNav;
  else if (role === 'verifier') navItems = verifierNav;
  else if (role === 'admin') navItems = adminNav;

  const handleSelectNav = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const roleDisplay = 
    role === 'borrower' ? 'Vendor' :
    role === 'lender' ? 'Lender Underwriter' :
    role === 'verifier' ? 'Financial Verifier' : 'Administrator';

  const roleColorBadge =
    role === 'borrower' ? 'bg-blue-100 text-blue-800 border-blue-200' :
    role === 'lender' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
    role === 'verifier' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
    'bg-purple-100 text-purple-800 border-purple-200';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-300 ease-in-out md:static ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#123B6D] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-[#123B6D] flex items-center space-x-1.5">
                  <span>TRUSTCRED</span>
                  <span className="text-blue-600 font-extrabold">AI</span>
                </span>
                <span className="text-[10px] text-text-secondary truncate font-medium">
                  Alternative Credit Platform
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-text-main hover:bg-slate-100 transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-lg transition-all text-xs font-medium cursor-pointer ${
                  isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600 shadow-2xs'
                    : 'text-text-secondary hover:text-text-main hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Role Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-2`}>
            <div className="w-9 h-9 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-main truncate">
                  {currentUser?.full_name || 'Guest User'}
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`bank-badge text-[9px] uppercase px-1.5 py-0.2 border ${roleColorBadge}`}>
                    {roleDisplay}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Working Logout Button */}
          <button
            onClick={onLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 p-2 transition cursor-pointer ${
              isCollapsed ? 'justify-center' : 'space-x-2'
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
