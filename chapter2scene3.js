function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', removeOverlay);
setTimeout(removeOverlay, 50);

const gameBody = document.getElementById('game-body');
const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowRight = document.getElementById('arrow-right');
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');

// Knight spawns in Dragon's Hall on the ground line
let kX = 400;
let kY = 560;
const speed = 6;
let currentArea = 'hall'; // 'hall' -> 'garden'

// Princess autonomous state in the garden (feet aligned on the ground)
let pX = window.innerWidth + 120;
let pY = 560;
let princessActive = false;
let princessWalkingToCenter = false;
let princessReadyToTalk = false;

let inDialogue = false;
let sceneComplete = false;
let isFadingOut = false;

// Scene Stages:
// 0 = In Dragon's Hall: player walks Knight right to the Royal Garden
// 1 = In Royal Garden: Princess walks to center, calls Knight over -> "Talk to Princess" task
// 2 = Multi-choice flirting, date ask, inner monologue & sneak-out plan
let sceneStage = 0;
let canInteract = false;
let popupTimeout = null;

// --- EMOTE BUBBLES & INNER THOUGHT BAR ---
const knightEmote = document.createElement('div');
knightEmote.className = 'emote-bubble hidden';
document.body.appendChild(knightEmote);

const princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

const thoughtBox = document.createElement('div');
thoughtBox.id = 'thought-box';
thoughtBox.className = 'subtle-thought hidden';
document.body.appendChild(thoughtBox);

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

let knightEmoteTimer = null;
let princessEmoteTimer = null;

function positionEmotesNow() {
  // Knight has transform-origin: center bottom, scale(4.8) on a 120x80 box -> head sits roughly around kY - 165
  if (knight && knightEmote) {
    knightEmote.style.left = (kX + 60) + 'px';
    knightEmote.style.top = (kY - 165) + 'px';
  }
  // Princess has transform-origin: center bottom, scale(3.5) on a 96x96 box -> head sits roughly around pY - 125
  if (princess && princessEmote) {
    princessEmote.style.left = (pX + 48) + 'px';
    princessEmote.style.top = (pY - 125) + 'px';
  }
}

function triggerEmote(target, symbol) {
  const el = target === 'knight' ? knightEmote : princessEmote;
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
  el.style.animation = 'emote-pulse-fade 1.8s ease-out forwards';

  if (target === 'knight') {
    clearTimeout(knightEmoteTimer);
    knightEmoteTimer = setTimeout(() => el.classList.add('hidden'), 1800);
  } else {
    clearTimeout(princessEmoteTimer);
    princessEmoteTimer = setTimeout(() => el.classList.add('hidden'), 1800);
  }
}

function showActionFeedback(message, targetX = kX + 60, targetY = kY - 185) {
  if (!actionPopup) return;
  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = targetX + 'px';
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

// --- DIALOGUE ENGINE WITH MULTI-CHOICE, INNER MONOLOGUE & < > ARROWS ---
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
  dialogueSpeaker.className = 'dialogue-speaker';
  if (speakerLower.includes('princess')) {
    dialogueSpeaker.classList.add('princess-speak');
    dialogueSpeaker.textContent = 'Princess';
  } else {
    dialogueSpeaker.textContent = 'Knight';
  }

  if (node.thought) {
    thoughtBox.textContent = node.thought;
    thoughtBox.classList.remove('hidden');
  } else {
    thoughtBox.classList.add('hidden');
  }

  dialogueText.textContent = node.text;

  if (node.knightEmote !== undefined) triggerEmote('knight', node.knightEmote);
  if (node.princessEmote !== undefined) triggerEmote('princess', node.princessEmote);

  if (princessActive && princess) {
    if (pX < kX) {
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
      princess.classList.add('facing-right');
      princess.classList.remove('facing-left');
    } else {
      knight.classList.add('facing-right');
      knight.classList.remove('facing-left');
      princess.classList.add('facing-left');
      princess.classList.remove('facing-right');
    }
  }

  dialogueChoices.innerHTML = '';

  if (node.choices && node.choices.length > 0) {
    waitingForChoice = true;
    dialogueChoices.classList.remove('hidden');
    navControls.style.display = 'none';
    dialogueHint.textContent = "Choose a response (click or press [1] / [2])";

    node.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.textContent = `${idx + 1}. ${choice.label}`;
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

  if (choice.knightEmote !== undefined) triggerEmote('knight', choice.knightEmote);
  if (choice.princessEmote !== undefined) triggerEmote('princess', choice.princessEmote);

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

// --- STORY DIALOGUE SCRIPTS ---
const openingFootstepsNodes = [
  {
    speaker: "Knight",
    text: "“Footsteps outside... someone is out in the garden. Let me head over and see who it is.”",
    thought: "(Internal) Quiet steps on stone—probably not a patrol. I should check it out.",
    knightEmote: "👂"
  }
];

const gardenEncounterNodes = [
  {
    speaker: "Princess",
    text: "“There you are! I spotted you coming out from the hall. Were you patrolling... or looking for me?”",
    thought: "(Internal) SHE WALKED RIGHT TOWARD ME. Why does she smell like vanilla and roses—and why is my armor suddenly way too tight?!",
    princessEmote: "😏",
    knightEmote: "🥵"
  },
  {
    speaker: "Princess",
    text: "“Tell me, Sir Knight... do you ever take that heavy armor off to actually take me out on a real date?”",
    thought: "(Internal) My heart is hammering louder than a war drum. Keep it together!",
    princessEmote: "😘",
    knightEmote: "😵‍💫",
    choices: [
      {
        label: "Flustered & honest: \"Y-Yes. Whenever you say the word, Your Highness—I mean, whenever.\"",
        knightEmote: "😳",
        princessEmote: "🥰",
        followUp: [
          {
            speaker: "Princess",
            text: "“Ooh, 'whenever I say the word'? Careful, or I might hold you to that tonight.”",
            thought: "(Internal) She said 'tonight.' My entire nervous system just short-circuited.",
            princessEmote: "🔥",
            knightEmote: "💓"
          }
        ]
      },
      {
        label: "Try to play it cool (and fail): \"A date? Right. Tactical moonlight reconnaissance. Very official.\"",
        knightEmote: "🫠",
        princessEmote: "🤭",
        followUp: [
          {
            speaker: "Princess",
            text: "“'Tactical moonlight reconnaissance'? Honestly, that's the cutest excuse you've ever tried.”",
            thought: "(Internal) Smooth, really smooth. Why did I say 'tactical'?!",
            princessEmote: "💕",
            knightEmote: "😳"
          }
        ]
      }
    ]
  },
  {
    speaker: "Knight",
    text: "“Listen—meet me when the clock chimes late. There won't be any guards posted in the chambers or the library then, so you can slip out safely.”",
    thought: "(Internal) Brain reboot! Okay, stay calm—if we sneak out, we have to time it right so nobody spots us.",
    knightEmote: "🤯",
    princessEmote: "✨"
  },
  {
    speaker: "Knight",
    text: "“One catch though: the King will be in his chambers at that hour—that's why there are no guards around, to keep his privacy. Keep quiet and stay out of sight.”",
    thought: "(Internal) No guards in the chambers or library for the King's privacy... one wrong sound and we're busted.",
    knightEmote: "🤫",
    princessEmote: "😉"
  },
  {
    speaker: "Princess",
    text: "“No guards in the library and chambers, and the King wants his privacy... sounds like the easiest royal escape ever. Don't keep me waiting, Knight.”",
    thought: "(Internal) She's smiling like she already has this whole night planned. I'm so doomed—and so in.",
    princessEmote: "💘",
    knightEmote: "❤️‍🔥"
  }
];

function enterRoyalGardenFromLeft() {
  currentArea = 'garden';
  sceneStage = 1;

  if (arrowRight) arrowRight.style.display = 'none';
  if (gameBody) gameBody.style.backgroundImage = "url('RoyalGarden.png')";
  if (locationBanner) locationBanner.textContent = "📍 Royal Garden";

  // Knight enters from the left on the garden ground line
  kX = 70;
  kY = 560;
  knight.classList.add('facing-right');
  knight.classList.remove('facing-left');

  // Princess enters autonomously from the right side toward the middle of the garden
  princessActive = true;
  princessWalkingToCenter = true;
  princessReadyToTalk = false;
  pX = window.innerWidth + 60;
  pY = 560;
  princess.classList.remove('hidden');
  princess.classList.add('facing-left');
  princess.classList.remove('facing-right');

  objectiveText.textContent = "Objective: Someone is in the garden...";
}

function triggerEncounterDialogue() {
  sceneStage = 2;
  princessReadyToTalk = false;
  canInteract = false;
  if (taskMarker) taskMarker.classList.add('hidden');
  if (interactionPrompt) interactionPrompt.classList.add('hidden');

  startDialogue(gardenEncounterNodes, () => {
    sceneComplete = true;
    objectiveText.textContent = "✅ Date arranged! Keep quiet around the King's chambers...";
    triggerEmote('knight', '💘');
    triggerEmote('princess', '💕');
  });
}

// Initial Dragon's Hall setup & opening footsteps message
if (gameBody) gameBody.style.backgroundImage = "url('PolishDragon.png')";
if (locationBanner) locationBanner.textContent = "📍 Dragon's Hall";
if (objectiveText) objectiveText.textContent = "Objective: Footsteps outside—walk right to check who is in the Royal Garden.";

setTimeout(() => {
  startDialogue(openingFootstepsNodes);
}, 300);

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
    } else if (k === 'e' || k === ' ') {
      advanceDialogue();
    }
    return;
  }

  // Talk to Princess once she calls the Knight over
  if (k === 'e' && canInteract && !isFadingOut) {
    if (currentArea === 'garden' && sceneStage === 1 && princessReadyToTalk) {
      triggerEncounterDialogue();
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let kMoving = false;
  let pMoving = false;

  if (!inDialogue && !isFadingOut) {
    // Player-controlled Knight movement
    if (keys['w'] || keys['arrowup']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      kY += speed;
      kMoving = true;
    }

    // Clamp vertical movement to ground/walkable path
    const minWalkY = currentArea === 'garden' ? 465 : 440;
    const maxWalkY = Math.min(window.innerHeight - 55, 620);
    if (kY < minWalkY) kY = minWalkY;
    if (kY > maxWalkY) kY = maxWalkY;

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

    if (kX < 10) kX = 10;

    // Area transition: Player walks Knight to the right edge of Dragon's Hall -> Royal Garden
    if (currentArea === 'hall') {
      if (arrowRight) {
        arrowRight.style.display = 'flex';
        if (kX > window.innerWidth - 280) {
          arrowRight.classList.add('highlight');
        } else {
          arrowRight.classList.remove('highlight');
        }
      }

      if (kX >= window.innerWidth - 130) {
        enterRoyalGardenFromLeft();
      }
    } else if (currentArea === 'garden') {
      if (arrowRight) arrowRight.style.display = 'none';
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    }

    // Princess walks from right to the middle of the garden, stops, and calls the Knight over
    if (currentArea === 'garden' && princessActive && princessWalkingToCenter) {
      const centerStopX = window.innerWidth * 0.54;

      if (pX > centerStopX) {
        pX -= 4.5;
        pMoving = true;
        princess.classList.add('facing-left');
        princess.classList.remove('facing-right');
      } else {
        pX = centerStopX;
        princessWalkingToCenter = false;
        princessReadyToTalk = true;
        pMoving = false;

        // She spots her Knight and calls him over!
        triggerEmote('princess', '💕');
        triggerEmote('knight', '❗');
        showActionFeedback("Sir Knight! Over here!", pX + 48, pY - 155);
        objectiveText.textContent = "Objective: Talk to the Princess.";
      }
    }

    // --- TASK MARKER & PROMPT FOR "TALK TO PRINCESS" ---
    canInteract = false;
    if (taskMarker) taskMarker.classList.add('hidden');
    if (interactionPrompt) interactionPrompt.classList.add('hidden');

    if (currentArea === 'garden' && sceneStage === 1 && princessReadyToTalk) {
      if (kX <= pX) {
        princess.classList.add('facing-left');
        princess.classList.remove('facing-right');
      } else {
        princess.classList.add('facing-right');
        princess.classList.remove('facing-left');
      }

      if (taskMarker) {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = (pX + 35) + 'px';
        taskMarker.style.top = (pY - 150) + 'px';
      }

      if (Math.abs(kX - pX) < 180) {
        canInteract = true;
        if (interactionPrompt) {
          interactionPrompt.textContent = "Press [E] to Talk to Princess";
          interactionPrompt.classList.remove('hidden');
        }
      }
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
    princess.classList.toggle('running', pMoving);
  }

  positionEmotesNow();
  requestAnimationFrame(gameLoop);
}

gameLoop();
