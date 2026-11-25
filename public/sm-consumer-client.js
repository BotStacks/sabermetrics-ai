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
          var err =
            (data && data.error && data.error.message) ||
            (data && data.detail && typeof data.detail === "string" && data.detail) ||
            r.statusText ||
            "Request failed";
          var e2 = new Error(err);
          e2.status = r.status;
          e2.data = data;
          throw e2;
        }
        return data;
      });
    });
  }
  function requireAuth(next) {
    if (!token()) {
      location.href = "/login?next=" + encodeURIComponent(next || location.pathname);
      return false;
    }
    return true;
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
          return api("/sabermetrics/bootstrap", { method: "POST" }).catch(function (e) {
            // Bootstrap may 404 until #972 image is live; still land on account.
            if (e.status === 404) return null;
            throw e;
          });
        })
        .then(function () {
          var params = new URLSearchParams(location.search);
          location.href = params.get("next") || "/account";
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
          msg("Check your email to verify, then log in. Five free answers unlock after verification.");
          form.reset();
        })
        .catch(function (e) {
          msg(e.message || "Signup failed");
        });
    });
  }
  function onForgot(form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg("");
      var fd = new FormData(form);
      api("/auth/request-password-reset", {
        method: "POST",
        body: { email: fd.get("email") },
      })
        .then(function () {
          msg("If that email has an account, a reset link is on the way.");
        })
        .catch(function (e) {
          msg(e.message || "Could not start reset");
        });
    });
  }
  function onReset(form) {
    var params = new URLSearchParams(location.search);
    if (params.get("token") && form.token) form.token.value = params.get("token");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg("");
      var fd = new FormData(form);
      api("/auth/reset-password", {
        method: "POST",
        body: { token: fd.get("token"), new_password: fd.get("new_password") },
      })
        .then(function () {
          msg("Password updated. You can log in.");
        })
        .catch(function (e) {
          msg(e.message || "Reset failed");
        });
    });
  }
  function renderBalance(d) {
    var lead = document.getElementById("sm-account-lead");
    var box = document.getElementById("sm-balance");
    if (lead)
      lead.textContent =
        "Plan: " + (d.plan_sku || d.status || "free") + " · mode " + d.spending_mode;
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
    if (!requireAuth("/account")) return;
    api("/sabermetrics/bootstrap", { method: "POST" })
      .then(renderBalance)
      .catch(function (e) {
        if (e.status === 401) {
          setToken("");
          location.href = "/login?next=/account";
          return;
        }
        if (e.status === 404) {
          msg("Account billing API is not deployed yet. Auth works; credits appear after the API image rolls.");
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
            msg(e.message || "Checkout unavailable until consumer API is deployed");
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
            msg(e.message || "Portal unavailable until consumer API is deployed");
          });
      });
    var logout = document.getElementById("sm-logout");
    if (logout)
      logout.addEventListener("click", function () {
        api("/auth/logout", { method: "POST", body: {} }).catch(function () {});
        setToken("");
        location.href = "/login";
      });
  }
  function onAsk() {
    var form = document.getElementById("sm-ask-form");
    var out = document.getElementById("sm-ask-answer");
    var credits = document.getElementById("sm-ask-credits");
    if (!form) return;
    if (!requireAuth("/ask")) return;
    api("/sabermetrics/me")
      .then(function (d) {
        if (credits) credits.textContent = "Credits left: " + d.answer_credits_remaining;
      })
      .catch(function () {
        if (credits) credits.textContent = "Credits: unavailable until API deploy";
      });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg("");
      if (out) out.textContent = "Thinking…";
      var fd = new FormData(form);
      api("/sabermetrics/ask", {
        method: "POST",
        body: { question: fd.get("question"), style: fd.get("style") || "Fan" },
      })
        .then(function (d) {
          if (out) out.textContent = d.answer || "";
          return api("/sabermetrics/me");
        })
        .then(function (d) {
          if (d && credits) credits.textContent = "Credits left: " + d.answer_credits_remaining;
        })
        .catch(function (e) {
          if (out) out.textContent = "";
          if (e.status === 402) {
            msg("No credits left. Explore plans to continue.");
            return;
          }
          msg(e.message || "Ask failed");
        });
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
    else if (page === "forgot") {
      var ff = document.getElementById("sm-forgot-form");
      if (ff) onForgot(ff);
    } else if (page === "reset") {
      var rf = document.getElementById("sm-reset-form");
      if (rf) onReset(rf);
    } else if (page === "ask") onAsk();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
