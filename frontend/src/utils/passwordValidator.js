// Place this at: src/utils/passwordValidator.js

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character');
  return errors; // empty array = valid
}

export function getPasswordStrength(password) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  if (score <= 1) return { label: 'Weak',   color: '#f44336', value: 20  };
  if (score === 2) return { label: 'Fair',   color: '#ff9800', value: 45  };
  if (score === 3) return { label: 'Good',   color: '#2196f3', value: 70  };
  return             { label: 'Strong', color: '#2DBE60', value: 100 };
}