window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const objectiveText = document.getElementById('objective');

// --- VISUAL EFFECTS LAYER ---
const vfxFlash = document.createElement('div');
Object.assign(vfxFlash.style, {
  position: 'fixed',
  inset: '0',
  pointerEvents: 'none',
  opacity: '0',
  transition: 'opacity 240ms ease-out',
  zIndex: '45'
});
document.body.appendChild(vfxFlash);

const vfxPopup = document.createElement('div');
vfxPopup.className = 'hidden';
Object.assign(vfxPopup.style, {
  position: 'fixed',
  pointerEvents: 'none',
  fontWeight: '700',
  fontSize: '15px',
  color: '#fff6d1',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)',
  transition: 'transform 650ms ease-out, opacity 650ms ease-out',
  zIndex: '50'
});
document.body.appendChild(vfxPopup);

function triggerFlash(color = 'rgba(255, 224, 130, 0.24)') {
  vfxFlash.style.background = color;
  vfxFlash.style.opacity = '1';
  setTimeout(() => {
    vfxFlash.style.opacity = '0';
  }, 90);
}

function triggerPopup(text, x, y) {
  vfxPopup.textContent = text;
  vfxPopup.style.left = x + 'px';
  vfxPopup.style.top = y + 'px';
  vfxPopup.style.opacity = '1';
  vfxPopup.style.transform = 'translateY(0px)';
  vfxPopup.classList.remove('hidden');

  requestAnimationFrame(() => {
    vfxPopup.style.transform = 'translateY(-28px)';
    vfxPopup.style.opacity = '0';
  });

  setTimeout(() => {
    vfxPopup.classList.add('hidden');
  }, 680);
}

// --- BUILD UI & EMOTE ELEMENTS ---
let sceneVignette = document.createElement('div');
sceneVignette.id = 'scene-vignette';
document.body.appendChild(sceneVignette);

let locationBanner = document.createElement('div');
locationBanner.id = 'location-banner';
locationBanner.textContent = "📍 Town Square — Alleys";
document.body.appendChild(locationBanner);

let thoughtBox = document.createElement('div');
thoughtBox.id = 'thought-box';
thoughtBox.className = 'subtle-thought hidden';
document.body.appendChild(thoughtBox);

let dialogueBox = document.createElement('div');
dialogueBox.id = 'dialogue-box';
dialogueBox.classList.add('hidden');
dialogueBox.innerHTML = `
  <div id="speaker-name">Knight</div>
  <p id="dialogue-text"></p>
  <button id="prev-arrow" class="nav-arrow" title="Previous Line">◀</button>
  <button id="next-arrow" class="nav-arrow" title="Next Line">▶</button>
`;
document.body.appendChild(dialogueBox);

let speakerNameEl = document.getElementById('speaker-name');
let dialogueTextEl = document.getElementById('dialogue-text');
let prevArrow = document.getElementById('prev-arrow');
let nextArrow = document.getElementById('next-arrow');

let choiceContainer = document.createElement('div');
choiceContainer.id = 'choice-container';
choiceContainer.classList.add('hidden');
document.body.appendChild(choiceContainer);

let blacksmith = document.createElement('div');
blacksmith.id = 'blacksmith';
blacksmith.className = 'blacksmith';
document.body.appendChild(blacksmith);

let knightEmote = document.createElement('div');
knightEmote.className = 'emote-bubble hidden';
document.body.appendChild(knightEmote);

let princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

let kX = 200;
let kY = 400;
let pX = 500;
let pY = 400;

const speed = 6;
let currentScene = 1;
let hasRing = false;
let inDialogue = false;
let dialogueIndex = 0;

const keys = {};

window.addEventListener('keydown', (e) => {
  if (window.GameAudio) GameAudio.unlock();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let kMoving = false;

  if (!inDialogue) {
    if (keys['w']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s']) {
      kY += speed;
      kMoving = true;
    }

    if (kY < 300) kY = 300;
    if (kY > window.innerHeight - 120) kY = window.innerHeight - 120;

    if (keys['a']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    }
    if (keys['d']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
      knight.classList.add('facing-right');
    }

    if (window.GameAudio) {
      GameAudio.updateStrideFootsteps(kMoving);
    }

    if (currentScene === 1) {
      if (!hasRing && kX >= window.innerWidth - 200) {
        hasRing = true;
        if (window.GameAudio) GameAudio.playItemPickup();
        triggerFlash('rgba(255, 224, 130, 0.25)');
        triggerPopup("✨ King's Ring Obtained! ✨", kX + 25, kY - 45);
        if (objectiveText) {
          objectiveText.textContent = "Objective: Got the item from the smith! Walk left across town to the fountain gates.";
        }
      }

      if (hasRing && kX <= 10) {
        currentScene = 2;
        if (window.GameAudio) GameAudio.playPageTurn();
        triggerFlash('rgba(130, 175, 255, 0.22)');
        triggerPopup("🌙 Moonlit Fountain 🌙", window.innerWidth - 220, 320);

        if (blacksmith) {
          blacksmith.classList.add('hidden');
        }

        if (gameBody) {
          gameBody.style.backgroundImage = "url('DangerFOUNTAIN.png')";
        }
        sceneVignette.classList.add('fountain-atmosphere');
        locationBanner.textContent = "📍 Outer Gates — Moonlit Fountain";

        pX = 220;
        pY = 400;
        if (princess) {
          princess.classList.remove('hidden');
          princess.classList.remove('facing-left');
          princess.classList.add('facing-right');
          princess.style.left = pX + 'px';
          princess.style.top = pY + 'px';
        }
        kX = window.innerWidth - 150;
        kY = 400;
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');

        if (objectiveText) {
          objectiveText.textContent = "Objective: Approach the Princess by the fountain.";
        }
      }
    } else if (currentScene === 2) {
      const distance = Math.abs(kX - pX);
      if (kX <= pX && distance <= 90) {
        kX = pX - 70;
        kY = pY;
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
        startEncounter();
      }
    }
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';
    knight.classList.toggle('running', kMoving);
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
  }

  knightEmote.style.left = (kX + 35) + 'px';
  knightEmote.style.top = (kY - 35) + 'px';

  princessEmote.style.left = (pX + 25) + 'px';
  princessEmote.style.top = (pY - 35) + 'px';

  requestAnimationFrame(gameLoop);
}

function triggerEmote(element, symbol) {
  element.textContent = symbol;
  element.classList.remove('hidden');
  void element.offsetWidth;
  setTimeout(() => {
    element.classList.add('hidden');
  }, 1800);
}

function startEncounter() {
  inDialogue = true;
  knight.classList.remove('running');
  if (window.GameAudio) GameAudio.playAlert();
  triggerFlash('rgba(255, 180, 210, 0.22)');
  triggerPopup("❗ Unexpected Encounter ❗", pX + 10, pY - 50);
  if (objectiveText) {
    objectiveText.textContent = "Event: Unexpected Encounter by the Fountain";
  }

  dialogueIndex = 0;
  showDialogueStep();
}

function showDialogueStep() {
  thoughtBox.classList.add('hidden');
  dialogueBox.classList.remove('hidden');

  if (dialogueIndex === 0) {
    speakerNameEl.className = '';
    speakerNameEl.textContent = "Knight";
    dialogueTextEl.textContent = "“Your Highness?! What are you doing out here by the outer gates?!”";
    thoughtBox.textContent = "...Royalty shouldn't be outside the palace. It's dangerous—they could easily be waylaid or robbed.";
    thoughtBox.classList.remove('hidden');
    triggerEmote(knightEmote, "❓");
  } else if (dialogueIndex === 1) {
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“Keep your voice down, you fool! I didn't slip past the guards just to have the town watch alerted by my own personal knight.”";
    triggerEmote(princessEmote, "💢");
  } else if (dialogueIndex === 2) {
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“I need to get to the old gate road, and I cannot do it alone. Will you assist me, or must I find someone less... cowardly?”";
    triggerEmote(princessEmote, "✨");
    triggerEmote(knightEmote, "💧");

    presentChoices();
  }
}

nextArrow.onclick = () => {
  if (dialogueIndex < 2) {
    if (window.GameAudio) GameAudio.playUiTick();
    dialogueIndex++;
    showDialogueStep();
  }
};

prevArrow.onclick = () => {
  if (dialogueIndex > 0) {
    if (window.GameAudio) GameAudio.playUiTick();
    dialogueIndex--;
    choiceContainer.classList.add('hidden');
    showDialogueStep();
  }
};

function presentChoices() {
  nextArrow.style.display = 'none';
  prevArrow.style.display = 'none';
  choiceContainer.innerHTML = '';
  choiceContainer.classList.remove('hidden');

  const options = [
    { text: "1. 'I am not cowardly! I am professionally concerned for your safety!'", responseType: 1 },
    { text: "2. (Stammering) 'I—uh... that is to say... protocol dictates—'", responseType: 2 },
    { text: "3. 'If the King finds out, he will have my head on a spike!'", responseType: 3 }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (window.GameAudio) GameAudio.playChoiceChime();
      triggerFlash('rgba(255, 235, 175, 0.18)');
      choiceContainer.classList.add('hidden');
      nextArrow.style.display = 'flex';
      prevArrow.style.display = 'flex';
      resolveChoice(opt.responseType);
    };
    choiceContainer.appendChild(btn);
  });
}

function resolveChoice(type) {
  thoughtBox.classList.remove('hidden');
  speakerNameEl.className = '';
  speakerNameEl.textContent = "Knight";

  if (type === 1) {
    dialogueTextEl.textContent = "“I am not cowardly! I am professionally concerned for your safety!”";
    thoughtBox.textContent = "(Internal) For a year I've admired her from afar... I never imagined she was this boldly teasing up close.";
    triggerEmote(knightEmote, "😳");
  } else if (type === 2) {
    dialogueTextEl.textContent = "“I—uh... that is to say... protocol dictates—oh, by the gods.”";
    thoughtBox.textContent = "(Internal) She's actually flirting with me. My entire nervous system is short-circuiting.";
    triggerEmote(knightEmote, "⚡");
  } else if (type === 3) {
    dialogueTextEl.textContent = "“If the King finds out, he will have my head on a spike!”";
    thoughtBox.textContent = "(Internal) She's glaring at me now... but gods, even when she's furious, she's breathtaking.";
    triggerEmote(knightEmote, "💓");
  }

  setTimeout(() => {
    thoughtBox.classList.add('hidden');
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";

    if (type === 1) {
      dialogueTextEl.textContent = "“Professional concern? Is that what you call shaking in your greaves? Get moving toward the Old Gate Road.”";
    } else if (type === 2) {
      dialogueTextEl.textContent = "“Protocol doesn't look very steady on its feet right now. Lead the way to the Old Gate Road.”";
    } else {
      dialogueTextEl.textContent = "“Then let's pray he doesn't find out. To the Old Gate Road, Knight.”";
    }
    triggerEmote(princessEmote, "✨");

    setTimeout(() => {
      dialogueBox.classList.add('hidden');
      inDialogue = false;
      if (objectiveText) {
        objectiveText.textContent = "Objective: Walk with the Princess toward the Old Gate Road on the left.";
      }
      transitionToNextChapter('chapter2.html');
    }, 4500);
  }, 4000);
}

gameLoop();

function transitionToNextChapter(nextChapterFilename) {
  if (window.GameAudio) GameAudio.playPageTurn();
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');

  setTimeout(() => {
    window.location.href = nextChapterFilename;
  }, 1000);
}
