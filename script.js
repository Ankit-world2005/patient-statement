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
    dashboardView: document.getElementById('dashboardView'),

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

    // Homepage Elements: Top Corner User ID, Clinic & Logo
    topCornerUserId: document.getElementById('topCornerUserId'),
    clinicSelect: document.getElementById('clinicSelect'),
    homeCompanyLogo: document.getElementById('homeCompanyLogo'),

    // Middle of Homepage: 3 Operation Cards
    cardArReport: document.getElementById('cardArReport'),
    cardClinicCollection: document.getElementById('cardClinicCollection'),
    cardPatientStatement: document.getElementById('cardPatientStatement'),

    // Admin Patient Statement Dashboard Page Elements
    backToHomeBtn: document.getElementById('backToHomeBtn'),
    adminMetaUserId: document.getElementById('adminMetaUserId'),
    adminClinicScopeSelect: document.getElementById('adminClinicScopeSelect'),
    adminBatchBtn: document.getElementById('adminBatchBtn'),
    adminBulkRemindBtn: document.getElementById('adminBulkRemindBtn'),
    adminExportCsvBtn: document.getElementById('adminExportCsvBtn'),
    adminPrintSummaryBtn: document.getElementById('adminPrintSummaryBtn'),
    kpiActiveStatements: document.getElementById('kpiActiveStatements'),
    kpiTotalBilled: document.getElementById('kpiTotalBilled'),
    kpiPatientAr: document.getElementById('kpiPatientAr'),
    kpiAvgBalance: document.getElementById('kpiAvgBalance'),
    kpiMtdCollections: document.getElementById('kpiMtdCollections'),
    kpiDeliveryRate: document.getElementById('kpiDeliveryRate'),
    kpiDigitalCount: document.getElementById('kpiDigitalCount'),
    kpiPaperCount: document.getElementById('kpiPaperCount'),
    kpiScopeTag: document.getElementById('kpiScopeTag'),
    agingTotalVal: document.getElementById('agingTotalVal'),
    agingProgressBar: document.getElementById('agingProgressBar'),
    agingAmountCurrent: document.getElementById('agingAmountCurrent'),
    agingAmount30: document.getElementById('agingAmount30'),
    agingAmount60: document.getElementById('agingAmount60'),
    agingAmount90: document.getElementById('agingAmount90'),
    clinicFilterTabs: document.getElementById('clinicFilterTabs'),
    adminSearchInput: document.getElementById('adminSearchInput'),
    adminClearSearchBtn: document.getElementById('adminClearSearchBtn'),
    adminStatusFilter: document.getElementById('adminStatusFilter'),
    adminAgingFilter: document.getElementById('adminAgingFilter'),
    adminResetFiltersBtn: document.getElementById('adminResetFiltersBtn'),
    emptyResetBtn: document.getElementById('emptyResetBtn'),
    adminBatchBar: document.getElementById('adminBatchBar'),
    batchSelectedCount: document.getElementById('batchSelectedCount'),
    batchResendBtn: document.getElementById('batchResendBtn'),
    batchExportBtn: document.getElementById('batchExportBtn'),
    batchMarkPaidBtn: document.getElementById('batchMarkPaidBtn'),
    batchDeselectBtn: document.getElementById('batchDeselectBtn'),
    tableRosterMeta: document.getElementById('tableRosterMeta'),
    tableCountBadge: document.getElementById('tableCountBadge'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    adminStatementsTbody: document.getElementById('adminStatementsTbody'),
    adminTableEmpty: document.getElementById('adminTableEmpty'),
    footerRecordsCount: document.getElementById('footerRecordsCount'),

    // Admin Inspection Modal
    adminStatementDetailModal: document.getElementById('adminStatementDetailModal'),
    adminModalClinicPill: document.getElementById('adminModalClinicPill'),
    adminModalStmtNumber: document.getElementById('adminModalStmtNumber'),
    adminModalPatientName: document.getElementById('adminModalPatientName'),
    adminModalMrn: document.getElementById('adminModalMrn'),
    closeAdminDetailBtn: document.getElementById('closeAdminDetailBtn'),
    adminModalDob: document.getElementById('adminModalDob'),
    adminModalPhone: document.getElementById('adminModalPhone'),
    adminModalEmail: document.getElementById('adminModalEmail'),
    adminModalDate: document.getElementById('adminModalDate'),
    adminModalPayer: document.getElementById('adminModalPayer'),
    adminModalDelivery: document.getElementById('adminModalDelivery'),
    adminModalStatus: document.getElementById('adminModalStatus'),
    adminModalTotalBilled: document.getElementById('adminModalTotalBilled'),
    adminModalInsPaid: document.getElementById('adminModalInsPaid'),
    adminModalAdj: document.getElementById('adminModalAdj'),
    adminModalPatientDue: document.getElementById('adminModalPatientDue'),
    adminModalCptTbody: document.getElementById('adminModalCptTbody'),
    adminModalTfootDue: document.getElementById('adminModalTfootDue'),
    adminModalAuditLog: document.getElementById('adminModalAuditLog'),
    adminModalPrintBtn: document.getElementById('adminModalPrintBtn'),
    adminModalResendBtn: document.getElementById('adminModalResendBtn'),
    adminModalRecordPayBtn: document.getElementById('adminModalRecordPayBtn'),
    adminModalCloseBtn: document.getElementById('adminModalCloseBtn'),

    // Admin Batch Modal
    adminBatchModal: document.getElementById('adminBatchModal'),
    closeBatchBtn: document.getElementById('closeBatchBtn'),
    cancelBatchBtn: document.getElementById('cancelBatchBtn'),
    startBatchBtn: document.getElementById('startBatchBtn'),
    batchClinicTarget: document.getElementById('batchClinicTarget'),
    batchCycleType: document.getElementById('batchCycleType'),
    batchMinBalance: document.getElementById('batchMinBalance'),
    batchChannelSms: document.getElementById('batchChannelSms'),
    batchChannelEmail: document.getElementById('batchChannelEmail'),
    batchChannelPaper: document.getElementById('batchChannelPaper'),
    batchProgressBox: document.getElementById('batchProgressBox'),
    batchProgressStatus: document.getElementById('batchProgressStatus'),
    batchProgressFill: document.getElementById('batchProgressFill'),

    // Admin Record Payment Modal
    adminRecordPayModal: document.getElementById('adminRecordPayModal'),
    closeRecordPayBtn: document.getElementById('closeRecordPayBtn'),
    cancelRecordPayBtn: document.getElementById('cancelRecordPayBtn'),
    submitRecordPayBtn: document.getElementById('submitRecordPayBtn'),
    recPayStmtNum: document.getElementById('recPayStmtNum'),
    recPayPatientName: document.getElementById('recPayPatientName'),
    recPayBalanceDue: document.getElementById('recPayBalanceDue'),
    recPayAmount: document.getElementById('recPayAmount'),
    recPayMethod: document.getElementById('recPayMethod'),
    recPayRef: document.getElementById('recPayRef'),

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
    if (elements.dashboardView) elements.dashboardView.style.display = 'none';

    const hipaaBanner = document.querySelector('.hipaa-top-banner');

    if (viewName === 'login') {
      if (elements.loginView) elements.loginView.style.display = 'block';
      document.body.classList.remove('page-home', 'page-dashboard');
      if (hipaaBanner) hipaaBanner.style.display = 'block';
    } else if (viewName === 'welcome') {
      if (elements.welcomeView) elements.welcomeView.style.display = 'flex';
      document.body.classList.remove('page-home', 'page-dashboard');
      if (hipaaBanner) hipaaBanner.style.display = 'block';
    } else if (viewName === 'home') {
      if (elements.homeView) elements.homeView.style.display = 'flex';
      document.body.classList.add('page-home');
      document.body.classList.remove('page-dashboard');
      if (hipaaBanner) hipaaBanner.style.display = 'none';
    } else if (viewName === 'dashboard') {
      if (elements.dashboardView) elements.dashboardView.style.display = 'flex';
      document.body.classList.add('page-dashboard');
      document.body.classList.remove('page-home');
      if (hipaaBanner) hipaaBanner.style.display = 'none';

      // Populate admin patient statement dashboard
      const user = state.activeUser || demoPatient;
      const clinicVal = (elements.clinicSelect ? elements.clinicSelect.value : null) || user.clinic || 'all';
      if (elements.adminMetaUserId) elements.adminMetaUserId.textContent = user.userId || user.mrn || 'US24-84920';
      if (elements.adminClinicScopeSelect) {
        elements.adminClinicScopeSelect.value = (clinicVal !== 'all' && ['Namaste', 'Arra', 'Icure', 'HariKrishna', 'Meyerland'].includes(clinicVal)) ? clinicVal : 'all';
        adminState.activeClinic = elements.adminClinicScopeSelect.value;
      }
      initAdminDashboard();
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
    if (elements.topCornerUserId) elements.topCornerUserId.textContent = user.userId || user.mrn || 'US24-84920';
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
    if (elements.clinicSelect && user.clinic) {
      const options = Array.from(elements.clinicSelect.options).map(o => o.value);
      if (options.includes(user.clinic)) {
        elements.clinicSelect.value = user.clinic;
      }
    }

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
    if (elements.adminStatementDetailModal) elements.adminStatementDetailModal.style.display = 'none';
    if (elements.adminBatchModal) elements.adminBatchModal.style.display = 'none';
    if (elements.adminRecordPayModal) elements.adminRecordPayModal.style.display = 'none';
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
     ADMIN LEVEL PATIENT STATEMENT DATASET & MANAGEMENT
     ========================================================================== */
  const adminState = {
    activeClinic: 'all',
    searchQuery: '',
    activeStatus: 'all',
    activeAging: 'all',
    selectedIds: new Set(),
    inspectingStmt: null,
    recordingStmt: null
  };

  const initialAdminStatements = [
    {
      id: '#US-2026-98124',
      date: '10/12/2026',
      name: 'Sarah Jenkins',
      mrn: 'US-84920',
      dob: '06/14/1988',
      phone: '+1 (713) 555-0192',
      email: 'sarah.j***@example.com',
      clinic: 'Namaste',
      payer: 'BlueCross BlueShield PPO',
      claimId: '#CLM-8924019',
      billed: 1450.00,
      insPaid: 1105.00,
      adj: 30.00,
      due: 345.00,
      agingDays: 22,
      agingBucket: '0-30',
      delivery: 'SMS + Email',
      status: 'Due',
      cptList: [
        { code: '99214', desc: 'Comprehensive Office Visit Level 4', provider: 'Dr. Robert Miller, MD', billed: 350.00, insPaid: 280.00, adj: 30.00, due: 40.00 },
        { code: '80053', desc: 'Comprehensive Metabolic Panel (CMP)', provider: 'Metro Labs Clinical', billed: 480.00, insPaid: 360.00, adj: 45.00, due: 75.00 },
        { code: '71046', desc: 'Chest Radiography (2 Views)', provider: 'Diagnostic Radiology Center', billed: 620.00, insPaid: 465.00, adj: -75.00, due: 230.00 }
      ],
      auditLog: [
        { time: '10/12/2026 09:14 AM', event: 'Billing encounter generated & cleared claim adjudication.' },
        { time: '10/12/2026 11:30 AM', event: 'e-Statement dispatched via secure SMS & Email gateway.' },
        { time: '10/13/2026 02:45 PM', event: 'Patient opened e-Statement secure payment link from mobile.' }
      ]
    },
    {
      id: '#US-2026-98118',
      date: '10/10/2026',
      name: 'Marcus Vance',
      mrn: 'US-81204',
      dob: '09/22/1974',
      phone: '+1 (832) 555-4921',
      email: 'm.vance***@example.com',
      clinic: 'Arra',
      payer: 'Medicare Part B',
      claimId: '#CLM-8923910',
      billed: 890.00,
      insPaid: 705.00,
      adj: 100.00,
      due: 0.00,
      agingDays: 14,
      agingBucket: '0-30',
      delivery: 'SMS + Email',
      status: 'Paid',
      cptList: [
        { code: '99213', desc: 'Office Outpatient Visit Level 3', provider: 'Dr. Anita Desai, MD', billed: 290.00, insPaid: 240.00, adj: 50.00, due: 0.00 },
        { code: '93000', desc: 'Electrocardiogram Routine ECG 12-lead', provider: 'Arra Diagnostics', billed: 600.00, insPaid: 465.00, adj: 50.00, due: 0.00 }
      ],
      auditLog: [
        { time: '10/10/2026 08:30 AM', event: 'Encounter batch verified.' },
        { time: '10/10/2026 10:15 AM', event: 'SMS e-Statement dispatched.' },
        { time: '10/14/2026 04:12 PM', event: 'Patient paid balance in full ($85.00) via Visa *4021.' }
      ]
    },
    {
      id: '#US-2026-97992',
      date: '08/14/2026',
      name: 'Elena Rostova',
      mrn: 'US-78331',
      dob: '11/04/1982',
      phone: '+1 (281) 555-8832',
      email: 'elena.r***@example.com',
      clinic: 'Icure',
      payer: 'Aetna Healthcare',
      claimId: '#CLM-8891044',
      billed: 2120.00,
      insPaid: 1500.00,
      adj: 100.00,
      due: 520.00,
      agingDays: 68,
      agingBucket: '61-90',
      delivery: 'First-Class Mail',
      status: 'Overdue',
      cptList: [
        { code: '99204', desc: 'New Patient Comprehensive Office Visit', provider: 'Dr. Carlos Vega, MD', billed: 520.00, insPaid: 360.00, adj: 40.00, due: 120.00 },
        { code: '73721', desc: 'MRI Lower Extremity Joint (Knee)', provider: 'Icure Imaging Center', billed: 1600.00, insPaid: 1140.00, adj: 60.00, due: 400.00 }
      ],
      auditLog: [
        { time: '08/14/2026 10:00 AM', event: 'Statement generated in monthly run.' },
        { time: '08/16/2026 09:30 AM', event: 'First-class printed statement mailed.' },
        { time: '09/18/2026 02:00 PM', event: 'Overdue 30d notice triggered.' },
        { time: '10/15/2026 11:20 AM', event: 'Second reminder SMS delivered.' }
      ]
    },
    {
      id: '#US-2026-98045',
      date: '09/24/2026',
      name: 'Rajesh Patel',
      mrn: 'US-83190',
      dob: '03/18/1990',
      phone: '+1 (713) 555-3341',
      email: 'r.patel***@example.com',
      clinic: 'HariKrishna',
      payer: 'UnitedHealthcare',
      claimId: '#CLM-8911029',
      billed: 980.00,
      insPaid: 745.00,
      adj: 40.00,
      due: 195.00,
      agingDays: 28,
      agingBucket: '0-30',
      delivery: 'SMS + Email',
      status: 'Due',
      cptList: [
        { code: '99214', desc: 'Established Patient Visit 40 min', provider: 'Dr. Sanjay Gupta, MD', billed: 380.00, insPaid: 290.00, adj: 20.00, due: 70.00 },
        { code: '82947', desc: 'Glucose Quantitative Blood Test', provider: 'HariKrishna Clinical Lab', billed: 180.00, insPaid: 145.00, adj: 10.00, due: 25.00 },
        { code: '83036', desc: 'Hemoglobin A1C Glycated', provider: 'HariKrishna Clinical Lab', billed: 420.00, insPaid: 310.00, adj: 10.00, due: 100.00 }
      ],
      auditLog: [
        { time: '09/24/2026 01:10 PM', event: 'Statement generated after ERA adjustment.' },
        { time: '09/25/2026 10:00 AM', event: 'SMS delivery confirmed by telco carrier.' }
      ]
    },
    {
      id: '#US-2026-97814',
      date: '09/06/2026',
      name: 'David Sterling',
      mrn: 'US-74129',
      dob: '08/30/1965',
      phone: '+1 (713) 555-7790',
      email: 'dsterling***@example.com',
      clinic: 'Meyerland',
      payer: 'Cigna Open Access',
      claimId: '#CLM-8865190',
      billed: 1850.00,
      insPaid: 1380.00,
      adj: 50.00,
      due: 420.00,
      agingDays: 45,
      agingBucket: '31-60',
      delivery: 'SMS + Email',
      status: 'Plan Active',
      cptList: [
        { code: '99214', desc: 'Outpatient Follow-up Cardiology', provider: 'Dr. Gregory House, MD', billed: 450.00, insPaid: 330.00, adj: 20.00, due: 100.00 },
        { code: '93306', desc: 'Transthoracic Echocardiogram (TTE)', provider: 'Meyerland Cardio Suite', billed: 1400.00, insPaid: 1050.00, adj: 30.00, due: 320.00 }
      ],
      auditLog: [
        { time: '09/06/2026 09:00 AM', event: 'Encounter closed.' },
        { time: '09/12/2026 03:00 PM', event: 'Patient enrolled in 4-month payment plan ($105/mo).' },
        { time: '10/06/2026 12:00 AM', event: 'Installment #1 settled successfully ($105.00).' }
      ]
    },
    {
      id: '#US-2026-97740',
      date: '08/07/2026',
      name: 'Amanda Gomez',
      mrn: 'US-72019',
      dob: '12/15/1993',
      phone: '+1 (832) 555-1234',
      email: 'agomez***@example.com',
      clinic: 'Namaste',
      payer: 'Humana Gold Choice',
      claimId: '#CLM-8840192',
      billed: 2400.00,
      insPaid: 1680.00,
      adj: 80.00,
      due: 640.00,
      agingDays: 75,
      agingBucket: '61-90',
      delivery: 'First-Class Mail',
      status: 'Overdue',
      cptList: [
        { code: '99205', desc: 'Comprehensive New Patient Evaluation', provider: 'Dr. Robert Miller, MD', billed: 600.00, insPaid: 420.00, adj: 30.00, due: 150.00 },
        { code: '74177', desc: 'CT Abdomen and Pelvis with Contrast', provider: 'Diagnostic Radiology Center', billed: 1800.00, insPaid: 1260.00, adj: 50.00, due: 490.00 }
      ],
      auditLog: [
        { time: '08/07/2026 11:45 AM', event: 'Statement processed in batch #BAT-2026-0807.' },
        { time: '08/10/2026 02:15 PM', event: 'Physical statement envelope dispatched.' },
        { time: '09/10/2026 09:00 AM', event: 'Late notice notice sent via SMS.' }
      ]
    },
    {
      id: '#US-2026-98105',
      date: '10/11/2026',
      name: 'Brian Chen',
      mrn: 'US-84112',
      dob: '05/29/1987',
      phone: '+1 (713) 555-9011',
      email: 'brian.c***@example.com',
      clinic: 'Arra',
      payer: 'BlueCross BlueShield',
      claimId: '#CLM-8920199',
      billed: 650.00,
      insPaid: 510.00,
      adj: 30.00,
      due: 0.00,
      agingDays: 10,
      agingBucket: '0-30',
      delivery: 'SMS + Email',
      status: 'Paid',
      cptList: [
        { code: '99213', desc: 'Office Visit Level 3', provider: 'Dr. Anita Desai, MD', billed: 250.00, insPaid: 200.00, adj: 10.00, due: 0.00 },
        { code: '85025', desc: 'Complete Blood Count (CBC) with diff', provider: 'Arra Pathology Labs', billed: 400.00, insPaid: 310.00, adj: 20.00, due: 0.00 }
      ],
      auditLog: [
        { time: '10/11/2026 08:15 AM', event: 'Encounter posted.' },
        { time: '10/11/2026 09:30 AM', event: 'Digital statement delivered.' },
        { time: '10/12/2026 11:20 AM', event: 'Paid in full via Apple Pay ($110.00).' }
      ]
    },
    {
      id: '#US-2026-98002',
      date: '10/03/2026',
      name: 'Sophia Taylor',
      mrn: 'US-80944',
      dob: '07/08/1958',
      phone: '+1 (281) 555-4420',
      email: 'staylor***@example.com',
      clinic: 'Icure',
      payer: 'Medicare Advantage',
      claimId: '#CLM-8914801',
      billed: 1280.00,
      insPaid: 950.00,
      adj: 45.00,
      due: 285.00,
      agingDays: 18,
      agingBucket: '0-30',
      delivery: 'Portal Only',
      status: 'Due',
      cptList: [
        { code: '99214', desc: 'Office Visit Level 4', provider: 'Dr. Carlos Vega, MD', billed: 380.00, insPaid: 290.00, adj: 15.00, due: 75.00 },
        { code: '92004', desc: 'Comprehensive Ophthalmology Exam', provider: 'Icure Eye Specialists', billed: 900.00, insPaid: 660.00, adj: 30.00, due: 210.00 }
      ],
      auditLog: [
        { time: '10/03/2026 04:00 PM', event: 'Claim adjudicated by CMS Medicare Advantage.' },
        { time: '10/04/2026 08:30 AM', event: 'Portal statement published.' }
      ]
    },
    {
      id: '#US-2026-97690',
      date: '08/30/2026',
      name: 'Priya Sharma',
      mrn: 'US-69450',
      dob: '01/24/1995',
      phone: '+1 (832) 555-6671',
      email: 'psharma***@example.com',
      clinic: 'HariKrishna',
      payer: 'Self-Pay (Prompt Pay)',
      claimId: '#CLM-8839001',
      billed: 850.00,
      insPaid: 0.00,
      adj: 500.00,
      due: 350.00,
      agingDays: 52,
      agingBucket: '31-60',
      delivery: 'SMS + Email',
      status: 'Plan Active',
      cptList: [
        { code: '99203', desc: 'New Patient Office Visit Level 3', provider: 'Dr. Sanjay Gupta, MD', billed: 350.00, insPaid: 0.00, adj: 200.00, due: 150.00 },
        { code: '80061', desc: 'Lipid Panel', provider: 'HariKrishna Clinical Lab', billed: 500.00, insPaid: 0.00, adj: 300.00, due: 200.00 }
      ],
      auditLog: [
        { time: '08/30/2026 02:00 PM', event: 'Self-pay prompt payment discount applied (-$500.00).' },
        { time: '09/01/2026 10:00 AM', event: 'Patient payment plan established ($70/mo).' }
      ]
    },
    {
      id: '#US-2026-97420',
      date: '07/18/2026',
      name: 'Thomas Wright',
      mrn: 'US-64109',
      dob: '04/11/1971',
      phone: '+1 (713) 555-5592',
      email: 'twright***@example.com',
      clinic: 'Meyerland',
      payer: 'UnitedHealthcare',
      claimId: '#CLM-8789123',
      billed: 3450.00,
      insPaid: 2480.00,
      adj: 80.00,
      due: 890.00,
      agingDays: 94,
      agingBucket: '90+',
      delivery: 'First-Class Mail',
      status: 'Overdue',
      cptList: [
        { code: '99215', desc: 'High Complexity Office Visit', provider: 'Dr. Gregory House, MD', billed: 550.00, insPaid: 390.00, adj: 20.00, due: 140.00 },
        { code: '93458', desc: 'Left Heart Catheterization with Coronary Angio', provider: 'Meyerland Cath Lab', billed: 2900.00, insPaid: 2090.00, adj: 60.00, due: 750.00 }
      ],
      auditLog: [
        { time: '07/18/2026 09:00 AM', event: 'Encounter settled by insurer.' },
        { time: '08/20/2026 10:30 AM', event: 'First physical billing statement mailed.' },
        { time: '09/22/2026 02:00 PM', event: 'Second notice delivered.' },
        { time: '10/18/2026 04:00 PM', event: 'Flagged for Collections Risk (>90 Days).' }
      ]
    },
    {
      id: '#US-2026-98088',
      date: '10/06/2026',
      name: 'Jessica Martinez',
      mrn: 'US-83991',
      dob: '10/02/1984',
      phone: '+1 (832) 555-9904',
      email: 'jmartinez***@example.com',
      clinic: 'Namaste',
      payer: 'Aetna Choice POS II',
      claimId: '#CLM-8919022',
      billed: 720.00,
      insPaid: 550.00,
      adj: 25.00,
      due: 145.00,
      agingDays: 15,
      agingBucket: '0-30',
      delivery: 'SMS + Email',
      status: 'Due',
      cptList: [
        { code: '99213', desc: 'Outpatient Follow-up Level 3', provider: 'Dr. Robert Miller, MD', billed: 280.00, insPaid: 220.00, adj: 10.00, due: 50.00 },
        { code: '81002', desc: 'Urinalysis Non-automated', provider: 'Metro Labs Clinical', billed: 440.00, insPaid: 330.00, adj: 15.00, due: 95.00 }
      ],
      auditLog: [
        { time: '10/06/2026 11:00 AM', event: 'Statement generated from adjudications.' },
        { time: '10/06/2026 01:25 PM', event: 'SMS e-Statement sent to +1 (832) 555-9904.' }
      ]
    },
    {
      id: '#US-2026-98140',
      date: '10/16/2026',
      name: 'Kevin O\'Connor',
      mrn: 'US-84990',
      dob: '02/17/1979',
      phone: '+1 (713) 555-8821',
      email: 'koconnor***@example.com',
      clinic: 'Arra',
      payer: 'Cigna HealthCare',
      claimId: '#CLM-8924881',
      billed: 520.00,
      insPaid: 495.00,
      adj: 25.00,
      due: 0.00,
      agingDays: 5,
      agingBucket: '0-30',
      delivery: 'Portal Only',
      status: 'Paid',
      cptList: [
        { code: '99212', desc: 'Brief Office Consultation Level 2', provider: 'Dr. Anita Desai, MD', billed: 180.00, insPaid: 165.00, adj: 15.00, due: 0.00 },
        { code: '87086', desc: 'Urine Culture Colony Count', provider: 'Arra Pathology Labs', billed: 340.00, insPaid: 330.00, adj: 10.00, due: 0.00 }
      ],
      auditLog: [
        { time: '10/16/2026 10:10 AM', event: 'Copay collected at check-in ($25.00).' },
        { time: '10/18/2026 09:00 AM', event: 'Insurer paid in full. Account settled.' }
      ]
    }
  ];

  let adminStatements = JSON.parse(JSON.stringify(initialAdminStatements));

  function initAdminDashboard() {
    // Sync scope selector with active clinic
    if (elements.adminClinicScopeSelect) {
      elements.adminClinicScopeSelect.value = adminState.activeClinic;
    }

    // Sync clinic filter tabs
    if (elements.clinicFilterTabs) {
      const tabs = elements.clinicFilterTabs.querySelectorAll('.clinic-tab-btn');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-clinic') === adminState.activeClinic);
      });
    }

    renderAdminDashboard();
  }

  function getFilteredStatements() {
    return adminStatements.filter(s => {
      // Clinic Filter
      if (adminState.activeClinic !== 'all' && s.clinic !== adminState.activeClinic) {
        return false;
      }
      // Status Filter
      if (adminState.activeStatus !== 'all' && s.status !== adminState.activeStatus) {
        return false;
      }
      // Aging Filter
      if (adminState.activeAging !== 'all' && s.agingBucket !== adminState.activeAging) {
        return false;
      }
      // Search Query
      if (adminState.searchQuery) {
        const q = adminState.searchQuery.toLowerCase();
        const match = s.name.toLowerCase().includes(q) ||
                      s.mrn.toLowerCase().includes(q) ||
                      s.id.toLowerCase().includes(q) ||
                      s.phone.toLowerCase().includes(q) ||
                      s.email.toLowerCase().includes(q) ||
                      s.clinic.toLowerCase().includes(q) ||
                      s.payer.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  function renderAdminDashboard() {
    const filtered = getFilteredStatements();

    // 1. Update Executive KPI Cards
    updateAdminKpis(filtered);

    // 2. Update Aging Distribution Bar & Metrics
    updateAgingDistribution(filtered);

    // 3. Update Multi-Clinic Tab Count Badges
    updateClinicTabCounts();

    // 4. Render Table Rows
    renderStatementsTable(filtered);
  }

  function updateAdminKpis(filtered) {
    const isUnfiltered = adminState.activeClinic === 'all' && !adminState.searchQuery && adminState.activeStatus === 'all' && adminState.activeAging === 'all';
    const activeCount = filtered.length;
    const totalBilled = filtered.reduce((acc, s) => acc + s.billed, 0);
    const totalDue = filtered.reduce((acc, s) => acc + s.due, 0);
    const avgBalance = activeCount > 0 ? (totalDue / activeCount) : 0;
    const totalMtdPaid = filtered.filter(s => s.status === 'Paid').reduce((acc, s) => acc + (s.billed - s.insPaid - s.adj), 0) + (isUnfiltered ? 88460 : 12400);
    const digitalCount = filtered.filter(s => s.delivery.includes('SMS') || s.delivery.includes('Email') || s.delivery.includes('Portal')).length;
    const paperCount = Math.max(0, activeCount - digitalCount);
    const digitalRate = activeCount > 0 ? ((digitalCount / activeCount) * 100).toFixed(1) : '89.4';

    if (elements.kpiActiveStatements) {
      elements.kpiActiveStatements.textContent = isUnfiltered ? '1,842' : activeCount.toLocaleString();
    }
    if (elements.kpiTotalBilled) {
      elements.kpiTotalBilled.textContent = isUnfiltered ? '$624,850.00' : `$${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (elements.kpiPatientAr) {
      elements.kpiPatientAr.textContent = isUnfiltered ? '$142,390.00' : `$${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (elements.kpiAvgBalance) {
      elements.kpiAvgBalance.textContent = isUnfiltered ? '$77.30 / stmt' : `$${avgBalance.toFixed(2)} / stmt`;
    }
    if (elements.kpiMtdCollections) {
      elements.kpiMtdCollections.textContent = `$${totalMtdPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (elements.kpiDeliveryRate) {
      elements.kpiDeliveryRate.textContent = `${digitalRate}%`;
    }
    if (elements.kpiDigitalCount) {
      elements.kpiDigitalCount.textContent = isUnfiltered ? '1,647' : digitalCount.toLocaleString();
    }
    if (elements.kpiPaperCount) {
      elements.kpiPaperCount.textContent = isUnfiltered ? '195' : paperCount.toLocaleString();
    }
    if (elements.kpiScopeTag) {
      elements.kpiScopeTag.textContent = adminState.activeClinic === 'all' ? 'All Facilities' : adminState.activeClinic;
    }
  }

  function updateAgingDistribution(filtered) {
    const isUnfiltered = adminState.activeClinic === 'all' && !adminState.searchQuery && adminState.activeStatus === 'all' && adminState.activeAging === 'all';
    
    let sumCurrent, sum30, sum60, sum90, totalDue;
    if (isUnfiltered) {
      sumCurrent = 82450.00;
      sum30 = 34120.00;
      sum60 = 17800.00;
      sum90 = 8020.00;
      totalDue = 142390.00;
    } else {
      sumCurrent = filtered.filter(s => s.agingBucket === '0-30').reduce((acc, s) => acc + s.due, 0);
      sum30 = filtered.filter(s => s.agingBucket === '31-60').reduce((acc, s) => acc + s.due, 0);
      sum60 = filtered.filter(s => s.agingBucket === '61-90').reduce((acc, s) => acc + s.due, 0);
      sum90 = filtered.filter(s => s.agingBucket === '90+').reduce((acc, s) => acc + s.due, 0);
      totalDue = sumCurrent + sum30 + sum60 + sum90;
    }

    const divisor = totalDue || 1;
    const pctCurrent = Math.round((sumCurrent / divisor) * 100);
    const pct30 = Math.round((sum30 / divisor) * 100);
    const pct60 = Math.round((sum60 / divisor) * 100);
    const pct90 = Math.max(0, 100 - pctCurrent - pct30 - pct60);

    if (elements.agingTotalVal) {
      elements.agingTotalVal.textContent = `$${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (elements.agingProgressBar) {
      elements.agingProgressBar.innerHTML = `
        <div class="aging-bar-seg seg-current" style="width: ${pctCurrent}%;" title="Current (0-30d): $${sumCurrent.toFixed(2)} (${pctCurrent}%)"></div>
        <div class="aging-bar-seg seg-30" style="width: ${pct30}%;" title="31-60 Days: $${sum30.toFixed(2)} (${pct30}%)"></div>
        <div class="aging-bar-seg seg-60" style="width: ${pct60}%;" title="61-90 Days: $${sum60.toFixed(2)} (${pct60}%)"></div>
        <div class="aging-bar-seg seg-90" style="width: ${pct90}%;" title="90+ Days: $${sum90.toFixed(2)} (${pct90}%)"></div>
      `;
    }
    if (elements.agingAmountCurrent) {
      elements.agingAmountCurrent.textContent = `$${sumCurrent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pctCurrent}%)`;
    }
    if (elements.agingAmount30) {
      elements.agingAmount30.textContent = `$${sum30.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct30}%)`;
    }
    if (elements.agingAmount60) {
      elements.agingAmount60.textContent = `$${sum60.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct60}%)`;
    }
    if (elements.agingAmount90) {
      elements.agingAmount90.textContent = `$${sum90.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct90}%)`;
    }
  }

  function updateClinicTabCounts() {
    const clinics = ['Namaste', 'Arra', 'Icure', 'HariKrishna', 'Meyerland'];
    clinics.forEach(c => {
      const badge = document.getElementById(`tabBadge${c}`);
      if (badge) {
        const count = adminStatements.filter(s => s.clinic === c).length;
        badge.textContent = count;
      }
    });
    const badgeAll = document.getElementById('tabBadgeAll');
    if (badgeAll) badgeAll.textContent = adminStatements.length;
  }

  function renderStatementsTable(filtered) {
    if (!elements.adminStatementsTbody) return;
    elements.adminStatementsTbody.innerHTML = '';

    if (filtered.length === 0) {
      if (elements.adminTableEmpty) elements.adminTableEmpty.style.display = 'block';
      if (elements.tableCountBadge) elements.tableCountBadge.textContent = '0 Statements';
      if (elements.footerRecordsCount) elements.footerRecordsCount.textContent = 'Showing 0 records';
      return;
    }

    if (elements.adminTableEmpty) elements.adminTableEmpty.style.display = 'none';
    if (elements.tableCountBadge) elements.tableCountBadge.textContent = `${filtered.length} Statement${filtered.length === 1 ? '' : 's'} Loaded`;
    if (elements.footerRecordsCount) elements.footerRecordsCount.textContent = `Displaying ${filtered.length} of ${adminStatements.length} verified statements in real-time`;

    filtered.forEach(s => {
      const tr = document.createElement('tr');
      tr.className = 'roster-row';
      tr.id = `stmtRow_${s.id.replace('#', '')}`;

      const isSelected = adminState.selectedIds.has(s.id);
      const statusClass = s.status === 'Paid' ? 'status-paid' :
                          s.status === 'Overdue' ? 'status-overdue' :
                          s.status === 'Plan Active' ? 'status-plan' : 'status-due';
      const statusLabel = s.status === 'Paid' ? 'Paid in Full' :
                          s.status === 'Overdue' ? 'Overdue (>60d)' :
                          s.status === 'Plan Active' ? 'Plan Active' : 'Payment Due';

      const agingClass = s.agingBucket === '0-30' ? 'tag-current' :
                         s.agingBucket === '31-60' ? 'tag-30' :
                         s.agingBucket === '61-90' ? 'tag-60' : 'tag-90';

      tr.innerHTML = `
        <td class="th-checkbox">
          <input type="checkbox" class="stmt-row-checkbox" data-id="${s.id}" ${isSelected ? 'checked' : ''} aria-label="Select statement ${s.id}">
        </td>
        <td>
          <strong style="font-family: var(--font-mono); color: var(--us24-navy);">${s.id}</strong>
          <div style="font-size: 0.6875rem; color: var(--text-light);">${s.date}</div>
        </td>
        <td>
          <div class="patient-cell-name">${s.name}</div>
          <div class="patient-cell-mrn">MRN: ${s.mrn}</div>
        </td>
        <td>
          <span class="clinic-badge-cell">${s.clinic}</span>
        </td>
        <td>
          <strong>$${s.billed.toFixed(2)}</strong>
        </td>
        <td>
          <span class="text-green">-$${s.insPaid.toFixed(2)}</span>
          <div style="font-size: 0.6875rem; color: var(--text-light);">Adj: -$${s.adj.toFixed(2)}</div>
        </td>
        <td>
          <strong class="${s.due > 0 ? 'text-due' : 'text-green'}">$${s.due.toFixed(2)}</strong>
        </td>
        <td>
          <span class="aging-tag ${agingClass}">${s.agingDays}d (${s.agingBucket})</span>
        </td>
        <td>
          <span class="delivery-chip">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            ${s.delivery}
          </span>
        </td>
        <td>
          <span class="status-pill ${statusClass}">${statusLabel}</span>
        </td>
        <td class="th-actions">
          <div class="admin-row-actions">
            <button type="button" class="btn-row-action btn-inspect-action" data-id="${s.id}" title="Inspect Statement Details & Audit Trail">
              Inspect
            </button>
            <button type="button" class="btn-row-action btn-resend-action" data-id="${s.id}" title="Resend e-Statement (SMS/Email)">
              Resend
            </button>
            ${s.due > 0 ? `
            <button type="button" class="btn-row-action btn-pay-action" data-id="${s.id}" title="Record Offline / Telephone Payment">
              Record Pay
            </button>
            ` : ''}
            <button type="button" class="btn-row-action btn-pdf-action" data-id="${s.id}" title="Print / Download PDF">
              PDF
            </button>
          </div>
        </td>
      `;

      elements.adminStatementsTbody.appendChild(tr);
    });

    // Wire row-specific listeners
    attachRowEventListeners();
    updateBatchBar();
  }

  function attachRowEventListeners() {
    // Checkbox changes
    const checkboxes = elements.adminStatementsTbody.querySelectorAll('.stmt-row-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          adminState.selectedIds.add(id);
        } else {
          adminState.selectedIds.delete(id);
        }
        updateBatchBar();
      });
    });

    // Inspect buttons
    const inspectBtns = elements.adminStatementsTbody.querySelectorAll('.btn-inspect-action');
    inspectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openStatementInspection(id);
      });
    });

    // Resend buttons
    const resendBtns = elements.adminStatementsTbody.querySelectorAll('.btn-resend-action');
    resendBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        handleResendStatement(id);
      });
    });

    // Record Pay buttons
    const payBtns = elements.adminStatementsTbody.querySelectorAll('.btn-pay-action');
    payBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openRecordPayment(id);
      });
    });

    // PDF buttons
    const pdfBtns = elements.adminStatementsTbody.querySelectorAll('.btn-pdf-action');
    pdfBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        printIndividualStatement(id);
      });
    });
  }

  function updateBatchBar() {
    const count = adminState.selectedIds.size;
    if (elements.batchSelectedCount) elements.batchSelectedCount.textContent = count;
    if (elements.adminBatchBar) {
      elements.adminBatchBar.style.display = count > 0 ? 'flex' : 'none';
    }
    if (elements.selectAllCheckbox) {
      const visibleCheckboxes = elements.adminStatementsTbody.querySelectorAll('.stmt-row-checkbox');
      elements.selectAllCheckbox.checked = visibleCheckboxes.length > 0 && Array.from(visibleCheckboxes).every(cb => cb.checked);
    }
  }

  /* Statement Details Inspection Modal */
  function openStatementInspection(id) {
    const stmt = adminStatements.find(s => s.id === id);
    if (!stmt || !elements.adminStatementDetailModal) return;

    adminState.inspectingStmt = stmt;

    if (elements.adminModalClinicPill) elements.adminModalClinicPill.textContent = `Clinic: ${stmt.clinic}`;
    if (elements.adminModalStmtNumber) elements.adminModalStmtNumber.textContent = stmt.id;
    if (elements.adminModalPatientName) elements.adminModalPatientName.textContent = stmt.name;
    if (elements.adminModalMrn) elements.adminModalMrn.textContent = stmt.mrn;
    if (elements.adminModalDob) elements.adminModalDob.textContent = stmt.dob;
    if (elements.adminModalPhone) elements.adminModalPhone.textContent = stmt.phone;
    if (elements.adminModalEmail) elements.adminModalEmail.textContent = stmt.email;
    if (elements.adminModalDate) elements.adminModalDate.textContent = stmt.date;
    if (elements.adminModalPayer) elements.adminModalPayer.textContent = stmt.payer;
    if (elements.adminModalDelivery) elements.adminModalDelivery.textContent = stmt.delivery;
    if (elements.adminModalStatus) {
      elements.adminModalStatus.textContent = stmt.status === 'Paid' ? 'Paid in Full' : stmt.status;
      elements.adminModalStatus.className = stmt.status === 'Paid' ? 'text-green' : stmt.status === 'Overdue' ? 'text-danger' : 'text-orange';
    }
    if (elements.adminModalTotalBilled) elements.adminModalTotalBilled.textContent = `$${stmt.billed.toFixed(2)}`;
    if (elements.adminModalInsPaid) elements.adminModalInsPaid.textContent = `-$${stmt.insPaid.toFixed(2)}`;
    if (elements.adminModalAdj) elements.adminModalAdj.textContent = `-$${stmt.adj.toFixed(2)}`;
    if (elements.adminModalPatientDue) {
      elements.adminModalPatientDue.textContent = `$${stmt.due.toFixed(2)}`;
      elements.adminModalPatientDue.className = stmt.due > 0 ? 'text-orange' : 'text-green';
    }
    if (elements.adminModalTfootDue) {
      elements.adminModalTfootDue.textContent = `$${stmt.due.toFixed(2)}`;
    }

    // Populate CPT line items
    if (elements.adminModalCptTbody) {
      elements.adminModalCptTbody.innerHTML = '';
      stmt.cptList.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${stmt.date}</td>
          <td><strong>${item.code}</strong> - ${item.desc}</td>
          <td>${item.provider}</td>
          <td>$${item.billed.toFixed(2)}</td>
          <td class="text-green">-$${item.insPaid.toFixed(2)}</td>
          <td>-$${item.adj.toFixed(2)}</td>
          <td><strong class="${item.due > 0 ? 'text-due' : 'text-green'}">$${item.due.toFixed(2)}</strong></td>
        `;
        elements.adminModalCptTbody.appendChild(row);
      });
    }

    // Populate Audit Log
    if (elements.adminModalAuditLog) {
      elements.adminModalAuditLog.innerHTML = '';
      stmt.auditLog.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'audit-log-entry';
        entry.innerHTML = `
          <span class="audit-log-time">[${log.time}]</span>
          <span class="audit-log-text">${log.event}</span>
        `;
        elements.adminModalAuditLog.appendChild(entry);
      });
    }

    elements.adminStatementDetailModal.style.display = 'flex';
  }

  /* Admin Record Payment Modal */
  function openRecordPayment(id) {
    const stmt = adminStatements.find(s => s.id === id);
    if (!stmt || !elements.adminRecordPayModal) return;

    adminState.recordingStmt = stmt;

    if (elements.recPayStmtNum) elements.recPayStmtNum.textContent = stmt.id;
    if (elements.recPayPatientName) elements.recPayPatientName.textContent = stmt.name;
    if (elements.recPayBalanceDue) elements.recPayBalanceDue.textContent = `$${stmt.due.toFixed(2)}`;
    if (elements.recPayAmount) elements.recPayAmount.value = stmt.due.toFixed(2);
    if (elements.recPayRef) elements.recPayRef.value = '';

    elements.adminRecordPayModal.style.display = 'flex';
  }

  function handlePostPayment() {
    if (!adminState.recordingStmt) return;
    const s = adminState.recordingStmt;
    const amountVal = parseFloat(elements.recPayAmount ? elements.recPayAmount.value : s.due) || s.due;
    const methodVal = elements.recPayMethod ? elements.recPayMethod.options[elements.recPayMethod.selectedIndex].text : 'Credit / Debit Card';
    const refVal = elements.recPayRef && elements.recPayRef.value.trim() ? elements.recPayRef.value.trim() : `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

    s.status = 'Paid';
    s.due = Math.max(0, s.due - amountVal);
    s.auditLog.unshift({
      time: `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      event: `Admin payment of $${amountVal.toFixed(2)} recorded via ${methodVal} (Ref: ${refVal}) by Administrator US24-84920.`
    });

    if (elements.adminRecordPayModal) elements.adminRecordPayModal.style.display = 'none';
    if (elements.adminStatementDetailModal && elements.adminStatementDetailModal.style.display === 'flex') {
      openStatementInspection(s.id);
    }
    renderAdminDashboard();
    alert(`✓ Payment Successfully Recorded & Settled!\n\nStatement: ${s.id}\nPatient: ${s.name}\nAmount: $${amountVal.toFixed(2)}\nMethod: ${methodVal}\nReference: ${refVal}\nStatus updated to Paid in Full. Patient statement ledger updated.`);
  }

  function handleResendStatement(id) {
    const stmt = adminStatements.find(s => s.id === id);
    if (!stmt) return;

    stmt.auditLog.unshift({
      time: `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      event: `e-Statement resent via secure SMS & Email to ${stmt.phone} / ${stmt.email}.`
    });

    renderAdminDashboard();
    alert(`✓ Statement Dispatched Successfully!\n\nStatement ID: ${stmt.id}\nPatient: ${stmt.name}\nPhone: ${stmt.phone}\nChannel: ${stmt.delivery}\nEncrypted link generated under HIPAA 45 CFR § 164.312.`);
  }

  function printIndividualStatement(id) {
    const stmt = adminStatements.find(s => s.id === id);
    if (!stmt) {
      window.print();
      return;
    }
    openStatementInspection(id);
    setTimeout(() => {
      window.print();
    }, 300);
  }

  function exportStatementsCsv() {
    const filtered = getFilteredStatements();
    if (filtered.length === 0) {
      alert('No statements currently match the filter criteria to export.');
      return;
    }

    const headers = ['Statement ID', 'Issue Date', 'Patient Name', 'MRN', 'DOB', 'Clinic Facility', 'Payer', 'Claim ID', 'Total Billed ($)', 'Insurance Paid ($)', 'Adjustments ($)', 'Patient Due ($)', 'Aging Days', 'Aging Bucket', 'Delivery Mode', 'Status'];
    const rows = filtered.map(s => [
      s.id,
      s.date,
      `"${s.name}"`,
      s.mrn,
      s.dob,
      s.clinic,
      `"${s.payer}"`,
      s.claimId,
      s.billed.toFixed(2),
      s.insPaid.toFixed(2),
      s.adj.toFixed(2),
      s.due.toFixed(2),
      s.agingDays,
      s.agingBucket,
      `"${s.delivery}"`,
      s.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `US24_Patient_Statements_${adminState.activeClinic}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleBatchRun() {
    const targetClinic = elements.batchClinicTarget ? elements.batchClinicTarget.value : 'all';
    const cycleType = elements.batchCycleType ? elements.batchCycleType.options[elements.batchCycleType.selectedIndex].text : 'End-of-Month';

    if (elements.batchProgressBox) elements.batchProgressBox.style.display = 'block';
    if (elements.startBatchBtn) elements.startBatchBtn.disabled = true;

    const fill = elements.batchProgressFill;
    const status = elements.batchProgressStatus;

    if (fill) fill.style.width = '20%';
    if (status) status.textContent = `Gathering unbilled encounters across ${targetClinic === 'all' ? 'All 5 Facilities' : targetClinic}...`;

    setTimeout(() => {
      if (fill) fill.style.width = '60%';
      if (status) status.textContent = 'Applying adjudicated ERA claim adjustments and co-pay rules...';
    }, 500);

    setTimeout(() => {
      if (fill) fill.style.width = '90%';
      if (status) status.textContent = 'Compiling 256-bit encrypted e-Statements and batch files...';
    }, 1100);

    setTimeout(() => {
      if (fill) fill.style.width = '100%';
      if (status) status.textContent = 'Batch complete! Dispatched statements to patients.';

      const clinicName = targetClinic === 'all' ? 'Namaste' : targetClinic;
      const newStmt1 = {
        id: `#US-2026-${Math.floor(98200 + Math.random() * 800)}`,
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        name: 'Rachel Adams',
        mrn: `US-${Math.floor(85000 + Math.random() * 5000)}`,
        dob: '10/12/1989',
        phone: '+1 (713) 555-4081',
        email: 'rachel.a***@example.com',
        clinic: clinicName,
        payer: 'BlueCross BlueShield',
        claimId: `#CLM-${Math.floor(8930000 + Math.random() * 10000)}`,
        billed: 780.00,
        insPaid: 600.00,
        adj: 30.00,
        due: 150.00,
        agingDays: 1,
        agingBucket: '0-30',
        delivery: 'SMS + Email',
        status: 'Due',
        cptList: [
          { code: '99213', desc: 'Office Visit Level 3', provider: 'Attending Physician, MD', billed: 320.00, insPaid: 250.00, adj: 10.00, due: 60.00 },
          { code: '80050', desc: 'General Health Panel', provider: 'Clinical Diagnostics', billed: 460.00, insPaid: 350.00, adj: 20.00, due: 90.00 }
        ],
        auditLog: [
          { time: `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, event: 'Batch statement created and dispatched.' }
        ]
      };

      adminStatements.unshift(newStmt1);

      setTimeout(() => {
        if (elements.adminBatchModal) elements.adminBatchModal.style.display = 'none';
        if (elements.batchProgressBox) elements.batchProgressBox.style.display = 'none';
        if (elements.startBatchBtn) elements.startBatchBtn.disabled = false;
        renderAdminDashboard();
        alert(`✓ Statement Batch Run Completed Successfully!\n\nTarget Scope: ${targetClinic === 'all' ? 'All Clinics' : targetClinic}\nBilling Rule: ${cycleType}\nStatements Generated: 48 new statements dispatched via SMS/Email.\nNew statement ${newStmt1.id} added to the live roster.`);
      }, 500);

    }, 1700);
  }

  function handleBulkReminders() {
    const dueCount = adminStatements.filter(s => s.due > 0).length;
    if (dueCount === 0) {
      alert('All statements are currently settled. No overdue reminders needed.');
      return;
    }

    const confirmBulk = confirm(
      `Dispatch automated SMS & Email payment reminders to ${dueCount} active accounts with patient responsibility?\n\n` +
      `Delivery Channel: HIPAA 256-bit secure one-tap mobile checkout.`
    );

    if (confirmBulk) {
      adminStatements.forEach(s => {
        if (s.due > 0) {
          s.auditLog.unshift({
            time: `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            event: 'Bulk payment reminder dispatched via automated RCM gateway.'
          });
        }
      });
      renderAdminDashboard();
      alert(`✓ Bulk Reminder Run Complete!\n\nAutomated payment notifications dispatched to ${dueCount} patient accounts across active clinics.`);
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
    // - AR Report & Clinic Collection are FROZEN (no actions, no marks)
    // - Patient Statement taps open the dedicated new page dashboard
    // ========================================================================
    // Card 1: AR Report (FROZEN - no actions, no marks)
    // Card 2: Clinic Collection (FROZEN - no actions, no marks)

    // Card 3: Patient Statement (Tapping opens the new page dashboard)
    if (elements.cardPatientStatement) {
      const openStatementPage = () => {
        showView('dashboard');
      };
      elements.cardPatientStatement.addEventListener('click', openStatementPage);
      elements.cardPatientStatement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openStatementPage();
        }
      });
    }

    // ========================================================================
    // ADMIN PATIENT STATEMENT DASHBOARD EVENT LISTENERS
    // ========================================================================
    if (elements.backToHomeBtn) {
      elements.backToHomeBtn.addEventListener('click', () => {
        showView('home');
      });
    }

    // Admin Facility Scope Selector
    if (elements.adminClinicScopeSelect) {
      elements.adminClinicScopeSelect.addEventListener('change', (e) => {
        adminState.activeClinic = e.target.value;
        if (elements.clinicFilterTabs) {
          const tabs = elements.clinicFilterTabs.querySelectorAll('.clinic-tab-btn');
          tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-clinic') === adminState.activeClinic);
          });
        }
        renderAdminDashboard();
      });
    }

    // Clinic Quick Filter Tabs
    if (elements.clinicFilterTabs) {
      const tabs = elements.clinicFilterTabs.querySelectorAll('.clinic-tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          adminState.activeClinic = tab.getAttribute('data-clinic');
          if (elements.adminClinicScopeSelect) {
            elements.adminClinicScopeSelect.value = adminState.activeClinic;
          }
          renderAdminDashboard();
        });
      });
    }

    // Real-time Search Input & Clear
    if (elements.adminSearchInput) {
      elements.adminSearchInput.addEventListener('input', (e) => {
        adminState.searchQuery = e.target.value.trim();
        if (elements.adminClearSearchBtn) {
          elements.adminClearSearchBtn.style.display = adminState.searchQuery ? 'block' : 'none';
        }
        renderAdminDashboard();
      });
    }

    if (elements.adminClearSearchBtn) {
      elements.adminClearSearchBtn.addEventListener('click', () => {
        if (elements.adminSearchInput) elements.adminSearchInput.value = '';
        adminState.searchQuery = '';
        elements.adminClearSearchBtn.style.display = 'none';
        renderAdminDashboard();
      });
    }

    // Status Filter Dropdown
    if (elements.adminStatusFilter) {
      elements.adminStatusFilter.addEventListener('change', (e) => {
        adminState.activeStatus = e.target.value;
        renderAdminDashboard();
      });
    }

    // Aging Filter Dropdown
    if (elements.adminAgingFilter) {
      elements.adminAgingFilter.addEventListener('change', (e) => {
        adminState.activeAging = e.target.value;
        renderAdminDashboard();
      });
    }

    // Reset Filter Buttons
    const resetAllAdminFilters = () => {
      adminState.activeClinic = 'all';
      adminState.searchQuery = '';
      adminState.activeStatus = 'all';
      adminState.activeAging = 'all';
      adminState.selectedIds.clear();

      if (elements.adminClinicScopeSelect) elements.adminClinicScopeSelect.value = 'all';
      if (elements.adminSearchInput) elements.adminSearchInput.value = '';
      if (elements.adminClearSearchBtn) elements.adminClearSearchBtn.style.display = 'none';
      if (elements.adminStatusFilter) elements.adminStatusFilter.value = 'all';
      if (elements.adminAgingFilter) elements.adminAgingFilter.value = 'all';
      if (elements.clinicFilterTabs) {
        const tabs = elements.clinicFilterTabs.querySelectorAll('.clinic-tab-btn');
        tabs.forEach(tab => tab.classList.toggle('active', tab.getAttribute('data-clinic') === 'all'));
      }
      renderAdminDashboard();
    };

    if (elements.adminResetFiltersBtn) elements.adminResetFiltersBtn.addEventListener('click', resetAllAdminFilters);
    if (elements.emptyResetBtn) elements.emptyResetBtn.addEventListener('click', resetAllAdminFilters);

    // Select All Checkbox
    if (elements.selectAllCheckbox) {
      elements.selectAllCheckbox.addEventListener('change', (e) => {
        const visibleCheckboxes = elements.adminStatementsTbody ? elements.adminStatementsTbody.querySelectorAll('.stmt-row-checkbox') : [];
        visibleCheckboxes.forEach(cb => {
          cb.checked = e.target.checked;
          const id = cb.getAttribute('data-id');
          if (e.target.checked) {
            adminState.selectedIds.add(id);
          } else {
            adminState.selectedIds.delete(id);
          }
        });
        updateBatchBar();
      });
    }

    // Executive Actions Toolbar
    if (elements.adminBatchBtn) {
      elements.adminBatchBtn.addEventListener('click', () => {
        if (elements.batchClinicTarget) elements.batchClinicTarget.value = adminState.activeClinic !== 'all' ? adminState.activeClinic : 'all';
        if (elements.batchProgressBox) elements.batchProgressBox.style.display = 'none';
        if (elements.startBatchBtn) elements.startBatchBtn.disabled = false;
        if (elements.adminBatchModal) elements.adminBatchModal.style.display = 'flex';
      });
    }

    if (elements.closeBatchBtn) elements.closeBatchBtn.addEventListener('click', () => {
      if (elements.adminBatchModal) elements.adminBatchModal.style.display = 'none';
    });
    if (elements.cancelBatchBtn) elements.cancelBatchBtn.addEventListener('click', () => {
      if (elements.adminBatchModal) elements.adminBatchModal.style.display = 'none';
    });
    if (elements.startBatchBtn) elements.startBatchBtn.addEventListener('click', handleBatchRun);

    if (elements.adminBulkRemindBtn) elements.adminBulkRemindBtn.addEventListener('click', handleBulkReminders);
    if (elements.adminExportCsvBtn) elements.adminExportCsvBtn.addEventListener('click', exportStatementsCsv);
    if (elements.adminPrintSummaryBtn) elements.adminPrintSummaryBtn.addEventListener('click', () => window.print());

    // Batch Bar Action Buttons
    if (elements.batchResendBtn) {
      elements.batchResendBtn.addEventListener('click', () => {
        const count = adminState.selectedIds.size;
        adminState.selectedIds.forEach(id => {
          const stmt = adminStatements.find(s => s.id === id);
          if (stmt) {
            stmt.auditLog.unshift({
              time: `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              event: 'Dispatched in batch reminder blast.'
            });
          }
        });
        renderAdminDashboard();
        alert(`✓ Dispatched ${count} selected e-Statements via secure SMS & Email gateway.`);
      });
    }

    if (elements.batchExportBtn) {
      elements.batchExportBtn.addEventListener('click', () => {
        const selectedStatements = adminStatements.filter(s => adminState.selectedIds.has(s.id));
        if (selectedStatements.length === 0) return;

        const headers = ['Statement ID', 'Issue Date', 'Patient Name', 'MRN', 'DOB', 'Clinic Facility', 'Payer', 'Claim ID', 'Total Billed ($)', 'Insurance Paid ($)', 'Adjustments ($)', 'Patient Due ($)', 'Aging Days', 'Aging Bucket', 'Delivery Mode', 'Status'];
        const rows = selectedStatements.map(s => [
          s.id,
          s.date,
          `"${s.name}"`,
          s.mrn,
          s.dob,
          s.clinic,
          `"${s.payer}"`,
          s.claimId,
          s.billed.toFixed(2),
          s.insPaid.toFixed(2),
          s.adj.toFixed(2),
          s.due.toFixed(2),
          s.agingDays,
          s.agingBucket,
          `"${s.delivery}"`,
          s.status
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `US24_Selected_Statements_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    if (elements.batchMarkPaidBtn) {
      elements.batchMarkPaidBtn.addEventListener('click', () => {
        const count = adminState.selectedIds.size;
        if (confirm(`Mark all ${count} selected statements as Settled / Paid in Full?`)) {
          adminState.selectedIds.forEach(id => {
            const stmt = adminStatements.find(s => s.id === id);
            if (stmt) {
              stmt.status = 'Paid';
              stmt.due = 0.00;
              stmt.auditLog.unshift({
                time: `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                event: 'Batch settled by Administrator US24-84920.'
              });
            }
          });
          adminState.selectedIds.clear();
          renderAdminDashboard();
          alert(`✓ Successfully marked ${count} statements as Paid in Full.`);
        }
      });
    }

    if (elements.batchDeselectBtn) {
      elements.batchDeselectBtn.addEventListener('click', () => {
        adminState.selectedIds.clear();
        updateBatchBar();
        renderAdminDashboard();
      });
    }

    // Modal 1: Statement Inspection Buttons
    if (elements.closeAdminDetailBtn) {
      elements.closeAdminDetailBtn.addEventListener('click', () => {
        if (elements.adminStatementDetailModal) elements.adminStatementDetailModal.style.display = 'none';
      });
    }
    if (elements.adminModalCloseBtn) {
      elements.adminModalCloseBtn.addEventListener('click', () => {
        if (elements.adminStatementDetailModal) elements.adminStatementDetailModal.style.display = 'none';
      });
    }
    if (elements.adminModalPrintBtn) {
      elements.adminModalPrintBtn.addEventListener('click', () => window.print());
    }
    if (elements.adminModalResendBtn) {
      elements.adminModalResendBtn.addEventListener('click', () => {
        if (adminState.inspectingStmt) handleResendStatement(adminState.inspectingStmt.id);
      });
    }
    if (elements.adminModalRecordPayBtn) {
      elements.adminModalRecordPayBtn.addEventListener('click', () => {
        if (adminState.inspectingStmt) openRecordPayment(adminState.inspectingStmt.id);
      });
    }

    // Modal 3: Record Payment Buttons
    if (elements.closeRecordPayBtn) {
      elements.closeRecordPayBtn.addEventListener('click', () => {
        if (elements.adminRecordPayModal) elements.adminRecordPayModal.style.display = 'none';
      });
    }
    if (elements.cancelRecordPayBtn) {
      elements.cancelRecordPayBtn.addEventListener('click', () => {
        if (elements.adminRecordPayModal) elements.adminRecordPayModal.style.display = 'none';
      });
    }
    if (elements.submitRecordPayBtn) {
      elements.submitRecordPayBtn.addEventListener('click', handlePostPayment);
    }

    // Clinic Selector Change Event (Namaste, Arra, Icure, HariKrishna, Meyerland)
    if (elements.clinicSelect) {
      elements.clinicSelect.addEventListener('change', (e) => {
        const selectedClinic = e.target.value;
        if (state.activeUser) {
          state.activeUser.clinic = selectedClinic;
        }
      });
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
