
// Key codes for controls
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

// Game dimensions I have taken them in rem 
const GAME_WIDTH = 50;
const GAME_HEIGHT = 35;

// DOM elements for score, lives, level, and highest score
const score = document.getElementById("score-num");
const lives = document.getElementById("lives-cnt");
const level = document.getElementById("level-cnt");
const highestScore = document.getElementById("highestScore");

// Loading highest score from localStorage and display it
if (localStorage.getItem("highestScore")) {
  highestScore.textContent = Number(localStorage.getItem("highestScore"));
}

// DOM elements for game container, lose and win screens
//Global declaration to provide access to all the functions
const $container = document.querySelector(".main");
const $lose = document.querySelector(".gameEnd");
const $win = document.querySelector(".win");

// Maintaining Game state object that would be static for every new game
const STATE = {
  x_pos: 0, // Player's x position
  y_pos: 0, // Player's y position
  move_right: false, // Direction flags for player movement
  move_left: false,
  shoot: false,
  lasers: [], // Arrays to store active lasers and enemy lasers
  enemyLasers: [],
  enemies: [], // Array to store enemy objects
  spaceship_width: 2.4, // Player spaceship width
  enemy_width: 2.9, // Enemy width
  cooldown: 0, // Cooldown for shooting
  number_of_enemies: 32, // Total number of enemies
  enemy_cooldown: 0, // Cooldown for enemy shooting
  gameOver: false, // Game over flag
  score: 0, // Player's score
  lives: 3, // Player's lives
  level: 1, // Current game level

  lastMoveDownTime: null, // Timer for moving enemies down
  moveDownInterval: 6000, // Interval time for moving enemies down
  moveDownAmount: 2.8, // Amount by which enemies move down
  enemies_y: 0, // Initial y position for enemies
};

// Function to make the defender(olayer) blink 
function makeDefenderBlink() {
  const defender = document.querySelector(".player");

  if (defender) {
    defender.classList.add("blink"); // Adding blinking class
    setTimeout(() => {
      defender.classList.remove("blink"); // Removing blinking class after 3 seconds
    }, 3000);
  }
}

// Function to delete a laser from the game
function deleteLaser(lasers, laser, $laser) {
  const index = lasers.indexOf(laser);
  if (index !== -1) {
    lasers.splice(index, 1); // Removing laser from the array

    const $container = document.querySelector(".main");

    if ($container.contains($laser)) {
      $container.removeChild($laser); // Removing the laser element from the DOM
    }
  } else {
    console.warn("Laser not found in the array.");
  }
}

// Function to check if two rectangles collide
function collideRect(rect1, rect2) {
  return !(
    rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top
  );
}

// Function to create a new enemy
function createEnemy($container, x, y) {
  const $enemy = document.createElement("img");
  $enemy.src = "assets/alien.png";
  $enemy.className = "enemy";
  $container.appendChild($enemy);
  const enemy_cooldown = Math.floor(Math.random() * 250);
  const enemy = { x, y, $enemy, enemy_cooldown };
  STATE.enemies.push(enemy);
  setSize($enemy, STATE.enemy_width);
  setPosition($enemy, x, y);
}

// Function to move enemies down the screen
function moveEnemiesDown() {
  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    enemy.y += STATE.moveDownAmount; // Move enemy down
    setPosition(enemy.$enemy, enemy.x, enemy.y);
    if (enemy.y >= GAME_HEIGHT - 4.5) STATE.gameOver = true; // Checking if game over
  }

  STATE.lastMoveDownTime = setTimeout(moveEnemiesDown, STATE.moveDownInterval); // Repeating untill game is over
}

// Function to update enemies positions and handle enemy shooting
function updateEnemies($container) {
  const dx = Math.sin(Date.now() / 500) * 2.3; // Sinusoidal movement for left and right

  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const a = enemy.x + dx;
    const b = enemy.y;
    setPosition(enemy.$enemy, a, b);

    if (enemy.enemy_cooldown <= 0) {
      createEnemyLaser($container, a, b - 14); // Create enemy laser
      enemy.enemy_cooldown = Math.floor(Math.random() * 200) + 120;
    }
    enemy.enemy_cooldown -= 0.3; // Decrease cooldown
  }
}

// Function to create an enemy laser
function createEnemyLaser($container, x, y) {
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "assets/enemyLaser.png";
  $enemyLaser.className = "enemyLaser";
  $container.appendChild($enemyLaser);
  const enemyLaser = { x, y, $enemyLaser };
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
}

// Function to update enemy lasers positions and check for collisions
function updateEnemyLaser() {
  const enemyLasers = STATE.enemyLasers;
  for (let i = 0; i < enemyLasers.length; i++) {
    const enemyLaser = enemyLasers[i];
    enemyLaser.y += 0.1; // Move laser down

    if (enemyLaser.y > GAME_HEIGHT - 13) {
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser); // Remove laser if it goes off screen
    }
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document
      .querySelector(".player")
      .getBoundingClientRect();
    if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
      STATE.lives -= 1; // Reduce lives on collision
      lives.textContent = STATE.lives;
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
      STATE.score -= 20; // Reduce score on collision
      makeDefenderBlink(); // Make player blink
      if (STATE.score < 0) STATE.score = 0; // Ensure score does not go below 0
      score.textContent = STATE.score;
      if (STATE.lives === 0) STATE.gameOver = true; // End game if lives are 0
    }
    setPosition(
      enemyLaser.$enemyLaser,
      enemyLaser.x + STATE.enemy_width / 2,
      enemyLaser.y + 15
    );
  }
}

// Function to set the position of an element using transform
function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}rem, ${y}rem)`;
}

// Function to set the size of an element
function setSize($element, width) {
  $element.style.width = `${width}rem`;
  $element.style.height = "auto"; // Maintain aspect ratio
}

// Function to bound the x position of the player
function bound(x) {
  if (x >= GAME_WIDTH - STATE.spaceship_width) {
    STATE.x_pos = GAME_WIDTH - STATE.spaceship_width;
    return GAME_WIDTH - STATE.spaceship_width;
  }
  if (x <= 0) {
    STATE.x_pos = 0;
    return 0;
  }
  return x;
}

// Function to create the player character
function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT;
  const $player = document.createElement("img");
  $player.src = "assets/defender.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

// Function to update the player's position and handle shooting
function updatePlayer() {
  if (STATE.move_left) {
    STATE.x_pos -= 0.11; // Move left
  }
  if (STATE.move_right) {
    STATE.x_pos += 0.11; // Move right
  }
  if (STATE.shoot && STATE.cooldown <= 0) {
    createLaser(
      $container,
      STATE.x_pos - STATE.spaceship_width / 2,
      STATE.y_pos
    );
    STATE.cooldown = 30; // Reset shooting cooldown
  }
  const $player = document.querySelector(".player");
  setPosition($player, bound(STATE.x_pos), STATE.y_pos - 0.75);
  if (STATE.cooldown > 0) {
    STATE.cooldown -= 0.8; // Decrease cooldown over time
  }
}

// Function to update the high score in localStorage
function updateHighScore() {
  const storedScore = localStorage.getItem("highestScore");
  const highScore = storedScore ? Number(storedScore) : 0;

  if (highScore < STATE.score) {
    localStorage.setItem("highestScore", String(STATE.score));
    highestScore.textContent = STATE.score;
  }
}

// Function to create a laser shot by the player
function createLaser($container, x, y) {
  const $laser = document.createElement("img");
  $laser.src = "assets/laser.png";
  $laser.className = "laser";
  $container.appendChild($laser);
  const laser = { x, y, $laser };
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
}

// Function to update laser positions and check for collisions with enemies
function updateLaser($container) {
  const lasers = STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y -= 0.35; // Move laser up

    if (laser.y < 2.7) {
      deleteLaser(lasers, laser, laser.$laser); // Remove laser if it goes off screen
    }

    const laser_rectangle = laser.$laser.getBoundingClientRect();
    const enemies = STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
      if (collideRect(enemy_rectangle, laser_rectangle)) {
        deleteLaser(lasers, laser, laser.$laser); // Remove laser on hit
        const index = enemies.indexOf(enemy);
        enemies.splice(index, 1); // Remove enemy from array
        $container.removeChild(enemy.$enemy); // Remove enemy from DOM
        STATE.score += 10; // Increase score
        score.textContent = STATE.score;

        updateHighScore(); // Update high score if needed
      }
      setPosition(laser.$laser, laser.x, laser.y);
    }
  }
}

// Function to handle key press events
function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true; // Set flag for moving right
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true; // Set flag for moving left
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true; // Set flag for shooting
  }
}

// Function to handle key release events
function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false; // Clear flag for moving right
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false; // Clear flag for moving left
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false; // Clear flag for shooting
  }
}

// Main game loop function
function main(playerName) {
  if (STATE.gameOver) {
    clearTimeout(STATE.lastMoveDownTime); // Stop enemy movement
    gameEnd($lose, playerName); // End game
    return;
  }
  if (STATE.enemies.length === 0) {
    clearTimeout(STATE.lastMoveDownTime); // Stop enemy movement
    STATE.enemies = [];
    STATE.moveDownInterval -= 500; // Decrease interval for moving enemies down
    STATE.level += 1; // Increase level
    STATE.moveDownAmount += 0.4; // Increase move down amount

    console.log(STATE.level);

    if (STATE.level === 7) {
      gameEnd($win, playerName); // Win the game
      return;
    }
    level.textContent = STATE.level; // Update level display
    let maxLevel = STATE.level;
    if(maxLevel === 6){
      maxLevel-=1;
      STATE.lives +=1; // Award extra life at level 6
    }
    for (let i = 0; i < maxLevel; i++) {
      createEnemies($container, STATE.enemies_y); // Create new enemies
      STATE.enemies_y += 3; // Increment y position for enemies
    }
    STATE.enemies_y = 0; // Reset enemies y position
    moveEnemiesDown(); // Start moving enemies down
  }

  updatePlayer(); // Update player position and shooting
  updateEnemies($container); // Update enemy positions and shooting
  updateLaser($container); // Update player lasers
  updateEnemyLaser($container); // Update enemy lasers

  window.requestAnimationFrame(() => main(playerName)); // Request next frame
}

// Function to create a row of enemies
function createEnemies($container, y) {
  for (let i = 0; i <= STATE.number_of_enemies / 4; i++) {
    createEnemy($container, i * 5.25, y);
  }
}

// Event listeners for key press and release
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);

// Function to start the game
function gameBegin(playerName) {
  $container.classList.remove('hideDisplay'); // Show game container
  createPlayer($container); // Create player character
  createEnemies($container, STATE.enemies_y); // Create initial enemies
  moveEnemiesDown(); // Start moving enemies down
  main(playerName); // Start main game loop
}

// Function to end the game and show the result
function gameEnd(result, playerName) {
  $container.classList.add("hideDisplay"); // Hide game container
  result.classList.remove("hideDisplay"); // Show result screen
  saveScore(playerName); // Save player score
  displayLeaderBoard(); // Show leaderboard
}

// Function to hide the leaderboard and result screens
function userEntry() {
  document.querySelector(".leaderBoard-container").classList.add("hideDisplay");
  $lose.classList.add("hideDisplay");
  $win.classList.add("hideDisplay");  
}
// Initial call to hide leaderboard and result screens
userEntry();

// Function to handle the play button click for starting the game
function handlePlay() {
  const playerName = document.getElementById("userName").value;
  console.log(playerName);
  document.querySelector(".userEntry").style.display = "none"; 
  if (playerName) {
    gameBegin(playerName); // Start the game with the entered player name
  } else {
    window.location.reload(); // Reload the page if no name is entered
  }
}


// Function to save the player's score to the leaderboard
function saveScore(playerName) {
  console.log(playerName);
  const Score = STATE.score;
  const scores = JSON.parse(localStorage.getItem('leaderboard')) || [];
  
  const playerIndex = scores.findIndex(entry => entry.name === playerName);
  const highestScore = document.querySelector(".HighestScore");
  const currentScore = document.querySelector(".currentScore");
  
  if (playerIndex > -1) {
    if (Score > scores[playerIndex].score) {
      scores[playerIndex].score = Score; // Update score if higher
    }
    highestScore.textContent = scores[playerIndex].score;
    currentScore.textContent = Score;
  } else {
    scores.push({ name: playerName, score: Score }); // Add new player to leaderboard
    currentScore.textContent = Score;
    highestScore.textContent = Score;
  }
  
  scores.sort((a, b) => b.score - a.score); // Sort scores in descending order
  if (scores.length > 10) {
    scores.length = 10; // Limit leaderboard to top 10 scores
  }
  
  localStorage.setItem('leaderboard', JSON.stringify(scores)); // Save leaderboard to localStorage
}

// Function to get the leaderboard from localStorage
function getLeaderBoard() {
  console.log(JSON.parse(localStorage.getItem('leaderboard')));
  return JSON.parse(localStorage.getItem('leaderboard')) || [];
}

// Function to display the leaderboard on the screen
function displayLeaderBoard() {
  const leaderBoard = getLeaderBoard();
  const tableBody = document.querySelector('#table tbody');

  tableBody.innerHTML = ''; // Clear existing table rows

  leaderBoard.forEach(entry => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = entry.name;
    const scoreCell = document.createElement('td');
    scoreCell.textContent = entry.score;
    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    tableBody.appendChild(row);
  });

  document.querySelector(".leaderBoard-container").classList.remove("hideDisplay"); // Show leaderboard container
}
