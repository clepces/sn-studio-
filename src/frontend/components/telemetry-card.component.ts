export interface TelemetryCardProps {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  status?: 'optimal' | 'warning' | 'critical' | 'neutral';
  icon?: string;
}

export class TelemetryCardComponent {
  public static render(props: TelemetryCardProps): string {
    const statusClass = props.status ? `status-${props.status}` : 'status-neutral';

    return `
      <div class="telemetry-card ${statusClass}" id="telemetry-${props.id}">
        <div class="telemetry-card-header">
          <span class="telemetry-label">${props.label}</span>
          ${props.icon ? `<span class="telemetry-icon">${props.icon}</span>` : ''}
        </div>
        <div class="telemetry-card-body">
          <div class="telemetry-value" id="val-${props.id}">${props.value}</div>
          ${props.subValue ? `<div class="telemetry-sub" id="sub-${props.id}">${props.subValue}</div>` : ''}
        </div>
      </div>
    `;
  }
}
