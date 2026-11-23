
function removeFadeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', removeFadeOverlay);
setTimeout(removeFadeOverlay, 60);

// Optional carryover from Chapter 3 Scene 2
let ch4Carryover = {};
try {
  const raw = sessionStorage.getItem('ch4_carryover');
  if (raw) ch4Carryover = JSON.parse(raw) || {};
} catch (e) {}

const gameBody = document.getElementById('game-body');
const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const knightEmote = document.getElementById('knight-emotion');
const princessEmote = document.getElementById('princess-emotion');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const flowersLayer = document.getElementById('flowers-layer');
const interactionPrompt = document.getElementById('interaction-prompt');

const bouquetHud = document.getElementById('bouquet-hud');
const bouquetTitle = document.getElementById('bouquet-title');
const bouquetVisual = document.getElementById('bouquet-visual');
const bouquetFlowersList = document.getElementById('bouquet-flowers-list');

const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
const dialogueChoices = document.getElementById('dialogue-choices');
const dialogueHint = document.getElementById('dialogue-hint');

// Lower-right < and > buttons inside dialogue-box
const navControls = document.createElement('div');
navControls.className = 'nav-controls';
const prevArrow = document.createElement('button');
prevArrow.type = 'button';
prevArrow.className = 'nav-arrow';
prevArrow.title = 'Previous Line';
prevArrow.textContent = '<';
const nextArrow = document.createElement('button');
nextArrow.type = 'button';
nextArrow.className = 'nav-arrow';
nextArrow.title = 'Next Line';
nextArrow.textContent = '>';
navControls.appendChild(prevArrow);
navControls.appendChild(nextArrow);
if (dialogueBox) dialogueBox.appendChild(navControls);

// Map areas:
// 'flower_quest' (FlowerQuest.png) -> left leads to 'princess_tree' (PrincessTree.png, locked until bouquet full)
//                                  -> right leads to 'looking_flower_1' (LookingFlower1.png)
// 'looking_flower_1' (LookingFlower1.png) -> left leads to 'looking_flower_2' (LookingFlower2.png)
//                                       -> right returns to 'flower_quest'
// 'looking_flower_2' (LookingFlower2.png) -> right returns to 'looking_flower_1'
// 'princess_tree' (PrincessTree.png) -> Princess waits by the tree facing right for the Knight
let currentArea = 'flower_quest';

// Controlled Knight state (starts standing on grass in the middle of FlowerQuest.png)
let kX = Math.round(window.innerWidth * 0.5) - 60;
let kY = 560;
const speed = 6;
let inDialogue = false;
let dateMetStarted = false;

// Princess state in PrincessTree.png (waiting by the tree facing right)
let pX = Math.round(window.innerWidth * 0.24);
let pY = 560;
let princessActive = false;

// Flowers Princess loves (hibiscus, roses, tulips, azalea, etc.)
const BOUQUET_GOAL = 5;
const FLOWER_TYPES = [
  { name: 'Hibiscus', icon: '🌺' },
  { name: 'Rose', icon: '🌹' },
  { name: 'Tulip', icon: '🌷' },
  { name: 'Azalea', icon: '🌸' },
  { name: 'Blossom', icon: '🌼' }
];

let collectedFlowers = [];
let activeFlowers = []; // { id, area, type, x, y, el }
let flowerIdCounter = 1;

function isBouquetComplete() {
  return collectedFlowers.length >= BOUQUET_GOAL;
}

// --- OVERHEAD EMOTES ---
let knightEmoteTimer = null;
let princessEmoteTimer = null;

function positionEmotesNow() {
  if (knight && knightEmote) {
    const clampedKX = Math.max(30, Math.min(window.innerWidth - 30, kX + 60));
    knightEmote.style.left = clampedKX + 'px';
    knightEmote.style.top = (kY - 165) + 'px';
  }
  if (princess && princessEmote) {
    const clampedPX = Math.max(30, Math.min(window.innerWidth - 30, pX + 48));
    princessEmote.style.left = clampedPX + 'px';
    princessEmote.style.top = (pY - 125) + 'px';
  }
}

function triggerEmote(target, symbol, extraDurationMs = 0) {
  const el = target === 'knight' ? knightEmote : princessEmote;
  if (!el) return;

  if (!symbol) {
    el.classList.add('hidden');
    return;
  }

  const totalMs = 1800 + extraDurationMs;
  const animName = extraDurationMs > 0 ? 'emote-pulse-fade-lingering' : 'emote-pulse-fade';

  positionEmotesNow();
  el.textContent = symbol;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `${animName} ${totalMs}ms ease-out forwards`;

  if (target === 'knight') {
    clearTimeout(knightEmoteTimer);
    knightEmoteTimer = setTimeout(() => el.classList.add('hidden'), totalMs);
  } else {
    clearTimeout(princessEmoteTimer);
    princessEmoteTimer = setTimeout(() => el.classList.add('hidden'), totalMs);
  }
}

// --- BOUQUET UI & RANDOM FLOWER SPAWNING ---
function updateBouquetUI() {
  const count = collectedFlowers.length;
  const done = isBouquetComplete();

  if (bouquetTitle) {
    bouquetTitle.textContent = done
      ? `Full Bouquet (${count}/${BOUQUET_GOAL})!`
      : `Bouquet: ${count} / ${BOUQUET_GOAL}`;
  }

  if (bouquetVisual) {
    if (count === 0) {
      bouquetVisual.textContent = '🎀';
    } else if (done) {
      bouquetVisual.textContent = `💐 ${collectedFlowers.map((f) => f.icon).join('')}`;
    } else {
      bouquetVisual.textContent = collectedFlowers.map((f) => f.icon).join('');
    }
  }

  if (bouquetFlowersList) {
    bouquetFlowersList.innerHTML = '';
    collectedFlowers.forEach((f) => {
      const chip = document.createElement('span');
      chip.className = 'collected-chip';
      chip.textContent = `${f.icon} ${f.name}`;
      bouquetFlowersList.appendChild(chip);
    });
  }

  if (bouquetHud) {
    bouquetHud.classList.toggle('completed', done);
  }

  if (objectiveText && !dateMetStarted) {
    if (done) {
      objectiveText.textContent =
        'Objective: Bouquet complete! Head left to the Princess waiting by the tree.';
    } else {
      objectiveText.textContent = `Objective: Find a gift for your date — collect flowers she loves (${count}/${BOUQUET_GOAL}).`;
    }
  }
}

function randomWalkY() {
  const minY = 475;
  const maxY = Math.min(window.innerHeight - 65, 625);
  return Math.round(minY + Math.random() * (maxY - minY));
}

function randomWalkX() {
  const minX = Math.round(window.innerWidth * 0.16);
  const maxX = Math.round(window.innerWidth * 0.84);
  return Math.round(minX + Math.random() * (maxX - minX));
}

function pickFlowerTypeForBouquet() {
  const needed = FLOWER_TYPES.filter(
    (ft) => !collectedFlowers.some((cf) => cf.name === ft.name)
  );
  const pool = needed.length > 0 ? needed : FLOWER_TYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnFlowerInArea(area, customX = null, customY = null) {
  if (!flowersLayer || isBouquetComplete()) return null;

  const existingInArea = activeFlowers.filter((f) => f.area === area).length;
  if (existingInArea >= 2) return null;

  const type = pickFlowerTypeForBouquet();
  const fx = typeof customX === 'number' ? customX : randomWalkX();
  const fy = typeof customY === 'number' ? customY : randomWalkY();

  const el = document.createElement('div');
  el.className = 'ground-flower';
  el.style.left = fx + 'px';
  el.style.top = fy + 'px';
  el.style.display = area === currentArea ? 'flex' : 'none';
  el.innerHTML = `
    <span class="flower-icon">${type.icon}</span>
    <span class="flower-tag">${type.name}</span>
  `;

  flowersLayer.appendChild(el);

  const flowerObj = {
    id: flowerIdCounter++,
    area,
    type,
    x: fx,
    y: fy,
    el
  };
  activeFlowers.push(flowerObj);
  return flowerObj;
}

function syncFlowersVisibility() {
  activeFlowers.forEach((f) => {
    if (!f.el) return;
    f.el.style.display = f.area === currentArea && !isBouquetComplete() ? 'flex' : 'none';
  });

  if (!isBouquetComplete() && currentArea !== 'princess_tree') {
    const inCurrent = activeFlowers.filter((f) => f.area === currentArea).length;
    if (inCurrent < 2) {
      spawnFlowerInArea(currentArea);
    }
  }
}

function clearRemainingFlowers() {
  activeFlowers.forEach((f) => {
    if (f.el && f.el.parentNode) f.el.parentNode.removeChild(f.el);
  });
  activeFlowers = [];
}

function getNearbyFlower() {
  if (isBouquetComplete() || currentArea === 'princess_tree') return null;
  let closest = null;
  let bestDist = 115;

  activeFlowers.forEach((f) => {
    if (f.area !== currentArea) return;
    const dist = Math.hypot(kX + 60 - f.x, kY + 20 - f.y);
    if (dist < bestDist) {
      bestDist = dist;
      closest = f;
    }
  });

  return closest;
}

function collectFlower(flower) {
  if (!flower || isBouquetComplete()) return;

  const idx = activeFlowers.findIndex((f) => f.id === flower.id);
  if (idx !== -1) {
    activeFlowers.splice(idx, 1);
  }
  if (flower.el && flower.el.parentNode) {
    flower.el.parentNode.removeChild(flower.el);
  }

  collectedFlowers.push(flower.type);
  updateBouquetUI();
  triggerEmote('knight', flower.type.icon);

  if (isBouquetComplete()) {
    clearRemainingFlowers();
    startDialogue([
      {
        speaker: 'Knight',
        text: `“${flower.type.name} to finish the arrangement... hibiscus, roses, tulips, azalea—a proper bouquet for her.”`,
        knightEmote: '💐'
      },
      {
        speaker: 'Knight',
        text: '“She is waiting by the tree to the left. Let us go to her at last.”',
        knightEmote: '✨'
      }
    ]);
  } else {
    spawnFlowerInArea(currentArea);
    startDialogue([
      {
        speaker: 'Knight',
        text: `“Picked a ${flower.type.name}. I will tuck it into the bouquet (${collectedFlowers.length}/${BOUQUET_GOAL}).”`,
        knightEmote: flower.type.icon
      }
    ]);
  }
}

// --- AREA SWITCHING ---
function setArea(nextArea, nextX, nextY) {
  currentArea = nextArea;
  if (typeof nextX === 'number') kX = nextX;
  if (typeof nextY === 'number') kY = nextY;

  if (currentArea === 'flower_quest') {
    if (gameBody) gameBody.style.backgroundImage = "url('FlowerQuest.png')";
    if (locationBanner) locationBanner.textContent = '📍 Meadow Clearing';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
  } else if (currentArea === 'looking_flower_1') {
    if (gameBody) gameBody.style.backgroundImage = "url('LookingFlower1.png')";
    if (locationBanner) locationBanner.textContent = '📍 Woodland Path';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
  } else if (currentArea === 'looking_flower_2') {
    if (gameBody) gameBody.style.backgroundImage = "url('LookingFlower2.png')";
    if (locationBanner) locationBanner.textContent = '📍 Sunlit Grove';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
  } else if (currentArea === 'princess_tree') {
    if (gameBody) gameBody.style.backgroundImage = "url('PrincessTree.png')";
    if (locationBanner) locationBanner.textContent = '📍 By the Great Tree';

    // Princess waits right by the tree facing right so she faces the Knight as he enters
    princessActive = true;
    pX = Math.max(180, Math.round(window.innerWidth * 0.22));
    pY = 560;
    if (princess) {
      princess.style.left = pX + 'px';
      princess.style.top = pY + 'px';
      princess.classList.remove('hidden');
      princess.classList.add('facing-right');
      princess.classList.remove('facing-left');
      princess.classList.remove('running');
    }
  }

  syncFlowersVisibility();
}

// --- CHAT DIALOGUE ENGINE ---
let currentNodes = [];
let nodeIndex = 0;
let waitingForChoice = false;
let onDialogueFinish = null;

function startDialogue(nodes, onFinish = null) {
  inDialogue = true;
  currentNodes = nodes;
  nodeIndex = 0;
  onDialogueFinish = onFinish;
  if (interactionPrompt) interactionPrompt.classList.add('hidden');
  renderNode();
}

function renderNode() {
  const node = currentNodes[nodeIndex];
  if (!node) {
    closeDialogue();
    return;
  }

  dialogueBox.classList.remove('hidden');

  const speakerLower = (node.speaker || '').toLowerCase();
  const isPrincess = speakerLower.includes('princess');
  dialogueSpeaker.className = 'dialogue-speaker';
  if (isPrincess) {
    dialogueSpeaker.classList.add('princess-speak');
    dialogueSpeaker.textContent = 'Princess';
  } else {
    dialogueSpeaker.textContent = 'Knight';
  }

  dialogueText.textContent = node.text;

  if (node.knightEmote !== undefined) {
    triggerEmote('knight', node.knightEmote, node.knightEmoteDuration || 0);
  }
  if (node.princessEmote !== undefined) {
    triggerEmote('princess', node.princessEmote, node.princessEmoteDuration || 0);
  }

  if (princessActive && princess) {
    princess.classList.add('facing-right');
    princess.classList.remove('facing-left');
    if (pX < kX) {
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    } else {
      knight.classList.add('facing-right');
      knight.classList.remove('facing-left');
    }
  }

  dialogueChoices.innerHTML = '';

  if (node.choices && node.choices.length > 0) {
    waitingForChoice = true;
    dialogueChoices.classList.remove('hidden');
    navControls.style.display = 'none';
    dialogueHint.textContent = 'Choose a response (click or press [1] / [2] / [3])';

    node.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.textContent = choice.label;
      btn.addEventListener('click', () => selectChoice(choice));
      dialogueChoices.appendChild(btn);
    });
  } else {
    waitingForChoice = false;
    dialogueChoices.classList.add('hidden');
    navControls.style.display = 'flex';
    prevArrow.disabled = nodeIndex === 0;
    dialogueHint.textContent = 'Press [E] / [Space] or > to continue';
  }
}

function selectChoice(choice) {
  if (!waitingForChoice) return;
  waitingForChoice = false;
  dialogueChoices.classList.add('hidden');

  if (choice.knightEmote !== undefined) {
    triggerEmote('knight', choice.knightEmote, choice.knightEmoteDuration || 0);
  }
  if (choice.princessEmote !== undefined) {
    triggerEmote('princess', choice.princessEmote, choice.princessEmoteDuration || 0);
  }

  if (choice.followUp && choice.followUp.length > 0) {
    currentNodes.splice(nodeIndex + 1, 0, ...choice.followUp);
  }
  nodeIndex++;
  renderNode();
}

function advanceDialogue() {
  if (!inDialogue || waitingForChoice) return;
  nodeIndex++;
  if (nodeIndex >= currentNodes.length) {
    closeDialogue();
  } else {
    renderNode();
  }
}

function rewindDialogue() {
  if (!inDialogue || waitingForChoice || nodeIndex <= 0) return;
  nodeIndex--;
  renderNode();
}

prevArrow.addEventListener('click', rewindDialogue);
nextArrow.addEventListener('click', advanceDialogue);

function closeDialogue() {
  dialogueBox.classList.add('hidden');
  dialogueChoices.innerHTML = '';
  dialogueChoices.classList.add('hidden');
  inDialogue = false;
  waitingForChoice = false;

  const cb = onDialogueFinish;
  onDialogueFinish = null;
  if (typeof cb === 'function') cb();
}

function blockPrincessTreeEntry() {
  kX = 75;
  knight.classList.remove('facing-left');
  knight.classList.add('facing-right');
  triggerEmote('knight', '💐');

  startDialogue([
    {
      speaker: 'Knight',
      text: '“I cannot walk up to her empty-handed. I should gather a full bouquet of flowers she loves—hibiscus, roses, tulips, azalea—before going to her.”',
      knightEmote: '🌷'
    }
  ]);
}

function triggerPrincessDateMeeting() {
  if (dateMetStarted) return;
  dateMetStarted = true;
  if (objectiveText) {
    objectiveText.textContent = 'Objective: Present the bouquet and enjoy the morning date with the Princess.';
  }

  startDialogue([
    {
      speaker: 'Princess',
      text: '“You actually came... and with a full bouquet already? Look at those hibiscus, roses, tulips, and azaleas.”',
      princessEmote: '🥰',
      knightEmote: '😳'
    },
    {
      speaker: 'Knight',
      text: '“Sunrise broke over the grounds, Your Highness—every flower here was gathered for you.”',
      knightEmote: '💐',
      princessEmote: '💕'
    }
  ]);
}

// --- CONTROLS ---
const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  if (inDialogue) {
    if (waitingForChoice) {
      const btns = dialogueChoices.querySelectorAll('.choice-btn');
      if (k === '1' && btns[0]) btns[0].click();
      if (k === '2' && btns[1]) btns[1].click();
      if (k === '3' && btns[2]) btns[2].click();
    } else if (k === 'e' || k === ' ') {
      advanceDialogue();
    }
    return;
  }

  if (k === 'e') {
    const nearFlower = getNearbyFlower();
    if (nearFlower) {
      collectFlower(nearFlower);
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// --- INITIAL SETUP ---
setArea('flower_quest', kX, kY);
updateBouquetUI();
spawnFlowerInArea('flower_quest', Math.round(window.innerWidth * 0.72), 555);
spawnFlowerInArea('looking_flower_1', Math.round(window.innerWidth * 0.42), 565);
spawnFlowerInArea('looking_flower_1', Math.round(window.innerWidth * 0.74), 545);
spawnFlowerInArea('looking_flower_2', Math.round(window.innerWidth * 0.36), 560);
spawnFlowerInArea('looking_flower_2', Math.round(window.innerWidth * 0.68), 550);

setTimeout(() => {
  startDialogue([
    {
      speaker: 'Knight',
      text: '“Sunrise is here. Before I go to her by the tree on the left, I should find a gift—a full bouquet of flowers she likes.”',
      knightEmote: '🌺'
    }
  ]);
}, 120);

function gameLoop() {
  let kMoving = false;

  if (!inDialogue) {
    if (keys['w'] || keys['arrowup']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      kY += speed;
      kMoving = true;
    }
    if (keys['a'] || keys['arrowleft']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    }
    if (keys['d'] || keys['arrowright']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
      knight.classList.add('facing-right');
    }

    if (kY < 455) kY = 455;
    if (kY > Math.min(window.innerHeight - 60, 635)) {
      kY = Math.min(window.innerHeight - 60, 635);
    }

    // Map transitions
    if (currentArea === 'flower_quest') {
      if (kX <= 45) {
        if (!isBouquetComplete()) {
          blockPrincessTreeEntry();
        } else {
          setArea('princess_tree', window.innerWidth - 180, Math.max(kY, 550));
          knight.classList.add('facing-left');
          knight.classList.remove('facing-right');
          triggerPrincessDateMeeting();
        }
      } else if (kX >= window.innerWidth - 130) {
        setArea('looking_flower_1', 120, Math.max(kY, 550));
      }
    } else if (currentArea === 'looking_flower_1') {
      if (kX <= 45) {
        setArea('looking_flower_2', window.innerWidth - 165, Math.max(kY, 550));
      } else if (kX >= window.innerWidth - 130) {
        setArea('flower_quest', 120, Math.max(kY, 550));
      }
    } else if (currentArea === 'looking_flower_2') {
      if (kX < 10) kX = 10;
      if (kX >= window.innerWidth - 130) {
        setArea('looking_flower_1', 120, Math.max(kY, 550));
      }
    } else if (currentArea === 'princess_tree') {
      if (kX < pX + 130) kX = pX + 130;
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    }
  }

  // Nearby flower interaction prompt
  const nearFlower = getNearbyFlower();
  if (interactionPrompt) {
    if (nearFlower && !inDialogue) {
      interactionPrompt.textContent = `Press [E] to Pick ${nearFlower.type.icon} ${nearFlower.type.name}`;
      interactionPrompt.classList.remove('hidden');
    } else {
      interactionPrompt.classList.add('hidden');
    }
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';
    knight.classList.toggle('running', kMoving);
  }

  if (princess && princessActive) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
    princess.classList.remove('running');
  }

  positionEmotesNow();
  requestAnimationFrame(gameLoop);
}

gameLoop();
