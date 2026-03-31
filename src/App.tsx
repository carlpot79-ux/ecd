/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, BarChart3, ChevronLeft, LogOut, Eye, EyeOff } from 'lucide-react';
import { AppData, ScreeningData, MonitoringData } from './types';
import { SUBDISTRICT_HIERARCHY, Region } from './constants';

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz66smbZSsT6IyZj7uOYrEA9YffzX1W6lz3nHlXHtAHCrLHSXhC25TikNvziuOrxtLcqA/exec';

type Screen = 'login' | 'nav' | 'screening-creche' | 'screening-details' | 'monitoring-creche' | 'monitoring-details';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [currentCrecheName, setCurrentCrecheName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | ''>('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [ageError, setAgeError] = useState(false);

  const [syncStatus, setSyncStatus] = useState('Up to date');
  const [syncColor, setSyncColor] = useState('var(--text3)');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'screening' | 'monitoring'>('screening');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<AppData | null>(null);

  const [recentCreches, setRecentCreches] = useState<string[]>([]);
  const [recentMonitors, setRecentMonitors] = useState<string[]>([]);

  // Form states
  const [screeningForm, setScreeningForm] = useState({
    screened: '',
    cariesFree: '',
    abscess: '',
    initialCaries: '',
    decayed: '',
    missing: '',
    filled: '',
    dmft: ''
  });

  const [monitoringForm, setMonitoringForm] = useState({
    consent: '',
    brushes: '',
    pastes: '',
    norms: false,
    childrenEd: '',
    parentsEd: '',
    fv1: '',
    fv2: '',
    fv3: ''
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn) {
      setIsLoggedIn(true);
      setLoggedInUser(localStorage.getItem('loggedInUser') || 'eddy');
      setScreen('nav');
    }

    const storedRecentCreches = localStorage.getItem('recentCreches');
    if (storedRecentCreches) setRecentCreches(JSON.parse(storedRecentCreches));

    const storedRecentMonitors = localStorage.getItem('recentMonitors');
    if (storedRecentMonitors) setRecentMonitors(JSON.parse(storedRecentMonitors));

    updateSyncStatus();
  }, []);

  // --- SYNC LOGIC ---
  const updateSyncStatus = useCallback(() => {
    const stored = localStorage.getItem('screeningRecords');
    if (stored) {
      const records: AppData[] = JSON.parse(stored);
      const unsynced = records.filter(r => !r.synced);
      if (unsynced.length === 0) {
        setSyncStatus('Up to date');
        setSyncColor('var(--green)');
      } else {
        setSyncStatus(`${unsynced.length} pending`);
        setSyncColor('var(--orange)');
      }
    } else {
      setSyncStatus('Up to date');
      setSyncColor('var(--green)');
    }
  }, []);

  const triggerSync = useCallback(async () => {
    const stored = localStorage.getItem('screeningRecords');
    if (!stored) return;

    const records: AppData[] = JSON.parse(stored);
    const unsynced = records.filter(r => !r.synced);
    if (unsynced.length === 0) return;

    setSyncStatus('Syncing...');
    setSyncColor('var(--text3)');

    for (const record of unsynced) {
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(record)
        });
        record.synced = true;
      } catch (err) {
        console.error('Record failed to sync', err);
      }
    }

    localStorage.setItem('screeningRecords', JSON.stringify(records));
    updateSyncStatus();
  }, [updateSyncStatus]);

  useEffect(() => {
    const handleOnline = () => triggerSync();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [triggerSync]);

  // --- HANDLERS ---
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loggedInUser === 'eddy' && loginPass === '1') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loggedInUser', loggedInUser);
      setIsLoggedIn(true);
      setLoginError(false);
      setScreen('nav');
    } else {
      setLoginError(true);
      setLoginPass('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setScreen('login');
  };

  const handleCrecheSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fullName = `${currentCrecheName} (Age: ${currentAge})`;
    
    if (recentCreches.includes(fullName)) {
      setAgeError(true);
      return;
    }

    setAgeError(false);
    setScreen('screening-details');
  };

  const handleMonitorCrecheSubmit = (e: FormEvent) => {
    e.preventDefault();
    setScreen('monitoring-details');
  };

  const handleScreeningSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formattedDate = new Date().toISOString().split('T')[0];
    
    const data: ScreeningData = {
      id: Date.now(),
      Type: 'screening',
      SheetName: 'Sheet1',
      Date: formattedDate,
      Creche: currentCrecheName,
      Subdistrict: `${selectedRegion} - ${selectedSubdistrict}`,
      Age: currentAge,
      NumberChildren: parseInt(screeningForm.screened) || 0,
      '%CariesFree': parseFloat(screeningForm.cariesFree) || 0,
      '%Abscess': parseFloat(screeningForm.abscess) || 0,
      AvgInitialCaries: parseFloat(screeningForm.initialCaries) || 0,
      AvgDecayed: parseFloat(screeningForm.decayed) || 0,
      AvgMissing: parseFloat(screeningForm.missing) || 0,
      AvgFilled: parseFloat(screeningForm.filled) || 0,
      Avgdmft: parseFloat(screeningForm.dmft) || 0,
      By: loggedInUser
    };

    setPendingData(data);
    setShowConfirmModal(true);
  };

  const handleMonitoringSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formattedDate = new Date().toISOString().split('T')[0];

    const data: MonitoringData = {
      id: Date.now(),
      Type: 'monitoring',
      SheetName: 'Sheet2',
      Date: formattedDate,
      Creche: currentCrecheName,
      Subdistrict: `${selectedRegion} - ${selectedSubdistrict}`,
      NewConsent: parseInt(monitoringForm.consent) || 0,
      Toothbrushes: parseInt(monitoringForm.brushes) || 0,
      Toothpaste: parseInt(monitoringForm.pastes) || 0,
      NormsAndStandards: monitoringForm.norms ? 'Yes' : 'No',
      ChildrenEducated: parseInt(monitoringForm.childrenEd) || 0,
      ParentsEducated: parseInt(monitoringForm.parentsEd) || 0,
      FV1: parseInt(monitoringForm.fv1) || 0,
      FV2: parseInt(monitoringForm.fv2) || 0,
      FV3: parseInt(monitoringForm.fv3) || 0,
      By: loggedInUser
    };

    setPendingData(data);
    setShowConfirmModal(true);
  };

  const confirmSave = () => {
    if (!pendingData) return;

    const stored = localStorage.getItem('screeningRecords');
    const records: AppData[] = stored ? JSON.parse(stored) : [];
    const newRecord = { ...pendingData, synced: false };
    records.push(newRecord);
    localStorage.setItem('screeningRecords', JSON.stringify(records));

    // Update history
    if (pendingData.Type === 'screening') {
      const fullName = `${pendingData.Creche} (Age: ${pendingData.Age})`;
      if (!recentCreches.includes(fullName)) {
        const newRecent = [...recentCreches, fullName];
        setRecentCreches(newRecent);
        localStorage.setItem('recentCreches', JSON.stringify(newRecent));
      }
      setToastType('screening');
    } else {
      if (!recentMonitors.includes(pendingData.Creche)) {
        const newRecent = [...recentMonitors, pendingData.Creche];
        setRecentMonitors(newRecent);
        localStorage.setItem('recentMonitors', JSON.stringify(newRecent));
      }
      setToastType('monitoring');
    }

    setPendingData(null);
    setShowConfirmModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Reset and go home
    setScreeningForm({ 
      screened: '', 
      cariesFree: '', 
      abscess: '', 
      initialCaries: '',
      decayed: '',
      missing: '',
      filled: '',
      dmft: ''
    });
    setMonitoringForm({
      consent: '', brushes: '', pastes: '', norms: false,
      childrenEd: '', parentsEd: '', fv1: '', fv2: '', fv3: ''
    });
    setCurrentCrecheName('');
    setSelectedRegion('');
    setSelectedSubdistrict('');
    setCurrentAge('');
    setScreen('nav');
    triggerSync();
  };

  const goBack = () => {
    if (screen === 'screening-details') setScreen('screening-creche');
    else if (screen === 'monitoring-details') setScreen('monitoring-creche');
    else if (screen === 'screening-creche' || screen === 'monitoring-creche') setScreen('nav');
  };

  return (
    <div className="app-container">
      {isLoggedIn && (
        <div className="topbar">
          <button 
            className="back-btn" 
            onClick={goBack}
            style={{ visibility: screen === 'nav' ? 'hidden' : 'visible' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="topbar-title">Dental Screening</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: syncColor, fontSize: '11px', fontWeight: 500 }}>{syncStatus}</div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="screen active"
          >
            <div className="pad" style={{ paddingTop: '100px' }}>
              <div className="hero" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦷</div>
                <div className="hero-label">WELCOME</div>
                <div className="hero-sub">Please log in to continue.</div>
              </div>

              <div className="divider" />

              <form onSubmit={handleLogin}>
                <div className="form-block">
                  <label className="form-lbl">USERNAME</label>
                  <input 
                    type="text" 
                    value={loggedInUser}
                    onChange={(e) => setLoggedInUser(e.target.value)}
                    placeholder="Username" 
                    required 
                  />
                </div>

                <div className="form-block">
                  <label className="form-lbl">PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="Password" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={20} color="var(--text3)" /> : <Eye size={20} color="var(--text3)" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div style={{ color: 'var(--red)', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>
                    Incorrect username or password.
                  </div>
                )}

                <button type="submit" className="primary-btn" style={{ marginTop: '30px' }}>
                  Log In
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {screen === 'nav' && (
          <motion.div 
            key="nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="screen active"
          >
            <div className="pad">
              <div className="hero">
                <div className="hero-label">DASHBOARD</div>
                <div className="hero-sub">Welcome back, {loggedInUser}. What would you like to do?</div>
              </div>

              <div className="divider" />

              <div className="nav-grid">
                <button className="nav-card" onClick={() => setScreen('screening-creche')}>
                  <div className="nav-card-icon"><ClipboardList size={32} /></div>
                  <div className="nav-card-title">Screening</div>
                  <div className="nav-card-sub">Start a new dental screening session.</div>
                </button>

                <button className="nav-card" onClick={() => setScreen('monitoring-creche')}>
                  <div className="nav-card-icon"><BarChart3 size={32} /></div>
                  <div className="nav-card-title">Monitoring</div>
                  <div className="nav-card-sub">Start a dental monitoring session for a creche.</div>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'screening-creche' && (
          <motion.div 
            key="screening-creche"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="screen active"
          >
            <div className="pad">
              <div className="hero">
                <div className="hero-label">START SCREENING</div>
                <div className="hero-sub">Enter the name of the creche and subdistrict to begin.</div>
              </div>

              <div className="divider" />

              {recentCreches.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div className="hero-label" style={{ fontSize: '10px' }}>RECENT CRECHES</div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginTop: '8px' }}>
                    {recentCreches.slice(-5).reverse().map((fullName, i) => (
                      <div 
                        key={i} 
                        className="recent-pill"
                        onClick={() => {
                          const match = fullName.match(/^(.*) \(Age: (.*)\)$/);
                          if (match) {
                            setCurrentCrecheName(match[1]);
                            setCurrentAge('');
                          }
                        }}
                      >
                        <div className="recent-pill-txt">{fullName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleCrecheSubmit}>
                <div className="form-block">
                  <label className="form-lbl">REGION</label>
                  <select 
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value as Region);
                      setSelectedSubdistrict('');
                    }}
                    required
                    className="select-input"
                  >
                    <option value="">Select Region</option>
                    {Object.keys(SUBDISTRICT_HIERARCHY).map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">SUBDISTRICT</label>
                    <select 
                      value={selectedSubdistrict}
                      onChange={(e) => setSelectedSubdistrict(e.target.value)}
                      required
                      disabled={!selectedRegion}
                      className="select-input"
                    >
                      <option value="">Select Subdistrict</option>
                      {selectedRegion && SUBDISTRICT_HIERARCHY[selectedRegion].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">CRECHE NAME</label>
                    <input 
                      type="text" 
                      value={currentCrecheName}
                      onChange={(e) => setCurrentCrecheName(e.target.value)}
                      placeholder="e.g. Sunny Days" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-block">
                  <label className="form-lbl">AGE GROUP</label>
                  <input 
                    type="text" 
                    value={currentAge}
                    onChange={(e) => setCurrentAge(e.target.value)}
                    placeholder="e.g. 4-5" 
                    required 
                  />
                  {ageError && (
                    <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '6px' }}>
                      This age group has already been screened for this creche.
                    </div>
                  )}
                </div>

                <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>
                  Continue
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {screen === 'screening-details' && (
          <motion.div 
            key="screening-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="screen active"
          >
            <div className="pad">
              <div className="hero">
                <div className="hero-label">NEW SCREENING</div>
                <div className="hero-sub">Screening: {currentCrecheName} ({currentAge})</div>
              </div>

              <div className="divider" />

              <form onSubmit={handleScreeningSubmit}>
                <div className="form-block">
                  <label className="form-lbl">NUMBER OF CHILDREN SCREENED</label>
                  <input 
                    type="number" 
                    value={screeningForm.screened}
                    onChange={(e) => setScreeningForm({ ...screeningForm, screened: e.target.value })}
                    placeholder="e.g. 25" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">% CARIES FREE</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={screeningForm.cariesFree}
                      onChange={(e) => setScreeningForm({ ...screeningForm, cariesFree: e.target.value })}
                      placeholder="e.g. 60" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">% ABSCESS</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={screeningForm.abscess}
                      onChange={(e) => setScreeningForm({ ...screeningForm, abscess: e.target.value })}
                      placeholder="e.g. 5" 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">AVG INITIAL CARIES</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={screeningForm.initialCaries}
                      onChange={(e) => setScreeningForm({ ...screeningForm, initialCaries: e.target.value })}
                      placeholder="0.0" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">AVG DECAYED</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={screeningForm.decayed}
                      onChange={(e) => setScreeningForm({ ...screeningForm, decayed: e.target.value })}
                      placeholder="0.0" 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">AVG MISSING</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={screeningForm.missing}
                      onChange={(e) => setScreeningForm({ ...screeningForm, missing: e.target.value })}
                      placeholder="0.0" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">AVG FILLED</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={screeningForm.filled}
                      onChange={(e) => setScreeningForm({ ...screeningForm, filled: e.target.value })}
                      placeholder="0.0" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-block">
                  <label className="form-lbl">AVG DMFT</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={screeningForm.dmft}
                    onChange={(e) => setScreeningForm({ ...screeningForm, dmft: e.target.value })}
                    placeholder="0.0" 
                    required 
                  />
                </div>

                <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>
                  Save Data
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {screen === 'monitoring-creche' && (
          <motion.div 
            key="monitoring-creche"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="screen active"
          >
            <div className="pad">
              <div className="hero">
                <div className="hero-label">START MONITORING</div>
                <div className="hero-sub">Enter the name of the creche and subdistrict for monitoring.</div>
              </div>

              <div className="divider" />

              {recentMonitors.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div className="hero-label" style={{ fontSize: '10px' }}>RECENT CRECHES</div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginTop: '8px' }}>
                    {recentMonitors.slice(-5).reverse().map((name, i) => (
                      <div 
                        key={i} 
                        className="recent-pill"
                        onClick={() => setCurrentCrecheName(name)}
                      >
                        <div className="recent-pill-txt">{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleMonitorCrecheSubmit}>
                <div className="form-block">
                  <label className="form-lbl">REGION</label>
                  <select 
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value as Region);
                      setSelectedSubdistrict('');
                    }}
                    required
                    className="select-input"
                  >
                    <option value="">Select Region</option>
                    {Object.keys(SUBDISTRICT_HIERARCHY).map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">CRECHE NAME</label>
                    <input 
                      type="text" 
                      value={currentCrecheName}
                      onChange={(e) => setCurrentCrecheName(e.target.value)}
                      placeholder="e.g. Sunny Days" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">SUBDISTRICT</label>
                    <select 
                      value={selectedSubdistrict}
                      onChange={(e) => setSelectedSubdistrict(e.target.value)}
                      required
                      disabled={!selectedRegion}
                      className="select-input"
                    >
                      <option value="">Select Subdistrict</option>
                      {selectedRegion && SUBDISTRICT_HIERARCHY[selectedRegion].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>
                  Continue
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {screen === 'monitoring-details' && (
          <motion.div 
            key="monitoring-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="screen active"
          >
            <div className="pad">
              <div className="hero">
                <div className="hero-label">NEW MONITORING</div>
                <div className="hero-sub">Monitoring: {currentCrecheName}</div>
              </div>

              <div className="divider" />

              <form onSubmit={handleMonitoringSubmit}>
                <div className="form-block">
                  <label className="form-lbl">NEW CONSENT FORMS</label>
                  <input 
                    type="number" 
                    value={monitoringForm.consent}
                    onChange={(e) => setMonitoringForm({ ...monitoringForm, consent: e.target.value })}
                    placeholder="0" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">TOOTH BRUSHES</label>
                    <input 
                      type="number" 
                      value={monitoringForm.brushes}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, brushes: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">TOOTH PASTES</label>
                    <input 
                      type="number" 
                      value={monitoringForm.pastes}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, pastes: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-block">
                  <div className="toggle-wrap">
                    <span className="form-lbl" style={{ marginBottom: 0 }}>NORMS & STANDARDS</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={monitoringForm.norms}
                        onChange={(e) => setMonitoringForm({ ...monitoringForm, norms: e.target.checked })}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">CHILDREN EDUCATED</label>
                    <input 
                      type="number" 
                      value={monitoringForm.childrenEd}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, childrenEd: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl">PARENTS EDUCATED</label>
                    <input 
                      type="number" 
                      value={monitoringForm.parentsEd}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, parentsEd: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                </div>

                <div className="hero-label" style={{ fontSize: '10px', marginBottom: '12px' }}>FLUORIDE VARNISH</div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl" style={{ fontSize: '9px' }}>FV1</label>
                    <input 
                      type="number" 
                      value={monitoringForm.fv1}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, fv1: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl" style={{ fontSize: '9px' }}>FV2</label>
                    <input 
                      type="number" 
                      value={monitoringForm.fv2}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, fv2: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-lbl" style={{ fontSize: '9px' }}>FV3</label>
                    <input 
                      type="number" 
                      value={monitoringForm.fv3}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, fv3: e.target.value })}
                      placeholder="0" 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>
                  Save Data
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      {showToast && (
        <div className="toast">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="toast-content"
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
            <div className="modal-title" style={{ color: 'var(--green)' }}>
              {toastType === 'monitoring' ? 'Monitoring Saved' : 'Screening Saved'}
            </div>
            <div className="modal-sub">The data has been stored locally.</div>
          </motion.div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="modal"
          >
            <div className="modal-title">Confirm Submission</div>
            <div className="modal-sub">Once saved, you cannot change this data again. Would you like to save now or continue editing?</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="modal-cancel"
              >
                Edit
              </button>
              <button 
                onClick={confirmSave}
                className="modal-save"
              >
                Save Data
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
