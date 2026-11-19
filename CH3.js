function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }
}

window.addEventListener('DOMContentLoaded', removeOverlay);
setTimeout(removeOverlay, 50);

const gameBody = document.getElementById('game-body');
const princess = document.getElementById('princess');
const king = document.getElementById('king');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');

// Player-controlled Princess starts in her room
let pX = Math.max(360, window.innerWidth * 0.52);
let pY = 560;
const speed = 6;

// King placeholder state (walks in, delivers royal command, then exits)
let kingActive = false;
let kingWalkingIn = false;
let kingWalkingOut = false;
let kX = -140;
let kY = 560;

// Balcony distraction state on the right side of the room
let balconyDistractionUsed = false;
let nearBalcony = false;

// Area & progression state:
// 'room' -> can use right side for balcony distraction, or head left ('<') toward chambers/library
let currentArea = 'room';
let inDialogue = false;
let isFadingOut = false;
let popupTimeout = null;

// --- EMOTE BUBBLES & THOUGHT BAR ---
const princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

const kingEmote = document.createElement('div');
kingEmote.className = 'emote-bubble hidden';
document.body.appendChild(kingEmote);

const thoughtBox = document.createElement('div');
thoughtBox.id = 'thought-box';
thoughtBox.className = 'subtle-thought hidden';
document.body.appendChild(thoughtBox);

const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
const dialogueChoices = document.getElementById('dialogue-choices');
const dialogueHint = document.getElementById('dialogue-hint');

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

let princessEmoteTimer = null;
let kingEmoteTimer = null;

function positionEmotesNow() {
  if (princess && princessEmote) {
    const clampedPX = Math.max(30, Math.min(window.innerWidth - 30, pX + 48));
    princessEmote.style.left = clampedPX + 'px';
    princessEmote.style.top = (pY - 125) + 'px';
  }
  if (king && kingActive && kingEmote) {
    const clampedKX = Math.max(30, Math.min(window.innerWidth - 30, kX + 46));
    kingEmote.style.left = clampedKX + 'px';
    kingEmote.style.top = (kY - 165) + 'px';
  }
}

function triggerEmote(target, symbol, durationMs = 1800) {
  const el = target === 'king' ? kingEmote : princessEmote;
  if (!el) return;

  if (!symbol) {
    el.classList.add('hidden');
    return;
  }

  positionEmotesNow();
  el.textContent = symbol;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `emote-pulse-fade ${durationMs}ms ease-out forwards`;

  if (target === 'king') {
    clearTimeout(kingEmoteTimer);
    kingEmoteTimer = setTimeout(() => el.classList.add('hidden'), durationMs);
  } else {
    clearTimeout(princessEmoteTimer);
    princessEmoteTimer = setTimeout(() => el.classList.add('hidden'), durationMs);
  }
}

function showActionFeedback(message, targetX = pX + 48, targetY = pY - 145) {
  if (!actionPopup) return;
  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = Math.max(90, Math.min(window.innerWidth - 90, targetX)) + 'px';
  actionPopup.style.top = targetY + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight;
  actionPopup.style.animation = 'float-above 2.2s ease-out forwards';

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 2200);
}

function fadeOutChapter(nextUrl = null) {
  if (isFadingOut) return;
  isFadingOut = true;

  if (interactionPrompt) interactionPrompt.classList.add('hidden');
  if (taskMarker) taskMarker.classList.add('hidden');
  if (thoughtBox) thoughtBox.classList.add('hidden');
  if (dialogueBox) dialogueBox.classList.add('hidden');

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.style.transition = 'opacity 1.5s ease-in-out';
    overlay.style.pointerEvents = 'auto';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.classList.add('active');
      });
    });

    if (nextUrl) {
      setTimeout(() => {
        window.location.href = nextUrl;
      }, 1500);
    }
  }
}

// --- DIALOGUE ENGINE ---
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
  if (taskMarker) taskMarker.classList.add('hidden');
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
  const isKing = speakerLower.includes('king');
  const isPrincess = speakerLower.includes('princess');

  dialogueSpeaker.className = 'dialogue-speaker';
  if (isPrincess) {
    dialogueSpeaker.classList.add('princess-speak');
    dialogueSpeaker.textContent = 'Princess';
  } else if (isKing) {
    dialogueSpeaker.classList.add('king-speak');
    dialogueSpeaker.textContent = 'King';
  } else {
    dialogueSpeaker.textContent = node.speaker || 'Narrator';
  }

  // Only show thought bar when neither Princess nor King is speaking out loud
  if (node.thought && !isPrincess && !isKing) {
    thoughtBox.textContent = node.thought;
    thoughtBox.classList.remove('hidden');
  } else {
    thoughtBox.classList.add('hidden');
  }

  dialogueText.textContent = node.text;

  if (node.princessEmote !== undefined) triggerEmote('princess', node.princessEmote);
  if (node.kingEmote !== undefined) triggerEmote('king', node.kingEmote);

  dialogueChoices.innerHTML = '';

  if (node.choices && node.choices.length > 0) {
    waitingForChoice = true;
    dialogueChoices.classList.remove('hidden');
    navControls.style.display = 'none';
    dialogueHint.textContent = "Choose a response (click or press [1] / [2] / [3])";

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
    dialogueHint.textContent = "Press [E] / [Space] or > to continue";
  }
}

function selectChoice(choice) {
  if (!waitingForChoice) return;
  waitingForChoice = false;
  dialogueChoices.classList.add('hidden');

  if (choice.princessEmote !== undefined) triggerEmote('princess', choice.princessEmote);
  if (choice.kingEmote !== undefined) triggerEmote('king', choice.kingEmote);

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
  thoughtBox.classList.add('hidden');
  dialogueChoices.innerHTML = '';
  dialogueChoices.classList.add('hidden');
  inDialogue = false;
  waitingForChoice = false;

  const cb = onDialogueFinish;
  onDialogueFinish = null;
  if (cb) cb();
}

// --- CHAPTER 3 ROYAL & SNEAK-OUT SCRIPTS ---
const kingBedtimeDecreeNodes = [
  {
    speaker: "King",
    text: "“The hour grows late, daughter. As your sovereign and your father, I command that you retire to your bed at once and sleep.”",
    kingEmote: "👑"
  },
  {
    speaker: "Princess",
    text: "“As Your Majesty commands. I shall attend to my evening routine and take my rest directly.”",
    princessEmote: "😊"
  },
  {
    speaker: "King",
    text: "“See that you do. A royal heir requires proper rest—do not linger awake.”",
    kingEmote: "🚪"
  }
];

const balconyDistractionNodes = [
  {
    speaker: "Princess",
    text: "“A neat little decoy by the balcony... if anyone glances toward the outer ledge, they will think the Princess is merely taking the night air.”",
    princessEmote: "😏"
  },
  {
    speaker: "Princess",
    text: "“Now—left toward the chambers and the library. Quiet steps, unseen by the King, straight to my midnight date.”",
    princessEmote: "✨"
  }
];

const sneakingTowardLibraryNodes = [
  {
    speaker: "Princess",
    text: "“Past the chambers and into the library's shadow... the King is none the wiser. The night is ours.”",
    princessEmote: "😏"
  }
];

function beginKingBedtimeVisit() {
  kingActive = true;
  kingWalkingIn = true;
  kingWalkingOut = false;
  kX = -130;
  kY = 560;
  king.classList.remove('hidden');
  king.classList.add('facing-right');
  king.classList.remove('facing-left');

  objectiveText.textContent = "Objective: The King has entered your chambers...";
}

function triggerBalconyDistraction() {
  if (balconyDistractionUsed || kingActive) return;
  balconyDistractionUsed = true;
  if (taskMarker) taskMarker.classList.add('hidden');
  if (interactionPrompt) interactionPrompt.classList.add('hidden');

  showActionFeedback("Balcony decoy set!", pX + 48, pY - 150);
  startDialogue(balconyDistractionNodes, () => {
    objectiveText.textContent = "Objective: Escape the palace. Go to your date. Leave unseen by the King.";
  });
}

function triggerLibraryEscape() {
  currentArea = 'library_escape';
  if (arrowLeft) arrowLeft.style.display = 'none';
  if (arrowRight) arrowRight.style.display = 'none';
  if (taskMarker) taskMarker.classList.add('hidden');
  if (interactionPrompt) interactionPrompt.classList.add('hidden');

  objectiveText.textContent = "✅ Unseen by the King — slipping out by the library for your date...";
  startDialogue(sneakingTowardLibraryNodes, () => {
    fadeOutChapter();
  });
}

// Initial Chapter 3 setup in Princess's Room
if (gameBody) gameBody.style.backgroundImage = "url('PrincessRoom.png')";
if (locationBanner) locationBanner.textContent = "📍 Princess's Chamber";
if (objectiveText) objectiveText.textContent = "Objective: Escape the palace. Go to your date. Leave unseen by the King.";

setTimeout(() => {
  beginKingBedtimeVisit();
}, 400);

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

  if (k === 'e' && nearBalcony && !balconyDistractionUsed && !kingActive && !isFadingOut) {
    triggerBalconyDistraction();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let pMoving = false;

  if (!inDialogue && !isFadingOut) {
    // King walks in to deliver his bedtime command
    if (kingActive && kingWalkingIn) {
      const kingStopX = Math.max(180, pX - 210);
      if (kX < kingStopX) {
        kX += 4.2;
      } else {
        kX = kingStopX;
        kingWalkingIn = false;
        princess.classList.add('facing-left');
        princess.classList.remove('facing-right');

        startDialogue(kingBedtimeDecreeNodes, () => {
          // King walks back out left
          kingWalkingOut = true;
          king.classList.add('facing-left');
          king.classList.remove('facing-right');
        });
      }
    } else if (kingActive && kingWalkingOut) {
      kX -= 4.5;
      if (kX < -150) {
        kingActive = false;
        kingWalkingOut = false;
        king.classList.add('hidden');
        showActionFeedback("The King has left... time to slip out!", pX + 48, pY - 150);
        objectiveText.textContent = "Objective: Escape the palace. Go to your date. Leave unseen by the King.";
      }
    }

    // Player controls Princess once the King isn't actively lecturing her
    if (!kingActive) {
      if (keys['w'] || keys['arrowup']) {
        pY -= speed;
        pMoving = true;
      }
      if (keys['s'] || keys['arrowdown']) {
        pY += speed;
        pMoving = true;
      }

      const minWalkY = 465;
      const maxWalkY = Math.min(window.innerHeight - 55, 620);
      if (pY < minWalkY) pY = minWalkY;
      if (pY > maxWalkY) pY = maxWalkY;

      if (keys['a'] || keys['arrowleft']) {
        pX -= speed;
        pMoving = true;
        princess.classList.add('facing-left');
        princess.classList.remove('facing-right');
      }
      if (keys['d'] || keys['arrowright']) {
        pX += speed;
        pMoving = true;
        princess.classList.remove('facing-left');
        princess.classList.add('facing-right');
      }

      if (pX < 10) pX = 10;
      if (pX > window.innerWidth - 110) pX = window.innerWidth - 110;

      // Left cue (< Chambers / Library) & Right cue (> Balcony distraction)
      if (currentArea === 'room') {
        if (arrowLeft) {
          arrowLeft.style.display = 'inline-flex';
          arrowLeft.classList.toggle('highlight', pX < 250);
        }
        if (arrowRight) {
          arrowRight.style.display = 'inline-flex';
          arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
        }

        // Balcony distraction spot on the right
        const balconySpotX = window.innerWidth - 170;
        nearBalcony = !balconyDistractionUsed && Math.abs(pX - balconySpotX) < 110;

        if (taskMarker) {
          if (!balconyDistractionUsed) {
            taskMarker.classList.remove('hidden');
            taskMarker.style.left = (balconySpotX + 20) + 'px';
            taskMarker.style.top = (pY - 140) + 'px';
          } else {
            taskMarker.classList.add('hidden');
          }
        }

        if (interactionPrompt) {
          if (nearBalcony) {
            interactionPrompt.textContent = "Press [E] to Use Balcony as Distraction";
            interactionPrompt.classList.remove('hidden');
          } else {
            interactionPrompt.classList.add('hidden');
          }
        }

        // Walking left toward chambers & library sneaks out unseen by the King
        if (pX <= 55) {
          triggerLibraryEscape();
        }
      }
    }
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
    princess.classList.toggle('running', pMoving);
  }

  if (king && kingActive) {
    king.style.left = kX + 'px';
    king.style.top = kY + 'px';
  }

  positionEmotesNow();
  requestAnimationFrame(gameLoop);
}

gameLoop();
