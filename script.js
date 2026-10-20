/**
 * US24 Solutions - Patient Statement Portal
 * HIPAA-Compliant Authentication & Patient Statement Showcase
 * 
 * Features:
 * - Multi-persona authentication (Patient, Provider, US24 Staff SSO)
 * - HIPAA 15-minute inactivity session lock timer
 * - Two-factor authentication (MFA/OTP) simulation
 * - Interactive Patient Statement Dashboard with line-item claims & PDF printing
 * - Real-time password strength validation & visibility toggle
 * - Light / Dark mode persistence
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentRole: 'patient',
    theme: localStorage.getItem('us24_theme') || 'light',
    sessionTimeLeft: 15 * 60, // 15 minutes in seconds
    timerInterval: null,
    rememberDevice: false,
    activeUser: null,
  };

  // Predefined Demo Profiles for Easy Testing
  const demoProfiles = {
    patient: {
      identifier: 'sarah.jenkins@example.com',
      dob: '1988-06-14',
      password: 'US24@PatientStatement2026',
      name: 'Sarah Jenkins',
      mrn: 'US-84920',
      balance: '$345.00',
      totalBilled: '$1,450.00',
      insurancePaid: '-$1,105.00',
    },
    provider: {
      identifier: 'dr.miller@metrohealth.org',
      dob: '1975-03-22',
      password: 'MetroClinic@Provider2026',
      name: 'Dr. Robert Miller, MD',
      mrn: 'NPI-1948201948',
      balance: '$12,480.00',
      totalBilled: '$54,200.00',
      insurancePaid: '-$41,720.00',
    },
    staff: {
      identifier: 'billing.agent@us24solutions.com',
      dob: '1992-11-05',
      password: 'US24#RCMBilling2026!',
      name: 'Michael Vance (US24 RCM Lead)',
      mrn: 'STAFF-US24-048',
      balance: '$184,920.00',
      totalBilled: '$840,120.00',
      insurancePaid: '-$655,200.00',
    }
  };

  // DOM Elements
  const elements = {
    // Top Bar & Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    timerCountdown: document.getElementById('timerCountdown'),

    // Role Tabs
    tabPatient: document.getElementById('tabPatient'),
    tabProvider: document.getElementById('tabProvider'),
    tabStaff: document.getElementById('tabStaff'),

    // Demo Buttons
    demoPatientBtn: document.getElementById('demoPatientBtn'),
    demoProviderBtn: document.getElementById('demoProviderBtn'),
    demoStaffBtn: document.getElementById('demoStaffBtn'),

    // Login Form & Inputs
    loginForm: document.getElementById('loginForm'),
    identifierLabel: document.getElementById('identifierLabel'),
    primaryIdentifier: document.getElementById('primaryIdentifier'),
    identifierError: document.getElementById('identifierError'),
    patientDobGroup: document.getElementById('patientDobGroup'),
    patientDob: document.getElementById('patientDob'),
    dobError: document.getElementById('dobError'),
    dobHelpTrigger: document.getElementById('dobHelpTrigger'),
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

    // Quick Pay
    quickPayBtn: document.getElementById('quickPayBtn'),
    quickPayCard: document.getElementById('quickPayCard'),
    closeQuickPayBtn: document.getElementById('closeQuickPayBtn'),
    quickPayForm: document.getElementById('quickPayForm'),
    authCard: document.getElementById('authCard'),

    // SSO Buttons
    ssoHealthIdBtn: document.getElementById('ssoHealthIdBtn'),
    ssoGoogleBtn: document.getElementById('ssoGoogleBtn'),

    // Modals
    otpModalBackdrop: document.getElementById('otpModalBackdrop'),
    otpTargetDisplay: document.getElementById('otpTargetDisplay'),
    otpContainer: document.getElementById('otpContainer'),
    autofillOtpBtn: document.getElementById('autofillOtpBtn'),
    resendOtpBtn: document.getElementById('resendOtpBtn'),
    cancelOtpBtn: document.getElementById('cancelOtpBtn'),
    verifyOtpBtn: document.getElementById('verifyOtpBtn'),

    // Dashboard Modal
    dashboardModalBackdrop: document.getElementById('dashboardModalBackdrop'),
    dashPatientName: document.getElementById('dashPatientName'),
    dashTotalBilled: document.getElementById('dashTotalBilled'),
    dashInsurancePaid: document.getElementById('dashInsurancePaid'),
    dashPatientBalance: document.getElementById('dashPatientBalance'),
    closeDashBtn: document.getElementById('closeDashBtn'),
    printStatementBtn: document.getElementById('printStatementBtn'),
    payBalanceBtn: document.getElementById('payBalanceBtn'),

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
    showAlert('error', 'HIPAA Security Timeout: Your session was automatically locked after 15 minutes of inactivity.');
    closeAllModals();
  }

  // Activity listeners to reset timeout
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetSessionTimer, { passive: true });
  });

  /* ==========================================================================
     ROLE SWITCHER
     ========================================================================== */
  function switchRole(role) {
    state.currentRole = role;

    // Update active tab buttons
    [elements.tabPatient, elements.tabProvider, elements.tabStaff].forEach(tab => {
      if (tab) {
        const isMatch = tab.dataset.role === role;
        tab.classList.toggle('active', isMatch);
        tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      }
    });

    hideAlert();
    clearValidationErrors();

    // Adapt fields to role
    if (role === 'patient') {
      elements.identifierLabel.innerHTML = 'Patient Email or Medical Record # (MRN) <span class="required-star">*</span>';
      elements.primaryIdentifier.placeholder = 'e.g. sarah.jenkins@example.com or MRN-84920';
      elements.primaryIdentifier.autocomplete = 'username';
      elements.patientDobGroup.style.display = 'block';
      elements.patientDob.required = true;
    } else if (role === 'provider') {
      elements.identifierLabel.innerHTML = 'Provider NPI Number or Clinic Email <span class="required-star">*</span>';
      elements.primaryIdentifier.placeholder = 'e.g. 1948201948 or dr.miller@metrohealth.org';
      elements.primaryIdentifier.autocomplete = 'username';
      elements.patientDobGroup.style.display = 'none';
      elements.patientDob.required = false;
    } else if (role === 'staff') {
      elements.identifierLabel.innerHTML = 'US24 Corporate Account Email (@us24solutions.com) <span class="required-star">*</span>';
      elements.primaryIdentifier.placeholder = 'e.g. billing.agent@us24solutions.com';
      elements.primaryIdentifier.autocomplete = 'username';
      elements.patientDobGroup.style.display = 'none';
      elements.patientDob.required = false;
    }
  }

  /* ==========================================================================
     DEMO AUTOFILL
     ========================================================================== */
  function fillDemoProfile(roleKey) {
    switchRole(roleKey);
    const profile = demoProfiles[roleKey];
    if (!profile) return;

    elements.primaryIdentifier.value = profile.identifier;
    if (roleKey === 'patient' && elements.patientDob) {
      elements.patientDob.value = profile.dob;
    }
    elements.portalPassword.value = profile.password;
    updatePasswordStrength(profile.password);
    showAlert('success', `Loaded ${profile.name} credentials. Click "Authenticate & View Statements" to test.`);
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
    const idVal = elements.primaryIdentifier.value.trim();
    if (!idVal) {
      elements.primaryIdentifier.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Validate DOB if Patient
    if (state.currentRole === 'patient') {
      const dobVal = elements.patientDob.value;
      if (!dobVal) {
        elements.patientDob.closest('.form-group').classList.add('has-error');
        isValid = false;
      }
    }

    // Validate Password
    const pwdVal = elements.portalPassword.value;
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

      // Set active user from profile or input
      const profile = demoProfiles[state.currentRole];
      state.activeUser = {
        name: profile ? profile.name : elements.primaryIdentifier.value.trim(),
        identifier: elements.primaryIdentifier.value.trim(),
        role: state.currentRole,
        balance: profile ? profile.balance : '$345.00',
        totalBilled: profile ? profile.totalBilled : '$1,450.00',
        insurancePaid: profile ? profile.insurancePaid : '-$1,105.00',
      };

      // Open 2FA Verification Modal (HIPAA requirement)
      openOtpModal();
    }, 700);
  }

  function openOtpModal() {
    elements.otpTargetDisplay.textContent = `${state.activeUser.identifier} (+1 ••• ••• 4920)`;
    elements.otpModalBackdrop.style.display = 'flex';
    clearOtpInputs();

    // Focus first OTP digit
    const firstDigit = elements.otpContainer.querySelector('.otp-digit');
    if (firstDigit) firstDigit.focus();
  }

  function clearOtpInputs() {
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
    const inputs = elements.otpContainer.querySelectorAll('.otp-digit');
    const enteredCode = Array.from(inputs).map(i => i.value).join('');

    if (enteredCode.length < 6) {
      alert('Please enter all 6 digits of your HIPAA verification code.');
      return;
    }

    // Close OTP modal and show Dashboard Statement
    elements.otpModalBackdrop.style.display = 'none';
    openDashboardModal();
  }

  /* ==========================================================================
     PATIENT STATEMENT DASHBOARD SHOWCASE
     ========================================================================== */
  function openDashboardModal() {
    if (!state.activeUser) return;

    elements.dashPatientName.textContent = state.activeUser.name;
    elements.dashTotalBilled.textContent = state.activeUser.totalBilled;
    elements.dashInsurancePaid.textContent = state.activeUser.insurancePaid;
    elements.dashPatientBalance.textContent = state.activeUser.balance;

    elements.dashboardModalBackdrop.style.display = 'flex';
  }

  function closeAllModals() {
    elements.otpModalBackdrop.style.display = 'none';
    elements.dashboardModalBackdrop.style.display = 'none';
    elements.forgotModalBackdrop.style.display = 'none';
    elements.privacyModalBackdrop.style.display = 'none';
  }

  /* ==========================================================================
     QUICK PAY TOGGLE
     ========================================================================== */
  function showQuickPay() {
    elements.authCard.style.display = 'none';
    elements.quickPayCard.style.display = 'block';
  }

  function hideQuickPay() {
    elements.quickPayCard.style.display = 'none';
    elements.authCard.style.display = 'block';
  }

  /* ==========================================================================
     EVENT LISTENERS INITIALIZATION
     ========================================================================== */
  function setupEventListeners() {
    // Theme toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Role tabs
    if (elements.tabPatient) elements.tabPatient.addEventListener('click', () => switchRole('patient'));
    if (elements.tabProvider) elements.tabProvider.addEventListener('click', () => switchRole('provider'));
    if (elements.tabStaff) elements.tabStaff.addEventListener('click', () => switchRole('staff'));

    // Demo presets
    if (elements.demoPatientBtn) elements.demoPatientBtn.addEventListener('click', () => fillDemoProfile('patient'));
    if (elements.demoProviderBtn) elements.demoProviderBtn.addEventListener('click', () => fillDemoProfile('provider'));
    if (elements.demoStaffBtn) elements.demoStaffBtn.addEventListener('click', () => fillDemoProfile('staff'));

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

    // DOB hint trigger
    if (elements.dobHelpTrigger) {
      elements.dobHelpTrigger.addEventListener('click', () => {
        alert('HIPAA Privacy Protection Rule (§ 164.514):\nDate of birth is verified against your electronic medical record to confirm identity before disclosing protected health statements.');
      });
    }

    // Quick Pay
    if (elements.quickPayBtn) elements.quickPayBtn.addEventListener('click', (e) => { e.preventDefault(); showQuickPay(); });
    if (elements.closeQuickPayBtn) elements.closeQuickPayBtn.addEventListener('click', hideQuickPay);
    if (elements.quickPayForm) {
      elements.quickPayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Statement Verified! Redirecting to US24 Encrypted Payment Gateway (Card/HSA/FSA/eCheck)...');
      });
    }

    // SSO Buttons
    if (elements.ssoHealthIdBtn) {
      elements.ssoHealthIdBtn.addEventListener('click', () => {
        fillDemoProfile('patient');
        showAlert('success', 'Health ID Authenticated. Click "Authenticate" to enter statement.');
      });
    }
    if (elements.ssoGoogleBtn) {
      elements.ssoGoogleBtn.addEventListener('click', () => {
        fillDemoProfile('staff');
        showAlert('success', 'Google Workspace SSO verified for US24 domain.');
      });
    }

    // OTP Modal Events
    if (elements.cancelOtpBtn) elements.cancelOtpBtn.addEventListener('click', () => elements.otpModalBackdrop.style.display = 'none');
    if (elements.verifyOtpBtn) elements.verifyOtpBtn.addEventListener('click', verifyOtp);
    if (elements.autofillOtpBtn) elements.autofillOtpBtn.addEventListener('click', autofillDemoOtp);
    if (elements.resendOtpBtn) {
      elements.resendOtpBtn.addEventListener('click', () => {
        alert('New 6-digit verification code sent via SMS/Email.');
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

    // Dashboard Modal Events
    if (elements.closeDashBtn) elements.closeDashBtn.addEventListener('click', () => {
      elements.dashboardModalBackdrop.style.display = 'none';
      showAlert('success', 'You have securely logged out. Session terminated.');
    });
    if (elements.printStatementBtn) {
      elements.printStatementBtn.addEventListener('click', () => window.print());
    }
    if (elements.payBalanceBtn) {
      elements.payBalanceBtn.addEventListener('click', () => {
        alert('Payment Authorization: Redirecting to US24 PCI-DSS Compliant Payment Processor for $345.00.\nReceipt will be emailed securely.');
      });
    }

    // Forgot Password Modal
    if (elements.forgotPasswordBtn) elements.forgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      elements.forgotModalBackdrop.style.display = 'flex';
    });
    if (elements.closeForgotBtn) elements.closeForgotBtn.addEventListener('click', () => elements.forgotModalBackdrop.style.display = 'none');
    if (elements.forgotForm) {
      elements.forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Secure password recovery link dispatched to your verified address. Please check your inbox within 10 minutes.');
        elements.forgotModalBackdrop.style.display = 'none';
      });
    }

    // Privacy & Terms Modals
    if (elements.privacyNoticeBtn) elements.privacyNoticeBtn.addEventListener('click', () => elements.privacyModalBackdrop.style.display = 'flex');
    if (elements.termsNoticeBtn) elements.termsNoticeBtn.addEventListener('click', () => elements.privacyModalBackdrop.style.display = 'flex');
    if (elements.closePrivacyBtn) elements.closePrivacyBtn.addEventListener('click', () => elements.privacyModalBackdrop.style.display = 'none');
    if (elements.ackPrivacyBtn) elements.ackPrivacyBtn.addEventListener('click', () => elements.privacyModalBackdrop.style.display = 'none');

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
    switchRole('patient');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
