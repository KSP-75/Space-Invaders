const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;



const GAME_WIDTH = 50;
const GAME_HEIGHT = 35;

const score = document.getElementById("score-num");
const lives = document.getElementById("lives-cnt");
const level = document.getElementById("level-cnt");
const highestScore = document.getElementById("highestScore");
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
  spaceship_width: 2.4,
  enemy_width: 2.9,
  cooldown: 0,
  number_of_enemies: 32,
  enemy_cooldown: 0,
  gameOver: false,
  score: 0,
  lives: 3,
  level : 1,

  lastMoveDownTime: null,
  moveDownInterval: 6000, 
  moveDownAmount: 2.8, 
  enemies_y : 0,
};


function makeDefenderBlink(){
  const defender = document.querySelector('.player');

  if(defender){
    defender.classList.add('blink');
    setTimeout(() => {
      defender.classList.remove('blink');
    }, 3000);
  }
}

// Delete Laser
function deleteLaser(lasers, laser, $laser) {
  const index = lasers.indexOf(laser);
  if (index !== -1) {
    lasers.splice(index, 1); // Remove laser from the array

    const $container = document.querySelector(".main");

    if ($container.contains($laser)) {
      $container.removeChild($laser); // Remove the laser element from the DOM
    }
  } 
  else {
    console.warn("Laser not found in the array.");
  }
}


function collideRect(rect1, rect2) {
  return !(rect2.left > rect1.right || 
    rect2.right < rect1.left || 
    rect2.top > rect1.bottom || 
    rect2.bottom < rect1.top);
}


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

function moveEnemiesDown() {
  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    enemy.y += STATE.moveDownAmount; 
    setPosition(enemy.$enemy, enemy.x, enemy.y);
    if( enemy.y >= GAME_HEIGHT-4.5) STATE.gameOver = true;
  }

  STATE.lastMoveDownTime = setTimeout(moveEnemiesDown, STATE.moveDownInterval);
}

function updateEnemies($container) {
  const dx = Math.sin(Date.now() / 500) * 2.3;

  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const a = enemy.x + dx;
    const b = enemy.y;
    setPosition(enemy.$enemy, a, b);



    if (enemy.enemy_cooldown <= 0) {
      createEnemyLaser($container, a, b-14);
      enemy.enemy_cooldown = Math.floor(Math.random() * 200) + 120;
    }
    enemy.enemy_cooldown -= 0.3;
  }
}


function createEnemyLaser($container, x, y) {
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "assets/enemyLaser.png";
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
    enemyLaser.y += 0.1;

    if (enemyLaser.y > GAME_HEIGHT - 13) {
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document.querySelector(".player").getBoundingClientRect();
    if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
      STATE.lives -= 1;
      lives.textContent = STATE.lives;
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
      STATE.score -=20;
      makeDefenderBlink();
    if(STATE.score < 0) STATE.score = 0;
      score.textContent = STATE.score;
      if (STATE.lives === 0) STATE.gameOver = true;
    }
    setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width / 2, enemyLaser.y + 15);
  }
}


function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}rem, ${y}rem)`;
}

function setSize($element, width) {
  $element.style.width = `${width}rem`;
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
  STATE.y_pos = GAME_HEIGHT;
  console.log(STATE.y_pos)
  const $player = document.createElement("img");
  $player.src = "assets/defender.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

function updatePlayer() {
  if (STATE.move_left) {
    STATE.x_pos -= 0.11;
  }
  if (STATE.move_right) {
    STATE.x_pos += 0.11;
  }
  if (STATE.shoot && STATE.cooldown <= 0) {
    createLaser($container, STATE.x_pos - STATE.spaceship_width / 2, STATE.y_pos);
    STATE.cooldown = 30;
  }
  const $player = document.querySelector(".player");
  setPosition($player, bound(STATE.x_pos), STATE.y_pos - 0.75);
  if (STATE.cooldown > 0) {
    STATE.cooldown -= 0.80;
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
  $laser.src = "assets/laser.png";
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
    laser.y -= 0.35;
    if (laser.y < 2.7) {
      deleteLaser(lasers, laser, laser.$laser);
    }
    
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
      setPosition(laser.$laser, laser.x, laser.y);
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


function main() {
  if (STATE.gameOver) {
    clearTimeout(STATE.lastMoveDownTime);
    document.querySelector(".gameEnd").style.display = "block";
    return;
  }
  if (STATE.enemies.length === 0) {
    clearTimeout(STATE.lastMoveDownTime);
    STATE.enemies =[];
    // STATE.lasers = [];
    STATE.moveDownInterval -=500;
    STATE.level += 1;
    STATE.moveDownAmount += 0.50;
    
    console.log(STATE.level);
    
    if(STATE.level === 7){
      document.querySelector(".win").style.display = "block";
      return;
    }
    level.textContent = STATE.level;
    for(let i = 0 ; i < STATE.level; i++){
      createEnemies($container , STATE.enemies_y);
      STATE.enemies_y +=3;
    }
    STATE.enemies_y = 0;
    moveEnemiesDown();
    // createEnemies($container);
  }
  
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);
  
  window.requestAnimationFrame(main);
}


function createEnemies($container ,y) {
  for (let i = 0; i <= STATE.number_of_enemies / 4; i++) {
    createEnemy($container, i * 5.25, y);
  }
}

const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container,STATE.enemies_y);
moveEnemiesDown();


window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
main();
