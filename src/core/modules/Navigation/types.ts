/**
 * Solaris Nexus Studio - Navigation & Shell Types
 * Strict typing for SPA routing, telemetry metrics, and sidebar project tree
 */

export interface ModuleMetadata {
  title: string;
  subtitle: string;
  metricNumber: string;
  metricLabel: string;
  metricBadge: string;
}

export interface TelemetryCardDef {
  title: string;
  badgeText: string;
  badgeClass?: string;
  value: string;
  valueClass?: string;
  footerText: string;
  icon?: string;
  tab?: string;
}

export interface NavigationInterface {
  init(): void;
  switchTab(targetId: string): void;
  toggleSidebar(forceOpen?: boolean): void;
}
