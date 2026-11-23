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
const knightBouquet = document.getElementById('knight-bouquet');
const princess = document.getElementById('princess');
const knightEmote = document.getElementById('knight-emotion');
const princessEmote = document.getElementById('princess-emotion');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const flowersLayer = document.getElementById('flowers-layer');
const interactionPrompt = document.getElementById('interaction-prompt');
const edgeArrowLeft = document.getElementById('edge-arrow-left');
const edgeArrowRight = document.getElementById('edge-arrow-right');

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

function getGroundBaselineY() {
  return Math.max(360, Math.round(window.innerHeight * 0.84));
}

function getMinWalkY() {
  return Math.max(320, getGroundBaselineY() - 52);
}

function getMaxWalkY() {
  return Math.min(window.innerHeight - 24, getGroundBaselineY() + 22);
}

// Map layout:
// 'flower_quest' (Meadow Clearing: FlowerQuest.png)
//   - Left  -> 'princess_spot' (PrincessTree.png, locked until bouquet is complete)
//   - Right -> 'woodland_path' (LookingFlower1.png, enters from left)
// 'woodland_path' (Woodland Path: LookingFlower1.png)
//   - Left  -> 'flower_quest' (returns to Meadow Clearing)
//   - Right -> 'sunlit_grove' (LookingFlower2.png, enters from left)
// 'sunlit_grove' (Sunlit Grove: LookingFlower2.png)
//   - Left  -> 'woodland_path' (returns to Woodland Path)
// 'princess_spot' (Princess Tree: PrincessTree.png)
//   - Right -> 'flower_quest' (returns to Meadow Clearing)
let currentArea = 'flower_quest';

// Controlled Knight state (spawns in Meadow Clearing on the grass in the middle)
let kX = Math.round(window.innerWidth * 0.5) - 60;
let kY = getGroundBaselineY();
const speed = 6;
let inDialogue = false;
let dateMetStarted = false;

// Princess state in PrincessTree.png (right side of the tree trunk, facing right)
let pX = Math.round(window.innerWidth * 0.34);
let pY = getGroundBaselineY();
let princessActive = false;

// Flowers Princess adores
const BOUQUET_GOAL = 5;
const FLOWER_TYPES = [
  { name: 'Hibiscus', icon: '🌺' },
  { name: 'Rose', icon: '🌹' },
  { name: 'Tulip', icon: '🌷' },
  { name: 'Azalea', icon: '🌸' },
  { name: 'Blossom', icon: '🌼' }
];

let collectedFlowers = [];
let activeFlowers = []; // { id, area, type, xRatio, yRatio, x, y, el }
let flowerIdCounter = 1;

function isBouquetComplete() {
  return collectedFlowers.length >= BOUQUET_GOAL;
}

// --- BOUQUET IN KNIGHT'S HAND ---
function syncKnightHandBouquet() {
  if (!knightBouquet) return;
  if (collectedFlowers.length === 0) {
    knightBouquet.classList.add('hidden');
    knightBouquet.textContent = '';
    return;
  }

  knightBouquet.classList.remove('hidden');
  knightBouquet.textContent = collectedFlowers
    .slice(-4)
    .map((f) => f.icon)
    .join('');
}

// --- OVERHEAD EMOTES ---
let knightEmoteTimer = null;
let princessEmoteTimer = null;

function positionEmotesNow() {
  if (knight && knightEmote) {
    const clampedKX = Math.max(30, Math.min(window.innerWidth - 30, kX + 60));
    knightEmote.style.left = clampedKX + 'px';
    knightEmote.style.top = (kY - 155) + 'px';
  }
  if (princess && princessEmote) {
    const clampedPX = Math.max(30, Math.min(window.innerWidth - 30, pX + 48));
    princessEmote.style.left = clampedPX + 'px';
    princessEmote.style.top = (pY - 120) + 'px';
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

// --- EDGE ARROWS ---
function updateEdgeArrows() {
  if (!edgeArrowLeft || !edgeArrowRight) return;

  if (currentArea === 'flower_quest') {
    edgeArrowLeft.classList.remove('hidden');
    edgeArrowLeft.textContent = isBouquetComplete()
      ? '◀ Princess Spot'
      : '◀ Princess Spot (Gift Needed)';
    edgeArrowRight.classList.remove('hidden');
    edgeArrowRight.textContent = 'Woodland Path ▶';
  } else if (currentArea === 'woodland_path') {
    edgeArrowLeft.classList.remove('hidden');
    edgeArrowLeft.textContent = '◀ Meadow Clearing';
    edgeArrowRight.classList.remove('hidden');
    edgeArrowRight.textContent = 'Sunlit Grove ▶';
  } else if (currentArea === 'sunlit_grove') {
    edgeArrowLeft.classList.remove('hidden');
    edgeArrowLeft.textContent = '◀ Woodland Path';
    edgeArrowRight.classList.add('hidden');
  } else if (currentArea === 'princess_spot') {
    edgeArrowLeft.classList.add('hidden');
    edgeArrowRight.classList.remove('hidden');
    edgeArrowRight.textContent = 'Meadow Clearing ▶';
  }
}

// --- BOUQUET UI & GROUND FLOWERS ---
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

  syncKnightHandBouquet();

  if (objectiveText && !dateMetStarted) {
    if (done) {
      objectiveText.textContent =
        'Objective: Bouquet gathered—head left to the Princess waiting by the tree.';
    } else {
      objectiveText.textContent = `Objective: Gather a bouquet of blossoms she adores (${count}/${BOUQUET_GOAL}).`;
    }
  }
}

function pickFlowerTypeForBouquet() {
  const needed = FLOWER_TYPES.filter(
    (ft) => !collectedFlowers.some((cf) => cf.name === ft.name)
  );
  const pool = needed.length > 0 ? needed : FLOWER_TYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function layoutFlowerPosition(flowerObj) {
  flowerObj.x = Math.round(window.innerWidth * flowerObj.xRatio);
  const minY = getMinWalkY();
  const maxY = getMaxWalkY();
  flowerObj.y = Math.round(minY + flowerObj.yRatio * (maxY - minY));
  if (flowerObj.el) {
    flowerObj.el.style.left = flowerObj.x + 'px';
    flowerObj.el.style.top = flowerObj.y + 'px';
  }
}

function spawnFlowerInArea(area, customXRatio = null, customYRatio = null) {
  if (!flowersLayer || isBouquetComplete()) return null;

  const existingInArea = activeFlowers.filter((f) => f.area === area).length;
  if (existingInArea >= 2) return null;

  const type = pickFlowerTypeForBouquet();
  const xRatio =
    typeof customXRatio === 'number'
      ? customXRatio
      : 0.22 + Math.random() * 0.56;
  const yRatio =
    typeof customYRatio === 'number'
      ? customYRatio
      : 0.25 + Math.random() * 0.65;

  const el = document.createElement('div');
  el.className = 'ground-flower';
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
    xRatio,
    yRatio,
    x: 0,
    y: 0,
    el
  };
  layoutFlowerPosition(flowerObj);
  activeFlowers.push(flowerObj);
  return flowerObj;
}

function syncFlowersVisibility() {
  activeFlowers.forEach((f) => {
    layoutFlowerPosition(f);
    if (!f.el) return;
    f.el.style.display = f.area === currentArea && !isBouquetComplete() ? 'flex' : 'none';
  });

  if (!isBouquetComplete() && currentArea !== 'princess_spot') {
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
  if (isBouquetComplete() || currentArea === 'princess_spot') return null;
  let closest = null;
  let bestDist = 115;

  activeFlowers.forEach((f) => {
    if (f.area !== currentArea) return;
    const dist = Math.hypot(kX + 60 - f.x, kY + 12 - f.y);
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
        text: `“A ${flower.type.name} to complete the bouquet... hibiscus, roses, tulips, and azaleas gathered in the golden morning light.”`,
        knightEmote: '💐'
      },
      {
        speaker: 'Knight',
        text: '“She is waiting by the great tree to the left. I shall carry this bouquet straight to her.”',
        knightEmote: '✨'
      }
    ]);
  } else {
    spawnFlowerInArea(currentArea);
    startDialogue([
      {
        speaker: 'Knight',
        text: `“I have gathered a ${flower.type.name} (${collectedFlowers.length}/${BOUQUET_GOAL}). I will hold it carefully for her.”`,
        knightEmote: flower.type.icon
      }
    ]);
  }
}

// --- AREA SWITCHING ---
function syncPrincessTreePosition() {
  // Position Princess right on the right side of the tree trunk in PrincessTree.png
  pX = Math.round(window.innerWidth * 0.34);
  pY = getGroundBaselineY();
  if (princess && princessActive) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
    princess.classList.remove('hidden');
    princess.classList.add('facing-right');
    princess.classList.remove('facing-left');
    princess.classList.remove('running');
  }
}

function setArea(nextArea, nextX, nextY) {
  currentArea = nextArea;
  if (typeof nextX === 'number') kX = nextX;
  if (typeof nextY === 'number') kY = nextY;

  if (currentArea === 'flower_quest') {
    if (gameBody) gameBody.style.backgroundImage = "url('FlowerQuest.png')";
    if (locationBanner) locationBanner.textContent = '📍 Meadow Clearing';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
  } else if (currentArea === 'woodland_path') {
    if (gameBody) gameBody.style.backgroundImage = "url('LookingFlower1.png')";
    if (locationBanner) locationBanner.textContent = '📍 Woodland Path';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
  } else if (currentArea === 'sunlit_grove') {
    if (gameBody) gameBody.style.backgroundImage = "url('LookingFlower2.png')";
    if (locationBanner) locationBanner.textContent = '📍 Sunlit Grove';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
  } else if (currentArea === 'princess_spot') {
    if (gameBody) gameBody.style.backgroundImage = "url('PrincessTree.png')";
    if (locationBanner) locationBanner.textContent = '📍 Princess Spot';
    princessActive = true;
    syncPrincessTreePosition();
  }

  syncFlowersVisibility();
  updateEdgeArrows();
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

function blockPrincessSpotEntry() {
  kX = 85;
  knight.classList.remove('facing-left');
  knight.classList.add('facing-right');
  triggerEmote('knight', '💐');

  startDialogue([
    {
      speaker: 'Knight',
      text: '“I cannot walk to her empty-handed on such a morning. I should gather a full bouquet of flowers she loves—hibiscus, roses, tulips, azaleas—before going to her.”',
      knightEmote: '🌷'
    }
  ]);
}

function triggerPrincessDateMeeting() {
  if (dateMetStarted) return;
  dateMetStarted = true;
  if (objectiveText) {
    objectiveText.textContent = 'Objective: Present the morning bouquet to the Princess.';
  }

  startDialogue([
    {
      speaker: 'Princess',
      text: '“You arrived with the morning sun... and carrying such a lovely bouquet. Hibiscus, roses, tulips, and azaleas—how thoughtful of you.”',
      princessEmote: '🥰',
      knightEmote: '😳'
    },
    {
      speaker: 'Knight',
      text: '“Every blossom was gathered for you, Your Highness. At long last, this morning is ours.”',
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

window.addEventListener('resize', () => {
  kY = Math.max(getMinWalkY(), Math.min(getMaxWalkY(), kY));
  syncFlowersVisibility();
  if (princessActive) syncPrincessTreePosition();
});

// --- INITIAL SETUP ---
setArea('flower_quest', kX, kY);
updateBouquetUI();
spawnFlowerInArea('flower_quest', 0.72, 0.55);
spawnFlowerInArea('woodland_path', 0.42, 0.65);
spawnFlowerInArea('woodland_path', 0.74, 0.45);
spawnFlowerInArea('sunlit_grove', 0.36, 0.60);
spawnFlowerInArea('sunlit_grove', 0.68, 0.50);

setTimeout(() => {
  startDialogue([
    {
      speaker: 'Knight',
      text: '“Sunrise has broken over the meadow. Before I go to her on the left, I must find a gift—a full bouquet of flowers she likes.”',
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

    const minY = getMinWalkY();
    const maxY = getMaxWalkY();
    if (kY < minY) kY = minY;
    if (kY > maxY) kY = maxY;

    // Map transitions:
    // Meadow Clearing (left -> Princess Spot, right -> Woodland Path from left)
    // Woodland Path (left -> Meadow Clearing, right -> Sunlit Grove from left)
    // Sunlit Grove (left -> Woodland Path)
    // Princess Spot (right -> Meadow Clearing)
    if (currentArea === 'flower_quest') {
      if (kX <= 45) {
        if (!isBouquetComplete()) {
          blockPrincessSpotEntry();
        } else {
          setArea('princess_spot', Math.round(window.innerWidth * 0.58), getGroundBaselineY());
          knight.classList.add('facing-left');
          knight.classList.remove('facing-right');
          triggerPrincessDateMeeting();
        }
      } else if (kX >= window.innerWidth - 130) {
        setArea('woodland_path', 90, getGroundBaselineY());
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
    } else if (currentArea === 'woodland_path') {
      if (kX <= 45) {
        setArea('flower_quest', window.innerWidth - 170, getGroundBaselineY());
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');
      } else if (kX >= window.innerWidth - 130) {
        setArea('sunlit_grove', 90, getGroundBaselineY());
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
    } else if (currentArea === 'sunlit_grove') {
      if (kX <= 45) {
        setArea('woodland_path', window.innerWidth - 170, getGroundBaselineY());
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');
      }
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    } else if (currentArea === 'princess_spot') {
      if (kX < pX + 125) kX = pX + 125;
      if (kX >= window.innerWidth - 130) {
        setArea('flower_quest', 90, getGroundBaselineY());
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
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
    syncPrincessTreePosition();
  }

  positionEmotesNow();
  requestAnimationFrame(gameLoop);
}

gameLoop();
