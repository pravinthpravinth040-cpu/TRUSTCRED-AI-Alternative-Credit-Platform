const API_BASE = "/api";

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem("trustcred_token");
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Timeout wrapper to completely eliminate permanent loading states
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs / 1000}s. Please check if backend server is running.`);
    }
    // If relative /api failed (e.g. running vite without proxy), retry direct to localhost:8000
    if (url.startsWith('/api')) {
      const directUrl = `http://localhost:8000${url}`;
      try {
        const directController = new AbortController();
        const directId = setTimeout(() => directController.abort(), 4000);
        const retryRes = await fetch(directUrl, { ...options, signal: directController.signal });
        clearTimeout(directId);
        return retryRes;
      } catch (retryErr) {
        // Fall back to original error
      }
    }
    throw error;
  }
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Invalid credentials" }));
      throw new Error(err.detail || "Authentication failed. Please check your credentials.");
    }
    return res.json();
  },

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    business_name?: string;
    business_type?: string;
    phone?: string;
    address?: string;
    monthly_turnover_estimate?: number;
  }) {
    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async getMe() {
    const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  },

  async seedDemoAccounts() {
    const res = await fetchWithTimeout(`${API_BASE}/auth/seed-demo-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to seed demo accounts");
    return res.json();
  },

  async updateProfile(profileData: any) {
    const res = await fetchWithTimeout(`${API_BASE}/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },

  // Transactions & Analytics
  async getTransactions(params?: { category?: string; direction?: string; flagged?: boolean; search?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.direction) query.set("direction", params.direction);
    if (params?.flagged !== undefined) query.set("flagged", String(params.flagged));
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const res = await fetchWithTimeout(`${API_BASE}/transactions?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  },

  async uploadStatement(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetchWithTimeout(`${API_BASE}/transactions/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async loadSample(persona: string) {
    const res = await fetchWithTimeout(`${API_BASE}/transactions/load-sample/${persona}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load sample dataset");
    return res.json();
  },

  async overrideClassification(txnId: string, classification: string) {
    const res = await fetchWithTimeout(`${API_BASE}/transactions/${txnId}/override`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ classification }),
    });
    if (!res.ok) throw new Error("Failed to reclassify transaction");
    return res.json();
  },

  async getAnalytics(days?: number) {
    const query = days ? `?days=${days}` : "";
    const res = await fetchWithTimeout(`${API_BASE}/transactions/analytics${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  // Credit Assessment
  async generateAssessment() {
    const res = await fetchWithTimeout(`${API_BASE}/assessment/generate`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to generate report" }));
      throw new Error(err.detail || "Failed to generate report");
    }
    return res.json();
  },

  async getLatestAssessment() {
    const res = await fetchWithTimeout(`${API_BASE}/assessment/latest`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch latest assessment");
    return res.json();
  },

  // Repayment Calculator
  async calculateRepayment(payload: any) {
    const res = await fetchWithTimeout(`${API_BASE}/calculator/repayment-capacity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to calculate repayment capacity");
    return res.json();
  },

  // Consent & Privacy
  async listConsents() {
    const res = await fetchWithTimeout(`${API_BASE}/consent`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch consents");
    return res.json();
  },

  async grantConsent(reportId: string, lenderOrgName: string, purpose: string, validityDays = 30) {
    const res = await fetchWithTimeout(`${API_BASE}/consent/grant`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        report_id: reportId,
        lender_org_name: lenderOrgName,
        purpose,
        validity_days: validityDays,
      }),
    });
    if (!res.ok) throw new Error("Failed to grant consent");
    return res.json();
  },

  async revokeConsent(consentId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/consent/${consentId}/revoke`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to revoke consent");
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetchWithTimeout(`${API_BASE}/consent/audit-log`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
  },

  // Verifier
  async getVerifierQueue() {
    const res = await fetchWithTimeout(`${API_BASE}/verifier/queue`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch verifier queue");
    return res.json();
  },

  async verifyBatch(batchId: string, status: string, notes?: string) {
    const res = await fetchWithTimeout(`${API_BASE}/verifier/batch/${batchId}/verify`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error("Failed to submit verification");
    return res.json();
  },

  // Lender
  async getLenderPipeline() {
    const res = await fetchWithTimeout(`${API_BASE}/lender/pipeline`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch lender pipeline");
    return res.json();
  },

  async getLenderReport(reportId: string) {
    const res = await fetchWithTimeout(`${API_BASE}/lender/report/${reportId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch lender report");
    return res.json();
  },

  async recordLenderDecision(reportId: string, decisionData: any) {
    const res = await fetchWithTimeout(`${API_BASE}/lender/report/${reportId}/decision`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(decisionData),
    });
    if (!res.ok) throw new Error("Failed to record decision");
    return res.json();
  },

  // Public Report Verification
  async verifyReportPublic(req: { report_payload?: any; report_id?: string; sha256_hash?: string }) {
    const res = await fetchWithTimeout(`${API_BASE}/verify-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("Verification service error");
    return res.json();
  },
};
