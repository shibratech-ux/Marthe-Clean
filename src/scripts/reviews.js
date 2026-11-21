// Shared customer-review section (de/fr/en home pages).
// Reads all reviews, newest first by createdAt (no moderation filter, by owner decision 2026-11-21),
// and lets signed-in Google users submit one.
// Rendering uses DOM nodes/textContent only: review fields are untrusted user input.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp,
    query, orderBy, limit, startAfter, getDocs,
    getAggregateFromServer, count, average
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from "../config/firebase.config.js";

const STRINGS = {
    de: {
        signIn: "Mit Google anmelden, um zu bewerten",
        write: "Bewertung schreiben",
        signedInAs: "Angemeldet als",
        signInFailed: "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
        popupBlocked: "Das Anmeldefenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.",
        authUnavailable: "Die Anmeldung mit Google ist auf dieser Website derzeit nicht verfügbar. Bitte später erneut versuchen.",
        networkError: "Keine Verbindung. Bitte Internetverbindung prüfen und erneut versuchen.",
        showMore: "Mehr anzeigen",
        anonymous: "Anonym",
        errName: "Bitte einen Namen eingeben (mind. 2 Zeichen).",
        errRating: "Bitte eine Bewertung von 1 bis 5 wählen.",
        errMessage: "Ihre Nachricht muss mindestens 10 Zeichen lang sein.",
        submitting: "Wird gesendet…",
        submit: "Bewertung absenden",
        thanks: "Vielen Dank! Ihre Bewertung wurde veröffentlicht.",
        submitFailed: "Ein Fehler ist aufgetreten. Bitte später erneut versuchen.",
        unavailable: "Bewertungen sind derzeit nicht verfügbar. Bitte später erneut versuchen.",
        empty: "Noch keine Bewertungen.",
        seeAll: (n) => n ? `Alle ${n} Bewertungen anzeigen` : "Alle Bewertungen anzeigen",
        countLabel: (n) => `${n} ${n === 1 ? "Bewertung" : "Bewertungen"}`
    },
    fr: {
        signIn: "Se connecter avec Google pour laisser un avis",
        write: "Écrire un avis",
        signedInAs: "Connecté en tant que",
        signInFailed: "La connexion a échoué. Veuillez réessayer.",
        popupBlocked: "La fenêtre de connexion a été bloquée. Autorisez les pop-ups pour ce site.",
        authUnavailable: "La connexion avec Google n’est pas disponible sur ce site pour le moment. Réessayez plus tard.",
        networkError: "Pas de connexion. Vérifiez votre connexion Internet et réessayez.",
        showMore: "Afficher plus",
        anonymous: "Anonyme",
        errName: "Entrez un nom (min. 2 caractères).",
        errRating: "Choisissez une note entre 1 et 5.",
        errMessage: "Votre message doit faire au moins 10 caractères.",
        submitting: "Envoi…",
        submit: "Publier l’avis",
        thanks: "Merci ! Votre avis a été publié.",
        submitFailed: "Une erreur est survenue. Réessayez plus tard.",
        unavailable: "Les avis sont momentanément indisponibles. Réessayez plus tard.",
        empty: "Aucun avis pour le moment.",
        seeAll: (n) => n ? `Voir les ${n} avis` : "Voir tous les avis",
        countLabel: (n) => `${n} avis`
    },
    en: {
        signIn: "Sign in with Google to write a review",
        write: "Write a review",
        signedInAs: "Signed in as",
        signInFailed: "Sign-in failed. Please try again.",
        popupBlocked: "The sign-in window was blocked. Please allow pop-ups for this site.",
        authUnavailable: "Google sign-in is not available on this site right now. Please try again later.",
        networkError: "No connection. Please check your internet connection and try again.",
        showMore: "Show more",
        anonymous: "Anonymous",
        errName: "Enter a name (min. 2 characters).",
        errRating: "Choose a rating between 1 and 5.",
        errMessage: "Your message must be at least 10 characters.",
        submitting: "Submitting…",
        submit: "Submit review",
        thanks: "Thank you! Your review has been published.",
        submitFailed: "An error occurred. Please try again later.",
        unavailable: "Reviews are unavailable right now. Please try again later.",
        empty: "No reviews yet.",
        seeAll: (n) => n ? `See all ${n} reviews` : "See all reviews",
        countLabel: (n) => `${n} ${n === 1 ? "review" : "reviews"}`
    }
};

const REVIEW_LIMIT = 5;   // reviews shown initially (newest first)
const SEE_ALL_BATCH = 50; // the "all reviews" dialog fetches in batches of this size
const MAX_NAME = 25;
const MAX_MESSAGE = 800;

export function initReviews() {
    const section = document.getElementById("avis-clients");
    if (!section) return;

    const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
    const t = STRINGS[lang] || STRINGS.en;

    const $ = (id) => document.getElementById(id);
    const list = $("reviewsList");
    const emptyEl = $("reviewsEmpty");
    const statusEl = $("reviewsStatus");
    const writeBtn = $("writeReviewBtn");
    const seeAllBtn = $("seeAllBtn");
    const authBox = $("authStatus");
    const authName = $("authName");
    const signOutBtn = $("signOutBtn");
    const dialog = $("reviewDialog");
    const closeBtn = $("closeReviewDialog");
    const form = $("formAvis");
    const submitBtn = $("submitBtn");
    const feedback = $("formFeedback");
    const avgRatingEl = $("avgRating");
    const reviewsCountEl = $("reviewsCount");

    const isConfigured = Object.keys(firebaseConfig).length > 0;
    if (!isConfigured) {
        console.warn("Firebase is not configured; reviews are disabled.");
        writeBtn.disabled = true;
        return;
    }

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const col = collection(db, "reviews");
    // Documents without createdAt are excluded by Firestore when ordering on it.
    const byNewest = orderBy("createdAt", "desc");

    /* ---------- Rendering (textContent / DOM only) ---------- */
    const fmtDate = (ts) => {
        if (!ts) return "";
        const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString(lang, { year: "numeric", month: "long" });
    };

    const safePhotoUrl = (value) => {
        if (typeof value !== "string" || value.length > 2048) return null;
        try {
            const url = new URL(value);
            return url.protocol === "https:" ? url.href : null;
        } catch { return null; }
    };

    const makeInitialAvatar = (name) => {
        const el = document.createElement("span");
        el.className = "review__avatar review__avatar--initial";
        el.setAttribute("aria-hidden", "true");
        el.textContent = (Array.from(name.trim())[0] || "?").toUpperCase();
        return el;
    };

    // Avatar + name, stars · date, message. Shared by the list item and the detail dialog.
    const buildReviewParts = (docData) => {
        const name = String(docData.name || t.anonymous);
        const rating = Math.max(0, Math.min(5, Math.floor(Number(docData.rating) || 0)));

        const head = document.createElement("div");
        head.className = "review__head";
        const photo = safePhotoUrl(docData.photoURL);
        if (photo) {
            const img = document.createElement("img");
            img.className = "review__avatar";
            img.alt = "";
            img.loading = "lazy";
            img.referrerPolicy = "no-referrer";
            img.width = 48; img.height = 48;
            img.addEventListener("error", () => img.replaceWith(makeInitialAvatar(name)), { once: true });
            img.src = photo;
            head.append(img);
        } else {
            head.append(makeInitialAvatar(name));
        }
        const nameEl = document.createElement("div");
        nameEl.className = "review__name";
        nameEl.textContent = name;
        head.append(nameEl);

        const meta = document.createElement("div");
        meta.className = "review__meta";
        const stars = document.createElement("span");
        stars.className = "review__rating";
        stars.setAttribute("aria-label", `${rating}/5`);
        stars.textContent = "★".repeat(rating);
        meta.append(stars);
        const dateText = fmtDate(docData.createdAt);
        if (dateText) {
            const sep = document.createElement("span");
            sep.className = "review__sep"; sep.setAttribute("aria-hidden", "true"); sep.textContent = "·";
            const date = document.createElement("span");
            date.className = "review__date"; date.textContent = dateText;
            meta.append(sep, date);
        }

        const message = document.createElement("p");
        message.className = "review__msg";
        message.textContent = String(docData.message || "");

        return { head, meta, message };
    };

    const renderReview = (docData, id) => {
        const { head, meta, message } = buildReviewParts(docData);
        const li = document.createElement("li");
        li.className = "review";
        li.dataset.id = id;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "review__toggle";
        toggle.textContent = t.showMore;
        toggle.hidden = true;
        toggle.setAttribute("aria-haspopup", "dialog");
        toggle.addEventListener("click", () => openDetail(docData));

        li.append(head, meta, message, toggle);
        return li;
    };

    // Full review in a modal dialog (opened by "Show more").
    const detailDialog = $("reviewDetailDialog");
    const detailBody = $("reviewDetailBody");
    const openDetail = (docData) => {
        const { head, meta, message } = buildReviewParts(docData);
        message.classList.add("review__msg--full");
        detailBody.replaceChildren(head, meta, message);
        if (typeof detailDialog.showModal === "function") detailDialog.showModal();
        else detailDialog.setAttribute("open", "");
        $("closeReviewDetail").focus();
    };
    const closeDetail = () => { if (detailDialog.open) detailDialog.close(); detailDialog.removeAttribute("open"); };
    $("closeReviewDetail").addEventListener("click", closeDetail);
    detailDialog.addEventListener("click", (e) => { if (e.target === detailDialog) closeDetail(); });

    // Reveal "Show more" only for messages that overflow the 3-line clamp.
    const updateToggles = () => {
        list.querySelectorAll(".review").forEach((li) => {
            const msg = li.querySelector(".review__msg");
            li.querySelector(".review__toggle").hidden = msg.scrollHeight <= msg.clientHeight + 1;
        });
    };
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(updateToggles, 150); });

    const appendDocs = (docs) => {
        docs.forEach((d) => list.appendChild(renderReview(d.data(), d.id)));
        requestAnimationFrame(updateToggles);
    };

    /* ---------- Loading ---------- */
    let exactAverage = false;
    const loadedRatings = [];

    const showAverage = (avg) => { avgRatingEl.textContent = (Number(avg) || 0).toFixed(1); };

    async function loadSummary() {
        const listedQuery = query(col, byNewest);
        try {
            // Count + average over the whole collection: no composite index needed (an orderBy here would need one).
            // Fallback below if Firestore still rejects it; see docs/SECURITY.md.
            const snap = await getAggregateFromServer(col, { total: count(), avg: average("rating") });
            const { total, avg } = snap.data();
            exactAverage = true;
            showAverage(avg);
            return total || 0;
        } catch {
            // Without that index: count only, average over the reviews loaded so far (previous behaviour).
            const snap = await getAggregateFromServer(listedQuery, { total: count() });
            return snap.data().total || 0;
        }
    }

    const trackRatings = (docs) => {
        docs.forEach((d) => {
            const r = Math.max(0, Math.min(5, Number(d.data().rating) || 0));
            if (r) loadedRatings.push(r);
        });
        refreshFallbackAverage();
    };

    const refreshFallbackAverage = () => {
        if (exactAverage || !loadedRatings.length) return;
        showAverage(loadedRatings.reduce((a, b) => a + b, 0) / loadedRatings.length);
    };

    async function loadPage() {
        const snap = await getDocs(query(col, byNewest, limit(REVIEW_LIMIT)));
        appendDocs(snap.docs);
        trackRatings(snap.docs);
        return snap.docs.length;
    }

    async function loadInitial() {
        // List and summary load independently so one failure doesn't hide the other.
        const [totalResult, pageResult] = await Promise.allSettled([loadSummary(), loadPage()]);
        const loaded = pageResult.status === "fulfilled" ? pageResult.value : 0;
        const total = totalResult.status === "fulfilled" ? totalResult.value : null;
        reviewsCountEl.textContent = String(total ?? loaded);
        seeAllBtn.textContent = t.seeAll(total);
        allTitle.textContent = t.countLabel(total ?? loaded);
        // Unknown total: offer the button whenever the first page was full.
        seeAllBtn.hidden = total === null ? loaded < REVIEW_LIMIT : total <= loaded;
        refreshFallbackAverage();
        if (pageResult.status === "rejected") throw pageResult.reason;
        emptyEl.hidden = loaded > 0;
    }

    /* ---------- "All reviews" dialog: sort + search over every review ---------- */
    const allDialog = $("allReviewsDialog");
    const allList = $("allReviewsList");
    const allTitle = $("allReviewsTitle");
    const allLoading = $("allReviewsLoading");
    const allEmpty = $("allReviewsEmpty");
    const allStatus = $("allReviewsStatus");
    const sortSelect = $("allReviewsSort");
    const searchBtn = $("allReviewsSearchBtn");
    const searchWrap = $("allReviewsSearchWrap");
    const searchInput = $("allReviewsSearch");
    let allReviews = null; // cached [{ data, id }] newest first; cleared after a submission

    const millis = (ts) => {
        if (!ts) return 0;
        if (typeof ts.toMillis === "function") return ts.toMillis();
        return new Date(ts).getTime() || 0;
    };
    const ratingOf = (data) => Math.max(0, Math.min(5, Number(data.rating) || 0));

    async function fetchAllReviews() {
        const out = [];
        let cursor = null;
        for (;;) {
            const q = cursor
                ? query(col, byNewest, startAfter(cursor), limit(SEE_ALL_BATCH))
                : query(col, byNewest, limit(SEE_ALL_BATCH));
            const snap = await getDocs(q);
            snap.docs.forEach((d) => out.push({ data: d.data(), id: d.id }));
            if (snap.docs.length < SEE_ALL_BATCH) break;
            cursor = snap.docs[snap.docs.length - 1];
        }
        return out;
    }

    const renderAll = () => {
        if (!allReviews) return;
        const term = searchInput.value.trim().toLocaleLowerCase(lang);
        const mode = sortSelect.value;
        const items = allReviews
            .filter(({ data }) => !term ||
                `${data.name || ""} ${data.message || ""}`.toLocaleLowerCase(lang).includes(term))
            .sort((a, b) => {
                if (mode === "highest" && ratingOf(b.data) !== ratingOf(a.data)) return ratingOf(b.data) - ratingOf(a.data);
                if (mode === "lowest" && ratingOf(a.data) !== ratingOf(b.data)) return ratingOf(a.data) - ratingOf(b.data);
                return millis(b.data.createdAt) - millis(a.data.createdAt);
            });
        allList.replaceChildren(...items.map(({ data, id }) => {
            const { head, meta, message } = buildReviewParts(data);
            message.classList.add("review__msg--full");
            const li = document.createElement("li");
            li.className = "review review--full";
            li.dataset.id = id;
            li.append(head, meta, message);
            return li;
        }));
        allEmpty.hidden = items.length > 0;
    };

    async function openAllReviews() {
        allStatus.textContent = "";
        if (typeof allDialog.showModal === "function") allDialog.showModal();
        else allDialog.setAttribute("open", "");
        $("closeAllReviews").focus();
        if (allReviews) { renderAll(); return; }
        allLoading.hidden = false;
        allEmpty.hidden = true;
        allList.replaceChildren();
        try {
            allReviews = await fetchAllReviews();
            allTitle.textContent = t.countLabel(allReviews.length);
            if (!exactAverage && allReviews.length) {
                const ratings = allReviews.map(({ data }) => ratingOf(data)).filter(Boolean);
                if (ratings.length) showAverage(ratings.reduce((a, b) => a + b, 0) / ratings.length);
            }
            renderAll();
        } catch {
            allStatus.textContent = t.unavailable;
        } finally {
            allLoading.hidden = true;
        }
    }

    const closeAllReviews = () => { if (allDialog.open) allDialog.close(); allDialog.removeAttribute("open"); };
    seeAllBtn.addEventListener("click", openAllReviews);
    $("closeAllReviews").addEventListener("click", closeAllReviews);
    allDialog.addEventListener("click", (e) => { if (e.target === allDialog) closeAllReviews(); });
    sortSelect.addEventListener("change", renderAll);
    searchInput.addEventListener("input", renderAll);
    searchBtn.addEventListener("click", () => {
        const show = searchWrap.hidden;
        searchWrap.hidden = !show;
        searchBtn.setAttribute("aria-expanded", String(show));
        if (show) searchInput.focus();
        else if (searchInput.value) { searchInput.value = ""; renderAll(); }
    });

    /* ---------- Authentication ---------- */
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const nameInput = form.elements.namedItem("reviewName");

    onAuthStateChanged(auth, (user) => {
        writeBtn.textContent = user ? t.write : t.signIn;
        authBox.hidden = !user;
        authName.textContent = user ? `${t.signedInAs} ${user.displayName || user.email || ""}`.trim() : "";
        if (!user && dialog.open) dialog.close();
    });

    const openDialog = () => {
        const user = auth.currentUser;
        if (user && !nameInput.value && user.displayName) {
            nameInput.value = user.displayName.slice(0, MAX_NAME);
        }
        feedback.textContent = "";
        feedback.className = "form__feedback";
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
        nameInput.focus();
    };

    writeBtn.addEventListener("click", async () => {
        statusEl.textContent = "";
        if (auth.currentUser) { openDialog(); return; }
        writeBtn.disabled = true;
        try {
            await signInWithPopup(auth, provider);
            openDialog();
        } catch (err) {
            const code = (err && err.code) || "unknown";
            if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
            // Log only the Firebase error code (no user data) so site configuration problems are diagnosable.
            console.warn(`Google sign-in failed: ${code}`);
            statusEl.textContent = signInMessage(code);
        } finally {
            writeBtn.disabled = false;
        }
    });

    // Visitor-facing text per Firebase Auth error code. Configuration errors (domain not in
    // Firebase "Authorized domains", Google provider disabled, wrong API key) must be fixed in
    // the Firebase console by the site owner; see docs/SECURITY.md "Review sign-in".
    function signInMessage(code) {
        switch (code) {
            case "auth/popup-blocked": return t.popupBlocked;
            case "auth/network-request-failed": return t.networkError;
            case "auth/unauthorized-domain":
            case "auth/operation-not-allowed":
            case "auth/configuration-not-found":
            case "auth/invalid-api-key":
            case "auth/api-key-not-valid":
            case "auth/admin-restricted-operation":
                return t.authUnavailable;
            default: return t.signInFailed;
        }
    }

    signOutBtn.addEventListener("click", () => { signOut(auth).catch(() => {}); });

    const closeDialog = () => { if (dialog.open) dialog.close(); dialog.removeAttribute("open"); };
    closeBtn.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDialog(); });

    /* ---------- Submission ---------- */
    // Full Google account name, stored alongside the editable public `name` (owner decision 2026-11-21).
    const MAX_AUTHOR_NAME = 100;
    const authorNameOf = (user) => {
        const value = typeof user.displayName === "string" ? user.displayName.trim() : "";
        return value ? value.slice(0, MAX_AUTHOR_NAME) : null;
    };
    const showError = (field, msg) => {
        const el = form.querySelector(`.error[data-for="${field}"]`);
        if (el) el.textContent = msg || "";
    };
    const resetErrors = () => ["reviewName", "rating", "reviewMessage"].forEach((f) => showError(f, ""));
    const setLoading = (state) => {
        submitBtn.disabled = state;
        submitBtn.textContent = state ? t.submitting : t.submit;
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        resetErrors();

        const user = auth.currentUser;
        if (!user) { closeDialog(); writeBtn.click(); return; }

        const name = String(form.elements.namedItem("reviewName").value || "").trim();
        const rating = Number(form.querySelector('input[name="rating"]:checked')?.value);
        const message = String(form.elements.namedItem("reviewMessage").value || "").trim();

        let hasErr = false;
        if (name.length < 2) { showError("reviewName", t.errName); hasErr = true; }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) { showError("rating", t.errRating); hasErr = true; }
        if (message.length < 10) { showError("reviewMessage", t.errMessage); hasErr = true; }
        if (hasErr) return;

        setLoading(true);
        feedback.textContent = "";
        try {
            // The client never sets the legacy moderation field `autoriser`.
            await addDoc(col, {
                name: name.length > MAX_NAME ? name.slice(0, MAX_NAME) + "…" : name,
                rating,
                message: message.length > MAX_MESSAGE ? message.slice(0, MAX_MESSAGE) + "…" : message,
                createdAt: serverTimestamp(),
                uid: user.uid,
                authorName: authorNameOf(user),
                photoURL: safePhotoUrl(user.photoURL)
            });
            form.reset();
            feedback.className = "form__feedback is-success";
            feedback.textContent = t.thanks;
            reload();
        } catch {
            feedback.className = "form__feedback is-error";
            feedback.textContent = t.submitFailed;
        } finally {
            setLoading(false);
        }
    });

    function reload() {
        list.replaceChildren();
        allReviews = null;
        seeAllBtn.hidden = true;
        loadedRatings.length = 0;
        exactAverage = false;
        statusEl.textContent = "";
        loadInitial().catch(() => {
            emptyEl.hidden = true;
            statusEl.textContent = t.unavailable;
        });
    }

    loadInitial().catch(() => {
        emptyEl.hidden = true;
        statusEl.textContent = t.unavailable;
    });
}
