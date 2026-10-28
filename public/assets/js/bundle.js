// src/frontend/state/event-bus.ts
var TypedEventBus = class {
  listeners = /* @__PURE__ */ new Map();
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    const set = this.listeners.get(event);
    const castedHandler = handler;
    set.add(castedHandler);
    return () => this.off(event, handler);
  }
  off(event, handler) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler);
  }
  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error al procesar evento "${event}":`, err);
      }
    }
  }
  clear() {
    this.listeners.clear();
  }
};
var GlobalEventBus = new TypedEventBus();

// src/frontend/state/app-store.state.ts
var AppStore = class {
  state = {
    activeTab: "tab-dashboard",
    isSidebarOpen: true,
    isDevMode: false,
    systemHealth: null,
    loadedStringsCount: 0,
    activeModsCount: 0
  };
  getState() {
    return Object.freeze({ ...this.state });
  }
  setState(patch) {
    this.state = { ...this.state, ...patch };
    GlobalEventBus.emit("state:changed", this.getState());
  }
  setActiveTab(tabId) {
    this.setState({ activeTab: tabId });
    GlobalEventBus.emit("tab:changed", tabId);
  }
  toggleSidebar(force) {
    const next = force !== void 0 ? force : !this.state.isSidebarOpen;
    this.setState({ isSidebarOpen: next });
    GlobalEventBus.emit("sidebar:toggled", next);
  }
};
var GlobalStore = new AppStore();

// src/frontend/router/view-navigator.router.ts
var ViewNavigatorRouter = class {
  activeTabId = "tab-dashboard";
  constructor() {
    this.init();
  }
  init() {
    window.addEventListener("hashchange", () => this.handleHashChange());
    document.addEventListener("click", (e) => this.handleDelegatedClick(e));
  }
  switchTab(targetTabId) {
    if (!targetTabId) return;
    const panels = document.querySelectorAll(".view-panel");
    panels.forEach((p) => {
      p.classList.toggle("active", p.id === targetTabId);
    });
    const navItems = document.querySelectorAll(".sidebar-nav-item");
    navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === targetTabId);
    });
    const dockBtns = document.querySelectorAll(".dock-btn");
    dockBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === targetTabId);
    });
    this.activeTabId = targetTabId;
    GlobalStore.setActiveTab(targetTabId);
    GlobalEventBus.emit("router:navigated", targetTabId);
    if (window.location.hash !== `#${targetTabId}`) {
      window.history.replaceState(null, "", `#${targetTabId}`);
    }
  }
  getActiveTab() {
    return this.activeTabId;
  }
  handleHashChange() {
    const hash = window.location.hash.replace("#", "");
    if (hash && hash !== this.activeTabId) {
      this.switchTab(hash);
    }
  }
  /**
   * Delegación centralizada de clicks en todo el documento.
   * Captura data-tab (navegación), data-action (comandos),
   * y data-message (alertas placeholder para features en desarrollo).
   */
  handleDelegatedClick(e) {
    const clicked = e.target;
    const tabTarget = clicked.closest("[data-tab]");
    if (tabTarget?.dataset.tab) {
      e.preventDefault();
      this.switchTab(tabTarget.dataset.tab);
      return;
    }
    const actionTarget = clicked.closest("[data-action]");
    if (actionTarget?.dataset.action) {
      e.preventDefault();
      this.handleDataAction(actionTarget);
      return;
    }
  }
  /**
   * Despacha data-action al EventBus o ejecuta lógica inline específica.
   */
  handleDataAction(el) {
    const action = el.dataset.action;
    if (!action) return;
    if (el.dataset.message) {
      GlobalEventBus.emit("ui:notify", { message: el.dataset.message, type: "info" });
      return;
    }
    if (action === "set-input-value" && el.dataset.target && el.dataset.value) {
      const input = document.querySelector(el.dataset.target);
      if (input) {
        input.value = el.dataset.value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return;
    }
    GlobalEventBus.emit(action, { source: el });
  }
};
var GlobalRouter = new ViewNavigatorRouter();

// src/frontend/api-client/base-api.client.ts
var BaseApiClient = class {
  static async request(endpoint, options) {
    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    };
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers
      }
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      const errPayload = body;
      throw new Error(`[${errPayload.error_uuid ?? "HTTP_ERR"}] ${errPayload.message ?? "Fallo en la petici\xF3n REST"}`);
    }
    return body.data;
  }
};

// src/frontend/api-client/system-api.client.ts
var SystemApiClient = class extends BaseApiClient {
  static async getHealth() {
    return this.request("api/system/health");
  }
  static async getEnvironment() {
    return this.request("api/system/environment");
  }
  static async getExecutions() {
    return this.request("api/system/executions");
  }
  static async recordExecution(payload) {
    return this.request("api/system/executions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
  static async convertResource(payload) {
    return this.request("api/engine/convert", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

// src/frontend/main.ts
console.info("\u{1F680} [SolarisNexus] Enterprise Frontend initialized.");
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const health = await SystemApiClient.getHealth();
    GlobalStore.setState({ systemHealth: health });
    GlobalEventBus.emit("system:ready", health);
  } catch (err) {
    console.warn("[SolarisNexus] Error al verificar estado inicial:", err);
  }
});
export {
  GlobalEventBus,
  GlobalRouter,
  GlobalStore
};
