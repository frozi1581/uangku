import axios from "axios";

// Base URL API Uangku. Token disimpan di localStorage.
const api = axios.create({
  baseURL: "/api/v1",
  headers: { Accept: "application/json" },
});

const TOKEN_KEY = "uangku_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Sisipkan Bearer token ke tiap request.
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Tangani 401 (token kadaluarsa) -> bersihkan & arahkan ke login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// ---- Master ----
export const masterApi = {
  customers: () => api.get("/customers"),
  createCustomer: (d) => api.post("/customers", d),
  vendors: () => api.get("/vendors"),
  createVendor: (d) => api.post("/vendors", d),
  bankAccounts: () => api.get("/bank-accounts"),
  createBankAccount: (d) => api.post("/bank-accounts", d),
  chartOfAccounts: () => api.get("/chart-of-accounts"),
};

// ---- Transaksi ----
export const txApi = {
  invoices: (params) => api.get("/invoices", { params }),
  createInvoice: (d) => api.post("/invoices", d),
  purchaseOrders: (params) => api.get("/purchase-orders", { params }),
  createPurchaseOrder: (d) => api.post("/purchase-orders", d),
  bankTransactions: (params) => api.get("/bank-transactions", { params }),
  createBankTransaction: (d) => api.post("/bank-transactions", d),
};

// ---- Laporan & Usage ----
export const reportApi = {
  balanceSheet: (date) => api.get("/reports/balance-sheet", { params: { date } }),
  cashFlow: (from, to) => api.get("/reports/cash-flow", { params: { from, to } }),
  usage: () => api.get("/usage/current"),
};

// ---- Super admin ----
export const adminApi = {
  plans: () => api.get("/admin/plans"),
  registrations: (status) => api.get("/admin/registrations", { params: { status } }),
  approve: (companyId, d) => api.post(`/admin/registrations/${companyId}/approve`, d),
  reject: (companyId, d) => api.post(`/admin/registrations/${companyId}/reject`, d),
};

export default api;
