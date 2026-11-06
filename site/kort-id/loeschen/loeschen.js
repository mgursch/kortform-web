/* Kort-ID löschen (K13): E-Mail -> Code -> Löschen bestätigen -> Fertig.
   Talks to the Supabase project of the Kort-ID backend directly (GoTrue REST + Edge Function delete-account).
   The access token and the e-mail address live only in memory of this page: nothing is stored, no cookies, no trackers.
   ?env=dev switches to the dev project (the Edge Function only allows the origin https://kortform.at). */
(function () {
  "use strict";

  /* Public values only (project ref and publishable key, public by design). NEVER a secret key.
     PROD_* are placeholders until the prod project exists (WP4); also update connect-src in index.html. */
  var ENVS = {
    prod: { ref: "PROD_REF_TBD", key: "PROD_PUBLISHABLE_KEY_TBD" },
    dev: { ref: "pjccvfvaeyvqjldfwqje", key: "sb_publishable_XEYNBagKrxgkPbeQNuoWnQ_k7vOBJTJ" }
  };
  var TIMEOUT_MS = 15000;
  var RESEND_SECONDS = 60;

  var MSG = {
    network: "Keine Verbindung. Bitte prüfe deine Internetverbindung und versuch es erneut.",
    generic: "Das hat nicht geklappt. Bitte versuch es später noch einmal.",
    rate: "Zu viele Versuche. Bitte warte einige Minuten und versuch es dann noch einmal.",
    invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    noAccount: "Zu dieser E-Mail-Adresse gibt es keine Kort-ID.",
    wrongCode: "Der Code ist falsch oder abgelaufen. Prüfe die Ziffern oder fordere einen neuen Code an.",
    invalidCode: "Bitte gib den 6-stelligen Code aus der E-Mail ein.",
    expired: "Die Anmeldung ist abgelaufen. Bitte starte noch einmal bei Schritt 1.",
    notConfigured: "Das Löschen auf dieser Seite ist gerade nicht verfügbar. Bitte lösche die Kort-ID in der App: Profil → Kort-ID → Kort-ID löschen.",
    deleteFailed: "Das Löschen hat nicht geklappt. Deine Kort-ID ist unverändert. Bitte versuch es später noch einmal."
  };

  var params = new URLSearchParams(window.location.search);
  var env = ENVS[params.get("env") === "dev" ? "dev" : "prod"];

  var email = "";
  var accessToken = null;
  var busy = false;
  var resendTimer = null;

  function $(id) { return document.getElementById(id); }

  function configured() {
    return !/_TBD$/.test(env.ref) && !/_TBD$/.test(env.key);
  }

  function setMsg(step, text) {
    var el = $("msg-" + step);
    el.textContent = text || "";
    el.hidden = !text;
  }

  function setState(step, state) {
    $("step-" + step).setAttribute("data-state", state);
  }

  function setBusy(button, isBusy, idleLabel, busyLabel) {
    busy = isBusy;
    button.disabled = isBusy;
    if (idleLabel) button.lastChild.textContent = isBusy ? busyLabel : idleLabel;
  }

  /** POST JSON to the project; resolves {status, body}, rejects with Error("network") on connection problems. */
  function post(path, body, bearer) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;
    var headers = { "apikey": env.key, "Content-Type": "application/json", "Accept": "application/json" };
    if (bearer) headers["Authorization"] = "Bearer " + bearer;
    return fetch("https://" + env.ref + ".supabase.co" + path, {
      method: "POST",
      headers: headers,
      body: body === undefined ? "{}" : JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (timer) clearTimeout(timer);
      return response.json().catch(function () { return {}; }).then(function (json) {
        return { status: response.status, body: json || {} };
      });
    }, function () {
      if (timer) clearTimeout(timer);
      throw new Error("network");
    });
  }

  function errorCode(result) {
    var b = result.body;
    return String(b.error_code || b.code || b.error || "");
  }

  function isRate(result) {
    var c = errorCode(result);
    return result.status === 429 || c === "over_email_send_rate_limit" || c === "over_request_rate_limit" || c === "over_sms_send_rate_limit";
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function startResendCountdown() {
    var button = $("resend");
    var left = RESEND_SECONDS;
    if (resendTimer) clearInterval(resendTimer);
    button.disabled = true;
    button.textContent = "Code erneut senden (" + left + " s)";
    resendTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        clearInterval(resendTimer);
        resendTimer = null;
        button.disabled = false;
        button.textContent = "Code erneut senden";
      } else {
        button.textContent = "Code erneut senden (" + left + " s)";
      }
    }, 1000);
  }

  function stopResendCountdown() {
    if (resendTimer) clearInterval(resendTimer);
    resendTimer = null;
    var button = $("resend");
    button.disabled = true;
    button.textContent = "Code erneut senden";
  }

  /** Send (or resend) the code. Resolves true when the mail was requested. */
  function sendCode(step) {
    return post("/auth/v1/otp", { email: email, create_user: false }).then(function (result) {
      if (result.status >= 200 && result.status < 300) return true;
      var code = errorCode(result);
      if (isRate(result)) setMsg(step, MSG.rate);
      else if (code === "otp_disabled" || code === "user_not_found" || code === "signup_disabled") setMsg(step, MSG.noAccount);
      else if (code === "validation_failed" || code === "email_address_invalid") setMsg(step, MSG.invalidEmail);
      else setMsg(step, MSG.generic);
      return false;
    }, function () {
      setMsg(step, MSG.network);
      return false;
    });
  }

  function showStep2() {
    setState(1, "done");
    $("title-1").textContent = "E-Mail · " + email;
    $("step-1").querySelector(".kl-form").hidden = true;
    setMsg(1, "");
    setState(2, "active");
    $("title-2").style.fontWeight = "";
    $("detail-2").hidden = false;
    $("code").value = "";
    startResendCountdown();
    $("code").focus();
  }

  function resetToStep1(message) {
    accessToken = null;
    stopResendCountdown();
    setState(1, "active");
    $("title-1").textContent = "E-Mail";
    $("step-1").querySelector(".kl-form").hidden = false;
    setState(2, "pending");
    $("detail-2").hidden = true;
    setMsg(2, "");
    setState(3, "pending");
    $("detail-3").hidden = true;
    setMsg(3, "");
    setMsg(1, message || "");
    $("email").focus();
  }

  function onSubmitEmail(event) {
    event.preventDefault();
    if (busy) return;
    var value = $("email").value.trim();
    $("email").removeAttribute("aria-invalid");
    if (!validEmail(value)) {
      $("email").setAttribute("aria-invalid", "true");
      setMsg(1, MSG.invalidEmail);
      $("email").focus();
      return;
    }
    if (!configured()) { setMsg(1, MSG.notConfigured); return; }
    setMsg(1, "");
    email = value;
    var button = $("send-code");
    setBusy(button, true, "Code senden", "Wird gesendet …");
    sendCode(1).then(function (ok) {
      setBusy(button, false, "Code senden", "Wird gesendet …");
      if (ok) showStep2();
    });
  }

  function onSubmitCode(event) {
    event.preventDefault();
    if (busy) return;
    var token = $("code").value.replace(/\s+/g, "");
    $("code").removeAttribute("aria-invalid");
    if (!/^[0-9]{6}$/.test(token)) {
      $("code").setAttribute("aria-invalid", "true");
      setMsg(2, MSG.invalidCode);
      $("code").focus();
      return;
    }
    setMsg(2, "");
    var button = $("verify-code");
    setBusy(button, true, "Bestätigen", "Wird geprüft …");
    post("/auth/v1/verify", { type: "email", email: email, token: token }).then(function (result) {
      setBusy(button, false, "Bestätigen", "Wird geprüft …");
      if (result.status >= 200 && result.status < 300 && typeof result.body.access_token === "string") {
        accessToken = result.body.access_token;
        stopResendCountdown();
        setState(2, "done");
        $("title-2").textContent = "Code bestätigt";
        $("detail-2").hidden = true;
        setState(3, "active");
        $("detail-3").hidden = false;
        $("delete").focus();
      } else if (isRate(result)) {
        setMsg(2, MSG.rate);
      } else if (result.status >= 500) {
        setMsg(2, MSG.generic);
      } else {
        $("code").setAttribute("aria-invalid", "true");
        setMsg(2, MSG.wrongCode);
      }
    }, function () {
      setBusy(button, false, "Bestätigen", "Wird geprüft …");
      setMsg(2, MSG.network);
    });
  }

  function onResend() {
    if (busy) return;
    var button = $("resend");
    button.disabled = true;
    setMsg(2, "");
    sendCode(2).then(function (ok) {
      if (ok) {
        var el = $("msg-2");
        el.setAttribute("data-kind", "info");
        el.textContent = "Wir haben dir einen neuen Code geschickt.";
        el.hidden = false;
        startResendCountdown();
      } else {
        button.disabled = false;
      }
    });
  }

  function onDelete() {
    if (busy || !accessToken) return;
    setMsg(3, "");
    var button = $("delete");
    setBusy(button, true, "Kort-ID endgültig löschen", "Wird gelöscht …");
    post("/functions/v1/delete-account", undefined, accessToken).then(function (result) {
      setBusy(button, false, "Kort-ID endgültig löschen", "Wird gelöscht …");
      if (result.status >= 200 && result.status < 300 && result.body.deleted === true) {
        accessToken = null;
        email = "";
        $("email").value = "";
        $("code").value = "";
        $("flow").hidden = true;
        document.querySelector(".kl-aside").hidden = true;
        var done = $("done");
        done.hidden = false;
        done.focus();
      } else if (result.status === 401) {
        resetToStep1(MSG.expired);
      } else {
        setMsg(3, MSG.deleteFailed);
      }
    }, function () {
      setBusy(button, false, "Kort-ID endgültig löschen", "Wird gelöscht …");
      setMsg(3, MSG.network);
    });
  }

  function init() {
    $("form-email").addEventListener("submit", onSubmitEmail);
    $("form-code").addEventListener("submit", onSubmitCode);
    $("resend").addEventListener("click", onResend);
    $("change-email").addEventListener("click", function () { resetToStep1(""); });
    $("delete").addEventListener("click", onDelete);
    $("email").addEventListener("input", function () { this.removeAttribute("aria-invalid"); });
    $("code").addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").slice(0, 6);
      this.removeAttribute("aria-invalid");
    });
    stopResendCountdown();
    if (!configured()) setMsg(1, MSG.notConfigured);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
