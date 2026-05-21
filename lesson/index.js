const params = new URLSearchParams(window.location.search);
const lessonId = Number(params.get("id"));

const frame = document.getElementById("lessonFrame");
const name = document.getElementById("lessonName");
const warning = document.getElementById("lessonWarning");
const warningText = document.getElementById("lessonWarningText");
const fullscreen = document.getElementById("fullscreen");

function getRecentlyPlayed() {
    let recentlyPlayed = localStorage.getItem("recentlyPlayed");
    if (!recentlyPlayed) {
        recentlyPlayed = {};
        localStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed));
    } else {
        recentlyPlayed = JSON.parse(recentlyPlayed);
    }
    return recentlyPlayed;
}

fetch("/lessons.json")
    .then((res) => res.json())
    .then((data) => {
        const lesson = data.lessons.find((l) => l.id === lessonId);
        if (!lesson) {
            frame.src = "about:blank";
            return;
        }

        const lessonGroup = lesson.lesson;
        if (lessonGroup === null && !lesson.path && !lesson.url) return;

        const targetSrc = lesson.path
            ? lesson.path + "/game.html"
            : (lesson.url
            ? `https://tctbbackend.up.railway.app/proxy/${lesson.url}`
            : `https://tctbbackend.up.railway.app/proxy/https://lesson126.github.io/lesson${lessonGroup}/lesson-${lessonId}/`);

        name.textContent = lesson.name;

        if (lesson.warning) {
            warningText.innerHTML = lesson.warning;
            warning.classList.remove("hidden");
        }

        const recentlyPlayed = getRecentlyPlayed();
        recentlyPlayed[lessonId] = Date.now();
        localStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed));

        frame.src = "about:blank";

        const onStorageReady = (e) => {
            if (e.data?.type !== "storageReady") return;
            window.removeEventListener("message", onStorageReady);
            clearTimeout(fallback);
            frame.src = targetSrc;
        };
        window.addEventListener("message", onStorageReady);

        const fallback = setTimeout(() => {
            window.removeEventListener("message", onStorageReady);
            frame.src = targetSrc;
        }, 300);
    });

fullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        frame.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

window.addEventListener("message", (e) => {
    if (e.data?.type !== "storage") return;
    const { id, method, args } = e.data;
    let value = null;

    if (method === "getItem") value = localStorage.getItem(args[0]);
    else if (method === "setItem") {
        localStorage.setItem(args[0], args[1]);
        value = null;
    } else if (method === "removeItem") {
        localStorage.removeItem(args[0]);
        value = null;
    } else if (method === "clear") {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(args[0]))
            .forEach((k) => localStorage.removeItem(k));
        value = null;
    } else if (method === "list") value = Object.keys(localStorage).filter((k) => k.startsWith(args[0]));
    else if (method === "length") value = Object.keys(localStorage).filter((k) => k.startsWith(args[0])).length;
    else if (method === "key") {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(args[0]));
        value = keys[args[1]] ?? null;
    }

    e.source.postMessage({ id, value }, "*");
});
