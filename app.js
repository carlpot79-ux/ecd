// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Form Handling
document.addEventListener('DOMContentLoaded', () => {
  const crecheForm = document.getElementById('crecheForm');
  const screeningForm = document.getElementById('screeningForm');
  const toast = document.getElementById('toast');
  const screenCreche = document.getElementById('screen-creche');
  const screenDetails = document.getElementById('screen-details');
  const crecheSubtitle = document.getElementById('crecheSubtitle');
  const backBtn = document.getElementById('backBtn');
  const syncStatus = document.getElementById('syncStatus');
  const loginForm = document.getElementById('loginForm');
  const screenLogin = document.getElementById('screen-login');
  const screenNav = document.getElementById('screen-nav');
  const startScreeningFlow = document.getElementById('startScreeningFlow');
  const loginError = document.getElementById('loginError');
  const appTopbar = document.getElementById('appTopbar');
  const logoutBtn = document.getElementById('logoutBtn');
  const togglePassword = document.getElementById('togglePassword');
  const loginPass = document.getElementById('loginPass');
  const recentCrechesWrap = document.getElementById('recentCrechesWrap');
  const recentCrechesList = document.getElementById('recentCrechesList');
  const crecheNameInput = document.getElementById('crecheName');
  const crecheAgeInput = document.getElementById('crecheAge');
  const ageError = document.getElementById('ageError');
  const confirmSaveModal = document.getElementById('confirmSaveModal');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');

  const startMonitoringFlow = document.getElementById('startMonitoringFlow');
  const screenMonitorCreche = document.getElementById('screen-monitor-creche');
  const screenMonitorDetails = document.getElementById('screen-monitor-details');
  const monitorForm = document.getElementById('monitorForm');
  const monitorDetailsForm = document.getElementById('monitorDetailsForm');
  const monitorCrecheNameInput = document.getElementById('monitorCrecheName');
  const monitorSubtitle = document.getElementById('monitorSubtitle');
  const recentMonitorsWrap = document.getElementById('recentMonitorsWrap');
  const recentMonitorsList = document.getElementById('recentMonitorsList');

  let currentCreche = '';
  let currentType = 'screening'; // 'screening' or 'monitoring'

  // --- LOGIN LOGIC ---
  const checkLogin = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      // Recovery for "Unknown" screener name bug
      if (!localStorage.getItem('loggedInUser')) {
        localStorage.setItem('loggedInUser', 'eddy');
      }

      screenLogin.classList.remove('active');
      screenNav.classList.add('active');
      screenCreche.classList.remove('active');
      screenMonitorCreche.classList.remove('active');
      screenDetails.classList.remove('active');
      screenMonitorDetails.classList.remove('active');
      appTopbar.style.display = 'flex';
    } else {
      screenLogin.classList.add('active');
      screenNav.classList.remove('active');
      screenCreche.classList.remove('active');
      screenMonitorCreche.classList.remove('active');
      screenDetails.classList.remove('active');
      screenMonitorDetails.classList.remove('active');
      appTopbar.style.display = 'none';
    }
  };

  // --- SCREEN TRANSITIONS ---
  startScreeningFlow.addEventListener('click', () => {
    currentType = 'screening';
    renderRecentCreches();
    screenNav.classList.remove('active');
    screenCreche.classList.add('active');
    backBtn.style.visibility = 'visible';
  });

  startMonitoringFlow.addEventListener('click', () => {
    currentType = 'monitoring';
    renderRecentMonitors();
    screenNav.classList.remove('active');
    screenMonitorCreche.classList.add('active');
    backBtn.style.visibility = 'visible';
  });

  backBtn.addEventListener('click', () => {
    if (screenDetails.classList.contains('active')) {
      screenDetails.classList.remove('active');
      screenCreche.classList.add('active');
    } else if (screenMonitorDetails.classList.contains('active')) {
      screenMonitorDetails.classList.remove('active');
      screenMonitorCreche.classList.add('active');
    } else if (screenCreche.classList.contains('active') || screenMonitorCreche.classList.contains('active')) {
      screenCreche.classList.remove('active');
      screenMonitorCreche.classList.remove('active');
      screenNav.classList.add('active');
      backBtn.style.visibility = 'hidden';
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = loginPass.value;

    if (user === 'eddy' && pass === '1') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loggedInUser', user); // Store username
      loginError.style.display = 'none';
      checkLogin();
    } else {
      loginError.style.display = 'block';
      loginPass.value = ''; // Clear password on failure
      loginPass.focus();
    }
  });

  togglePassword.addEventListener('click', () => {
    const type = loginPass.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPass.setAttribute('type', type);
    togglePassword.innerText = type === 'password' ? '👁️' : '🙈';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    checkLogin();
  });

  // Run initial check
  checkLogin();
  
  crecheForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = crecheNameInput.value.trim();
    const age = crecheAgeInput.value.trim();
    const fullName = `${name} (Age: ${age})`;

    // Validation
    const storedRecent = localStorage.getItem('recentCreches');
    if (storedRecent) {
      const recent = JSON.parse(storedRecent);
      const exists = recent.some(r => r.toLowerCase() === fullName.toLowerCase());
      if (exists) {
        ageError.style.display = 'block';
        return;
      }
    }
    
    ageError.style.display = 'none';
    currentCreche = fullName;
    crecheSubtitle.innerText = 'Screening: ' + currentCreche;
    
    screenCreche.classList.remove('active');
    screenDetails.classList.add('active');
    backBtn.style.visibility = 'visible';
  });

  monitorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = monitorCrecheNameInput.value.trim();
    currentCreche = name; // Just the name for monitoring
    monitorSubtitle.innerText = 'Monitoring: ' + currentCreche;
    
    screenMonitorCreche.classList.remove('active');
    screenMonitorDetails.classList.add('active');
    backBtn.style.visibility = 'visible';
  });

  // --- RECENT CRECHES LOGIC ---
  function renderRecentCreches() {
    const stored = localStorage.getItem('recentCreches');
    if (!stored) {
      recentCrechesWrap.style.display = 'none';
      return;
    }

    const recent = JSON.parse(stored); // Array of "Name (Age: X)"
    if (recent.length === 0) {
      recentCrechesWrap.style.display = 'none';
      return;
    }

    // Group by Creche Name
    const history = {};
    recent.forEach(fullName => {
      const match = fullName.match(/^(.*) \((?:[Aa]ge: )?(.*)\)$/);
      if (match) {
        const name = match[1];
        const age = match[2];
        if (!history[name]) history[name] = new Set();
        history[name].add(age);
      }
    });

    const uniqueNames = Object.keys(history);
    if (uniqueNames.length === 0) {
      recentCrechesWrap.style.display = 'none';
      return;
    }

    recentCrechesWrap.style.display = 'block';
    recentCrechesList.innerHTML = '';

    // Show last 5 unique creches
    uniqueNames.reverse().slice(0, 5).forEach(name => {
      const ages = Array.from(history[name]).join(', ');
      
      const pill = document.createElement('div');
      pill.className = 'recent-pill';
      pill.innerHTML = `<div class="recent-pill-txt">${name} (Age: ${ages})</div>`;
      
      pill.addEventListener('click', () => {
        crecheNameInput.value = name;
        crecheAgeInput.value = '';
        crecheAgeInput.focus();
        ageError.style.display = 'none';
      });
      
      recentCrechesList.appendChild(pill);
    });
  }

  screeningForm.addEventListener('submit', (e) => {
    e.preventDefault();
    preparePendingData('screening');
  });

  monitorDetailsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    preparePendingData('monitoring');
  });

  function preparePendingData(type) {
    const formattedDate = new Date().toISOString().split('T')[0];
    
    if (type === 'screening') {
      pendingData = {
        id: Date.now(),
        date: formattedDate,
        type: type,
        screener: localStorage.getItem('loggedInUser') || 'eddy',
        creche: currentCreche,
        screened: parseInt(document.getElementById('screened').value) || 0,
        cariesFree: parseInt(document.getElementById('cariesFree').value) || 0,
        abscess: parseInt(document.getElementById('abscess').value) || 0,
        initialCaries: parseInt(document.getElementById('initialCaries').value) || 0
      };
    } else {
      pendingData = {
        id: Date.now(),
        date: formattedDate,
        type: type,
        screener: localStorage.getItem('loggedInUser') || 'eddy',
        creche: currentCreche,
        consentForms: parseInt(document.getElementById('m_consent').value) || 0,
        toothBrushes: parseInt(document.getElementById('m_brushes').value) || 0,
        toothPastes: parseInt(document.getElementById('m_pastes').value) || 0,
        normsAndStandards: document.getElementById('m_norms').checked,
        childrenEducated: parseInt(document.getElementById('m_children_ed').value) || 0,
        parentsEducated: parseInt(document.getElementById('m_parents_ed').value) || 0,
        fluorideVarnish1: parseInt(document.getElementById('m_varnish1').value) || 0,
        fluorideVarnish2: parseInt(document.getElementById('m_varnish2').value) || 0,
        fluorideVarnish3: parseInt(document.getElementById('m_varnish3').value) || 0
      };
    }

    confirmSaveModal.classList.add('open');
  }

  confirmSaveBtn.addEventListener('click', () => {
    if (!pendingData) return;

    saveRecord(pendingData);

    // Save to relevant history key
    const key = pendingData.type === 'screening' ? 'recentCreches' : 'recentMonitors';
    let recent = [];
    const storedRecent = localStorage.getItem(key);
    if (storedRecent) recent = JSON.parse(storedRecent);
    
    if (!recent.includes(pendingData.creche)) {
      recent.push(pendingData.creche);
      localStorage.setItem(key, JSON.stringify(recent));
    }

    const typeSaved = pendingData.type;
    pendingData = null;
    confirmSaveModal.classList.remove('open');

    // Reset Forms
    screeningForm.reset();
    monitorDetailsForm.reset();
    crecheForm.reset();
    monitorForm.reset();
    currentCreche = '';

    // Go back to dashboard
    screenDetails.classList.remove('active');
    screenMonitorDetails.classList.remove('active');
    screenNav.classList.add('active');
    backBtn.style.visibility = 'hidden';

    showToast(typeSaved);
  });

  cancelSaveBtn.addEventListener('click', () => {
    confirmSaveModal.classList.remove('open');
    pendingData = null;
  });

  function renderRecentMonitors() {
    const stored = localStorage.getItem('recentMonitors');
    if (!stored) {
      recentMonitorsWrap.style.display = 'none';
      return;
    }

    const recent = JSON.parse(stored);
    if (recent.length === 0) {
      recentMonitorsWrap.style.display = 'none';
      return;
    }

    recentMonitorsWrap.style.display = 'block';
    recentMonitorsList.innerHTML = '';

    recent.reverse().slice(0, 5).forEach(name => {
      const pill = document.createElement('div');
      pill.className = 'recent-pill';
      pill.innerHTML = `<div class="recent-pill-txt">${name}</div>`;
      
      pill.addEventListener('click', () => {
        monitorCrecheNameInput.value = name;
        monitorForm.requestSubmit(); // Auto-continue for convenience
      });
      
      recentMonitorsList.appendChild(pill);
    });
  }

  function showToast(type) {
    const title = toast.querySelector('.modal-title');
    const sub = toast.querySelector('.modal-sub');
    title.innerText = type === 'monitoring' ? 'Monitoring Saved' : 'Screening Saved';
    sub.innerText = 'The data has been stored locally.';
    
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  async function triggerSync() {
    let records = [];
    const stored = localStorage.getItem('screeningRecords');
    if (stored) records = JSON.parse(stored);
    
    let unsynced = records.filter(r => !r.synced);
    if (unsynced.length === 0) return updateSyncStatus();
    
    syncStatus.innerText = 'Syncing...';
    syncStatus.style.color = 'var(--text3)';
    
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyA_0QlyIFCZ6dtqhol_vYRGvmIyUovCDtJ9Me8M_xFM3UYz2OL0GiBD49FdbT_I_xFIA/exec';

    for (let record of unsynced) {
       try {
         // Firing to Google App Script using no-cors because Google forces a 302 redirect that breaks strict CORS handling.
         // A successful offline catch will instantly throw a network error preventing record.synced = true.
         await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(record)
         });
         
         record.synced = true;
       } catch (err) {
         console.error('Record failed to sync (Offline Queue Triggered)', err);
       }
    }
    
    localStorage.setItem('screeningRecords', JSON.stringify(records));
    updateSyncStatus();
  }
  
  function updateSyncStatus() {
    let records = [];
    const stored = localStorage.getItem('screeningRecords');
    if (stored) records = JSON.parse(stored);
    let unsynced = records.filter(r => !r.synced);

    if (unsynced.length === 0) {
       syncStatus.innerText = 'Up to date';
       syncStatus.style.color = 'var(--green)';
    } else {
       syncStatus.innerText = `${unsynced.length} pending`;
       syncStatus.style.color = 'var(--orange)';
    }
  }

  window.addEventListener('online', () => {
     triggerSync();
  });

  function saveRecord(record) {
    record.synced = false;
    let records = [];
    const stored = localStorage.getItem('screeningRecords');
    if (stored) {
      try {
        records = JSON.parse(stored);
      } catch (e) {
        console.error("Could not parse records");
      }
    }
    records.push(record);
    localStorage.setItem('screeningRecords', JSON.stringify(records));

    // Automatically try to sync to cloud if connected
    triggerSync();
  }

  // Initial Sync Status check on startup
  updateSyncStatus();


  function showToast() {
    toast.classList.add('open');
    setTimeout(() => {
      toast.classList.remove('open');
    }, 2500);
  }
});
