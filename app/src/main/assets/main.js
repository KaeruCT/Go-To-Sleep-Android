const gameScreen = {};
const starRoot = 10;
let maxSheep = 3;
let sheepCount = 0;

const id = id => document.getElementById(id);

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

function playSound(file) {
    const audio = new Audio(file);
    audio.play();
}

let sleepiness = 0;
let filterDuration = 1000;
let increasingSleepiness = false;
function increaseSleepiness () {
    if (increasingSleepiness) return;
    increasingSleepiness = true;
    const filters = [
        'blur(5px)',
        'grayscale(80%)',
        'hue-rotate(180deg)',
        'invert(100%) brightness(30%)',
        'brightness(40%)',
    ];
    const gameStyle = id('game').style;
    gameStyle.transition = `filter ${filterDuration/2}ms linear`;

    gameStyle.filter = randomElement(filters);
    setTimeout(() => {
        gameStyle.filter = '';
        filterDuration += 200;
        increasingSleepiness = false;
    }, filterDuration);
}

let transitioningScreen = false;
let topScreenIndex = 1;
function showScreen(screenId, skipAnim) {
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
}

function threadBg() {
    const colors = [
        '#aff', '#faf', '#ffa',
        '#aaf', '#afa', '#faa',
    ];
    return randomElement(colors);
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
    const height = gameScreen.height;
    const halfSheepHeight = 50;
    const threadHeight = gameScreen.height/2;
    const sheepX = `${gameScreen.width*x}px`; 
    const sheepHiddenY = `-${gameScreen.height*1.3}px`;
    const wrapStyle = `transform: translate(${sheepX}, ${sheepHiddenY})`;
    const threadStyle = `height: ${height}px; background: ${threadBg()}`;
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
        playSound('bah.mp3');
        alive = false;

        setTimeout(() => {
            threadedSheep.remove();
            addSheep(Math.random());
        }, 1000);
    };
    threadedSheep.addEventListener('touchstart', touchSheep);
    threadedSheep.addEventListener('mousedown', touchSheep);
}

function startCounter() {
    let counter = 0;
    function countTime() {
        id('time').innerText = formatSeconds(counter);
        counter += 1;
        setTimeout(() => {
            countTime();
        }, 1000);
    }
    countTime();
}

function initGame() {
    for (let i = 0; i < starRoot; i++) {
        for (let j = 0; j < starRoot; j++) {
            if ((i + j) % 2 === 0) {
                addStar(i/starRoot, j/starRoot);
            }
        }
    }
    for (let i = 0; i < maxSheep; i++) {
        addSheep(i/(maxSheep-1));
    }
    startCounter();
}

function init() {
    function resize () {
        const e = document.documentElement;
        const b = document.getElementsByTagName('body')[0];
        gameScreen.width = window.innerWidth || e.clientWidth || b.clientWidth;
        gameScreen.height = window.innerHeight || e.clientHeight || b.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    try {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait');
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

    showScreen('start', true);
}

init();