import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const headerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { font-family: 'DM Sans', sans-serif; }

  .cgo-header {
    background: linear-gradient(135deg, #1a1a1a 0%, #1F1F1F 60%, #2a2a2a 100%);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }

  .cgo-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 8px;
  }

  .cgo-logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cgo-logo-icon {
    background: #2DBE60;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cgo-logo-text {
    font-size: 20px;
    font-weight: 700;
    color: white;
    letter-spacing: -0.3px;
  }

  .cgo-logo-text span { color: #2DBE60; }

  .cgo-header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .cgo-icon-btn {
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 10px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: background 0.2s;
  }

  .cgo-icon-btn:active { background: rgba(255,255,255,0.25); }

  .cgo-header-welcome {
    padding: 4px 16px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cgo-welcome-text {
    color: rgba(255,255,255,0.6);
    font-size: 12px;
  }

  .cgo-welcome-name {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin-top: 1px;
  }

  .cgo-role-badge {
    display: inline-block;
    background: rgba(45,190,96,0.2);
    border: 1px solid rgba(45,190,96,0.35);
    color: #2DBE60;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    margin-top: 3px;
  }

  .cgo-balance-pill {
    background: rgba(45,190,96,0.2);
    border: 1px solid rgba(45,190,96,0.4);
    border-radius: 14px;
    padding: 6px 14px;
    text-align: right;
  }

  .cgo-balance-label {
    color: rgba(255,255,255,0.6);
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 3px;
    justify-content: flex-end;
  }

  .cgo-balance-amount {
    color: #2DBE60;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  }
`;

/**
 * Shared header for all Campus GO dashboards.
 *
 * Props:
 *  - user        : object from localStorage (full_name, balance, role)
 *  - role        : string label shown as badge e.g. "Platform Admin"
 *  - showBalance : boolean — only true for StudentDashboard
 */
export default function CampusGoHeader({ user, role, showBalance = false }) {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      <style>{headerStyles}</style>
      <div className="cgo-header">
        <div className="cgo-header-top">
          <div className="cgo-logo">
            <div className="cgo-logo-icon">
              <DirectionsBusIcon sx={{ color: 'white', fontSize: 22 }} />
            </div>
            <div className="cgo-logo-text">Campus<span>GO</span></div>
          </div>
          <div className="cgo-header-actions">
            <button className="cgo-icon-btn" onClick={() => window.location.href = '/settings'} title="Settings">
              <SettingsIcon sx={{ fontSize: 20 }} />
            </button>
            <button className="cgo-icon-btn" onClick={handleLogout} title="Logout">
              <LogoutIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>

        <div className="cgo-header-welcome">
          <div>
            <div className="cgo-welcome-text">Welcome back,</div>
            <div className="cgo-welcome-name">{user?.full_name}</div>
            {role && <div className="cgo-role-badge">{role}</div>}
          </div>

          {showBalance && (
            <div className="cgo-balance-pill">
              <div className="cgo-balance-label">
                <AccountBalanceWalletIcon sx={{ fontSize: 11 }} /> Wallet
              </div>
              <div className="cgo-balance-amount">
                ${parseFloat(user?.balance || 0).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
