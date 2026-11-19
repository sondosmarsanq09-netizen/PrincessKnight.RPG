function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', removeOverlay);
setTimeout(removeOverlay, 50);

const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
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

// Starting Knight on the garden path (scaled 4.8x like Scene 1)
let kX = 240;
let kY = 460;
const speed = 6;

// Princess starts off-screen / right side and walks in autonomously
let pX = window.innerWidth + 120;
let pY = 570;
let princessActive = false;
let princessWalkingToMeet = false;
let princessBumped = false;

let inDialogue = false;
let sceneComplete = false;
let isFadingOut = false;

// Scene Stages:
// 0 = Check noise at the fountain
// 1 = Princess walks in and bumps into Knight in middle of garden
// 2 = Conversation, flirting, date ask, inner monologue & sneak-out plan
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

function showActionFeedback(message) {
  if (!actionPopup) return;
  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = (kX + 60) + 'px';
  actionPopup.style.top = (kY - 40) + 'px';

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
  interactionPrompt.classList.add('hidden');
  taskMarker.classList.add('hidden');
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
const fountainCheckNodes = [
  {
    speaker: "Knight (Inner Monologue)",
    text: "Weird... footsteps and rustling near the fountain. Definitely not the dragon.",
    knightEmotion: "🤔",
    isMonologue: true
  },
  {
    speaker: "Princess",
    text: "Oh! Look who wandered out into the garden... were you looking for a distraction, Sir Knight?",
    princessEmotion: "😏",
    knightEmotion: "😳"
  }
];

const gardenEncounterNodes = [
  {
    speaker: "Knight (Inner Monologue)",
    text: "SHE WALKED RIGHT INTO ME. Why does she smell like vanilla and roses—and why is my armor suddenly way too tight?!",
    knightEmotion: "🥵",
    princessEmotion: "💖",
    isMonologue: true
  },
  {
    speaker: "Princess",
    text: "Careful, you're catching me off guard. Tell me... do you ever take that heavy armor off to actually take me out on a real date?",
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
        princessEmotion: " giggle"
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

function triggerPrincessEntrance() {
  sceneStage = 1;
  princessActive = true;
  princessWalkingToMeet = true;
  princess.classList.remove('hidden');
  pX = window.innerWidth + 80;
  pY = 570;
  objectiveText.textContent = "Objective: Something—or someone—is approaching in the garden...";
}

function triggerEncounterDialogue() {
  sceneStage = 2;
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

  if (k === 'e' && canInteract && !isFadingOut) {
    if (sceneStage === 0) {
      startDialogue(fountainCheckNodes, () => {
        triggerPrincessEntrance();
      });
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
    // Knight movement (player-controlled)
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
    if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;

    // Princess autonomous movement (never controlled by player)
    if (princessActive && princessWalkingToMeet && !princessBumped) {
      const targetX = Math.max(360, Math.min(window.innerWidth * 0.55, kX + 140));
      const targetY = 570;

      const dx = targetX - pX;
      const dy = targetY - pY;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        const pSpeed = 4.2;
        pX += (dx / dist) * pSpeed;
        pY += (dy / dist) * pSpeed;
        pMoving = true;

        if (dx < 0) {
          princess.classList.add('facing-left');
          princess.classList.remove('facing-right');
        } else {
          princess.classList.add('facing-right');
          princess.classList.remove('facing-left');
        }
      }

      // Bump into the Knight around the middle of the garden
      if (Math.abs(pX - kX) < 85 && Math.abs((pY - 110) - kY) < 120) {
        princessBumped = true;
        princessWalkingToMeet = false;
        pMoving = false;
        showActionFeedback("Bump!");
        triggerEncounterDialogue();
      }
    }

    // --- TASK MARKER AT FOUNTAIN ---
    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (sceneStage === 0) {
      const fountainX = Math.min(window.innerWidth - 220, 680);
      const fountainY = 520;

      taskMarker.classList.remove('hidden');
      taskMarker.style.left = fountainX + 'px';
      taskMarker.style.top = fountainY + 'px';

      if (Math.hypot(kX - fountainX, (kY + 70) - fountainY) < 100) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Check the Fountain";
        interactionPrompt.classList.remove('hidden');
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
