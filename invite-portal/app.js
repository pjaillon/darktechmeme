const MATRIX_HOMESERVER = 'https://matrix.cleardis.com';
const ELEMENT_URL = 'https://app.cleardis.com';

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Redirect to landing page if no token
if (!token) {
  window.location.href = '/';
}

const form = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  successMsg.style.display = 'none';
  submitBtn.disabled = false;
  submitBtn.textContent = 'Join United';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';

  const username = document.getElementById('username').value.trim().toLowerCase();
  const displayName = document.getElementById('displayName').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;

  if (password !== passwordConfirm) {
    return showError('Passwords do not match.');
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';

  try {
    // Step 1: get registration session (required by Matrix spec)
    const sessionRes = await fetch(
      `${MATRIX_HOMESERVER}/_matrix/client/v3/register`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'user' }) }
    );
    const sessionData = await sessionRes.json();
    const session = sessionData.session;

    // Step 2: register with token + dummy auth
    const registerRes = await fetch(
      `${MATRIX_HOMESERVER}/_matrix/client/v3/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'user',
          username,
          password,
          auth: {
            type: 'm.login.registration_token',
            token,
            session,
          },
        }),
      }
    );

    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      if (registerData.errcode === 'M_USER_IN_USE') {
        return showError('That username is already taken. Please choose another.');
      }
      if (registerData.errcode === 'M_INVALID_TOKEN') {
        return showError('This invite link is invalid or has already been used.');
      }
      return showError(registerData.error || 'Registration failed. Please try again.');
    }

    // Step 3: set display name
    const accessToken = registerData.access_token;
    const userId = registerData.user_id;

    if (displayName && accessToken) {
      await fetch(
        `${MATRIX_HOMESERVER}/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ displayname: displayName }),
        }
      );
    }

    // Step 4: show success and redirect to Element
    successMsg.style.display = 'block';
    form.style.display = 'none';

    setTimeout(() => {
      window.location.href = ELEMENT_URL;
    }, 2000);

  } catch (err) {
    showError('Network error. Please check your connection and try again.');
  }
});
