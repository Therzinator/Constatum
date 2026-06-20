import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import './OnlineIndicator.css';

// Komt overeen met #online-indicator uit docs/index.html — net als
// SyncStatusBar alleen zichtbaar zodra er iets te melden is (offline).
export function OnlineIndicator() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="online-indicator">
      <span className="online-indicator-dot" />
      OFFLINE
    </div>
  );
}
