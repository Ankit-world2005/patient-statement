# US24 Solutions - HIPAA Compliant Patient Statement Portal

[![HIPAA Compliant](https://img.shields.io/badge/Security-HIPAA%20Compliant-blue.svg)](https://us24solutions.com)
[![Encryption](https://img.shields.io/badge/Encryption-TLS%201.3%20%7C%20AES--256-green.svg)](https://us24solutions.com)
[![SOC 2](https://img.shields.io/badge/Compliance-SOC%202%20Type%20II-teal.svg)](https://us24solutions.com)
[![US24 Official](https://img.shields.io/badge/US24%20Solutions-Official%20Branding-orange.svg)](https://us24solutions.com)

A web portal designed for **US24 Solutions** Revenue Cycle Management (RCM) operations, providing secure access to patient medical statements, billing invoices, insurance adjustments, and electronic payment options.

---

## 🎨 Official US24 Solutions Brand Palette

Colors extracted directly from [US24 Solutions Official Website](https://us24solutions.com):

| Color | Hex | Role |
|-------|-----|------|
| **US24 Royal Navy** | `#243989` | Primary Buttons, Headers, Brand Identity |
| **US24 Brand Orange** | `#fe7121` | Vibrant Accent, Active Highlights, CTAs |
| **Healthcare Emerald Teal** | `#69c8a6` | Success States, Valid Inputs, Security Badges |
| **Deep Slate Petrol** | `#173d55` | Text Color, Dark Mode Accents, Top Banner |
| **Soft Tech Blue** | `#7399e6` | Secondary Badges, Focus Glows |
| **Warm Coral Rose** | `#e68778` | Warnings, Alert Accents |

---

## 🔒 HIPAA Compliance & Security Architecture

1. **Access Controls (45 CFR § 164.312(a)(1))**:
   - Unique User Identification & Multi-Persona Verification (Patient MRN, Provider NPI, Staff SSO).
   - Identity verification via Date of Birth (DOB) to prevent unauthorized disclosure of Protected Health Information (PHI).
2. **Automatic Inactivity Logoff (§ 164.312(a)(2)(iii))**:
   - Automated 15-minute inactivity session lock countdown timer with continuous user activity tracking.
3. **Multi-Factor Authentication (MFA/2FA)**:
   - Interactive 6-digit cryptographic verification code modal (with quick demo autofill).
4. **End-to-End Cryptography (§ 164.312(e)(1))**:
   - TLS 1.3 / AES-256 GCM cryptographic simulation and verification badges.
5. **Audit Trails & Security Disclaimers**:
   - Dynamic client IP address logging and cryptographic audit trail IDs (`US24-SEC-XXXX`).
   - Prominent HIPAA warnings and interactive security policies.

---

## ✨ Features

- **Multi-Persona Access**:
  - 👤 **Patient / Guarantor**: Log in with Email or MRN + DOB.
  - 🩺 **Healthcare Provider**: Log in with NPI Number or Clinic Email.
  - 💻 **US24 Staff SSO**: Corporate single sign-on for billing specialists.
- **Demo Presets**:
  - One-click buttons to load `Sarah Jenkins (Patient)`, `Dr. Robert Miller (Provider)`, and `Michael Vance (RCM Staff)`.
- **Guest Statement Quick Pay**:
  - Direct checkout using Statement # + PIN without creating an account.
- **Interactive Statement Preview Dashboard**:
  - Post-authentication showcase with financial overview (Total Charges, Insurance Paid, Patient Responsibility).
  - Detailed line items with CPT codes, provider names, and adjustment calculations.
  - **Print / PDF Export**: Built-in `@media print` stylesheet for clean PDF downloads.
- **Real-Time Password Strength Meter**:
  - Dynamic entropy scoring meeting NIST-800 healthcare security guidelines.
- **Light & Dark Theme Toggle**:
  - Seamless toggle with persistent `localStorage` preference.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser, or serve it locally using any static web server:

```bash
# Using Python
python -m http.server 3000

# Using Node / npx
npx serve .
```

---

## 🏢 Contact US24 Solutions

- **Headquarters**: Chicago, IL | Global Offices in UK & India
- **Phone**: [+1-309-364-6427](tel:+1-309-364-6427)
- **Email**: [contact@us24solutions.com](mailto:contact@us24solutions.com)
- **Website**: [https://us24solutions.com](https://us24solutions.com)
