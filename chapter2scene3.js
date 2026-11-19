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
let princessWalkingToRightSpot = false;
let princessReadyToTalk = false;
let princessWalkingAway = false;
let princessPartingLineShown = false;

let inDialogue = false;
let sceneComplete = false;
let isFadingOut = false;

// Scene Stages:
// 0 = In Dragon's Hall: player walks Knight right to the Royal Garden
// 1 = In Royal Garden: Princess walks slightly onto the right side, calls Knight over -> "Talk to Princess" task
// 2 = Multi-choice flirting, date ask, (Knight's Internal) & sneak-out plan
// 3 = Princess walks away to the right with a parting line, then Knight panics once she's out of sight -> Chapter ends
let sceneStage = 0;
let canInteract = false;
let popupTimeout = null;

// --- EMOTE BUBBLES & (KNIGHT'S INTERNAL) THOUGHT BAR ---
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
  if (knight && knightEmote) {
    knightEmote.style.left = (kX + 60) + 'px';
    knightEmote.style.top = (kY - 165) + 'px';
  }
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

// Pure black fade-out to end Chapter 2 (no text)
function fadeOutEndOfChapter(nextUrl = null) {
  if (isFadingOut) return;
  isFadingOut = true;

  if (interactionPrompt) interactionPrompt.classList.add('hidden');
  if (taskMarker) taskMarker.classList.add('hidden');
  if (thoughtBox) thoughtBox.classList.add('hidden');
  if (dialogueBox) dialogueBox.classList.add('hidden');

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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

// --- DIALOGUE ENGINE WITH MULTI-CHOICE, (KNIGHT'S INTERNAL) & < > ARROWS ---
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

  if (princessActive && princess && !princessWalkingAway) {
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
    dialogueHint.textContent = "Choose a response (click or press [1] / [2] / [3])";

    node.choices.forEach((choice, idx) => {
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
    text: "“Footsteps beyond the hall... yet no watchman is assigned to the garden at this hour.”",
    thought: "(Knight's Internal) Soft steps against the flagstones. Too quiet for a patrol... I ought to look.",
    knightEmote: "👂"
  }
];

const gardenEncounterNodes = [
  {
    speaker: "Princess",
    text: "“How swift of you to answer the call. Tell me, Knight—do you patrol the garden by duty, or did your steps quicken hoping it was I who awaited?”",
    thought: "(Knight's Internal) She stands there like she commands the very wind. Why does my chest tighten every time she turns that gaze on me?",
    princessEmote: "😏",
    knightEmote: "😳"
  },
  {
    speaker: "Knight",
    text: "“Your Highness—forgive me. I heard movement and came at once to ensure no harm had—”",
    thought: "(Knight's Internal) My tongue nearly tripped over my own gorget. She is just a few paces away, and the evening air around her is ruining my focus.",
    knightEmote: "🥵",
    princessEmote: "✨"
  },
  {
    speaker: "Princess",
    text: "“Spare me the rehearsed caution. I grow weary of seeing you only as a shadow behind iron. Tonight, you will escort me—a proper outing, away from courtly eyes.”",
    thought: "(Knight's Internal) A... an outing? With me? My wits have deserted me entirely.",
    princessEmote: "😘",
    knightEmote: "😵‍💫",
    choices: [
      {
        label: "1. (Flustered & devoted) \"An outing... with me? Your Highness, I—yes. Name the hour, and I shall be there.\"",
        knightEmote: "😳",
        princessEmote: "🥰",
        followUp: [
          {
            speaker: "Princess",
            text: "“Bold words for a man whose pulse I can practically hear through his breastplate. Do not dare keep me waiting.”",
            thought: "(Knight's Internal) She caught me off guard again. At this rate, my armor won't hide a thing.",
            princessEmote: "🔥",
            knightEmote: "💓"
          }
        ]
      },
      {
        label: "2. (Trying to sound composed, failing) \"If it is your wish, Your Highness... I accept the charge. Strictly as your guard, of course.\"",
        knightEmote: "💧",
        princessEmote: "🤭",
        followUp: [
          {
            speaker: "Princess",
            text: "“'Strictly as my guard'? How terribly convincing—especially with color rising to your ears. Play whatever role you like tonight.”",
            thought: "(Knight's Internal) She sees right through me. Every ounce of my composure just vanished.",
            princessEmote: "💖",
            knightEmote: "😳"
          }
        ]
      },
      {
        label: "3. (Quietly intense) \"You have no idea how long I have wished to hear you ask that, Your Highness.\"",
        knightEmote: "💘",
        princessEmote: "😍",
        followUp: [
          {
            speaker: "Princess",
            text: "“Careful, Knight... speak with that much conviction and I may hold you to far more than a simple walk tonight.”",
            thought: "(Knight's Internal) Her eyes held mine a second too long. My heart is hammering against my ribs.",
            princessEmote: "✨",
            knightEmote: "❤️‍🔥"
          }
        ]
      }
    ]
  },
  {
    speaker: "Knight",
    text: "“Listen closely, Your Highness. Slip away late tonight—no guards are posted in the chambers or the library at that hour, so your path will be clear.”",
    thought: "(Knight's Internal) Pull yourself together, Knight. Think clearly—if she slips out tonight, every step must be timed.",
    knightEmote: "🤯",
    princessEmote: "😉"
  },
  {
    speaker: "Knight",
    text: "“Yet tread lightly near the royal wing: the King will be in his chambers then. The guards withdraw solely to grant him privacy—one careless sound could undo us both.”",
    thought: "(Knight's Internal) No guards in the chambers or library for the King's privacy... one wrong step near his door and we're finished.",
    knightEmote: "🤫",
    princessEmote: "😏"
  },
  {
    speaker: "Princess",
    text: "“No guards in the chambers or the library, and the King keeping his privacy... then the path is already half-won. I shall slip past unseen.”",
    thought: "(Knight's Internal) She speaks of treasonous night walks like a royal decree. I am completely in over my head.",
    princessEmote: "💘",
    knightEmote: "💓"
  }
];

const princessPartingNodes = [
  {
    speaker: "Princess",
    text: "“Do not miss me too much before tonight, Knight.”",
    thought: "(Knight's Internal) Did she just—?! My mind is still spinning from that parting look!",
    princessEmote: "💋",
    knightEmote: "😵‍💫"
  }
];

const knightAfterDeparturePanicNodes = [
  {
    speaker: "Knight",
    text: "“Y-Your Highness—! Wait, tonight?! By the gods, I just agreed to sneak the Princess past the King's chambers!”",
    thought: "(Knight's Internal) PANIC. Full panic. No guards in the library or chambers, the King right there in his rooms, and she's walking away smiling like nothing happened!",
    knightEmote: "😱"
  },
  {
    speaker: "Knight",
    text: "“I need a moment to breathe before the night falls... if we get caught, it's over for both of us!”",
    thought: "(Knight's Internal) Deep breaths... deep breaths. Tonight is going to be the longest night of my life.",
    knightEmote: "🤯"
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

  // Princess enters from the right edge and stops slightly into the right section of the garden
  princessActive = true;
  princessWalkingToRightSpot = true;
  princessReadyToTalk = false;
  princessWalkingAway = false;
  princessPartingLineShown = false;
  pX = window.innerWidth + 60;
  pY = 560;
  princess.classList.remove('hidden');
  princess.classList.add('facing-left');
  princess.classList.remove('facing-right');

  objectiveText.textContent = "Objective: Someone stepped into the right side of the garden...";
}

function triggerEncounterDialogue() {
  sceneStage = 2;
  princessReadyToTalk = false;
  canInteract = false;
  if (taskMarker) taskMarker.classList.add('hidden');
  if (interactionPrompt) interactionPrompt.classList.add('hidden');

  startDialogue(gardenEncounterNodes, () => {
    // Princess walks away to the right and delivers her parting line
    sceneStage = 3;
    princessWalkingAway = true;
    princessPartingLineShown = false;
    princess.classList.remove('facing-left');
    princess.classList.add('facing-right');
    objectiveText.textContent = "Objective: Watch the Princess head back...";
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
      if (k === '3' && btns[2]) btns[2].click();
    } else if (k === 'e' || k === ' ') {
      advanceDialogue();
    }
    return;
  }

  // Talk to Princess once she calls the Knight over on the right side of the garden
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

    // Princess enters from the right and stops just a little way into the right section of the garden
    if (currentArea === 'garden' && princessActive && princessWalkingToRightSpot) {
      const rightGardenStopX = Math.max(520, window.innerWidth * 0.72);

      if (pX > rightGardenStopX) {
        pX -= 4.5;
        pMoving = true;
        princess.classList.add('facing-left');
        princess.classList.remove('facing-right');
      } else {
        pX = rightGardenStopX;
        princessWalkingToRightSpot = false;
        princessReadyToTalk = true;
        pMoving = false;

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

      if (Math.hypot(kX - pX, kY - pY) < 190) {
        canInteract = true;
        if (interactionPrompt) {
          interactionPrompt.textContent = "Press [E] to Talk to Princess";
          interactionPrompt.classList.remove('hidden');
        }
      }
    }

    // Princess walks off to the right after arranging the plan
    if (currentArea === 'garden' && princessActive && princessWalkingAway) {
      princess.classList.remove('facing-left');
      princess.classList.add('facing-right');
      pX += 4.2;
      pMoving = true;

      if (!princessPartingLineShown && pX >= window.innerWidth * 0.8) {
        princessPartingLineShown = true;
        princessWalkingAway = false;
        pMoving = false;
        startDialogue(princessPartingNodes, () => {
          princessWalkingAway = true;
        });
      } else if (pX > window.innerWidth + 120) {
        // Out of sight -> Knight panics and Chapter 2 ends
        princessActive = false;
        princessWalkingAway = false;
        princess.classList.add('hidden');
        sceneComplete = true;
        objectiveText.textContent = "✅ Chapter 2 Complete — A midnight plan is set...";

        startDialogue(knightAfterDeparturePanicNodes, () => {
          fadeOutEndOfChapter();
        });
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
