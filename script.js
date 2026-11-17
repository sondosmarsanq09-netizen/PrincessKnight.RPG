const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const objectiveText = document.getElementById('objective');

// --- BUILD UI & EMOTE ELEMENTS ---
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
`;
document.body.appendChild(dialogueBox);

let speakerNameEl = document.getElementById('speaker-name');
let dialogueTextEl = document.getElementById('dialogue-text');

let choiceContainer = document.createElement('div');
choiceContainer.id = 'choice-container';
choiceContainer.classList.add('hidden');
document.body.appendChild(choiceContainer);

// Floating Emote Bubbles for Knight and Princess
let knightEmote = document.createElement('div');
knightEmote.className = 'emote-bubble hidden';
document.body.appendChild(knightEmote);

let princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

// Coordinates & State
let kX = 200;
let kY = 400;
let pX = 500; 
let pY = 400;

const speed = 4;
let currentScene = 1;
let hasRing = false;
let inDialogue = false;

const keys = {};

window.addEventListener('keydown', (e) => {
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
    if (keys['a']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
    }
    if (keys['d']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
    }

    // Vertical boundary limits
    kY = Math.max(350, Math.min(550, kY));
    kX = Math.max(0, Math.min(window.innerWidth - 100, kX));

    // --- SC1 QUEST & SCENE PROGRESSION ---
    if (currentScene === 1) {
      // Step 1: Visit Blacksmith on the right
      if (!hasRing && kX >= window.innerWidth - 200) {
        hasRing = true;
        objectiveText.textContent = "Objective: Got the King's ring! Now walk left across town to the fountain gates.";
      }

      // Step 2: Walk left to transition to Fountain Scene
      if (hasRing && kX <= 10) {
        currentScene = 2;
        gameBody.style.backgroundImage = "url('image_54e525.png')";
        
        // Position Princess in the middle-right of the screen, facing left toward the knight
        pX = window.innerWidth / 2 + 100; 
        pY = 400;
        princess.classList.remove('hidden');
        princess.classList.add('facing-right'); // Flips her sprite to face left!
        princess.style.left = pX + 'px';
        princess.style.top = pY + 'px';

        // Knight enters from the right side jogging left
        kX = window.innerWidth - 150; 
        kY = 400;
        knight.classList.add('facing-left');

        objectiveText.textContent = "Objective: Approach the Princess by the fountain.";
      }
    } 
    else if (currentScene === 2) {
      // Check if knight walks close to her from the right
      let distance = Math.abs(kX - pX);
      if (kX < pX + 150 && distance < 100) {
        // SNAP KNIGHT into position to the left of the princess, facing RIGHT toward her!
        kX = pX - 90; 
        kY = pY;
        knight.classList.remove('facing-left'); // Forces Knight to face right toward her!
        startEncounter();
      }
    }
  }

  // Update DOM positions & Emote bubble coordinates
  knight.style.left = kX + 'px';
  knight.style.top = kY + 'px';

  princess.style.left = pX + 'px';
  princess.style.top = pY + 'px';

  knightEmote.style.left = (kX + 35) + 'px';
  knightEmote.style.top = (kY - 30) + 'px';

  princessEmote.style.left = (pX + 25) + 'px';
  princessEmote.style.top = (pY - 30) + 'px';

  if (kMoving) {
    knight.classList.add('running');
  } else {
    knight.classList.remove('running');
  }

  requestAnimationFrame(gameLoop);
}

// --- ENCOUNTER & DIALOGUE SEQUENCING WITH EMOTES ---
function startEncounter() {
  inDialogue = true;
  knight.classList.remove('running');
  objectiveText.textContent = "Event: Unexpected Encounter by the Fountain";
  
  // EMOTE: Knight is startled/confused
  knightEmote.textContent = "❓";
  knightEmote.classList.remove('hidden');

  // Step A: Subtle Inner Monologue + Spoken dialogue
  thoughtBox.classList.remove('hidden');
  thoughtBox.textContent = "...Royalty shouldn't be outside the palace. It's dangerous—they could easily be waylaid or robbed. Why is Her Highness out here alone?";

  dialogueBox.classList.remove('hidden');
  speakerNameEl.className = '';
  speakerNameEl.textContent = "Knight";
  dialogueTextEl.textContent = "“Your Highness?! What are you doing out here by the outer gates?!”";

  setTimeout(() => {
    knightEmote.classList.add('hidden');
    thoughtBox.classList.add('hidden');
    
    // EMOTE: Princess is annoyed/reactive
    princessEmote.textContent = "💢";
    princessEmote.classList.remove('hidden');

    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“Keep your voice down, you fool! I didn't slip past the guards just to have the town watch alerted by my own personal knight.”";

    setTimeout(() => {
      princessEmote.classList.add('hidden');
      
      // EMOTE: Princess teasing / Knight sweating
      princessEmote.textContent = "✨";
      princessEmote.classList.remove('hidden');
      knightEmote.textContent = "💧";
      knightEmote.classList.remove('hidden');

      dialogueTextEl.textContent = "“I need to get to the old gate road, and I cannot do it alone. Will you assist me, or must I find someone less... cowardly?”";
      presentChoices();
    }, 4500);

  }, 4500);
}

function presentChoices() {
  choiceContainer.innerHTML = '';
  choiceContainer.classList.remove('hidden');

  const options = [
    { text: "1. 'I am not cowardly! I am professionally concerned for your safety!'", responseType: 1 },
    { text: "2. (Stammering) 'I—uh... that is to say... protocol dictates—'", responseType: 2 },
    { text: "3. 'If the King finds out, he will have my head on a spike!'", responseType: 3 }
  ];

  options.forEach(opt => {
    let btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      choiceContainer.classList.add('hidden');
      princessEmote.classList.add('hidden');
      knightEmote.classList.add('hidden');
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
    knightEmote.textContent = "😳";
  } else if (type === 2) {
    dialogueTextEl.textContent = "“I—uh... that is to say... protocol dictates—oh, by the gods.”";
    thoughtBox.textContent = "(Internal) She's actually flirting with me. My entire nervous system is short-circuiting.";
    knightEmote.textContent = "⚡";
  } else if (type === 3) {
    dialogueTextEl.textContent = "“If the King finds out, he will have my head on a spike!”";
    thoughtBox.textContent = "(Internal) She's glaring at me now... but gods, even when she's furious, she's breathtaking.";
    knightEmote.textContent = "💓";
  }
  knightEmote.classList.remove('hidden');

  setTimeout(() => {
    thoughtBox.classList.add('hidden');
    knightEmote.classList.add('hidden');
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    
    if (type === 1) {
      dialogueTextEl.textContent = "“Professional concern? Is that what you call shaking in your greaves? Get moving toward the Old Gate Road.”";
    } else if (type === 2) {
      dialogueTextEl.textContent = "“Protocol doesn't look very steady on its feet right now. Lead the way to the Old Gate Road.”";
    } else {
      dialogueTextEl.textContent = "“Then let's pray he doesn't find out. To the Old Gate Road, Knight.”";
    }

    setTimeout(() => {
      dialogueBox.classList.add('hidden');
      inDialogue = false;
      objectiveText.textContent = "Objective: Walk with the Princess toward the Old Gate Road on the left.";
    }, 4500);

  }, 4500);
}

// Start game loop
gameLoop();
