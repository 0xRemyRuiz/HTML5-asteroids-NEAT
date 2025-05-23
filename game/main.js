// Canvas Asteroids
//
// Copyright (c) 2010 Doug McInnes
//
// Refactored and Modified by Rémy RUIZ in 2024-2025
//
$(function () {
  var canvas = $("#canvas");
  // BASE GRAPHICS INIT
  var context = canvas[0].getContext("2d");

  function drawLine(x1, y1, x2, y2, color) {
    const tempColor = context.strokeStyle
    const tempLineWidth = context.lineWidth
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.lineWidth = .5
    context.strokeStyle = color
    context.stroke()
    context.lineWidth = tempLineWidth
    context.strokeStyle = tempColor
    context.closePath()
  }

  Text.context = context;
  Text.face = vector_battle;

  var gridWidth = Math.round(Game.canvasWidth / GRID_SIZE);
  var gridHeight = Math.round(Game.canvasHeight / GRID_SIZE);
  var grid = new Array(gridWidth);
  for (var i = 0; i < gridWidth; i++) {
    grid[i] = new Array(gridHeight);
    for (var j = 0; j < gridHeight; j++) {
      grid[i][j] = new GridNode();
    }
  }

  // set up the positional references
  for (var i = 0; i < gridWidth; i++) {
    for (var j = 0; j < gridHeight; j++) {
      var node   = grid[i][j];
      node.north = grid[i][(j == 0) ? gridHeight - 1 : j - 1];
      node.south = grid[i][(j == gridHeight - 1) ? 0 : j + 1];
      node.west  = grid[(i == 0) ? gridWidth - 1 : i - 1][j];
      node.east  = grid[(i == gridWidth - 1) ? 0 : i + 1][j];
    }
  }

  // set up borders
  for (var i = 0; i < gridWidth; i++) {
    grid[i][0].dupe.vertical              =  Game.canvasHeight;
    grid[i][gridHeight - 1].dupe.vertical = -Game.canvasHeight;
  }

  for (var j = 0; j < gridHeight; j++) {
    grid[0][j].dupe.horizontal             =  Game.canvasWidth;
    grid[gridWidth - 1][j].dupe.horizontal = -Game.canvasWidth;
  }

  var sprites = [];
  Game.sprites = sprites;

  // so all the sprites can use it
  Sprite.prototype.context = context;
  Sprite.prototype.grid    = grid;
  Sprite.prototype.matrix  = new Matrix(2, 3);

  var ship = new Ship();
  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;

  sprites.push(ship);

  ship.bullets = [];
  for (var i = 0; i < 10; i++) {
    var bull = new Bullet();
    ship.bullets.push(bull);
    sprites.push(bull);
  }
  Game.ship = ship;

  var bigAlien = new BigAlien();
  bigAlien.setup();
  sprites.push(bigAlien);
  Game.bigAlien = bigAlien;

  // var extraDude = new Ship();
  // extraDude.scale = 0.6;
  // extraDude.visible = true;
  // extraDude.preMove = null;
  // extraDude.children = [];

  var i, j = 0;

  var paused = false;
  var showFramerate = false;
  var avgFramerate = 0;
  var frameCount = 0;
  var elapsedCounter = 0;

  var lastFrame = Date.now();
  var thisFrame;
  var elapsed;
  var delta;

  var canvasNode = canvas[0];

  // shim layer with setTimeout fallback from here: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (/* function */ callback, /* DOMElement */ element) {
              window.setTimeout(callback, (1000 / 60) * RQ_FRAME_TIMER_SPEED_FACTOR);
            };
  })();

  // button viewer
  $watchup = $('#watch-up')
  $watchleft = $('#watch-left')
  $watchright = $('#watch-right')
  $watchspace = $('#watch-space')
  $watchaiup = $('#watch-ai-up')
  $watchaileft = $('#watch-ai-left')
  $watchairight = $('#watch-ai-right')
  $watchaispace = $('#watch-ai-space')

  // left panel display
  var current_panel = 2
  var keycodes_show = false
  var renderDangerDirection = 'none'
  var $renderDangerDirection = $("#render-danger-direction")
  var $ennemiesPanelList = null
  var ennemiesList = []
  var $value_panel = null
  var value_panel_on = false
  var $network_panel = null
  function mainLoop() {
    if (!webSocketConnected) {
      autoplay_is_on = false
      $('#autoplay-container').removeClass('true')
    }
    // draw canvas anyway
    context.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);

    if (KEY_STATUS.up && !$watchup.hasClass('active')) $watchup.addClass('active')
    else if (!KEY_STATUS.up && $watchup.hasClass('active')) !$watchup.removeClass('active')
    if (KEY_STATUS.left && !$watchleft.hasClass('active')) $watchleft.addClass('active')
    else if (!KEY_STATUS.left && $watchleft.hasClass('active')) !$watchleft.removeClass('active')
    if (KEY_STATUS.right && !$watchright.hasClass('active')) $watchright.addClass('active')
    else if (!KEY_STATUS.right && $watchright.hasClass('active')) !$watchright.removeClass('active')
    if (KEY_STATUS.space && !$watchspace.hasClass('active')) $watchspace.addClass('active')
    else if (!KEY_STATUS.space && $watchspace.hasClass('active')) !$watchspace.removeClass('active')

    if (LAST_AI_BUTTON_COMMAND.up && !$watchaiup.hasClass('active')) $watchaiup.addClass('active')
    else if (!LAST_AI_BUTTON_COMMAND.up && $watchaiup.hasClass('active')) !$watchaiup.removeClass('active')
    if (LAST_AI_BUTTON_COMMAND.left && !$watchaileft.hasClass('active')) $watchaileft.addClass('active')
    else if (!LAST_AI_BUTTON_COMMAND.left && $watchaileft.hasClass('active')) !$watchaileft.removeClass('active')
    if (LAST_AI_BUTTON_COMMAND.right && !$watchairight.hasClass('active')) $watchairight.addClass('active')
    else if (!LAST_AI_BUTTON_COMMAND.right && $watchairight.hasClass('active')) !$watchairight.removeClass('active')
    if (LAST_AI_BUTTON_COMMAND.space && !$watchaispace.hasClass('active')) $watchaispace.addClass('active')
    else if (!LAST_AI_BUTTON_COMMAND.space && $watchaispace.hasClass('active')) !$watchaispace.removeClass('active')

    ship.rx = Math.round(ship.x)
    ship.ry = Math.round(ship.y)

    if (current_panel === 0) {
      // DEBUG DATA VISUALIZATION
      $('#player_score').html(Game.score)
      $('#player_health').html(Game.lives)
      $('#player_speed_x').html(Math.round(ship.vel.x * 1e8) / 1e8)
      $('#player_speed_y').html(Math.round(ship.vel.y * 1e8) / 1e8)
      $('#player_orientation').html(Math.round(ship.rot)+"°")
      $('#player_position').html(ship.rx+"x / "+ship.ry+"y")
    }

    let listHTML = ""
    let dangerList = []
    for (let i = Game.sprites.length - 1; i >= 0; i--) {
      const el = Game.sprites[i]
      // sprite needs to be visible to be a potential danger
      if (el.visible && (el.name === "alienbullet" || el.name === "bigalien" || el.name === "asteroid")) {
        const danger = {
          type: el.name,
          target: el.name === "bigalien" || el.name === "asteroid",
          velX: Math.round(el.vel.x * 1e8) / 1e8,
          velY: Math.round(el.vel.y * 1e8) / 1e8,
          x: Math.round(el.x),
          y: Math.round(el.y),
          edge: el.edge,
        }
        // calculate distance (hypothenus) of danger for each 4 virtual position and the real position
        const cases = [
          [0, 0],
          [Game.canvasWidth, 0],
          [-Game.canvasWidth, 0],
          [0, Game.canvasHeight],
          [0, -Game.canvasHeight],
        ]
        const dists = []
        // TODO: improve this by checking only 2 other positions based on corner position of danger
        for (let j = 0; j < 5; j++) {
          const posX = ship.rx + cases[j][0]
          const posY = ship.ry + cases[j][1]
          dists.push({
            dist: Math.round(Math.sqrt(Math.abs(posX - danger.x) ** 2 + Math.abs(posY - danger.y) ** 2)),
            x: posX,
            y: posY,
            dangerX: danger.x - cases[j][0],
            dangerY: danger.y - cases[j][1],
          })
        }

        // determine which is way is closest to the danger
        let minPos = dists[0]
        // console.log(danger.x, danger.y, dists)
        for (let j = 1; j < 5; j++) {
          if (dists[j].dist < minPos.dist) {
            minPos = dists[j]
          }
        }

        // calculate direction degree based on the default game `ship.rot` calculation logic
        danger.dist = minPos.dist
        // c is the length of the visualization vector
        const c = 30
        // d is the distance minus the "outter edge" maximum distance from center of the polygon
        const d = danger.dist - Math.sqrt((danger.edge + 1) ** 2)
        if (minPos.x < danger.x) {
          if (minPos.y > danger.y) {
            const h = Math.abs(minPos.y - danger.y) / danger.dist
            const alpha = Math.asin(h)
            danger.dir = 90 - Math.round(alpha * 57.295779513)
            //--
            // DEBUG VISUALIZATION
            //--
              if (renderDangerDirection === 'min') {
                const a = c * h
                const b = Math.sqrt(c * c - a * a)
                drawLine(ship.x, ship.y, ship.x + b, ship.y - a, 'blue')
              } else if (renderDangerDirection === 'real') {
                if (minPos.x !== ship.rx || minPos.y !== ship.ry) {
                  drawLine(ship.x, ship.y, minPos.dangerX, minPos.dangerY, 'red')
                }
                const a = d * h
                const b = Math.sqrt(d * d - a * a)
                drawLine(minPos.x, minPos.y, minPos.x + b, minPos.y - a, 'red')
              }
          } else {
            const h = Math.abs(minPos.x - danger.x) / danger.dist
            const alpha = Math.asin(h)
            danger.dir = 180 - Math.round(alpha * 57.295779513)
            //--
            // DEBUG VISUALIZATION
            //--
              if (renderDangerDirection === 'min') {
                const a = c * h
                const b = Math.sqrt(c * c - a * a)
                drawLine(ship.x, ship.y, ship.x + a, ship.y + b, 'blue')
              } else if (renderDangerDirection === 'real') {
                if (minPos.x !== ship.rx || minPos.y !== ship.ry) {
                  drawLine(ship.x, ship.y, minPos.dangerX, minPos.dangerY, 'red')
                }
                const a = d * h
                const b = Math.sqrt(d * d - a * a)
                drawLine(minPos.x, minPos.y, minPos.x + a, minPos.y + b, 'red')
              }
          }
        } else {
          if (minPos.y < danger.y) {
            const h = Math.abs(minPos.y - danger.y) / danger.dist
            const beta = Math.asin(h)
            danger.dir = 270 - Math.round(beta * 57.295779513)
            //--
            // DEBUG VISUALIZATION
            //--
              if (renderDangerDirection === 'min') {
                const b = c * h
                const a = Math.sqrt(c * c - b * b)
                drawLine(ship.x, ship.y, ship.x - a, ship.y + b, 'blue')
              } else if (renderDangerDirection === 'real') {
                if (minPos.x !== ship.rx || minPos.y !== ship.ry) {
                  drawLine(ship.x, ship.y, minPos.dangerX, minPos.dangerY, 'red')
                }
                const b = d * h
                const a = Math.sqrt(d * d - b * b)
                drawLine(minPos.x, minPos.y, minPos.x - a, minPos.y + b, 'red')
              }
          } else {
            const h = Math.abs(minPos.x - danger.x) / danger.dist
            const beta = Math.asin(h)
            danger.dir = 360 - Math.round(beta * 57.295779513)
            //--
            // DEBUG VISUALIZATION
            //--
              if (renderDangerDirection === 'min') {
                const b = c * h
                const a = Math.sqrt(c * c - b * b)
                drawLine(ship.x, ship.y, ship.x - b, ship.y - a, 'blue')
              } else if (renderDangerDirection === 'real') {
                if (minPos.x !== ship.rx || minPos.y !== ship.ry) {
                  drawLine(ship.x, ship.y, minPos.dangerX, minPos.dangerY, 'red')
                }
                const b = d * h
                const a = Math.sqrt(d * d - b * b)
                drawLine(minPos.x, minPos.y, minPos.x - b, minPos.y - a, 'red')
              }
          }
        }
        dangerList.push({...danger})
      }

      // sort dangers
      dangerList.sort((a, b) => {
        if (a.dist <= b.dist) {
          return -1
        }
        return 1
      })

      if (current_panel === 2) {
        //-- DEBUG VISUALIZATION
        listHTML = ''
        for (let k in dangerList) {
          listHTML += `<li>${dangerList[k].name} ${dangerList[k].x}x / ${dangerList[k].y}y => ${dangerList[k].dist} dist ${dangerList[k].dir}°</li>`
        }
      }
    }

    //--
    // Sends data to the web socket
    //--
    if (webSocketConnected && autoplay_is_on) {
      webSocketInstance.send(JSON.stringify({
        state: Game.FSM.state,
        player: [
          ship.vel.x,
          ship.vel.y,
          ship.rot,
          ship.x,
          ship.y,
          // 1st closest danger
          dangerList[0] && dangerList[0].dist ? dangerList[0].dist : -1,
          dangerList[0] && dangerList[0].dir ? dangerList[0].dir : -1,
          dangerList[0] && dangerList[0].target ? 1 : -1,
          dangerList[1] && dangerList[1].dist ? dangerList[1].dist : -1,
          dangerList[1] && dangerList[1].dir ? dangerList[1].dir : -1,
          dangerList[1] && dangerList[1].target ? 1 : -1,
          dangerList[2] && dangerList[2].dist ? dangerList[2].dist : -1,
          dangerList[2] && dangerList[2].dir ? dangerList[2].dir : -1,
          dangerList[2] && dangerList[2].target ? 1 : -1,
          dangerList[3] && dangerList[3].dist ? dangerList[3].dist : -1,
          dangerList[3] && dangerList[3].dir ? dangerList[3].dir : -1,
          dangerList[3] && dangerList[3].target ? 1 : -1,
          // 5th closest danger
          dangerList[4] && dangerList[4].dist ? dangerList[4].dist : -1,
          dangerList[4] && dangerList[4].dir ? dangerList[4].dir : -1,
          dangerList[4] && dangerList[4].target ? 1 : -1,
        ],
      }))
    }

    //--
    // DEBUG DATA VISUALIZATION
    //--
      if ($ennemiesPanelList == null) {
        $ennemiesPanelList = $('#ennemies-list')
      }
      $ennemiesPanelList.empty()
      $ennemiesPanelList.append(listHTML)

    Game.FSM.execute();

    if (KEY_STATUS.g) {
      context.beginPath();
      for (var i = 0; i < gridWidth; i++) {
        context.moveTo(i * GRID_SIZE, 0);
        context.lineTo(i * GRID_SIZE, Game.canvasHeight);
      }
      for (var j = 0; j < gridHeight; j++) {
        context.moveTo(0, j * GRID_SIZE);
        context.lineTo(Game.canvasWidth, j * GRID_SIZE);
      }
      context.closePath();
      context.stroke();
    }

    thisFrame = Date.now();
    elapsed = thisFrame - lastFrame;
    lastFrame = thisFrame;
    delta = elapsed * GAME_PACE_SPEED_MOD;

    for (i = 0; i < sprites.length; i++) {
      sprites[i].run(delta);

      if (sprites[i].reap) {
        sprites[i].reap = false;
        sprites.splice(i, 1);
        i--;
      }
    }

    // score
    var score_text = ''+Game.score;
    Text.renderText(score_text, 18, Game.canvasWidth - 14 * score_text.length, 20);

    // // extra dudes
    // for (i = 0; i < Game.lives; i++) {
    //   context.save();
      // extraDude.x = Game.canvasWidth - (8 * (i + 1));
      // extraDude.y = 32;
      // extraDude.configureTransform();
      // extraDude.draw();
    //   context.restore();
    // }

    if (showFramerate) {
      Text.renderText(''+avgFramerate, 24, Game.canvasWidth - 38, Game.canvasHeight - 2);
    }

    frameCount++;
    elapsedCounter += elapsed;
    if (elapsedCounter > BASE_TIMER) {
      elapsedCounter -= BASE_TIMER;
      avgFramerate = frameCount;
      frameCount = 0;
    }

    if (paused) {
      Text.renderText('PAUSED', 72, Game.canvasWidth / 2 - 160, 120);
    } else {
      requestAnimFrame(mainLoop, canvasNode);
    }
  };

  mainLoop();

  $(window).keydown(function (e) {
    switch (KEY_CODES[e.keyCode]) {
      case 'f': // show framerate
        showFramerate = !showFramerate
        break

      case 'd':
        if (renderDangerDirection == 'none') {
          renderDangerDirection = 'min'
        } else if (renderDangerDirection == 'min') {
          renderDangerDirection = 'real'
        } else {
          renderDangerDirection = 'none'
        }
        $renderDangerDirection.html(renderDangerDirection)
        break

      case 'u': // reset
        if (LOCK_KEYSTROKE) {
          break
        }
        if (!autoplay_is_on) {
          Game.FSM.start()
        }
        break

      case 't': // toggle info panel
        if ($value_panel == null) {
          $value_panel = $("#value-panel")
        }
        value_panel_on = !value_panel_on
        if (value_panel_on) {
          $value_panel.show()
        } else {
          $value_panel.hide()
        }
        break

      case 'p': // pause
        if (LOCK_KEYSTROKE) {
          break
        }
        paused = !paused;
        if (!paused) {
          // start up again
          lastFrame = Date.now();
          mainLoop();
        }
        break;

      case 'a': // trigger autoplay
        // TODO: parametrize to allow test mode
        return // deactivated
        if (LOCK_KEYSTROKE) {
          break
        }
        set_autoplay(!autoplay_is_on)
        break

      case 'b': // switch subview
        panels = [
          () => {
            // player stats panel
            $('#ennemies-list-panel').hide()
            $('#player-stats-panel').show()
          },
          () => {
            // network graphic representation
            $('#player-stats-panel').hide()
            $('#network-panel').show()
            NETWORK_PANEL_SHOWN = true
            resize_network_canva()
          },
          () => {
            // danger realtime listing
            $('#network-panel').hide()
            NETWORK_PANEL_SHOWN = false
            $('#ennemies-list-panel').show()
          },
        ]
        current_panel = (current_panel + 1) % panels.length
        panels[current_panel]()
        break

      case 'k': // toggle Keycodes listing
        keycodes_show = !keycodes_show
        if (keycodes_show) {
          $('#keycodes').show()
        } else {
          $('#keycodes').hide()
        }
        break

      case 'm': // mute
        SFX.muted = !SFX.muted
        $('#SFX-muted').html(SFX.muted.toString())
        break
    }
  });
});

// vim: fdl=0
