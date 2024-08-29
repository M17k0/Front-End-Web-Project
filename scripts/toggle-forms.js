function toggleAuthForms(formType) {
  if (formType === 'login') {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
    document.title = 'Login';
  } else {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
    document.title = 'Register';
  }
}

document.addEventListener("DOMContentLoaded", function() {
  toggleAuthForms('login');
});
