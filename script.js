/**
 * US24 Solutions - Patient Statement Portal
 * HIPAA-Compliant Single Authentication Page & Patient Statement Showcase
 * 
 * Features:
 * - Single, unified Patient Statement login page
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
    theme: localStorage.getItem('us24_theme') || 'light',
    sessionTimeLeft: 15 * 60, // 15 minutes in seconds
    timerInterval: null,
    rememberDevice: false,
    activeUser: null,
  };

  // Predefined Demo Patient Profile for Easy Testing
  const demoPatient = {
    identifier: 'sarah.jenkins@example.com',
    dob: '1988-06-14',
    password: 'US24@PatientStatement2026',
    name: 'Sarah Jenkins',
    mrn: 'US-84920',
    balance: '$345.00',
    totalBilled: '$1,450.00',
    insurancePaid: '-$1,105.00',
  };

  // DOM Elements
  const elements = {
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
     DEMO AUTOFILL HELPER
     ========================================================================== */
  function fillDemoPatient() {
    if (elements.primaryIdentifier) elements.primaryIdentifier.value = demoPatient.identifier;
    if (elements.patientDob) elements.patientDob.value = demoPatient.dob;
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

    // Validate DOB
    if (elements.patientDob) {
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

      // Set active user
      const identifierInput = elements.primaryIdentifier.value.trim();
      state.activeUser = {
        name: identifierInput.toLowerCase().includes('sarah') ? demoPatient.name : (identifierInput.split('@')[0] || 'Patient User'),
        identifier: identifierInput,
        balance: demoPatient.balance,
        totalBilled: demoPatient.totalBilled,
        insurancePaid: demoPatient.insurancePaid,
      };

      // Open 2FA Verification Modal (HIPAA requirement)
      openOtpModal();
    }, 600);
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
        fillDemoPatient();
        showAlert('success', 'Health ID Authenticated. Click "Authenticate" to enter statement.');
      });
    }
    if (elements.ssoGoogleBtn) {
      elements.ssoGoogleBtn.addEventListener('click', () => {
        fillDemoPatient();
        showAlert('success', 'Google Workspace verified. Click "Authenticate" to enter statement.');
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
