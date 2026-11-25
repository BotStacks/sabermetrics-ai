(function () {
  var API = "https://sabermetrics-api-edge-staging.botstacks.workers.dev";
  var KEY = "sm_access_token";
  function msg(t) {
    var el = document.getElementById("sm-msg");
    if (el) el.textContent = t || "";
  }
  function token() {
    try {
      return localStorage.getItem(KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem(KEY, t);
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var tok = token();
    if (tok) headers.Authorization = "Bearer " + tok;
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "omit",
    }).then(function (r) {
      return r.text().then(function (txt) {
        var data = null;
        try {
          data = txt ? JSON.parse(txt) : null;
        } catch (e) {
          data = { raw: txt };
        }
        if (!r.ok) {
          var err = (data && data.error && data.error.message) || r.statusText || "Request failed";
          var e2 = new Error(err);
          e2.status = r.status;
          e2.data = data;
          throw e2;
        }
        return data;
      });
    });
  }
  function onLogin(form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg("");
      var fd = new FormData(form);
      api("/auth/login", {
        method: "POST",
        body: { email: fd.get("email"), password: fd.get("password") },
      })
        .then(function (d) {
          setToken(d.access_token);
          return api("/sabermetrics/bootstrap", { method: "POST" });
        })
        .then(function () {
          location.href = "/account";
        })
        .catch(function (e) {
          msg(e.message || "Login failed");
        });
    });
  }
  function onSignup(form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg("");
      var fd = new FormData(form);
      api("/auth/signup", {
        method: "POST",
        body: {
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          accept_terms: !!fd.get("accept_terms"),
        },
      })
        .then(function () {
          msg("Check your email to verify, then log in.");
          form.reset();
        })
        .catch(function (e) {
          msg(e.message || "Signup failed");
        });
    });
  }
  function renderBalance(d) {
    var lead = document.getElementById("sm-account-lead");
    var box = document.getElementById("sm-balance");
    if (lead)
      lead.textContent =
        "Plan: " +
        (d.plan_sku || d.status || "free") +
        " · mode " +
        d.spending_mode;
    if (!box) return;
    box.innerHTML =
      "<div><dt>Credits left</dt><dd>" +
      d.answer_credits_remaining +
      "</dd></div><div><dt>Free used</dt><dd>" +
      d.free_answers_used +
      " / " +
      d.free_answers_once +
      "</dd></div>";
  }
  function onAccount() {
    if (!token()) {
      location.href = "/login?next=/account";
      return;
    }
    api("/sabermetrics/bootstrap", { method: "POST" })
      .then(renderBalance)
      .catch(function (e) {
        if (e.status === 401) {
          setToken("");
          location.href = "/login?next=/account";
          return;
        }
        msg(e.message || "Could not load account");
      });
    document.querySelectorAll("[data-sm-sku]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        msg("");
        api("/sabermetrics/checkout", {
          method: "POST",
          body: { sku: btn.getAttribute("data-sm-sku") },
        })
          .then(function (d) {
            location.href = d.checkout_url;
          })
          .catch(function (e) {
            msg(e.message || "Checkout failed");
          });
      });
    });
    var portal = document.getElementById("sm-portal");
    if (portal)
      portal.addEventListener("click", function () {
        api("/sabermetrics/portal", { method: "POST", body: {} })
          .then(function (d) {
            location.href = d.portal_url;
          })
          .catch(function (e) {
            msg(e.message || "Portal failed");
          });
      });
    var logout = document.getElementById("sm-logout");
    if (logout)
      logout.addEventListener("click", function () {
        setToken("");
        location.href = "/login";
      });
  }
  function onVerify() {
    var params = new URLSearchParams(location.search);
    var t = params.get("token");
    var lead = document.getElementById("sm-verify-lead");
    if (!t) {
      if (lead) lead.textContent = "Missing verification token.";
      return;
    }
    api("/auth/verify-email", { method: "POST", body: { token: t } })
      .then(function () {
        if (lead) lead.textContent = "Email verified. You can log in.";
        msg("");
      })
      .catch(function (e) {
        if (lead) lead.textContent = "Verification failed.";
        msg(e.message || "Invalid or expired token");
      });
  }
  function boot() {
    var root = document.querySelector("[data-sm-page]");
    if (!root) return;
    var page = root.getAttribute("data-sm-page");
    if (page === "login") {
      var lf = document.getElementById("sm-login-form");
      if (lf) onLogin(lf);
    } else if (page === "signup") {
      var sf = document.getElementById("sm-signup-form");
      if (sf) onSignup(sf);
    } else if (page === "account") onAccount();
    else if (page === "verify") onVerify();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
