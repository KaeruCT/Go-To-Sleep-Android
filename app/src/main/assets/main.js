const gameScreen = {};
const STAR_ROOT = 10;
const MAX_SHEEP = 10;
const BAHS = ["bah1.mp3", "bah2.mp3", "bah3.mp3", "bah4.mp3", "bah5.mp3"];
const COLORS = [
    '#aff', '#faf', '#ffa',
    '#aaf', '#afa', '#faa',
];
let maxSheep;
let sheepCount;
let sleepiness;
let filterDuration;

const id = id => document.getElementById(id);

const settings = {};
function setSetting(key, val) {
    settings[key] = val;
    try {
        localStorage.setItem(key, val);
    } catch {}
}
function getSetting(key) {
    try {
        if (!settings[key]) {
            settings[key] = localStorage.getItem(key);
        }
    } catch {}
    return settings[key];
}

function setEffectsDisabled(enabled) {
    setSetting("effects", enabled ? "" : "disabled");
}

function effectsDisabled() {
    return getSetting("effects") !== "disabled";
}

function randomRange(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

function randomElement(list) {
    return list[Math.floor(Math.random()*list.length)];
}

function formatSeconds(time) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - (hours * 3600)) / 60);
    let seconds = time - (hours * 3600) - (minutes * 60);

    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    if (seconds < 10) seconds = `0${seconds}`;
    return `${hours}:${minutes}:${seconds}`;
}

function html(html) {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

let sounds = {};
function playSound(file) {
    const audio = sounds[file] || new Audio(file);
    if (!sounds[file]) sounds[file] = audio;
    audio.play();
}

let increasingSleepiness = false;
function increaseSleepiness () {
    if (increasingSleepiness) return;
    increasingSleepiness = true;

    const gameStyle = id('game').style;
    
    if (!effectsDisabled()) {
        const filters = [
            'blur(5px)',
            'grayscale(80%)',
            'hue-rotate(180deg)',
            'invert(100%) brightness(30%)',
            'brightness(40%)',
        ];
        
        gameStyle.transition = `filter ${filterDuration/2}ms linear`;
        gameStyle.filter = randomElement(filters);
    }
    setTimeout(() => {
        gameStyle.filter = '';
        filterDuration += 200;
        increasingSleepiness = false;
    }, filterDuration);

    maxSheep = Math.min(maxSheep, MAX_SHEEP);
}

let transitioningScreen = false;
let topScreenIndex = 1;
function showScreen(screenId, skipAnim) {
    gameScreen.currentScreen = screenId;
    function forAllOtherScreens (fn) {
        [].forEach.call(document.querySelectorAll('.screen'), el => {
            if (el.id === screenId) return;
            fn(el);
        });
    }

    if (transitioningScreen) return;
    transitioningScreen = true;

    if (screenId === 'game') initGame();

    const currentScreenStyle = id(screenId).style;
    currentScreenStyle.transition = 'none';
    currentScreenStyle.transform = 'translateX(-100%)';
    currentScreenStyle.zIndex = topScreenIndex++;
    currentScreenStyle.opacity = 1;
    currentScreenStyle.pointerEvents = 'all';
    forAllOtherScreens(s => s.style.pointerEvents = 'none');

    setTimeout(() => {
        if (!skipAnim) currentScreenStyle.transition = '';
        currentScreenStyle.transform = 'translateX(0)';
    }, 50);

    setTimeout(() => {
        forAllOtherScreens(s => s.style.opacity = 0);
        transitioningScreen = false;
    }, skipAnim ? 1 : 800);
}

function updateCount() {
    sheepCount++;
    id('count').innerText = sheepCount;
    if (sheepCount % 5 === 0) {
        increaseSleepiness();
    }
    if (sheepCount % 10 === 0) {
        setTimeout(() => addSheep(Math.random()), randomRange(1500, 4000));
    }
}

function addStar(x, y) {
    const starWidth = randomRange(gameScreen.width*0.03, gameScreen.width*0.2);
    const top = x * (gameScreen.height+starWidth/2) - starWidth/2;
    const left = y * (gameScreen.width+starWidth/2) - starWidth/2;
    const rotate = randomRange(0, 359);
    const starStyle = `transform: translate(${left}px, ${top}px) rotate(${rotate}deg); width: ${starWidth}px`;
    const star = html(`<img class="star" src="star.png" style="${starStyle}">`);
    id('game').appendChild(star);
}

function addSheep(x) {
    const sheepAlive = document.querySelectorAll('.thread-wrap').length;
    if (sheepAlive >= maxSheep) return;

    const height = gameScreen.height;
    const halfSheepHeight = 50;
    const threadHeight = gameScreen.height/2;
    const sheepX = `${gameScreen.width*x}px`; 
    const sheepHiddenY = `-${gameScreen.height*1.3}px`;
    const wrapStyle = `transform: translate(${sheepX}, ${sheepHiddenY})`;
    const threadStyle = `height: ${height}px; background: ${randomElement(COLORS)}`;
    const sheepWrapStyle = `transform: translateY(${(height - halfSheepHeight)}px)`;
    const sheep = `<div class="sheep-wrap" style="${sheepWrapStyle}"><img class="sheep" src="sheep.png"></div>`;
    const thread = `<div class="thread" style="${threadStyle}">${sheep}</div>`;
    const threadWrap = `<div class="thread-wrap" style="${wrapStyle}">${thread}</div>`;
    const threadedSheep = html(threadWrap);
    setTimeout(() => {
        const offset = 100 * Math.sin(Math.random()*10) - threadHeight;
        threadedSheep.style.transform = `translate(${sheepX}, ${offset}px)`;
    }, 500);
    id('game').appendChild(threadedSheep);

    let alive = true;
    const touchSheep =  () => {
        if (!alive) return;
        updateCount();
        threadedSheep.style.transform = `translate(${sheepX}, ${sheepHiddenY})`;
        threadedSheep.querySelector('img').style.animation = 'spin 1s linear infinite';
        playSound(randomElement(BAHS));
        alive = false;

        setTimeout(() => {
            threadedSheep.remove();
            addSheep(Math.random());
        }, 1000);
    };
    threadedSheep.addEventListener('touchstart', touchSheep);
    threadedSheep.addEventListener('mousedown', touchSheep);
}

let timerTimeout;
function startCounter() {
    if (timerTimeout) clearTimeout(timerTimeout);
    let counter = 0;
    function countTime() {
        id('time').innerText = formatSeconds(counter);
        counter += 1;
        timerTimeout = setTimeout(() => {
            countTime();
        }, 1000);
    }
    countTime();
}

function initStars() {
    [].forEach.call(document.querySelectorAll('.star'), el => el.parentElement.removeChild(el));
    for (let i = 0; i < STAR_ROOT; i++) {
        for (let j = 0; j < STAR_ROOT; j++) {
            if ((i + j) % 2 === 0) {
                addStar(i/STAR_ROOT, j/STAR_ROOT);
            }
        }
    }
}

function initGame() {
    maxSheep = 3;
    sleepiness = 0;
    sheepCount = 0;
    sleepiness = 0;
    filterDuration = 1000;
    id('count').innerText = 0;
    initStars();
    [].forEach.call(document.querySelectorAll('.thread-wrap'), el => el.parentElement.removeChild(el));
    for (let i = 0; i < maxSheep; i++) {
        addSheep(i/(maxSheep-1));
    }
    startCounter();
}

function explode(el, x, y) {
    const clone = el.cloneNode();
    el.parentElement.append(clone);
    clone.classList.add('explosion');
    clone.style.position = 'absolute';
    clone.style.left = `${x - clone.width / 2}px`;
    clone.style.top = `${y - clone.height / 2}px`;
    clone.style.transform = `scale(5) rotate(${randomRange(180, -180)}deg)`;
    clone.style.opacity = 0;
    setTimeout(() => {
        clone.parentElement.removeChild(clone);
    }, 300);
}

function init() {
    function resize () {
        const e = document.documentElement;
        const b = document.getElementsByTagName('body')[0];
        gameScreen.width = window.innerWidth || e.clientWidth || b.clientWidth;
        gameScreen.height = window.innerHeight || e.clientHeight || b.clientHeight;
        if (gameScreen.currentScreen === 'game') {
            initStars();
        }
    }
    resize();
    window.addEventListener('resize', resize);

    try {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(() => {
                // ignore error
            });
        } else {
            screen.lockOrientationUniversal = screen.lockOrientation || screen.mozLockOrientation || screen .msLockOrientation;
            screen.lockOrientationUniversal('portrait-primary');
        }
    } catch (err) {
        console.error(err);
    }

    [].forEach.call(document.querySelectorAll('[data-screen]'), el => el.addEventListener('click', e => {
        e.preventDefault();
        showScreen(el.dataset.screen);
    }));

    // handle effect setting
    id('effects').checked = effectsDisabled();
    id('effects').addEventListener('change', (e) => {
        setEffectsDisabled(e.target.checked);
        e.preventDefault();
    });

    // easter-egg
    let tapCount = 0;
    let tapTimeout;
    [].forEach.call(document.querySelectorAll('.logo img'), (el) => {
        el.addEventListener('click', function (e) {
            tapCount += 1;
            if (tapCount > 20) {
                tapCount = 0;
                showScreen('easter-egg');
            } else {
                if (tapTimeout) clearTimeout(tapTimeout);
                tapTimeout = setTimeout(() => tapCount = 0, 400);
                explode(el, e.clientX, e.clientY);
            }
        });
    });

    [].forEach.call(document.querySelectorAll('.play-sound'), (el, i) => {
            el.addEventListener('click', function (e) {
                explode(el, e.clientX, e.clientY);
                playSound(BAHS[i % BAHS.length]);
            });
            el.style.filter = `opacity(0.6) saturate(500%) drop-shadow(-1px -1px 5px ${COLORS[i % COLORS.length]})`;
        });

    showScreen('start', true);
}
init();