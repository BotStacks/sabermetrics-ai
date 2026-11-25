/**
 * SaberMetrics consumer auth + account client.
 * Owns signup/login/reset forms so Webflow Forms never receive passwords.
 */
(function () {
  var API = "https://sabermetrics-api-edge-staging.botstacks.workers.dev";
  var KEY = "sm_access_token";
  var PASS_HINT = "At least 8 characters.";

  function msg(t, kind) {
    var el = document.getElementById("sm-msg");
    if (!el) return;
    el.textContent = t || "";
    if (!t) {
      el.style.color = "";
      return;
    }
    el.style.color = kind === "ok" ? "#174d37" : "#9b2c2c";
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
          e2.code = data && data.error && data.error.code;
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

  /** Strip Webflow Form handlers so password fields are never submitted to Webflow. */
  function takeOverAuthForm(form) {
    if (!form || form.getAttribute("data-sm-owned") === "1") return form;
    var wrap = form.closest(".w-form");
    if (wrap) {
      wrap.querySelectorAll(".w-form-done, .w-form-fail").forEach(function (n) {
        n.remove();
      });
      wrap.classList.remove("w-form");
      wrap.setAttribute("data-sm-auth-form", "1");
    }
    form.removeAttribute("data-wf-page-id");
    form.removeAttribute("data-wf-element-id");
    form.removeAttribute("data-turnstile-sitekey");
    form.setAttribute("action", "javascript:void(0)");
    form.setAttribute("method", "post");
    form.setAttribute("novalidate", "novalidate");
    form.setAttribute("autocomplete", "on");
    // Clone drops jQuery/Webflow submit listeners that block passwords.
    var clone = form.cloneNode(true);
    clone.setAttribute("data-sm-owned", "1");
    form.parentNode.replaceChild(clone, form);
    return clone;
  }

  function fixFieldNames(form) {
    var nameInput =
      form.querySelector('input[autocomplete="name"]') ||
      form.querySelector('input[name="field"]');
    if (nameInput) {
      nameInput.name = "name";
      nameInput.id = "sm-name";
      nameInput.setAttribute("placeholder", "Your name");
    }
    var email = form.querySelector('input[type="email"], input[name="email"]');
    if (email) {
      email.name = "email";
      email.id = "sm-email";
      email.setAttribute("placeholder", "you@example.com");
    }
    var password = form.querySelector('input[type="password"][name="password"]');
    if (password) {
      password.id = "sm-password";
      password.setAttribute("placeholder", "Create a password");
      password.setAttribute("minlength", "8");
      password.setAttribute("autocomplete", password.getAttribute("autocomplete") || "new-password");
    }
    var newPass = form.querySelector('input[name="new_password"]');
    if (newPass) {
      newPass.id = "sm-new-password";
      newPass.setAttribute("placeholder", "New password");
      newPass.setAttribute("minlength", "8");
    }
    var tokenField = form.querySelector('input[name="token"]');
    if (tokenField) {
      tokenField.id = "sm-reset-token";
      tokenField.setAttribute("placeholder", "Paste reset token");
    }
    var terms = form.querySelector('input[name="accept_terms"]');
    if (terms) {
      terms.id = "sm-accept-terms";
      // Webflow nests a w-form-label ("accept_terms") plus outer copy — keep one sentence.
      var outer = form.querySelector(".sm-check") || terms.closest("label");
      if (outer) {
        var keepBox = outer.querySelector(".w-checkbox") || terms.parentNode;
        outer.innerHTML = "";
        if (keepBox) {
          var span = keepBox.querySelector(".w-form-label");
          if (span) {
            span.textContent = "";
            span.setAttribute("aria-hidden", "true");
          }
          outer.appendChild(keepBox);
        } else {
          outer.appendChild(terms);
        }
        var copy = document.createElement("span");
        copy.className = "sm-terms-copy";
        copy.innerHTML =
          ' I agree to the <a class="sm-a" href="/terms">Terms of Use</a> and <a class="sm-a" href="/privacy">Privacy Policy</a>';
        outer.appendChild(copy);
      }
    }
    // Unique ids — Webflow left every input as id=field
    form.querySelectorAll("input").forEach(function (inp, i) {
      if (inp.id === "field" || inp.id === "checkbox") {
        inp.id = "sm-field-" + i;
      }
      var lab = inp.closest("label");
      if (lab && !lab.getAttribute("for") && inp.id) lab.setAttribute("for", inp.id);
    });
  }

  function ensureAuthLinks(page) {
    var host =
      document.querySelector(".sm-links-1, .sm-links-1-2, .sm-links-1-2-3") ||
      document.getElementById("sm-msg");
    if (!host) return;
    var bar = document.getElementById("sm-auth-links");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "sm-auth-links";
      bar.className = "sm-auth-links";
      bar.style.cssText = "margin-top:1rem;line-height:1.6;";
      if (host.id === "sm-msg") host.parentNode.insertBefore(bar, host);
      else host.parentNode.insertBefore(bar, host.nextSibling);
    }
    if (page === "login") {
      bar.innerHTML =
        '<a class="sm-a" href="/forgot-password" style="font-weight:600;">Forgot password?</a>' +
        ' · <a class="sm-a" href="/signup">Create an account</a>' +
        ' · <a class="sm-a" href="/account">Account</a>';
    } else if (page === "signup") {
      bar.innerHTML =
        '<a class="sm-a" href="/login">Log in</a>' +
        ' · <a class="sm-a" href="/forgot-password">Forgot password?</a>';
    }
  }

  function showRecovery(email, kind) {
    var host = document.getElementById("sm-msg");
    if (!host) return;
    var box = document.getElementById("sm-recovery");
    if (!box) {
      box = document.createElement("div");
      box.id = "sm-recovery";
      box.style.cssText = "margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:0.6rem;";
      host.parentNode.insertBefore(box, host.nextSibling);
    }
    var q = email ? "?email=" + encodeURIComponent(email) : "";
    var html = "";
    if (kind === "exists") {
      html +=
        '<a class="sm-btn w-button" href="/login' +
        q +
        '">Log in</a>' +
        '<a class="sm-btn-secondary w-button" href="/forgot-password' +
        q +
        '">Reset password</a>';
    } else if (kind === "credentials") {
      html +=
        '<a class="sm-btn w-button" href="/forgot-password' +
        q +
        '">Reset password</a>';
    } else if (kind === "google") {
      html +=
        '<a class="sm-btn w-button" href="/forgot-password' +
        q +
        '">Set an email password</a>';
    }
    box.innerHTML = html;
  }

  function clearRecovery() {
    var box = document.getElementById("sm-recovery");
    if (box) box.innerHTML = "";
  }

  function prefillEmail(form) {
    var params = new URLSearchParams(location.search);
    var email = params.get("email");
    var field = form.querySelector('input[name="email"], input[type="email"]');
    if (email && field && !field.value) field.value = email;
  }

  function polishSubmit(form, label) {
    var submit = form.querySelector('input[type="submit"], button[type="submit"]');
    if (!submit) return null;
    if (submit.tagName === "INPUT") {
      submit.value = label;
      submit.setAttribute("data-sm-label", label);
      submit.setAttribute("data-wait", "Working…");
    } else {
      submit.textContent = label;
      submit.setAttribute("data-sm-label", label);
    }
    return submit;
  }

  function setLoading(form, on) {
    var submit = form.querySelector('input[type="submit"], button[type="submit"]');
    if (!submit) return;
    submit.disabled = !!on;
    var base = submit.getAttribute("data-sm-label") || "Continue";
    if (submit.tagName === "INPUT") submit.value = on ? "Working…" : base;
    else submit.textContent = on ? "Working…" : base;
  }

  function ensurePasswordToggle(input) {
    if (!input || input.getAttribute("data-sm-toggle") === "1") return;
    input.setAttribute("data-sm-toggle", "1");
    var wrap = document.createElement("div");
    wrap.className = "sm-pass-wrap";
    wrap.style.position = "relative";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.style.paddingRight = "3rem";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sm-pass-toggle";
    btn.setAttribute("aria-label", "Show password");
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "Show";
    btn.style.cssText =
      "position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);background:transparent;border:0;color:#174d37;font-size:0.85rem;cursor:pointer;padding:0.25rem;";
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", show ? "true" : "false");
    });
    wrap.appendChild(btn);
    if (!input.parentNode.querySelector(".sm-pass-hint")) {
      var hint = document.createElement("p");
      hint.className = "sm-pass-hint";
      hint.style.cssText = "margin:0.35rem 0 0;font-size:0.85rem;color:#4d616d;";
      hint.textContent = PASS_HINT;
      wrap.parentNode.insertBefore(hint, wrap.nextSibling);
    }
  }

  function validatePassword(pw) {
    if (!pw || String(pw).length < 8) return PASS_HINT;
    return "";
  }

  function onLogin(form) {
    form = takeOverAuthForm(form);
    fixFieldNames(form);
    polishSubmit(form, "Log in");
    ensureAuthLinks("login");
    prefillEmail(form);
    var pw = form.querySelector('input[type="password"]');
    if (pw) {
      pw.setAttribute("autocomplete", "current-password");
      pw.setAttribute("placeholder", "Your BotStacks / SaberMetrics password");
      ensurePasswordToggle(pw);
    }
    var lead = document.querySelector(".sm-lead-1, .sm-lead-1-2, .sm-lead");
    if (lead && !lead.getAttribute("data-sm-shared")) {
      lead.setAttribute("data-sm-shared", "1");
      lead.textContent =
        "Use the same email and password as BotStacks sandbox. SaberMetrics shares that login — no second account.";
    }
    form.addEventListener(
      "submit",
      function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        msg("");
        clearRecovery();
        var fd = new FormData(form);
        var email = String(fd.get("email") || "").trim();
        var password = String(fd.get("password") || "");
        if (!email || !password) {
          msg("Enter your email and password.");
          return;
        }
        setLoading(form, true);
        api("/auth/login", { method: "POST", body: { email: email, password: password } })
          .then(function (d) {
            setToken(d.access_token);
            return api("/sabermetrics/bootstrap", { method: "POST" }).catch(function (e) {
              if (e.status === 404) return null;
              throw e;
            });
          })
          .then(function () {
            var params = new URLSearchParams(location.search);
            location.href = params.get("next") || "/account";
          })
          .catch(function (e) {
            setLoading(form, false);
            if (e.status === 403 && /not verified/i.test(e.message || "")) {
              msg("Verify your email before logging in. Check your inbox, or resend below.");
              showResend(email);
              return;
            }
            if (/google sign-in/i.test(e.message || "")) {
              msg(
                "This account uses Google sign-in. Set an email password with Forgot password to use SaberMetrics, or sign in with Google on BotStacks."
              );
              showRecovery(email, "google");
              return;
            }
            if (e.status === 401 || /invalid credentials/i.test(e.message || "")) {
              msg(
                "That email and password did not match. Use your BotStacks password, or reset it — SaberMetrics does not create a separate login."
              );
              showRecovery(email, "credentials");
              return;
            }
            msg(e.message || "Login failed");
          });
      },
      true
    );
  }

  function showResend(email) {
    var host = document.getElementById("sm-msg");
    if (!host || document.getElementById("sm-resend-btn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "sm-resend-btn";
    btn.className = "sm-btn-secondary";
    btn.style.cssText = "display:inline-block;margin-top:0.75rem;cursor:pointer;";
    btn.textContent = "Resend verification email";
    btn.addEventListener("click", function () {
      btn.disabled = true;
      api("/auth/resend-verification", { method: "POST", body: { email: email } })
        .then(function () {
          msg("If that account needs verification, a new email is on the way.", "ok");
        })
        .catch(function (e) {
          if (e.status === 404) {
            msg("Resend is not live on staging API yet — check your inbox for the first email.");
          } else {
            msg(e.message || "Could not resend verification email");
          }
          btn.disabled = false;
        });
    });
    host.parentNode.insertBefore(btn, host.nextSibling);
  }

  function onSignup(form) {
    form = takeOverAuthForm(form);
    fixFieldNames(form);
    polishSubmit(form, "Create account");
    ensureAuthLinks("signup");
    prefillEmail(form);
    var pw = form.querySelector('input[name="password"]');
    if (pw) ensurePasswordToggle(pw);
    var lead = document.querySelector(".sm-lead-1-2, .sm-lead-1, .sm-lead");
    if (lead && !lead.getAttribute("data-sm-shared")) {
      lead.setAttribute("data-sm-shared", "1");
      lead.textContent =
        "New here? Create an account. Already on BotStacks? Log in with that email — SaberMetrics shares the same account.";
    }
    form.addEventListener(
      "submit",
      function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        msg("");
        clearRecovery();
        var fd = new FormData(form);
        var name = String(fd.get("name") || "").trim();
        var email = String(fd.get("email") || "").trim();
        var password = String(fd.get("password") || "");
        var accept = !!fd.get("accept_terms");
        var pwErr = validatePassword(password);
        if (!email) {
          msg("Enter a valid email address.");
          return;
        }
        if (pwErr) {
          msg(pwErr);
          return;
        }
        if (!accept) {
          msg("Please accept the Terms of Use to create an account.");
          return;
        }
        setLoading(form, true);
        api("/auth/signup", {
          method: "POST",
          body: {
            name: name || null,
            email: email,
            password: password,
            accept_terms: true,
          },
        })
          .then(function () {
            setLoading(form, false);
            msg(
              "Check your email to verify your account. Five free answers unlock after verification.",
              "ok"
            );
            form.reset();
            showResend(email);
          })
          .catch(function (e) {
            setLoading(form, false);
            if (e.status === 409 || /already registered/i.test(e.message || "")) {
              msg(
                "That email already has a BotStacks / SaberMetrics account. Log in with your existing password, or reset it — we do not create a second account."
              );
              showRecovery(email, "exists");
              return;
            }
            msg(e.message || "Signup failed");
          });
      },
      true
    );
  }

  function onForgot(form) {
    form = takeOverAuthForm(form);
    fixFieldNames(form);
    polishSubmit(form, "Email reset link");
    prefillEmail(form);
    var lead = document.querySelector(".sm-lead-1, .sm-lead-1-2, .sm-lead");
    if (lead && !lead.getAttribute("data-sm-shared")) {
      lead.setAttribute("data-sm-shared", "1");
      lead.textContent =
        "We email a reset link for BotStacks / SaberMetrics accounts (same login). Check spam if it is slow.";
    }
    form.addEventListener(
      "submit",
      function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        msg("");
        var fd = new FormData(form);
        var email = String(fd.get("email") || "").trim();
        if (!email) {
          msg("Enter the email for your account.");
          return;
        }
        setLoading(form, true);
        api("/auth/request-password-reset", { method: "POST", body: { email: email } })
          .then(function () {
            setLoading(form, false);
            msg(
              "If that email has an account, a reset link is on the way from BotStacks. Check inbox and spam, then return here to set a new password.",
              "ok"
            );
          })
          .catch(function (e) {
            setLoading(form, false);
            msg(e.message || "Could not start reset");
          });
      },
      true
    );
  }

  function onReset(form) {
    form = takeOverAuthForm(form);
    fixFieldNames(form);
    polishSubmit(form, "Update password");
    var params = new URLSearchParams(location.search);
    if (params.get("token") && form.token) form.token.value = params.get("token");
    var pw = form.querySelector('input[name="new_password"]');
    if (pw) ensurePasswordToggle(pw);
    form.addEventListener(
      "submit",
      function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        msg("");
        var fd = new FormData(form);
        var newPassword = String(fd.get("new_password") || "");
        var pwErr = validatePassword(newPassword);
        if (pwErr) {
          msg(pwErr);
          return;
        }
        if (!fd.get("token")) {
          msg("Missing reset token. Open the link from your email.");
          return;
        }
        setLoading(form, true);
        api("/auth/reset-password", {
          method: "POST",
          body: { token: fd.get("token"), new_password: newPassword },
        })
          .then(function () {
            setLoading(form, false);
            msg("Password updated. You can log in.", "ok");
            setTimeout(function () {
              location.href = "/login";
            }, 1200);
          })
          .catch(function (e) {
            setLoading(form, false);
            msg(e.message || "Reset failed");
          });
      },
      true
    );
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
        msg(e.message || "Could not load account");
      });
    document.querySelectorAll("[data-sm-sku]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        msg("");
        api("/sabermetrics/checkout", {
          method: "POST",
          body: { sku: btn.getAttribute("data-sm-sku") },
        })
          .then(function (d) {
            location.href = d.checkout_url;
          })
          .catch(function (e) {
            msg(e.message || "Checkout unavailable");
          });
      });
    });
    var portal = document.getElementById("sm-portal");
    if (portal)
      portal.addEventListener("click", function (ev) {
        ev.preventDefault();
        api("/sabermetrics/portal", { method: "POST", body: {} })
          .then(function (d) {
            location.href = d.portal_url;
          })
          .catch(function (e) {
            msg(e.message || "Portal unavailable");
          });
      });
    var logout = document.getElementById("sm-logout");
    if (logout)
      logout.addEventListener("click", function (ev) {
        ev.preventDefault();
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
        if (credits) credits.textContent = "Credits: sign in required";
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
    var emailHint = params.get("email") || "";
    if (!t) {
      if (lead) lead.textContent = "Missing verification token. Open the link from your email, or request a new one.";
      if (emailHint) showResend(emailHint);
      else showResendPrompt();
      return;
    }
    api("/auth/verify-email", { method: "POST", body: { token: t } })
      .then(function () {
        if (lead) lead.textContent = "Email verified. Redirecting to log in…";
        msg("");
        setTimeout(function () {
          location.href = "/login";
        }, 900);
      })
      .catch(function (e) {
        if (lead) lead.textContent = "Verification failed.";
        msg(e.message || "Invalid or expired token");
        showResendPrompt();
      });
  }

  function showResendPrompt() {
    if (document.getElementById("sm-resend-form")) return;
    var host = document.getElementById("sm-msg") || document.body;
    var box = document.createElement("form");
    box.id = "sm-resend-form";
    box.style.cssText = "margin-top:1rem;display:grid;gap:0.5rem;max-width:24rem;";
    box.innerHTML =
      '<label for="sm-resend-email">Email for a new verification link</label>' +
      '<input id="sm-resend-email" type="email" required placeholder="you@example.com" class="sm-input w-input" />' +
      '<button type="submit" class="sm-btn w-button">Resend verification email</button>';
    host.parentNode.insertBefore(box, host.nextSibling);
    box.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = document.getElementById("sm-resend-email").value.trim();
      if (!email) return;
      api("/auth/resend-verification", { method: "POST", body: { email: email } })
        .then(function () {
          msg("If that account needs verification, a new email is on the way.", "ok");
        })
        .catch(function (e) {
          if (e.status === 404) {
            msg("Resend is not live on staging API yet — open the link from your first email.");
          } else {
            msg(e.message || "Could not resend");
          }
        });
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
