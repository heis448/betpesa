.panel {
  flex: 1;
  background: #141828;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

/* ── TABS ── */
.tabs {
  display: flex;
  background: rgba(255,255,255,0.04);
  border-radius: 7px;
  padding: 3px;
  gap: 3px;
}

.tab, .tabInactive {
  flex: 1;
  padding: 5px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
}

.tab       { background: #1e2438; color: #e8eaf6; }
.tabInactive { background: transparent; color: rgba(255,255,255,0.28); }

/* ── AMOUNT ── */
.amtRow {
  display: flex;
  align-items: center;
  gap: 5px;
}

.adj {
  width: 34px; height: 38px;
  background: #1e2438;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: #8892b0;
  font-size: 18px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.adj:hover { background: #252b42; color: #e8eaf6; }

.amtWrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #0f1221;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  overflow: hidden;
}

.amtInput {
  flex: 1;
  background: transparent;
  border: none;
  color: #e8eaf6;
  font-family: 'Rajdhani', sans-serif;
  font-size: 18px;
  font-weight: 600;
  padding: 8px 8px;
  text-align: center;
  min-width: 0;
}
.amtInput:disabled { opacity: 0.5; }

.currency {
  font-size: 9px;
  color: rgba(255,255,255,0.28);
  padding-right: 8px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

/* ── QUICK ── */
.quickRow { display: flex; gap: 4px; }

.quick {
  flex: 1;
  background: #0f1221;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px;
  color: #8892b0;
  font-size: 10px;
  font-weight: 700;
  padding: 5px 2px;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.quick:hover {
  border-color: rgba(255,255,255,0.2);
  color: #e8eaf6;
  background: #1e2438;
}

/* ── AUTO CASHOUT ── */
.autoRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.autoLabel {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  flex: 1;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}

.toggle {
  position: relative;
  width: 34px; height: 18px;
  flex-shrink: 0;
  cursor: pointer;
}
.toggle input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.1);
  border-radius: 18px;
  transition: 0.2s;
}
.slider::before {
  content: '';
  position: absolute;
  width: 12px; height: 12px;
  left: 3px; bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.toggle input:checked + .slider { background: #3fa842; }
.toggle input:checked + .slider::before { transform: translateX(16px); }

.autoInput {
  width: 54px;
  background: #0f1221;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  color: #e8eaf6;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 6px;
  text-align: center;
  font-family: 'Roboto Mono', monospace;
}
.autoInput:disabled { opacity: 0.35; cursor: not-allowed; }
.autoX { font-size: 10px; color: rgba(255,255,255,0.28); flex-shrink: 0; }

/* ── MAIN BUTTON — Spribe exact palette ── */
.mainBtn {
  width: 100%;
  padding: 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: all 0.15s;
  border: none;
  font-family: 'Inter', sans-serif;
}

/* GREEN — Bet (Spribe's signature green) */
.btnBet {
  background: linear-gradient(180deg, #4caf50 0%, #388e3c 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(76,175,80,0.4);
}
.btnBet:hover { filter: brightness(1.08); box-shadow: 0 5px 26px rgba(76,175,80,0.5); }

/* RED outlined — Cancel */
.btnCancel {
  background: rgba(242,54,69,0.08);
  color: #f23645;
  border: 1.5px solid rgba(242,54,69,0.35);
}
.btnCancel:hover { background: rgba(242,54,69,0.15); }

/* ORANGE — Cash Out (Spribe's signature orange) */
.btnCash {
  background: linear-gradient(180deg, #ff9800 0%, #e65100 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(255,152,0,0.4);
  animation: cashPulse 1s ease-in-out infinite;
}
@keyframes cashPulse {
  0%,100% { box-shadow: 0 4px 20px rgba(255,152,0,0.4); }
  50%      { box-shadow: 0 6px 32px rgba(255,152,0,0.65); }
}

/* GREEN muted — cashed out confirmation */
.btnDone {
  background: rgba(76,175,80,0.1);
  color: #4caf50;
  border: 1px solid rgba(76,175,80,0.3);
  cursor: default;
}

/* grey — idle/next round */
.btnIdle {
  background: #1e2438;
  color: rgba(255,255,255,0.25);
  cursor: not-allowed;
}

.mainBtn:disabled { cursor: not-allowed; transform: none !important; filter: none !important; }

/* ── BADGES ── */
.demoPanel {
  border-color: rgba(255,214,10,0.2) !important;
}

.demoBadge {
  font-size: 9px;
  font-weight: 700;
  color: #ffd60a;
  letter-spacing: 0.08em;
  text-align: center;
  background: rgba(255,214,10,0.07);
  border: 1px solid rgba(255,214,10,0.18);
  border-radius: 5px;
  padding: 3px 8px;
  font-family: 'Inter', sans-serif;
}

.guestBadge {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.05em;
  text-align: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px;
  padding: 3px 8px;
  font-family: 'Inter', sans-serif;
}

.btnReset {
  background: rgba(255,214,10,0.1);
  color: #ffd60a;
  border: 1px solid rgba(255,214,10,0.28);
}
.btnReset:hover { background: rgba(255,214,10,0.17); }
