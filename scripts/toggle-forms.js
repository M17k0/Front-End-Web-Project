function toggleAuthForms(formType) {
  if (formType === 'login') {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
  } else {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
  }
}

document.addEventListener("DOMContentLoaded", function() {
  toggleAuthForms('login');
});
