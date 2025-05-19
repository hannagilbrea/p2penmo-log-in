// Get DOM elements
const usernameInput = document.getElementById("username");
const nextButton = document.getElementById("nextButton");
const errorMessage = document.getElementById("errorMessage");

const passwordModal = document.getElementById("passwordModal");
const displayUsername = document.getElementById("displayUsername");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const passwordError = document.getElementById("passwordError");

const changeUsernameBtn = passwordModal.querySelector("button");

// Initially hide error messages
errorMessage.style.display = "none";
passwordError.textContent = "";

// Step 1: Click 'Next' to validate username and open password modal
nextButton.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) {
    errorMessage.style.display = "block";
    return;
  }

  errorMessage.style.display = "none";
  displayUsername.textContent = username;
  passwordModal.style.display = "flex";

  // Focus password input for better user experience
  passwordInput.focus();
});

// Step 2: Click 'Change' button in modal to return to username input
changeUsernameBtn.addEventListener("click", () => {
  passwordModal.style.display = "none";
  usernameInput.focus();
});

// Step 3: Click 'Log in' to validate password and send data to server
loginButton.addEventListener("click", () => {
  const username = displayUsername.textContent.trim();
  const password = passwordInput.value.trim();

  if (!password) {
    passwordError.textContent = "Password is required";
    return;
  }

  passwordError.textContent = "";

  // POST username and password to json-server endpoint
  fetch("/users", {

    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
  .then(res => {
    if (!res.ok) throw new Error(`Failed to save user: ${res.statusText}`);
    return res.json();
  })
  .then(data => {
    alert("Login successful! User saved.");
    console.log("Saved user:", data);

    // Reset form and close modal
    passwordModal.style.display = "none";
    passwordInput.value = "";
    usernameInput.value = "";
  })
  .catch(err => {
    console.error("Error saving user:", err);
    alert("Failed to save login. Please try again.");
  });
});
