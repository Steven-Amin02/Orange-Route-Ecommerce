/**
 * FreshCart - Authentication Engine (auth.js)
 * 
 * Handles client-side validation, Route API login & registration,
 * session token persistence via FreshCart domain, and dynamic feedback.
 */

(function () {
  'use strict';

  const AUTH_API = 'https://ecommerce.routemisr.com/api/v1/auth';

  // ============================================================================
  // 1. FORM VALIDATION HELPERS
  // ============================================================================

  const validators = {
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim()),
    password: (val) => String(val || '').length >= 6,
    name: (val) => String(val || '').trim().length >= 3,
    phone: (val) => /^01[0125][0-9]{8}$/.test(String(val || '').trim()) || /^[0-9]{10,14}$/.test(String(val || '').trim())
  };

  function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('auth-alert-box');
    if (!alertBox) return;

    alertBox.className = `alert alert-${type} d-flex align-items-center gap-2 py-2 px-3 mb-3`;
    alertBox.innerHTML = `
      <i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'triangle-exclamation'}"></i>
      <div>${FreshCart.escapeHtml(message)}</div>
    `;
    alertBox.classList.remove('d-none');
  }

  function clearAlert() {
    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) alertBox.classList.add('d-none');
  }

  // ============================================================================
  // 2. PASSWORD VISIBILITY TOGGLE
  // ============================================================================

  function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle-icon').forEach((icon) => {
      icon.addEventListener('click', () => {
        const targetId = icon.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          icon.classList.toggle('fa-eye', !isPassword);
          icon.classList.toggle('fa-eye-slash', isPassword);
        }
      });
    });
  }

  // ============================================================================
  // 3. LOGIN HANDLING
  // ============================================================================

  function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const email = emailInput?.value.trim();
      const password = passwordInput?.value;

      let isValid = true;
      if (!validators.email(email)) {
        emailInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput?.classList.remove('is-invalid');
      }

      if (!validators.password(password)) {
        passwordInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        passwordInput?.classList.remove('is-invalid');
      }

      if (!isValid) {
        showAlert('Please provide a valid email and password.');
        return;
      }

      // Submit to Route API
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing in...';
      }

      try {
        const response = await fetch(`${AUTH_API}/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || data.message !== 'success') {
          throw new Error(data.message || 'Invalid email or password.');
        }

        // Save session
        FreshCart.setUser(data.user, data.token);

        showAlert('Signed in successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 800);
      } catch (err) {
        showAlert(err.message || 'Login failed. Please check your credentials.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right ms-1"></i>';
        }
      }
    });
  }

  // ============================================================================
  // 4. SIGNUP HANDLING
  // ============================================================================

  function setupSignupForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const rePasswordInput = document.getElementById('signup-repassword');
    const phoneInput = document.getElementById('signup-phone');
    const submitBtn = document.getElementById('btn-signup-submit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const name = nameInput?.value.trim();
      const email = emailInput?.value.trim();
      const password = passwordInput?.value;
      const rePassword = rePasswordInput?.value;
      const phone = phoneInput?.value.trim();

      let isValid = true;

      if (!validators.name(name)) {
        nameInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        nameInput?.classList.remove('is-invalid');
      }

      if (!validators.email(email)) {
        emailInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput?.classList.remove('is-invalid');
      }

      if (!validators.password(password)) {
        passwordInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        passwordInput?.classList.remove('is-invalid');
      }

      if (password !== rePassword) {
        rePasswordInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        rePasswordInput?.classList.remove('is-invalid');
      }

      if (!validators.phone(phone)) {
        phoneInput?.classList.add('is-invalid');
        isValid = false;
      } else {
        phoneInput?.classList.remove('is-invalid');
      }

      if (!isValid) {
        showAlert('Please fill in all fields correctly.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating account...';
      }

      try {
        const response = await fetch(`${AUTH_API}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, rePassword, phone })
        });

        const data = await response.json();

        if (!response.ok || data.message !== 'success') {
          throw new Error(data.message || 'Registration failed. Email may already be in use.');
        }

        // Save session directly on signup
        FreshCart.setUser(data.user, data.token);

        showAlert('Account created successfully! Welcome to FreshCart.', 'success');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1000);
      } catch (err) {
        showAlert(err.message || 'Registration failed. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Create Account</span> <i class="fa-solid fa-arrow-right ms-1"></i>';
        }
      }
    });
  }

  // ============================================================================
  // 5. INITIALIZATION
  // ============================================================================

  document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggles();
    setupLoginForm();
    setupSignupForm();

    // Check if user is already logged in
    if (FreshCart.isLoggedIn()) {
      const user = FreshCart.getUser();
      const alertBox = document.getElementById('auth-alert-box');
      if (alertBox && user) {
        showAlert(`You are already signed in as ${user.name || user.email}.`, 'success');
      }
    }
  });
})();
