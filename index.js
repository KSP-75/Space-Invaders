const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 630;

const score = document.getElementById("score-num");
const lives = document.getElementById("lives-cnt");
const highestScore = document.getElementById("highestScore");
// localStorage.setItem("highestScore" , String(0));
if(localStorage.getItem('highestScore')){
  highestScore.textContent = Number(localStorage.getItem("highestScore"));
}

const STATE = {
  x_pos: 0,
  y_pos: 0,
  move_right: false,
  move_left: false,
  shoot: false,
  lasers: [],
  enemyLasers: [],
  enemies: [],
  spaceship_width: 50,
  enemy_width: 50,
  cooldown: 0,
  number_of_enemies: 32,
  enemy_cooldown: 0,
  gameOver: false,
  score: 0,
  lives: 3,
  lastMoveDownTime: null, // Track the last time enemies moved down
  moveDownInterval: 5500, // Interval in milliseconds
  moveDownAmount: 45, // Amount to move down
};

function collideRect(rect1, rect2) {
  return !(rect2.left > rect1.right || 
    rect2.right < rect1.left || 
    rect2.top > rect1.bottom || 
    rect2.bottom < rect1.top);
}


function createEnemy($container, x, y) {
  const $enemy = document.createElement("img");
  $enemy.src = "assests/alien.png";
  $enemy.className = "enemy";
  $container.appendChild($enemy);
  const enemy_cooldown = Math.floor(Math.random() * 150);
  const enemy = { x, y, $enemy, enemy_cooldown };
  STATE.enemies.push(enemy);
  setSize($enemy, STATE.enemy_width);
  setPosition($enemy, x-80, y);
}

function moveEnemiesDown() {
  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    enemy.y += STATE.moveDownAmount; // Move enemies down
    setPosition(enemy.$enemy, enemy.x, enemy.y);
    if( enemy.y >= GAME_HEIGHT-100) STATE.gameOver = true;
  }
  // Set up the next movement
  STATE.lastMoveDownTime = setTimeout(moveEnemiesDown, STATE.moveDownInterval);
}

function updateEnemies($container) {
  const dx = Math.sin(Date.now() / 500) * 45;

  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const a = enemy.x + dx;
    const b = enemy.y;
    setPosition(enemy.$enemy, a, b);


    if (enemy.enemy_cooldown <= 0) {
      createEnemyLaser($container, a, b);
      enemy.enemy_cooldown = Math.floor(Math.random() * 200) + 50;
    }
    enemy.enemy_cooldown -= 0.3;
  }
}


function createEnemyLaser($container, x, y) {
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "assests/enemyLaser.png";
  $enemyLaser.className = "enemyLaser";
  $container.appendChild($enemyLaser);
  const enemyLaser = { x, y, $enemyLaser };
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
}

function updateEnemyLaser() {
  const enemyLasers = STATE.enemyLasers;
  for (let i = 0; i < enemyLasers.length; i++) {
    const enemyLaser = enemyLasers[i];
    enemyLaser.y += 2;
    if (enemyLaser.y > GAME_HEIGHT - 30) {
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document.querySelector(".player").getBoundingClientRect();
    if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
      STATE.lives -= 1;
      console.log(STATE.lives);
      lives.textContent = STATE.lives;
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
      if (STATE.lives === 0) STATE.gameOver = true;
    }
    setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width / 2, enemyLaser.y + 15);
  }
}

// Delete Laser
function deleteLaser(lasers, laser, $laser) {
  const index = lasers.indexOf(laser);
  lasers.splice(index, 1);
  try{
    $container.removeChild($laser);
  }
  catch(e){
    console.log(e);
  } 
}

function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}px, ${y}px)`;
}

function setSize($element, width) {
  $element.style.width = `${width}px`;
  $element.style.height = "auto";
}

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


function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "assests/defender.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

function updatePlayer() {
  if (STATE.move_left) {
    STATE.x_pos -= 3;
  }
  if (STATE.move_right) {
    STATE.x_pos += 3;
  }
  if (STATE.shoot && STATE.cooldown <= 0) {
    createLaser($container, STATE.x_pos - STATE.spaceship_width / 2, STATE.y_pos);
    STATE.cooldown = 30;
  }
  const $player = document.querySelector(".player");
  setPosition($player, bound(STATE.x_pos), STATE.y_pos - 10);
  if (STATE.cooldown > 0) {
    STATE.cooldown -= 0.5;
  }
}

function updateHighScore(){
    const storedScore = localStorage.getItem('highestScore');

    const highScore = storedScore ? Number(storedScore) : 0;

    // console.log(storedScore);
    if(highScore < STATE.score){
      localStorage.setItem('highestScore' , String(STATE.score));
      highestScore.textContent = STATE.score;
    }
}



function createLaser($container, x, y) {
  const $laser = document.createElement("img");
  $laser.src = "assests/laser.png";
  $laser.className = "laser";
  $container.appendChild($laser);
  const laser = { x, y, $laser };
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
}

function updateLaser($container) {
  const lasers = STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y -= 4.5;
    if (laser.y < 0) {
      deleteLaser(lasers, laser, laser.$laser);
    }
    setPosition(laser.$laser, laser.x, laser.y);
    const laser_rectangle = laser.$laser.getBoundingClientRect();
    const enemies = STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
      if (collideRect(enemy_rectangle, laser_rectangle)) {
        deleteLaser(lasers, laser, laser.$laser);
        const index = enemies.indexOf(enemy);
        enemies.splice(index, 1);
        $container.removeChild(enemy.$enemy);
        STATE.score += 10;
        score.textContent = STATE.score;

        updateHighScore();
      }
    }
  }
}


function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true;
  }
}

function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false;
  }
}


function update() {
  if (STATE.gameOver) {
    clearTimeout(STATE.lastMoveDownTime);
    document.querySelector(".lose").style.display = "block";
    return;
  }
  if (STATE.enemies.length === 0) {
    // document.querySelector(".win").style.display = "block";
    // return;
    createEnemies($container);
  }
  
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);
  
  window.requestAnimationFrame(update);
}


function createEnemies($container) {
  for (let i = 0; i <= STATE.number_of_enemies / 4; i++) {
    createEnemy($container, i * 80, 30);
  }
  for (let i = 0; i <= STATE.number_of_enemies / 4; i++) {
    createEnemy($container, i * 80, 80);
  }
  for (let i = 0; i <= STATE.number_of_enemies / 4; i++) {
    createEnemy($container, i * 80, 130);
  }
}

// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container);
moveEnemiesDown();

// Key Press Event Listener
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
update();
