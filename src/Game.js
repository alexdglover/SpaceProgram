//var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

SpaceProgram.Game = function(game) {
    ship = null;
    cursors = null;
    button = null;

    bullet = null;
    bullets = null;
    bulletTime = 0;

    fuel = 200;
    fuelString = 'Fuel : ';
    fuelText = '';
    score = 0;
    scoreString = 'Score : ';
    scoreText = '';
    cashString = '$ : ';
    cashText = '';

    launched = false;

    explosions = null;

    gasTanks = null;
    gasTankSize = 100;
    diamonds = null;
    cash = 0;

    altitude = 0;

    boostUsed = false;
};

SpaceProgram.Game.prototype = {

    preload: function() {

        this.load.image('space', 'assets/skies/deep-space.jpg');
        this.load.image('background','assets/misc/starfield.jpg');
        this.load.image('bullet', 'assets/games/asteroids/bullets.png');
        this.load.image('ship', 'assets/games/asteroids/ship.png');
        this.load.image('ship2', 'assets/sprites/thrust_ship.png');
        this.load.image('orb-green', 'assets/sprites/orb-green.png');
        this.load.image('diamond', 'assets/sprites/diamond.png');
        this.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
        this.load.spritesheet('button', 'assets/buttons/button_sprite_sheet.png', 193, 71);
    },



    create: function() {

        //  This will run in Canvas mode, so let's gain a little speed and display
        this.game.renderer.clearBeforeRender = false;
        this.game.renderer.roundPixels = true;
        this.world.setBounds(0, 0, 5000, 5000);
        this.add.tileSprite(0, 0, 5000, 5000, 'background');
        
        //  The score
        //Created a Sprite with fixedToCamera = true
        var textSprite = this.add.sprite(0,0);
        textSprite.fixedToCamera = true;

        //addChild of my text at x:0, y:0
        fuelText = this.add.text(0, 0, fuelString + fuel, { font: '40px Arial', fill: '#fff' });
        cashText = this.add.text(0, 50, cashString + cash, { font: '40px Arial', fill: '#fff' });
        scoreText = this.add.text(0, 100, scoreString + score, { font: '40px Arial', fill: '#fff' });
        textSprite.addChild(fuelText);
        textSprite.addChild(cashText);
        textSprite.addChild(scoreText);

        //position the cameraOffset of my Sprite
        textSprite.cameraOffset.x = 550;
        textSprite.cameraOffset.y = 50;

        //  We need arcade physics
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = 100;

        //  A spacey background
        //this.add.tileSprite(0, 0, game.width, game.height, 'space');

        //  Our ships bullets
        bullets = this.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;

        //  All 40 of them
        bullets.createMultiple(40, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);

        //  Our player ship
        ship = this.add.sprite(2500, 5000, 'ship2');
        ship.anchor.set(0.5);

        //  and its physics settings
        this.game.physics.enable(ship, Phaser.Physics.ARCADE);

        this.game.camera.follow(ship, Phaser.Camera.FOLLOW);

        
        ship.body.drag.set(100,100);
        ship.body.maxVelocity.set(200);
        ship.body.gravity.y = 100;
        ship.body.collideWorldBounds = true;
        ship.body.bounce.set(0.3);
        ship.body.drag.set(20, 100);
        ship.angle = -90;

        //  Game input
        cursors = this.game.input.keyboard.createCursorKeys();
        this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
        this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.B ]);

        //  An explosion pool
        explosions = this.add.group();
        explosions.createMultiple(30, 'kaboom');
        explosions.forEach(this.setupShip, this);

        //  Our gasTanks group
        gasTanks = this.add.group();
        gasTanks.enableBody = true;
        gasTanks.physicsBodyType = Phaser.Physics.ARCADE;
        gasTanks.createMultiple(100, 'orb-green');
        gasTanks.setAll('body.allowGravity', false);
        gasTanks.setAll('anchor.x', 0.5);
        gasTanks.setAll('anchor.y', 1);
        gasTanks.setAll('checkWorldBounds', true);

        gasTanks.forEach(function(gasTank){
            var randX = Math.floor(Math.random() * (5000 - 1 + 1)) + 1;
            var randY = Math.floor(Math.random() * (5000 - 1 + 1)) + 1;
            gasTank.reset(randX, randY);
        });

        // diamonds group
        diamonds = this.add.group();
        diamonds.enableBody = true;
        diamonds.physicsBodyType = Phaser.Physics.ARCADE;
        diamonds.createMultiple(50, 'diamond');
        diamonds.setAll('body.allowGravity', false);
        diamonds.setAll('anchor.x', 0.5);
        diamonds.setAll('anchor.y', 1);
        diamonds.setAll('checkWorldBounds', true);    

        //  Grab the first gasTank we can from the pool
        diamonds.forEach(function(diamond){
            var randX = Math.floor(Math.random() * (5000 - 1 + 1)) + 1;
            var randY = Math.floor(Math.random() * (5000 - 1 + 1)) + 1;
            diamond.reset(randX, randY);
        });

        //button = this.add.button(this.world.centerX + 250, 4800, 'button', actionOnClick, this, 2, 1, 0);

    },

    update: function() {

        if (cursors.up.isDown && fuel > 0)
        {
            
            this.game.physics.arcade.accelerationFromRotation(ship.rotation, 500, ship.body.acceleration);
            fuel--;
            fuelText.text = fuelString + fuel;
        }
        else
        {
            ship.body.acceleration.set(0);
        }

        if (cursors.left.isDown)
        {
            ship.body.angularVelocity = -300;
        }
        else if (cursors.right.isDown)
        {
            ship.body.angularVelocity = 300;
        }
        else
        {
            ship.body.angularVelocity = 0;
        }

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
        {
            this.fireBullet();
        }

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.B) && !boostUsed)
        {
            this.game.physics.arcade.accelerationFromRotation(ship.rotation, 100000000, ship.body.acceleration);
            boostUsed = true;
        }

        altitude = 4972 - ship.body.y;

        if(altitude > score)
        {
            score = Math.floor(altitude);
            scoreText.text = scoreString + score;
        }

        this.crash(ship);

        //  Run collision
        this.game.physics.arcade.overlap(gasTanks, ship, this.gasTanksCollisionHandler, null, this);
        this.game.physics.arcade.overlap(diamonds, ship, this.diamondsCollisionHandler, null, this);

    },

    fireBullet: function () {

        if (this.game.time.now > bulletTime)
        {
            bullet = bullets.getFirstExists(false);

            if (bullet)
            {
                bullet.reset(ship.body.x + 16, ship.body.y + 16);
                bullet.lifespan = 2000;
                bullet.rotation = ship.rotation;
                this.game.physics.arcade.velocityFromRotation(ship.rotation, 400, bullet.body.velocity);
                bulletTime = this.game.time.now + 50;
            }
        }

    },

    crash: function (ship) {

        if(ship.y < 4985)
        {
            launched = true;
        }

        if (ship.y > 4985 && (launched==true))
        {
            ship.kill();
            fuelText.text = 'Crashed!';
            var explosion = explosions.getFirstExists(false);
            explosion.reset(ship.body.x, ship.body.y);
            explosion.play('kaboom', 30, false, true);
            setTimeout(this.restartGame, 5000);    
        }
    },

    restartGame: function () {
        launched = false;
        this.game.state.start('Game', true, true);
    },

    setupShip: function (ship) {
        ship.anchor.x = 0.5;
        ship.anchor.y = 0.5;
        ship.animations.add('kaboom');

    },

    gasTanksCollisionHandler: function (ship, gasTank) {
        gasTank.kill();
        fuel += gasTankSize;
        fuelText.text = fuelString + fuel;
    },

    diamondsCollisionHandler: function (ship, diamond) {
        diamond.kill();
        cash += 500;
        cashText.text = cashString + cash;
    },


    render: function() {
        //this.debug.cameraInfo(this.game.camera, 32, 64);
        //this.debug.spriteCoords(ship, 32, 150);
    }
};