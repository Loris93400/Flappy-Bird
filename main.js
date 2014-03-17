// on déclare un objet Phaser qui va contenir notre jeu en 640*960px
var game = new Phaser.Game(640, 960, Phaser.AUTO, 'flappyBird');
game.transparent = true;

var gameState = {};
// On crée une variable "load" à notre objet gameState
gameState.load = function() { };  
gameState.load.prototype = {
	preload: function() {
		this.game = game;
	
		// On fait en sorte que le jeu se redimensionne selon la taille de l'écran
		this.game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
		this.game.stage.scale.setShowAll();
		window.addEventListener('resize', function () {
			this.game.stage.scale.refresh();
		});
		this.game.stage.scale.refresh();

		/**** SPRITES *****/
		// bird - png et json
		this.game.load.atlasJSONHash('bird', 'img/bird.png', 'data/bird.json');

		// background
		this.game.load.image('background', 'img/background.png');

		// sol
		this.game.load.image('ground', 'img/ground.png');

		// tuyaux
		this.game.load.image('pipe', 'img/pipe.png');

		// bout des tuyaux
		this.game.load.image('pipeEndTop', 'img/pipe-end-top.png');
		this.game.load.image('pipeEndBottom', 'img/pipe-end-bottom.png');

		// Chiffres pour le score
		this.game.load.atlasJSONHash('numbers', 'img/numbers.png', 'data/numbers.json');

		// Image "Get Ready"
		this.game.load.image('ready', 'img/ready.png');

		// Image "Game Over"
		this.game.load.image('gameOver', 'img/game-over.png');

		// Bouton play
		this.game.load.image('buttonPlay', 'img/button-play.png');

		/**** AUDIO *****/

		// Quand l'oiseau touche le sol ou un tuyau
		this.game.load.audio('hit', ['sons/hit.wav', 'sons/hit.ogg']);

		// Quand l'oiseau tombe après touché un tuyau
		this.game.load.audio('fall', ['sons/fall.wav', 'sons/fall.ogg']);

		// Quand l'oiseau vole
		this.game.load.audio('flap', ['sons/flap.wav', 'sons/flap.ogg']);

		// Quand l'oiseau dépasse un tuyau
		this.game.load.audio('point', ['sons/point.wav', 'sons/point.ogg']);

		// Quand on clique sur le bouton play
		this.game.load.audio('menu', ['sons/menu.wav', 'sons/menu.ogg']);
	},
	
	create: function() {
		game.state.start('main');
	}
};

gameState.main = function() { };  
gameState.main.prototype = {
	create: function() {
		this.gameStart = false;
		this.gameEnd = false;

		/**** SPRITES ****/

		// création de l'arrière-plan
		this.background = this.game.add.sprite(0, 0, 'background');
		this.background.width = this.game.world.width;
		this.background.height = this.game.world.height;

		// Tuyaux
		this.pipes = game.add.group();
		this.pipes.createMultiple(40, 'pipe');
		this.pipesEndTop = game.add.group();
		this.pipesEndTop.createMultiple(4, 'pipeEndTop');
		this.pipesEndBottom = game.add.group();
		this.pipesEndBottom.createMultiple(4, 'pipeEndBottom');
		this.arrayPipes = new Array();

		// création du sol
		this.ground = this.game.add.sprite(0, 0, 'ground');
		this.ground.y = this.game.world.height - this.ground.height;
		this.ground.body.immovable = true;
		this.ground.body.velocity.x = -250;
		this.ground.body.rebound = false;

		// Création de l'oiseau en tant que sprite dans le jeu avec coordonnées x = 200px et y = 0
		this.bird = this.game.add.sprite(200, 0, 'bird');
		this.bird.width = this.bird.width / 6.5;
		this.bird.height = this.bird.height / 6.5;
		this.bird.y = this.game.world.height / 2 - this.bird.height / 2;
		// On change la zone de collision (le polygone) de l'oiseau
		this.bird.body.setPolygon(	39,129, 
									127,42,
									188,0,
									365,0,
									425,105,
									436,176,
									463,182,
									495,219,
									430,315,
									285,345,
									152,341,
									6,228 );
		this.bird.body.rebound = false;
		this.bird.anchor.setTo(0.5, 0.5);
		this.birdHitGround = false;
		this.birdHitPipe = false;
		// Rotation du polygone de l'oiseau
		this.birdRotatePolygon = 0;

		// Tuyaux à vérifier pour savoir si l'oiseau l'a dépassé (permet d'augmenter le score)
		// On vérifiera toujours le premier élément seulement
		this.pipesToCheckForScore = new Array();
		// Tuyaux à vérifier pour savoir quand ajouter un tuyau
		// On vérifiera toujours le premier élément seulement
		this.pipesToCheckForAdd = new Array();

		// Score
		this.score = 0;
		this.spritesScore = new Array();
		var spriteScore = this.game.add.sprite(this.game.width / 2, 100, 'numbers');
		this.spritesScore.push(spriteScore);
		this.spritesScore[0].animations.add('number');
		this.spritesScore[0].animations.frame = 0;
		this.spritesScore[0].x -= this.spritesScore[0].width / 2;

		// Image "ready"
		this.ready = this.game.add.sprite(this.game.width / 2, 250, 'ready');
		this.ready.x -= this.ready.width / 2;

		// Image "gameOver"
		this.gameOver = this.game.add.sprite(this.game.width / 2, 300, 'gameOver');
		this.gameOver.x -= this.gameOver.width / 2;
		this.gameOver.alpha = 0;

		// Bouton play
		this.buttonPlay = this.game.add.sprite(this.game.width / 2, 500, 'buttonPlay');
		this.buttonPlay.x -= this.buttonPlay.width / 2;
		this.buttonPlay.alpha = 0;
		this.buttonPlay.inputEnabled = true;

		// On ajoute l'animation du battement des ailes, animation contenu dans le JSON
		this.bird.animations.add('fly');
		// On fait démarrer l'animation, avec 8 images par seconde et répétée en boucle
		this.bird.animations.play('fly', 8, true);
		
		// On ajoute l'animation qui va permettre à l'oiseau de flotter dans les airs
		this.tweenFlap = this.game.add.tween(this.bird);
		this.tweenFlap.to({ y: this.bird.y + 20}, 400, Phaser.Easing.Quadratic.InOut, true, 0, 10000000000, true);
		
		// Au click, on appelle la fonction "start()"
		this.game.input.onTap.add(this.start, this);

		/**** AUDIO ****/

		this.soundHit = game.add.audio('hit', 1);
		this.soundFall = game.add.audio('fall', 1);
		this.soundFlap = game.add.audio('flap', 1);
		this.soundPoint = game.add.audio('point', 1);
		this.soundMenu = game.add.audio('menu', 1);
	},

	start: function() {
		// on fait disparaître le ready
		this.game.add.tween(this.ready).to( { alpha: 0 }, 500, Phaser.Easing.Linear.None, true, 0, 0, true);

		this.gameStart = true;

		// On supprime l'événement qui se déclenchait au click sur le jeu
		this.game.input.onTap.removeAll();
		// Pour ajouter le jump à l'événement down sur le jeu
		this.game.input.onDown.add(this.jump, this);
		
		// gravité
		this.bird.body.gravity.y = 2000;
		this.bird.body.velocity.y = -600;

		// rotation
		this.bird.rotation = -Math.PI / 8;
		this.bird.body.translate(-this.bird.width/2, -this.bird.height/2);
		this.bird.body.polygon.rotate(-Math.PI / 8);
		this.birdRotatePolygon = -Math.PI / 8;
		this.bird.body.translate(this.bird.width/2, this.bird.height/2);

		this.soundFlap.play();
		
		this.birdInJump = true;
		this.tweenFlap.stop();
		this.bird.animations.stop('fly');
		this.bird.animations.play('fly', 15, true);

		// Timer qui va appeler la méthode addGroupPipes au bout de 1.5 secondes
		this.timer = this.game.time.events.loop(1500, this.addGroupPipes, this);
	},

	jump: function() {
		// Quand l'oiseau est encore visible (ne dépasse pas le haut de l'écran)
		if(this.bird.y + this.bird.height >= 0) {

			this.soundFlap.play();

			// On note que l'oiseau est dans l'action jump
			this.birdInJump = true;
			// Saut
			this.bird.body.velocity.y = -600;

			// On stop l'animation de rotation quand l'oiseau tombe
			if(this.tweenFall != null)
				this.tweenFall.stop();
			
			// On ajoute l'animation de rotation quand l'oiseau saute
			this.tweenJump = game.add.tween(this.bird);
			this.tweenJump.to({rotation: -Math.PI / 8}, 70, Phaser.Easing.Quadratic.In, true, 0, 0, true);

			// On relance l'animation de battements d'ailes (coupée lorsque l'oiseau tombe)
			this.bird.animations.play('fly');
			this.bird.animations.frame = 0;
		}
	},

	update: function() {
		// On répète le sol
		if(this.ground.center.x <= 0) {
			this.ground.x = 0;
		}

		if(this.gameStart) {
			// Quand l'oiseau retombe après un jump
			// Donc quand la vitesse vers le haut atteint 0 (à cause de la gravité)
			if(this.bird.body.velocity.y > 0 && this.birdInJump) {
				this.birdInJump = false;
				
				// on stop l'animation de rotation quand l'oiseau saute
				if(this.tweenJump != null)
					this.tweenJump.stop();
				
				// On ajoute l'animation de rotation quand l'oiseau tombe
				// On la fait démarrer avec un délai de 200 ms
				this.tweenFall = this.game.add.tween(this.bird);
				this.tweenFall.to({rotation: Math.PI / 2}, 300, Phaser.Easing.Quadratic.In, true, 200, 0, true);

				var self = this;
				// Lorsque l'animation de rotation "tweenFall" commence
				this.tweenFall.onStart.add(function() {
					// On stop l'animation des battements d'ailes
					self.bird.animations.stop('fly');
					self.bird.animations.frame = 1;
				});
			}
			// Si l'oiseau touche le sol
			this.game.physics.overlap(this.bird, this.ground, this.hitGround, null, this);
			// Si l'oiseau touche un tuyau
			this.game.physics.overlap(this.bird, this.pipes, this.hitPipe, null, this);
			// Si l'oiseau touche le bout d'un tuyau
			this.game.physics.overlap(this.bird, this.pipesEndTop, this.hitPipe, null, this);
			this.game.physics.overlap(this.bird, this.pipesEndBottom, this.hitPipe, null, this);

			// Si l'oiseau dépasse un tuyau
			if(this.pipesToCheckForScore.length != 0 && this.pipesToCheckForScore[0].x + this.pipesToCheckForScore[0].width / 2 < this.bird.center.x) {
				
				this.soundPoint.play();

				this.pipesToCheckForScore.splice(0, 1);
				this.score++;
				
				// on découpe le nombre en des chiffres individuels
				var digits = this.score.toString().split('');
				var widthNumbers = 0;

				for(var j = 0; j < this.spritesScore.length; j++)
					this.spritesScore[j].kill();
				this.spritesScore = new Array();
				
				// on met en forme le score avec les sprites
				for(var i = 0; i < digits.length; i++) {
					var spriteScore = this.game.add.sprite(widthNumbers, 100, 'numbers');
					spriteScore.animations.add('number');
					spriteScore.animations.frame = +digits[i];
					this.spritesScore.push(spriteScore);
					widthNumbers += spriteScore.width;
				}

				// on centre le score
				for(var i = 0; i < this.spritesScore.length; i++) {
					this.spritesScore[i].x += this.game.width / 2 - widthNumbers / 2;
				}
			}

			// Quand le premier tuyau se trouve au milieu du terrain
			if(this.pipesToCheckForAdd.length != 0 && this.pipesToCheckForAdd[0].x + this.pipesToCheckForAdd[0].width / 2 < this.game.world.width / 2) {
				this.pipesToCheckForAdd.splice(0, 1);
				// On ajoute un nouveau tuyau
				this.addGroupPipes();
			}

			for(var i = 0; i < this.arrayPipes.length; i++) {
				// si les bouts de tuyau du tuyau i se trouvent en dehors de la fenêtre (à gauche)
				if(this.arrayPipes[i][0].x + this.arrayPipes[i][0].width < 0) {
					// on les supprime
					for(var j = 0; j < this.arrayPipes[i].length; j++) {
						this.arrayPipes[i][j].kill();
					}
				}
			}

			// Rotation du polygone de l'oiseau
			this.bird.body.translate(-this.bird.width/2, -this.bird.height/2);
			this.bird.body.polygon.rotate(this.bird.rotation - this.birdRotatePolygon);
			this.birdRotatePolygon += this.bird.rotation - this.birdRotatePolygon;
			this.bird.body.translate(this.bird.width/2, this.bird.height/2);
		}
	},

	// Permet d'ajouter un morceau de tuyau
	addPieceOfPipe: function(x, y, i, hole, nbPipe) {
		// On prend le premier élément "mort" du groupe pipes
		var pipe = this.pipes.getFirstDead();
		// On change la position du bout de tuyau
		pipe.reset(x, y);		
		// On change la vitesse pour qu'il se déplace en même temps que le sol
		pipe.body.velocity.x = -250;

		pipe.body.immovable = true;

		// on enregistre les tuyaux présents sur le terrain dans un tableau
		// this.arrayPipes[index] = tuyau index en entier
		// this.arrayPipes[index][2] = bout n°2 du tuyau index
		if(i == 0) {
			this.pipesToCheckForScore.push(pipe);
			this.pipesToCheckForAdd.push(pipe);
			this.arrayPipes.push(new Array());
			this.arrayPipes[this.arrayPipes.length - 1].push(pipe);
		} else {
			this.arrayPipes[this.arrayPipes.length - 1].push(pipe);
		}

		// Si le trou est juste avant ou juste après, on place les pipeEnd
		if(i == hole + 2 || i == hole - 2) {
			var yDiff = 15;
			var pipeEnd;
			var yPipe;

			if(i == hole + 2) {
				// On prend le premier élément "mort" du groupe pipesEndTop
				pipeEnd = this.pipesEndTop.getFirstDead();
				yPipe = y + yDiff;
			} else {
				// On prend le premier élément "mort" du groupe pipesEndBottom
				pipeEnd = this.pipesEndBottom.getFirstDead();
				yPipe = y - yDiff;
			}

			// On change la position du bout de tuyau
			pipeEnd.reset(x - 4, yPipe);		
			// On change la vitesse pour qu'il se déplace en même temps que le sol
			pipeEnd.body.velocity.x = -250;

			pipeEnd.body.immovable = true;
			this.arrayPipes[this.arrayPipes.length - 1].push(pipeEnd);
		}
	},

	// On ajoute un groupe (une colonne) de 12 tuyaux avec un trou quelque part au milieu
	addGroupPipes: function() {
		// On supprime le timer qui ne nous sert plus à rien
		this.game.time.events.remove(this.timer);

		var nbPiecesOfPipes = 12;
		var hole = Math.round(Math.random() * (nbPiecesOfPipes - 7)) + 3;

		for (var i = 0; i <= nbPiecesOfPipes; i++)
			if (i > hole + 1 || i < hole - 1)				
				this.addPieceOfPipe(this.game.world.width, this.game.world.height - this.ground.height - i * this.game.world.height / nbPiecesOfPipes, i, hole);
	},

	hitGround: function() {
		if(!this.birdHitGround) {
			this.bird.body.gravity.y = 0;
			this.bird.body.velocity.y = 0;
			
			if(!this.birdHitPipe)
				this.soundHit.play();

			// on fait apparaitre le game over et le bouton play
			this.game.add.tween(this.gameOver).to( { alpha: 1 }, 300, Phaser.Easing.Linear.None, true, 0, 0, true);
			this.game.add.tween(this.buttonPlay).to( { alpha: 1 }, 300, Phaser.Easing.Linear.None, true, 0, 0, true);
			
			var self = this;

			// Evénements sur le bouton play
			this.buttonPlay.events.onInputDown.add(function() {
				self.buttonPlay.y += 10;
			});
			this.buttonPlay.events.onInputUp.add(function() {
				self.buttonPlay.y -= 10;
				self.restart();
			});

			this.gameFinish();

			this.birdHitGround = true;
		}
	},

	hitPipe: function() {
		if(!this.birdHitPipe) {
			this.soundHit.play();
			var self = this;
			setTimeout(function(){self.soundFall.play();}, 300);

			this.gameFinish();

			this.birdHitPipe = true;
		}
	},

	gameFinish: function() {
		// on arrête le sol
		this.ground.body.velocity.x = 0;

		// on arrête les tuyaux
		for(var i = 0; i < this.arrayPipes.length; i++)
			for(var j = 0; j < this.arrayPipes[i].length; j++)
				this.arrayPipes[i][j].body.velocity.x = 0;

		this.game.input.onDown.removeAll();

		this.gameEnd = true;

		// On supprime le timer
		this.game.time.events.remove(this.timer);
	},

	restart: function() {
		this.soundMenu.play();
		// On redémarre la partie
		this.game.state.start('main');
	}
};

// On ajoute les 2 objet load et main à notre objet Phaser
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);
// Il ne reste plus qu'à lancer l'état "load"
game.state.start('load');