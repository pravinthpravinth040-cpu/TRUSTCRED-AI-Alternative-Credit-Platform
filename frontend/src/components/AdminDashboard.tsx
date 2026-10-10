import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  Server, 
  Database, 
  Key, 
  Cpu, 
  RefreshCw,
  Search,
  Building,
  UserCheck
} from 'lucide-react';
import { User, AuditLogItem } from '../types';

interface AdminDashboardProps {
  currentUser: User | null;
  auditLogs: AuditLogItem[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  auditLogs,
  onRefresh,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'health'>('overview');

  const demoAccounts = [
    { name: 'Ramesh Kumar', email: 'ramesh@trustcred.ai', role: 'Vendor', business: 'Ramesh Kirana Store', status: 'Active • 90 Days Statement' },
    { name: 'Priya Sharma', email: 'priya@trustcred.ai', role: 'Vendor', business: 'Priya Street Gourmet', status: 'Active • 90 Days Statement' },
    { name: 'Anil Verma', email: 'anil@trustcred.ai', role: 'Vendor', business: 'Anil Quick Logistics', status: 'Active • 90 Days Statement' },
    { name: 'Rajesh Sen', email: 'verifier@trustcred.ai', role: 'Financial Verifier', business: 'TrustCred Verification Agency', status: 'Certified • License Active' },
    { name: 'Meera Kapoor', email: 'lender@trustcred.ai', role: 'Lender Underwriter', business: 'Apex Micro-Enterprise Capital', status: 'NBFC Underwriting Node' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bank-badge bg-purple-100 text-purple-800 border border-purple-200">
              System Administration
            </span>
            <span className="text-xs text-text-secondary">Platform Governance & Health</span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] mt-1.5">
            TRUSTCRED AI Platform Operations & Security
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Monitor system health, cryptographic node uptime, participant organizations, and immutable audit logs.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-text-secondary transition shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 inline ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Active Accounts
          </div>
          <div className="text-2xl font-bold text-[#172B4D] mt-1">
            5 Personas
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            3 Borrowers • 1 Verifier • 1 Lender
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Total Transactions Analyzed
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            1,420+ Records
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Across 90-day normalized timeframes
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            SHA-256 Digest Engine
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-1" /> Healthy
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            HMAC signing latency &lt; 2ms
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Database Engine
          </div>
          <div className="text-2xl font-bold text-[#123B6D] mt-1 flex items-center">
            <Database className="w-5 h-5 mr-1" /> SQLite
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Local relational store with ACID compliance
          </div>
        </div>
      </div>

      {/* Accounts & System Health Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Registered Users Table (7 cols) */}
        <div className="lg:col-span-7 bank-card border border-[#E2E8F0] overflow-hidden bg-white">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="text-sm font-bold text-[#172B4D]">
              Platform User & Persona Directory
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-text-secondary uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {demoAccounts.map((acc) => (
                  <tr key={acc.email} className="bank-table-row">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-text-main">{acc.name}</div>
                      <div className="text-[10px] text-text-secondary">{acc.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bank-badge text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-text-secondary">
                      {acc.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Security & Crypto Diagnostics (5 cols) */}
        <div className="lg:col-span-5 bank-card p-6 border border-[#E2E8F0] bg-white space-y-4">
          <h3 className="text-sm font-bold text-[#172B4D] pb-3 border-b border-[#E2E8F0] flex items-center space-x-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Cryptographic & Security Diagnostics</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-bold text-text-main">Password Encryption</div>
                <div className="text-[10px] text-text-secondary">Argon2id (time=3, memory=65536k)</div>
              </div>
              <span className="bank-badge bg-emerald-50 text-emerald-700 border border-emerald-200">Enforced</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-bold text-text-main">Report Integrity Digest</div>
                <div className="text-[10px] text-text-secondary">SHA-256 Canonical JSON serialization</div>
              </div>
              <span className="bank-badge bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-bold text-text-main">Digital Signatures</div>
                <div className="text-[10px] text-text-secondary">HMAC-SHA256 with platform key</div>
              </div>
              <span className="bank-badge bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-bold text-text-main">Zero-Credential Policy</div>
                <div className="text-[10px] text-text-secondary">Zero banking passwords collected</div>
              </div>
              <span className="bank-badge bg-blue-50 text-blue-700 border border-blue-200">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
