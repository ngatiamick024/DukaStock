
document.documentElement.style.visibility = "hidden";

window.dukaAuthReady = (async function() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("login.html");
        return false;
    }

    document.documentElement.style.visibility = "visible";
    return true;
})();
