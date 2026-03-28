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

  let currentCreche = '';
  
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

  backBtn.addEventListener('click', () => {
    screenDetails.classList.remove('active');
    screenCreche.classList.add('active');
    backBtn.style.visibility = 'hidden';
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

    // Go back to screen 1
    screenDetails.classList.remove('active');
    screenCreche.classList.add('active');
    backBtn.style.visibility = 'hidden';

    // Show Toast Notification
    showToast();
  });

  function saveRecord(record) {
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
  }

  function showToast() {
    toast.classList.add('open');
    setTimeout(() => {
      toast.classList.remove('open');
    }, 2500);
  }
});
