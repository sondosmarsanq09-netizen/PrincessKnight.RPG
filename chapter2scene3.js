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
const knightEmotion = document.getElementById('knight-emotion');
const princessEmotion = document.getElementById('princess-emotion');

const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
const dialogueChoices = document.getElementById('dialogue-choices');
const dialogueHint = document.getElementById('dialogue-hint');

// Knight spawns in Dragon's Hall (matching Scene 1 floor coordinates)
let kX = 400;
let kY = 450;
const speed = 6;
let currentArea = 'hall'; // 'hall' -> 'garden'

// Princess autonomous state in the garden
let pX = window.innerWidth + 120;
let pY = 570;
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

function setEmotion(target, emoji) {
  const badge = target === 'knight' ? knightEmotion : princessEmotion;
  if (!badge) return;

  if (!emoji) {
    badge.classList.add('hidden');
    badge.textContent = '';
    return;
  }

  badge.textContent = emoji;
  badge.classList.remove('hidden');
}

function updateEmotionPositions() {
  if (knight && knightEmotion && !knightEmotion.classList.contains('hidden')) {
    knightEmotion.style.left = (kX + 60) + 'px';
    knightEmotion.style.top = (kY - 190) + 'px';
  }
  if (princess && princessEmotion && !princessEmotion.classList.contains('hidden')) {
    princessEmotion.style.left = (pX + 48) + 'px';
    princessEmotion.style.top = (pY - 125) + 'px';
  }
}

function showActionFeedback(message, targetX = kX + 60, targetY = kY - 40) {
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

// --- DIALOGUE ENGINE WITH MULTI-CHOICE & INNER MONOLOGUE ---
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
  if (node.isMonologue) {
    dialogueBox.classList.add('monologue');
  } else {
    dialogueBox.classList.remove('monologue');
  }

  dialogueSpeaker.textContent = node.speaker;
  dialogueText.textContent = node.text;

  if (node.knightEmotion !== undefined) setEmotion('knight', node.knightEmotion);
  if (node.princessEmotion !== undefined) setEmotion('princess', node.princessEmotion);

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
    dialogueHint.textContent = "Click an option or press [1] / [2]";

    node.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = `${idx + 1}. ${choice.label}`;
      btn.addEventListener('click', () => selectChoice(choice));
      dialogueChoices.appendChild(btn);
    });
  } else {
    waitingForChoice = false;
    dialogueHint.textContent = "Press [E] or [Space] to continue";
  }
}

function selectChoice(choice) {
  if (!waitingForChoice) return;
  waitingForChoice = false;

  if (choice.knightEmotion !== undefined) setEmotion('knight', choice.knightEmotion);
  if (choice.princessEmotion !== undefined) setEmotion('princess', choice.princessEmotion);

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

function closeDialogue() {
  dialogueBox.classList.add('hidden');
  dialogueChoices.innerHTML = '';
  inDialogue = false;
  waitingForChoice = false;

  const cb = onDialogueFinish;
  onDialogueFinish = null;
  if (cb) cb();
}

// --- STORY DIALOGUE SCRIPTS ---
const openingFootstepsNodes = [
  {
    speaker: "Knight (Inner Monologue)",
    text: "Footsteps... someone is outside. I should go check who's in the garden.",
    knightEmotion: "👂",
    isMonologue: true
  }
];

const gardenEncounterNodes = [
  {
    speaker: "Princess",
    text: "There you are! I spotted you coming out from the hall. Were you patrolling... or looking for me?",
    princessEmotion: "😏",
    knightEmotion: "😳"
  },
  {
    speaker: "Knight (Inner Monologue)",
    text: "IT'S THE PRINCESS. Why does she smell like vanilla and roses—and why is my armor suddenly way too tight?!",
    knightEmotion: "🥵",
    princessEmotion: "💖",
    isMonologue: true
  },
  {
    speaker: "Princess",
    text: "Tell me, Sir Knight... do you ever take that heavy armor off to actually take me out on a real date?",
    princessEmotion: "😘",
    knightEmotion: "😵‍💫",
    choices: [
      {
        label: "Flustered & honest: \"Y-Yes. Whenever you say the word, Your Highness—I mean, whenever.\"",
        knightEmotion: "😳",
        princessEmotion: "🥰",
        followUp: [
          {
            speaker: "Princess",
            text: "Ooh, 'whenever I say the word'? Careful, or I might hold you to that tonight.",
            princessEmotion: "🔥",
            knightEmotion: "💓"
          }
        ]
      },
      {
        label: "Try to play it cool (and fail): \"A date? Right. Tactical moonlight reconnaissance. Very official.\"",
        knightEmotion: "🫠",
        princessEmotion: "🤭"
      }
    ]
  },
  {
    speaker: "Knight (Inner Monologue)",
    text: "BRAIN. Reboot. Okay, okay—stay calm! If we sneak out, we have to time it right so nobody spots us!",
    knightEmotion: "🤯",
    isMonologue: true
  },
  {
    speaker: "Knight",
    text: "Listen—meet me when the clock chimes late. There won't be any guards posted in the chambers or the library then, so you can slip out safely.",
    knightEmotion: "😌",
    princessEmotion: "✨"
  },
  {
    speaker: "Knight",
    text: "One catch though: the King will be in his chambers at that hour—that's why there are no guards around, to keep his privacy. Keep quiet and stay out of sight.",
    knightEmotion: "🤫",
    princessEmotion: "😉"
  },
  {
    speaker: "Princess",
    text: "No guards in the library and chambers, and the King wants his privacy... sounds like the easiest royal escape ever. Don't keep me waiting, Knight.",
    princessEmotion: "💘",
    knightEmotion: "❤️‍🔥"
  }
];

function enterRoyalGardenFromLeft() {
  currentArea = 'garden';
  sceneStage = 1;
  setEmotion('knight', null);

  if (arrowRight) arrowRight.style.display = 'none';
  if (gameBody) gameBody.style.backgroundImage = "url('RoyalGarden.png')";
  if (locationBanner) locationBanner.textContent = "📍 Royal Garden";

  // Knight walks in from the left edge (Dragon's Hall side)
  kX = 60;
  kY = 450;
  knight.classList.add('facing-right');
  knight.classList.remove('facing-left');

  // Princess walks in autonomously from the right side toward the middle of the garden
  princessActive = true;
  princessWalkingToCenter = true;
  princessReadyToTalk = false;
  pX = window.innerWidth + 60;
  pY = 570;
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
    setEmotion('knight', '💘');
    setEmotion('princess', '💕');
    setTimeout(() => {
      setEmotion('knight', null);
      setEmotion('princess', null);
    }, 2200);
  });
}

// Initial Dragon's Hall setup & opening footsteps message
if (gameBody) gameBody.style.backgroundImage = "url('PolishDragon.png')";
if (locationBanner) locationBanner.textContent = "📍 Dragon's Hall";
if (objectiveText) objectiveText.textContent = "Objective: Footsteps outside—walk right to check who is in the Royal Garden.";

setTimeout(() => {
  startDialogue(openingFootstepsNodes, () => {
    setEmotion('knight', null);
  });
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
    if (kY < 350) kY = 350;
    if (kY > window.innerHeight - 100) kY = window.innerHeight - 100;

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
        setEmotion('princess', '💕');
        setEmotion('knight', '❗');
        showActionFeedback("Sir Knight! Over here!", pX + 48, pY - 90);
        objectiveText.textContent = "Objective: Talk to the Princess.";
      }
    }

    // --- TASK MARKER & PROMPT FOR "TALK TO PRINCESS" ---
    canInteract = false;
    if (taskMarker) taskMarker.classList.add('hidden');
    if (interactionPrompt) interactionPrompt.classList.add('hidden');

    if (currentArea === 'garden' && sceneStage === 1 && princessReadyToTalk) {
      // Face Princess toward Knight as he walks over
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
        taskMarker.style.top = (pY - 120) + 'px';
      }

      // Generous interaction radius around the Princess so it never feels finicky
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

  updateEmotionPositions();
  requestAnimationFrame(gameLoop);
}

gameLoop();
