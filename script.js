/**
 * US24 Solutions - Patient Statement Portal
 * HIPAA-Compliant Single Authentication Page & Healthcare Operations Hub
 * 
 * Features:
 * - Single, unified Patient Statement login page (HIPAA NIST-800 compliant)
 * - Two-factor authentication (MFA/OTP) verification
 * - Dynamic Welcome Screen with official US24 Solutions logo & animated security progress
 * - First Homepage with:
 *     1. Top Corner: User ID + Clinic (Facility information)
 *     2. Middle of the page: Three primary cards:
 *         - Card 1: AR Report (Accounts Receivable Aging & Denial Analysis)
 *         - Card 2: Clinic Collection (Reconciliation, Daily Deposits & EFT Yield)
 *         - Card 3: Patient Statement (Invoices, CPT Breakdown & Balance Due)
 * - Interactive Modals for AR Report, Clinic Collection, and Line-Item Statement Breakdown
 * - PCI-DSS Level 1 compliant payment flow simulation
 * - Statement PDF printing / saving
 * - HIPAA 15-minute inactivity session lock timer
 * - Real-time password strength validation & visibility toggle
 * - Light / Dark mode persistence
 */

(function () {
  'use strict';

  // State Management
  const state = {
    theme: localStorage.getItem('us24_theme') || 'light',
    sessionTimeLeft: 15 * 60, // 15 minutes in seconds
    timerInterval: null,
    rememberDevice: false,
    activeUser: null,
    welcomeTimer: null,
    currentView: 'login', // 'login' | 'welcome' | 'home'
  };

  // Predefined Demo Patient Profile for Easy Testing
  const demoPatient = {
    identifier: 'sarah.jenkins@example.com',
    dob: '1988-06-14',
    password: 'US24@PatientStatement2026',
    name: 'Sarah Jenkins',
    userId: 'US24-84920',
    clinic: 'Metro Health Clinic',
    mrn: 'US-84920',
    statementNumber: '#US-2026-98124',
    balance: '$345.00',
    totalBilled: '$1,450.00',
    insurancePaid: '-$1,105.00',
  };

  // DOM Elements
  const elements = {
    // Views
    loginView: document.getElementById('loginView'),
    welcomeView: document.getElementById('welcomeView'),
    homeView: document.getElementById('homeView'),

    // Top Bar & Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    timerCountdown: document.getElementById('timerCountdown'),

    // Demo Autofill Helper
    autofillDemoBtn: document.getElementById('autofillDemoBtn'),

    // Login Form & Inputs
    loginForm: document.getElementById('loginForm'),
    identifierLabel: document.getElementById('identifierLabel'),
    primaryIdentifier: document.getElementById('primaryIdentifier'),
    identifierError: document.getElementById('identifierError'),
    portalPassword: document.getElementById('portalPassword'),
    passwordError: document.getElementById('passwordError'),
    togglePasswordBtn: document.getElementById('togglePasswordBtn'),
    strengthBarFill: document.getElementById('strengthBarFill'),
    strengthText: document.getElementById('strengthText'),
    rememberDevice: document.getElementById('rememberDevice'),
    submitLoginBtn: document.getElementById('submitLoginBtn'),
    formAlert: document.getElementById('formAlert'),
    alertMessage: document.getElementById('alertMessage'),
    alertCloseBtn: document.getElementById('alertCloseBtn'),

    // SSO Buttons
    ssoHealthIdBtn: document.getElementById('ssoHealthIdBtn'),
    ssoGoogleBtn: document.getElementById('ssoGoogleBtn'),

    // 2FA / OTP Modal
    otpModalBackdrop: document.getElementById('otpModalBackdrop'),
    otpTargetDisplay: document.getElementById('otpTargetDisplay'),
    otpContainer: document.getElementById('otpContainer'),
    autofillOtpBtn: document.getElementById('autofillOtpBtn'),
    resendOtpBtn: document.getElementById('resendOtpBtn'),
    cancelOtpBtn: document.getElementById('cancelOtpBtn'),
    verifyOtpBtn: document.getElementById('verifyOtpBtn'),

    // Welcome Screen Elements
    welcomeLogo: document.getElementById('welcomeLogo'),
    welcomePatientName: document.getElementById('welcomePatientName'),
    welcomePatientDetails: document.getElementById('welcomePatientDetails'),
    welcomeProgressFill: document.getElementById('welcomeProgressFill'),
    welcomeStatusText: document.getElementById('welcomeStatusText'),
    proceedToHomeBtn: document.getElementById('proceedToHomeBtn'),

    // Homepage Elements: Top Corner User ID & Clinic
    topCornerUserId: document.getElementById('topCornerUserId'),
    topCornerClinicName: document.getElementById('topCornerClinicName'),
    homeSignoutBtn: document.getElementById('homeSignoutBtn'),
    homeGreetingName: document.getElementById('homeGreetingName'),

    // Middle of Homepage: 3 Operation Cards
    cardArReport: document.getElementById('cardArReport'),
    openArReportBtn: document.getElementById('openArReportBtn'),
    cardClinicCollection: document.getElementById('cardClinicCollection'),
    openClinicCollectionBtn: document.getElementById('openClinicCollectionBtn'),
    cardPatientStatement: document.getElementById('cardPatientStatement'),
    openPatientStatementBtn: document.getElementById('openPatientStatementBtn'),
    hubPatientBalance: document.getElementById('hubPatientBalance'),
    hubInsurancePaid: document.getElementById('hubInsurancePaid'),
    patientStatementsSection: document.getElementById('patientStatementsSection'),

    // Homepage Patient Statement Detail Elements
    homePayStatementBtn: document.getElementById('homePayStatementBtn'),
    homeDownloadPdfBtn: document.getElementById('homeDownloadPdfBtn'),
    homeKpiBalance: document.getElementById('homeKpiBalance'),
    homeKpiInsurance: document.getElementById('homeKpiInsurance'),
    homeKpiTotalBilled: document.getElementById('homeKpiTotalBilled'),
    kpiViewStmtLink: document.getElementById('kpiViewStmtLink'),
    statementSearchInput: document.getElementById('statementSearchInput'),
    tblViewStmtBtn: document.getElementById('tblViewStmtBtn'),
    tblPayStmtBtn: document.getElementById('tblPayStmtBtn'),
    tblReceiptBtn1: document.getElementById('tblReceiptBtn1'),
    tblReceiptBtn2: document.getElementById('tblReceiptBtn2'),
    tblPdfBtn1: document.getElementById('tblPdfBtn1'),
    tblPdfBtn2: document.getElementById('tblPdfBtn2'),
    navPaymentHistoryBtn: document.getElementById('navPaymentHistoryBtn'),
    navInsuranceBtn: document.getElementById('navInsuranceBtn'),
    navSupportBtn: document.getElementById('navSupportBtn'),

    // Statement Line-Item Modal
    dashboardModalBackdrop: document.getElementById('dashboardModalBackdrop'),
    dashPatientName: document.getElementById('dashPatientName'),
    dashTotalBilled: document.getElementById('dashTotalBilled'),
    dashInsurancePaid: document.getElementById('dashInsurancePaid'),
    dashPatientBalance: document.getElementById('dashPatientBalance'),
    closeDashBtn: document.getElementById('closeDashBtn'),
    printStatementBtn: document.getElementById('printStatementBtn'),
    payBalanceBtn: document.getElementById('payBalanceBtn'),

    // AR Report Modal
    arReportModalBackdrop: document.getElementById('arReportModalBackdrop'),
    closeArBtn: document.getElementById('closeArBtn'),
    ackArBtn: document.getElementById('ackArBtn'),
    printArBtn: document.getElementById('printArBtn'),

    // Clinic Collection Modal
    clinicCollectionModalBackdrop: document.getElementById('clinicCollectionModalBackdrop'),
    closeCollectionBtn: document.getElementById('closeCollectionBtn'),
    ackCollectionBtn: document.getElementById('ackCollectionBtn'),
    printCollectionBtn: document.getElementById('printCollectionBtn'),

    // Forgot Password & Privacy Modals
    forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
    forgotModalBackdrop: document.getElementById('forgotModalBackdrop'),
    closeForgotBtn: document.getElementById('closeForgotBtn'),
    forgotForm: document.getElementById('forgotForm'),
    privacyNoticeBtn: document.getElementById('privacyNoticeBtn'),
    termsNoticeBtn: document.getElementById('termsNoticeBtn'),
    privacyModalBackdrop: document.getElementById('privacyModalBackdrop'),
    closePrivacyBtn: document.getElementById('closePrivacyBtn'),
    ackPrivacyBtn: document.getElementById('ackPrivacyBtn'),
  };

  /* ==========================================================================
     THEME MANAGEMENT
     ========================================================================== */
  function applyTheme(themeName) {
    state.theme = themeName;
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('us24_theme', themeName);
  }

  function toggleTheme() {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  /* ==========================================================================
     HIPAA 15-MINUTE SESSION TIMEOUT SIMULATION
     ========================================================================== */
  function startSessionTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.sessionTimeLeft = 15 * 60; // 15 mins

    function updateDisplay() {
      const mins = Math.floor(state.sessionTimeLeft / 60);
      const secs = state.sessionTimeLeft % 60;
      if (elements.timerCountdown) {
        elements.timerCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      if (state.sessionTimeLeft <= 0) {
        clearInterval(state.timerInterval);
        handleSessionExpired();
      } else {
        state.sessionTimeLeft--;
      }
    }

    updateDisplay();
    state.timerInterval = setInterval(updateDisplay, 1000);
  }

  function resetSessionTimer() {
    state.sessionTimeLeft = 15 * 60;
  }

  function handleSessionExpired() {
    closeAllModals();
    handleSignOut();
    showAlert('error', 'HIPAA Security Timeout: Your session was automatically locked after 15 minutes of inactivity.');
  }

  // Activity listeners to reset timeout
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetSessionTimer, { passive: true });
  });

  /* ==========================================================================
     VIEW NAVIGATION CONTROLLER (LOGIN -> WELCOME -> HOMEPAGE)
     ========================================================================== */
  function showView(viewName) {
    state.currentView = viewName;

    if (elements.loginView) elements.loginView.style.display = 'none';
    if (elements.welcomeView) elements.welcomeView.style.display = 'none';
    if (elements.homeView) elements.homeView.style.display = 'none';

    if (viewName === 'login') {
      if (elements.loginView) elements.loginView.style.display = 'block';
    } else if (viewName === 'welcome') {
      if (elements.welcomeView) elements.welcomeView.style.display = 'flex';
    } else if (viewName === 'home') {
      if (elements.homeView) elements.homeView.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ==========================================================================
     WELCOME SCREEN TRANSITION
     ========================================================================== */
  function startWelcomeTransition() {
    showView('welcome');

    if (state.welcomeTimer) {
      clearTimeout(state.welcomeTimer);
      state.welcomeTimer = null;
    }

    // Populate user profile info across the screens
    const user = state.activeUser || demoPatient;
    if (elements.welcomePatientName) elements.welcomePatientName.textContent = user.name;
    if (elements.welcomePatientDetails) {
      elements.welcomePatientDetails.textContent = `MRN: ${user.mrn || 'US-84920'} • Statement ${user.statementNumber || '#US-2026-98124'}`;
    }
    if (elements.homeGreetingName) elements.homeGreetingName.textContent = user.name;
    if (elements.topCornerUserId) elements.topCornerUserId.textContent = user.userId || user.mrn || 'US24-84920';
    if (elements.topCornerClinicName) elements.topCornerClinicName.textContent = user.clinic || 'Metro Health Clinic';
    if (elements.dashPatientName) elements.dashPatientName.textContent = user.name;
    if (elements.hubPatientBalance) elements.hubPatientBalance.textContent = user.balance || '$345.00';
    if (elements.hubInsurancePaid) elements.hubInsurancePaid.textContent = user.insurancePaid || '-$1,105.00';

    // Reset progress bar to initial state
    if (elements.welcomeProgressFill) elements.welcomeProgressFill.style.width = '0%';
    if (elements.welcomeStatusText) elements.welcomeStatusText.textContent = 'Securing 256-bit cryptographic session...';

    // Step 1: 350ms
    setTimeout(() => {
      if (state.currentView !== 'welcome') return;
      if (elements.welcomeProgressFill) elements.welcomeProgressFill.style.width = '35%';
      if (elements.welcomeStatusText) elements.welcomeStatusText.textContent = 'Authenticating with US24 RCM Gateway...';
    }, 350);

    // Step 2: 1050ms
    setTimeout(() => {
      if (state.currentView !== 'welcome') return;
      if (elements.welcomeProgressFill) elements.welcomeProgressFill.style.width = '70%';
      if (elements.welcomeStatusText) elements.welcomeStatusText.textContent = 'Decrypting Protected Health Records (PHI)...';
    }, 1050);

    // Step 3: 1750ms
    setTimeout(() => {
      if (state.currentView !== 'welcome') return;
      if (elements.welcomeProgressFill) elements.welcomeProgressFill.style.width = '100%';
      if (elements.welcomeStatusText) elements.welcomeStatusText.textContent = `Welcome ${user.name}! Opening Patient Statement Portal...`;
    }, 1750);

    // Step 4: 2600ms -> Automatically transition to Homepage
    state.welcomeTimer = setTimeout(() => {
      if (state.currentView === 'welcome') {
        goToHomePage();
      }
    }, 2600);
  }

  function goToHomePage() {
    if (state.welcomeTimer) {
      clearTimeout(state.welcomeTimer);
      state.welcomeTimer = null;
    }
    const user = state.activeUser || demoPatient;
    if (elements.topCornerUserId) elements.topCornerUserId.textContent = user.userId || user.mrn || 'US24-84920';
    if (elements.topCornerClinicName) elements.topCornerClinicName.textContent = user.clinic || 'Metro Health Clinic';
    if (elements.homeGreetingName) elements.homeGreetingName.textContent = user.name;

    showView('home');
    startSessionTimer(); // Refresh active session timer on homepage entry
  }

  function handleSignOut() {
    if (state.welcomeTimer) {
      clearTimeout(state.welcomeTimer);
      state.welcomeTimer = null;
    }
    state.activeUser = null;
    closeAllModals();
    showView('login');
    showAlert('success', 'You have been securely signed out. Session encrypted and closed.');
  }

  /* ==========================================================================
     DEMO AUTOFILL HELPER
     ========================================================================== */
  function fillDemoPatient() {
    if (elements.primaryIdentifier) elements.primaryIdentifier.value = demoPatient.identifier;
    if (elements.portalPassword) {
      elements.portalPassword.value = demoPatient.password;
      updatePasswordStrength(demoPatient.password);
    }
    showAlert('success', `Loaded demo credentials for ${demoPatient.name} (MRN: ${demoPatient.mrn}). Click "Authenticate & View Statements" to test.`);
  }

  /* ==========================================================================
     PASSWORD STRENGTH METER & TOGGLE
     ========================================================================== */
  function togglePasswordVisibility() {
    const isPassword = elements.portalPassword.type === 'password';
    elements.portalPassword.type = isPassword ? 'text' : 'password';
    elements.togglePasswordBtn.classList.toggle('showing', isPassword);
    elements.togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  }

  function updatePasswordStrength(pwd) {
    if (!elements.strengthBarFill || !elements.strengthText) return;

    if (!pwd) {
      elements.strengthBarFill.style.width = '0%';
      elements.strengthBarFill.style.backgroundColor = '#e53e3e';
      elements.strengthText.textContent = 'Password Strength: Empty';
      return;
    }

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    let width = '20%';
    let color = '#e53e3e'; // red
    let label = 'Weak (Needs 8+ chars, numbers & symbols)';

    if (score >= 4) {
      width = '100%';
      color = '#2fa177'; // green
      label = 'Strong (Meets HIPAA NIST-800 guidelines)';
    } else if (score >= 3) {
      width = '65%';
      color = '#fe7121'; // orange
      label = 'Good (Recommended: add special characters)';
    } else if (score >= 2) {
      width = '40%';
      color = '#e68778';
      label = 'Moderate (Minimum 8 chars with 1 number)';
    }

    elements.strengthBarFill.style.width = width;
    elements.strengthBarFill.style.backgroundColor = color;
    elements.strengthText.textContent = `Password Strength: ${label}`;
  }

  /* ==========================================================================
     ALERTS & FORM VALIDATION
     ========================================================================== */
  function showAlert(type, msg) {
    if (!elements.formAlert) return;
    elements.formAlert.className = `alert-box alert-${type}`;
    elements.alertMessage.textContent = msg;
    elements.formAlert.style.display = 'flex';
  }

  function hideAlert() {
    if (elements.formAlert) {
      elements.formAlert.style.display = 'none';
    }
  }

  function clearValidationErrors() {
    document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
  }

  function validateLoginForm() {
    clearValidationErrors();
    let isValid = true;

    // Validate Identifier
    const idVal = elements.primaryIdentifier ? elements.primaryIdentifier.value.trim() : '';
    if (!idVal) {
      elements.primaryIdentifier.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Validate Password
    const pwdVal = elements.portalPassword ? elements.portalPassword.value : '';
    if (!pwdVal || pwdVal.length < 6) {
      elements.portalPassword.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    return isValid;
  }

  /* ==========================================================================
     LOGIN & 2FA / OTP WORKFLOW
     ========================================================================== */
  function handleLoginSubmit(e) {
    e.preventDefault();

    if (!validateLoginForm()) {
      showAlert('error', 'Please fill in all required HIPAA identification fields correctly.');
      return;
    }

    // Simulate Secure Submission & Server Handshake
    elements.submitLoginBtn.classList.add('loading');
    elements.submitLoginBtn.disabled = true;

    setTimeout(() => {
      elements.submitLoginBtn.classList.remove('loading');
      elements.submitLoginBtn.disabled = false;

      // Set active user
      const identifierInput = elements.primaryIdentifier.value.trim();
      const isDemo = identifierInput.toLowerCase().includes('sarah') || identifierInput.includes('84920');

      state.activeUser = {
        name: isDemo ? demoPatient.name : (identifierInput.split('@')[0] || 'Patient User'),
        identifier: identifierInput,
        userId: isDemo ? demoPatient.userId : `US24-${Math.floor(10000 + Math.random() * 90000)}`,
        clinic: demoPatient.clinic,
        mrn: isDemo ? demoPatient.mrn : 'US-84920',
        statementNumber: isDemo ? demoPatient.statementNumber : '#US-2026-98124',
        balance: demoPatient.balance,
        totalBilled: demoPatient.totalBilled,
        insurancePaid: demoPatient.insurancePaid,
      };

      // Open 2FA Verification Modal (HIPAA requirement)
      openOtpModal();
    }, 600);
  }

  function openOtpModal() {
    if (!elements.otpModalBackdrop) return;
    elements.otpTargetDisplay.textContent = `${state.activeUser.identifier} (+1 ••• ••• 4920)`;
    elements.otpModalBackdrop.style.display = 'flex';
    clearOtpInputs();

    // Focus first OTP digit
    const firstDigit = elements.otpContainer ? elements.otpContainer.querySelector('.otp-digit') : null;
    if (firstDigit) firstDigit.focus();
  }

  function clearOtpInputs() {
    if (!elements.otpContainer) return;
    elements.otpContainer.querySelectorAll('.otp-digit').forEach(input => {
      input.value = '';
    });
  }

  function autofillDemoOtp() {
    const code = ['9', '4', '8', '2', '1', '0'];
    const inputs = elements.otpContainer.querySelectorAll('.otp-digit');
    inputs.forEach((input, idx) => {
      input.value = code[idx] || '';
    });
    inputs[inputs.length - 1].focus();
  }

  function verifyOtp() {
    const inputs = elements.otpContainer ? elements.otpContainer.querySelectorAll('.otp-digit') : [];
    const enteredCode = Array.from(inputs).map(i => i.value).join('');

    if (enteredCode.length < 6) {
      alert('Please enter all 6 digits of your HIPAA verification code (Demo code: 9 4 8 2 1 0).');
      return;
    }

    // Close OTP modal and launch the Welcome Screen sequence
    if (elements.otpModalBackdrop) elements.otpModalBackdrop.style.display = 'none';
    startWelcomeTransition();
  }

  /* ==========================================================================
     PATIENT STATEMENT LINE-ITEM BREAKDOWN MODAL
     ========================================================================== */
  function openDashboardModal() {
    if (!elements.dashboardModalBackdrop) return;

    const user = state.activeUser || demoPatient;
    if (elements.dashPatientName) elements.dashPatientName.textContent = user.name;
    if (elements.dashTotalBilled) elements.dashTotalBilled.textContent = user.totalBilled || '$1,450.00';
    if (elements.dashInsurancePaid) elements.dashInsurancePaid.textContent = user.insurancePaid || '-$1,105.00';
    if (elements.dashPatientBalance) elements.dashPatientBalance.textContent = user.balance || '$345.00';

    elements.dashboardModalBackdrop.style.display = 'flex';
  }

  function closeAllModals() {
    if (elements.otpModalBackdrop) elements.otpModalBackdrop.style.display = 'none';
    if (elements.dashboardModalBackdrop) elements.dashboardModalBackdrop.style.display = 'none';
    if (elements.arReportModalBackdrop) elements.arReportModalBackdrop.style.display = 'none';
    if (elements.clinicCollectionModalBackdrop) elements.clinicCollectionModalBackdrop.style.display = 'none';
    if (elements.forgotModalBackdrop) elements.forgotModalBackdrop.style.display = 'none';
    if (elements.privacyModalBackdrop) elements.privacyModalBackdrop.style.display = 'none';
  }

  /* ==========================================================================
     PAYMENT PROCESSING SIMULATION
     ========================================================================== */
  function handlePaymentAction(amount) {
    const user = state.activeUser || demoPatient;
    const confirmPay = confirm(
      `US24 PCI-DSS Level 1 Secure Payment Gateway\n\n` +
      `Statement: #US-2026-98124\n` +
      `Patient: ${user.name}\n` +
      `Amount Due: ${amount || '$345.00'}\n\n` +
      `Proceed with encrypted debit/credit card transaction?`
    );

    if (confirmPay) {
      alert(
        `✓ Transaction Successful!\n\n` +
        `Payment of ${amount || '$345.00'} has been authorized.\n` +
        `Transaction ID: US24-TX-${Math.floor(100000 + Math.random() * 900000)}\n` +
        `An official HIPAA-compliant receipt has been emailed to ${user.identifier || demoPatient.identifier}.`
      );
    }
  }

  /* ==========================================================================
     SCROLL TO PATIENT STATEMENT SECTION
     ========================================================================== */
  function scrollToPatientStatements(e) {
    if (e) e.stopPropagation();
    if (elements.patientStatementsSection) {
      elements.patientStatementsSection.scrollIntoView({ behavior: 'smooth' });
      elements.patientStatementsSection.classList.remove('pulse-highlight');
      // trigger reflow
      void elements.patientStatementsSection.offsetWidth;
      elements.patientStatementsSection.classList.add('pulse-highlight');
    }
  }

  /* ==========================================================================
     EVENT LISTENERS INITIALIZATION
     ========================================================================== */
  function setupEventListeners() {
    // Theme toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Demo preset button
    if (elements.autofillDemoBtn) {
      elements.autofillDemoBtn.addEventListener('click', fillDemoPatient);
    }

    // Password visibility & meter
    if (elements.togglePasswordBtn) {
      elements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    if (elements.portalPassword) {
      elements.portalPassword.addEventListener('input', (e) => updatePasswordStrength(e.target.value));
    }

    // Alert close
    if (elements.alertCloseBtn) {
      elements.alertCloseBtn.addEventListener('click', hideAlert);
    }

    // Form submit
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Federated Identity / SSO Buttons (Single click login simulation)
    if (elements.ssoHealthIdBtn) {
      elements.ssoHealthIdBtn.addEventListener('click', () => {
        fillDemoPatient();
        state.activeUser = {
          name: demoPatient.name,
          identifier: demoPatient.identifier,
          userId: demoPatient.userId,
          clinic: demoPatient.clinic,
          mrn: demoPatient.mrn,
          statementNumber: demoPatient.statementNumber,
          balance: demoPatient.balance,
          totalBilled: demoPatient.totalBilled,
          insurancePaid: demoPatient.insurancePaid,
        };
        startWelcomeTransition();
      });
    }

    if (elements.ssoGoogleBtn) {
      elements.ssoGoogleBtn.addEventListener('click', () => {
        fillDemoPatient();
        state.activeUser = {
          name: demoPatient.name,
          identifier: demoPatient.identifier,
          userId: demoPatient.userId,
          clinic: demoPatient.clinic,
          mrn: demoPatient.mrn,
          statementNumber: demoPatient.statementNumber,
          balance: demoPatient.balance,
          totalBilled: demoPatient.totalBilled,
          insurancePaid: demoPatient.insurancePaid,
        };
        startWelcomeTransition();
      });
    }

    // OTP Modal Events
    if (elements.cancelOtpBtn) {
      elements.cancelOtpBtn.addEventListener('click', () => {
        elements.otpModalBackdrop.style.display = 'none';
      });
    }
    if (elements.verifyOtpBtn) elements.verifyOtpBtn.addEventListener('click', verifyOtp);
    if (elements.autofillOtpBtn) elements.autofillOtpBtn.addEventListener('click', autofillDemoOtp);
    if (elements.resendOtpBtn) {
      elements.resendOtpBtn.addEventListener('click', () => {
        alert('HIPAA Security Gateway: A fresh 6-digit verification code has been transmitted to your registered phone & email.');
      });
    }

    // OTP Digits Auto-focus movement
    if (elements.otpContainer) {
      const otpInputs = elements.otpContainer.querySelectorAll('.otp-digit');
      otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
          if (e.target.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
          }
          if (e.key === 'Enter') {
            verifyOtp();
          }
        });
      });
    }

    // Welcome Screen: Proceed to Homepage Button
    if (elements.proceedToHomeBtn) {
      elements.proceedToHomeBtn.addEventListener('click', goToHomePage);
    }

    // Homepage: Sign Out Button
    if (elements.homeSignoutBtn) {
      elements.homeSignoutBtn.addEventListener('click', handleSignOut);
    }

    // ========================================================================
    // HOMEPAGE 3 MIDDLE CARDS INTERACTION
    // ========================================================================
    // Card 1: AR Report
    if (elements.cardArReport) {
      elements.cardArReport.addEventListener('click', () => {
        if (elements.arReportModalBackdrop) elements.arReportModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.openArReportBtn) {
      elements.openArReportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elements.arReportModalBackdrop) elements.arReportModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.closeArBtn) {
      elements.closeArBtn.addEventListener('click', () => {
        elements.arReportModalBackdrop.style.display = 'none';
      });
    }
    if (elements.ackArBtn) {
      elements.ackArBtn.addEventListener('click', () => {
        elements.arReportModalBackdrop.style.display = 'none';
      });
    }
    if (elements.printArBtn) {
      elements.printArBtn.addEventListener('click', () => window.print());
    }

    // Card 2: Clinic Collection
    if (elements.cardClinicCollection) {
      elements.cardClinicCollection.addEventListener('click', () => {
        if (elements.clinicCollectionModalBackdrop) elements.clinicCollectionModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.openClinicCollectionBtn) {
      elements.openClinicCollectionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elements.clinicCollectionModalBackdrop) elements.clinicCollectionModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.closeCollectionBtn) {
      elements.closeCollectionBtn.addEventListener('click', () => {
        elements.clinicCollectionModalBackdrop.style.display = 'none';
      });
    }
    if (elements.ackCollectionBtn) {
      elements.ackCollectionBtn.addEventListener('click', () => {
        elements.clinicCollectionModalBackdrop.style.display = 'none';
      });
    }
    if (elements.printCollectionBtn) {
      elements.printCollectionBtn.addEventListener('click', () => window.print());
    }

    // Card 3: Patient Statement
    if (elements.cardPatientStatement) {
      elements.cardPatientStatement.addEventListener('click', scrollToPatientStatements);
    }
    if (elements.openPatientStatementBtn) {
      elements.openPatientStatementBtn.addEventListener('click', scrollToPatientStatements);
    }

    // Homepage: Payment Buttons
    if (elements.homePayStatementBtn) {
      elements.homePayStatementBtn.addEventListener('click', () => handlePaymentAction('$345.00'));
    }
    if (elements.tblPayStmtBtn) {
      elements.tblPayStmtBtn.addEventListener('click', () => handlePaymentAction('$345.00'));
    }
    if (elements.payBalanceBtn) {
      elements.payBalanceBtn.addEventListener('click', () => handlePaymentAction('$345.00'));
    }

    // Homepage: PDF Download Buttons
    if (elements.homeDownloadPdfBtn) {
      elements.homeDownloadPdfBtn.addEventListener('click', () => window.print());
    }
    if (elements.tblPdfBtn1) {
      elements.tblPdfBtn1.addEventListener('click', () => window.print());
    }
    if (elements.tblPdfBtn2) {
      elements.tblPdfBtn2.addEventListener('click', () => window.print());
    }
    if (elements.printStatementBtn) {
      elements.printStatementBtn.addEventListener('click', () => window.print());
    }

    // Homepage: View Line Items Modal
    if (elements.tblViewStmtBtn) {
      elements.tblViewStmtBtn.addEventListener('click', openDashboardModal);
    }
    if (elements.kpiViewStmtLink) {
      elements.kpiViewStmtLink.addEventListener('click', (e) => {
        e.preventDefault();
        openDashboardModal();
      });
    }

    // Line Item Modal Close
    if (elements.closeDashBtn) {
      elements.closeDashBtn.addEventListener('click', () => {
        elements.dashboardModalBackdrop.style.display = 'none';
      });
    }

    // Receipt Detail Buttons
    if (elements.tblReceiptBtn1) {
      elements.tblReceiptBtn1.addEventListener('click', () => {
        alert('Payment Receipt #RCT-2026-94102\nDate: Aug 04, 2026\nAmount: $40.00\nPayment Method: Visa ending in 4021\nStatus: Settled (HIPAA Encrypted)');
      });
    }
    if (elements.tblReceiptBtn2) {
      elements.tblReceiptBtn2.addEventListener('click', () => {
        alert('Payment Receipt #RCT-2026-89100\nDate: May 19, 2026\nAmount: $0.00 (Paid in Full by Insurance)\nStatus: Settled');
      });
    }

    // Statements Table Real-time Search Filter
    if (elements.statementSearchInput) {
      elements.statementSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll('.home-statements-table tbody tr');
        rows.forEach(row => {
          const rowText = row.textContent.toLowerCase();
          row.style.display = rowText.includes(query) ? '' : 'none';
        });
      });
    }

    // Navigation Menu Links
    if (elements.navPaymentHistoryBtn) {
      elements.navPaymentHistoryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Payment History: All past transactions are logged with cryptographic hashes under HIPAA 45 CFR § 164.312.');
      });
    }
    if (elements.navInsuranceBtn) {
      elements.navInsuranceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Insurance Claims: Active Provider BlueCross BlueShield PPO. Policy #BC-89240192. Claims are processed directly via US24 Solutions RCM.');
      });
    }
    if (elements.navSupportBtn) {
      elements.navSupportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const supportBar = document.querySelector('.home-support-bar');
        if (supportBar) supportBar.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Forgot Password Modal
    if (elements.forgotPasswordBtn) {
      elements.forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.forgotModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.closeForgotBtn) {
      elements.closeForgotBtn.addEventListener('click', () => {
        elements.forgotModalBackdrop.style.display = 'none';
      });
    }
    if (elements.forgotForm) {
      elements.forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Secure password recovery link dispatched to your verified address. Please check your inbox within 10 minutes.');
        elements.forgotModalBackdrop.style.display = 'none';
      });
    }

    // Privacy & Terms Modals
    if (elements.privacyNoticeBtn) {
      elements.privacyNoticeBtn.addEventListener('click', () => {
        elements.privacyModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.termsNoticeBtn) {
      elements.termsNoticeBtn.addEventListener('click', () => {
        elements.privacyModalBackdrop.style.display = 'flex';
      });
    }
    if (elements.closePrivacyBtn) {
      elements.closePrivacyBtn.addEventListener('click', () => {
        elements.privacyModalBackdrop.style.display = 'none';
      });
    }
    if (elements.ackPrivacyBtn) {
      elements.ackPrivacyBtn.addEventListener('click', () => {
        elements.privacyModalBackdrop.style.display = 'none';
      });
    }

    // Global Escape Key to dismiss modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  // Self Initialization
  function init() {
    applyTheme(state.theme);
    startSessionTimer();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
