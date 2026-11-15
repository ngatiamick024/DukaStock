
const loginForm = document.getElementById("login-form");
const signupButton = document.getElementById("signup-button");
const authMessage = document.getElementById("auth-message");

// Create a new account
signupButton.addEventListener("click", async function() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        authMessage.textContent = "Enter your email and password first.";
        return;
    }

    authMessage.textContent = "Creating your account...";

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: "https://ngatiamick024.github.io/DukaStock/login.html"
        }
    });

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    if (data.session) {
        window.location.href = "index.html";
    } else {
        authMessage.textContent =
            "Account created! Check your email to confirm your account.";
    }
});

// Log in to an existing account
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    authMessage.textContent = "Logging in...";

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    window.location.href = "index.html";
});
