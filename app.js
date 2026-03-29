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
  const userNameBlock = document.getElementById('userNameBlock');
  const userNameDisplayBlock = document.getElementById('userNameDisplayBlock');
  const displayUserName = document.getElementById('displayUserName');
  const changeNameBtn = document.getElementById('changeNameBtn');
  const userNameInput = document.getElementById('userName');
  const syncStatus = document.getElementById('syncStatus');
  const loginForm = document.getElementById('loginForm');
  const screenLogin = document.getElementById('screen-login');
  const screenNav = document.getElementById('screen-nav');
  const startScreeningFlow = document.getElementById('startScreeningFlow');
  const loginError = document.getElementById('loginError');
  const appTopbar = document.getElementById('appTopbar');
  const logoutBtn = document.getElementById('logoutBtn');

  let currentCreche = '';

  // --- LOGIN LOGIC ---
  const checkLogin = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      screenLogin.classList.remove('active');
      screenNav.classList.add('active');
      screenCreche.classList.remove('active');
      appTopbar.style.display = 'flex';
    } else {
      screenLogin.classList.add('active');
      screenNav.classList.remove('active');
      screenCreche.classList.remove('active');
      appTopbar.style.display = 'none';
    }
  };

  // --- SCREEN TRANSITIONS ---
  startScreeningFlow.addEventListener('click', () => {
    screenNav.classList.remove('active');
    screenCreche.classList.add('active');
    backBtn.style.visibility = 'visible';
  });

  backBtn.addEventListener('click', () => {
    if (screenDetails.classList.contains('active')) {
      screenDetails.classList.remove('active');
      screenCreche.classList.add('active');
    } else {
      screenCreche.classList.remove('active');
      screenNav.classList.add('active');
      backBtn.style.visibility = 'hidden';
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    if (user === 'eddy' && pass === '1') {
      localStorage.setItem('isLoggedIn', 'true');
      loginError.style.display = 'none';
      checkLogin();
    } else {
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    checkLogin();
  });

  // Run initial check
  checkLogin();
  
  // Initialization for Name Setup
  let savedName = localStorage.getItem('screenerName');
  if (savedName) {
    userNameBlock.style.display = 'none';
    userNameDisplayBlock.style.display = 'block';
    displayUserName.innerText = savedName;
    userNameInput.required = false;
  } else {
    userNameInput.required = true;
  }

  changeNameBtn.addEventListener('click', () => {
    userNameBlock.style.display = 'block';
    userNameDisplayBlock.style.display = 'none';
    userNameInput.value = savedName || '';
    userNameInput.required = true;
    userNameInput.focus();
  });

  crecheForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Save User Name if a new one was entered
    const enteredName = userNameInput.value.trim();
    if (enteredName) {
      localStorage.setItem('screenerName', enteredName);
      savedName = enteredName; // Update local state
      
      // Update UI for next time
      userNameBlock.style.display = 'none';
      userNameDisplayBlock.style.display = 'block';
      displayUserName.innerText = savedName;
      userNameInput.required = false;
      userNameInput.value = '';
    }

    currentCreche = document.getElementById('crecheName').value;
    crecheSubtitle.innerText = 'Screening for: ' + currentCreche;
    
    // Transition UI
    screenCreche.classList.remove('active');
    screenDetails.classList.add('active');
    backBtn.style.visibility = 'visible';
  });

  screeningForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get Form Data
    const formData = {
      id: Date.now(),
      date: new Date().toISOString(),
      screener: savedName || 'Unknown',
      creche: currentCreche,
      screened: parseInt(document.getElementById('screened').value),
      cariesFree: parseInt(document.getElementById('cariesFree').value),
      abscess: parseInt(document.getElementById('abscess').value),
      initialCaries: parseInt(document.getElementById('initialCaries').value)
    };

    // Save to LocalStorage
    saveRecord(formData);

    // Reset Form
    screeningForm.reset();
    crecheForm.reset();
    currentCreche = '';

    // Go back to dashboard (screen 1)
    screenDetails.classList.remove('active');
    screenNav.classList.add('active');
    backBtn.style.visibility = 'hidden';

    // Show Toast Notification
    showToast();
  });

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
