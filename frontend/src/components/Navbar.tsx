import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Store, 
  UtensilsCrossed, 
  Truck, 
  CheckCircle, 
  Building2, 
  RefreshCw,
  Lock,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchPersona: (email: string) => void;
  onSeedDemo: () => void;
  isLoadingSeed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchPersona,
  onSeedDemo,
  isLoadingSeed
}) => {
  const personas = [
    {
      email: 'ramesh@trustcred.ai',
      name: 'Ramesh Kumar',
      business: 'Ramesh Kirana Store',
      role: 'borrower',
      icon: Store,
      badge: 'High Consistency'
    },
    {
      email: 'priya@trustcred.ai',
      name: 'Priya Sharma',
      business: 'Priya Street Gourmet',
      role: 'borrower',
      icon: UtensilsCrossed,
      badge: 'Street Food Micro-UPI'
    },
    {
      email: 'anil@trustcred.ai',
      name: 'Anil Verma',
      business: 'Anil Quick Logistics',
      role: 'borrower',
      icon: Truck,
      badge: 'Commercial Fleet EMI'
    },
    {
      email: 'verifier@trustcred.ai',
      name: 'Rajesh Sen',
      business: 'Certified Verifier',
      role: 'verifier',
      icon: CheckCircle,
      badge: 'Statement Auditor'
    },
    {
      email: 'lender@trustcred.ai',
      name: 'Meera Kapoor',
      business: 'Apex Capital MSME',
      role: 'lender',
      icon: Building2,
      badge: 'Credit Underwriter'
    }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Financial Overview', role: 'all' },
    { id: 'transactions', label: 'Transaction Workbench', role: 'all' },
    { id: 'assessment', label: 'Alternative Credit Assessment', role: 'all' },
    { id: 'calculator', label: 'Repayment Capacity', role: 'all' },
    { id: 'consent', label: 'Privacy & Sharing', role: 'borrower' },
    { id: 'verifier', label: 'Verifier Queue', role: 'verifier' },
    { id: 'lender', label: 'Lender Console', role: 'lender' },
    { id: 'public-verify', label: 'Independent Verifier', role: 'all' }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#070d18]/90 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="border-b border-slate-800/60 bg-slate-950/40 px-4 py-1.5 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-2.5 h-2.5 mr-1" /> Privacy-Preserving
            </span>
            <span className="hidden sm:inline text-slate-400">
              Zero banking passwords or UPI PINs collected • Independently verifiable SHA-256 integrity
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onSeedDemo}
              disabled={isLoadingSeed}
              className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50 cursor-pointer"
              title="Reset sample data and pre-load realistic personas"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingSeed ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isLoadingSeed ? 'Seeding...' : 'Reset Demo Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                TRUST<span className="text-emerald-400">CRED</span>
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">
              Alternative Credit & Verifiable Cash Flows
            </p>
          </div>
        </div>

        {/* Demo Persona Switcher */}
        <div className="flex items-center space-x-2">
          <div className="hidden lg:flex items-center text-xs text-slate-400 mr-1">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>Simulate User Role:</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {personas.map((p) => {
              const Icon = p.icon;
              const isSelected = currentUser?.email === p.email;
              return (
                <button
                  key={p.email}
                  onClick={() => onSwitchPersona(p.email)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`${p.name} (${p.business}) - ${p.badge}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">{p.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-70 hidden xl:inline">({p.role[0].toUpperCase() + p.role.slice(1)})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 px-4">
        <div className="mx-auto flex max-w-7xl space-x-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
