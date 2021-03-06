define(["globals", "utils", "enemy", "./backgroundLine", "./gameInfoDisplay"], function (GLOBAL, Utils, Enemy, BackgroundLine, GameInfoDisplay) {
	return {
	update : function (player) {
      		//shoot
		if (GLOBAL.KEYDOWN.isSpace()) {
			player.shoot();
		}
	      	if(GLOBAL.GAMEMODE=='leftrightonly'){
	        	//left
	        	if (GLOBAL.KEYDOWN.left) {
	          		var speed = GLOBAL.RESTIME;
	          		speed = Math.min(Math.max(3, (30000 / speed)), 20);
	          		player.x-=speed;
	        	}      
	        	//right
	        	if (GLOBAL.KEYDOWN.right) {
	          		var speed = GLOBAL.RESTIME;
	          		speed = Math.min(Math.max(3, (30000 / speed)), 20);
	          		player.x+=speed;
	        	}
	      	} else {
	        	//left
	        	if (GLOBAL.KEYDOWN.left) {
	          		player.left(0.075);
	        	}      
	        	//right
	        	if (GLOBAL.KEYDOWN.right) {
	          		player.right(0.075);
	        	}
	        	//up
	        	if (GLOBAL.KEYDOWN.up) {
	          		var speed = GLOBAL.RESTIME;
	          		speed = Math.min(Math.max(3, (30000 / speed)), 20);
	          		player.up(speed);
	        	}
	        	//down
	        	if (GLOBAL.KEYDOWN.down) {
	          		var speed = GLOBAL.RESTIME;
	          		speed = Math.min(Math.max(3, (30000 / speed)), 20);				
	          		player.down(speed);
	        	}
	      	}
	      
	      	//keep player inside screen
		player.x = player.x.clamp(0, GLOBAL.CANVAS_WIDTH - player.width);
	      	player.y = player.y.clamp(0, GLOBAL.CANVAS_HEIGHT - player.height);
	      
	      	//add bg lines
	      	if(Math.random()<0.02){
	        	while(GLOBAL.BACKGROUNDLINES.length<500){
	          		GLOBAL.BACKGROUNDLINES.push(BackgroundLine());
	        	}
	      	}
	      
	      	//update bg lines
	      	GLOBAL.BACKGROUNDLINES.forEach(function (line) {
			line.update();
		});
		GLOBAL.BACKGROUNDLINES = GLOBAL.BACKGROUNDLINES.filter(function (line) {
			return line.active;
	      	});
	      
	      	//update bullets
		GLOBAL.PLAYERBULLETS.forEach(function (bullet) {
			bullet.update();
		});
		GLOBAL.PLAYERBULLETS = GLOBAL.PLAYERBULLETS.filter(function (bullet) {
			return bullet.active;
	      	});
	      
	      	//update enemies
		GLOBAL.ENEMIES.forEach(function (enemy) {
			enemy.update();
		});
		GLOBAL.ENEMIES = GLOBAL.ENEMIES.filter(function (enemy) {
			return enemy.active;
		});
	      
	      	//update GameInfoDisplay
	      	GameInfoDisplay.update();
	      
	      	//handle collisions
		this._handleCollisions(GLOBAL, player, this._collides);
	
		var nextEnemy = this._shouldCreateEnemy();
		if (nextEnemy) {
			GLOBAL.HOURENEMYNUMBER++;
			var from = nextEnemy.from;
			//color enemy by email address
			var color = this._colorEnemy(from);		
			
			// TODO: currently, the scale is proportional to number of recipients 
			// correct this to be the size of email body
			var scale = Math.min(10, (nextEnemy.numOfTo + nextEnemy.numOfCc));
			scale = (scale / 10) * 1.5 + 1;
			
			GLOBAL.ENEMIES.push(Enemy({
				color : color,
				scale : scale
			}));
		}
	},
	
	_colorEnemy: function(from){
		var color = 'white';
		if (from.search(/@cornell.edu/i) != -1){
			color = 'red';
		//xx@yy.edu should be colored blue
		} else if(from.search(/.edu/i) != -1){
			color = 'blue';
		} else if (from.search(/@gmail.com/i) != -1) {
			color = 'green';
		} else if (from.search(/@yahoo./i) != -1) {
			color = 'green';
		} else if (from.search(/@hotmail./i) != -1) {
			color = 'green';
		} else if (from.search(/@outlook./i) != -1) {
			color = 'green';
		} else {
			color = 'grey';
		}
		return color;
	},
	
	_shouldCreateEnemy : function () { //TODO: should not be doing so many things. Break down 
		var hour = GLOBAL.GAMEHOUR;
		var inemaildata = GLOBAL.INCOMINGEMAILDATA;
		var totalhourloops = GLOBAL.FPS * GLOBAL.HOURLENGTH;
		var numenemies = (inemaildata[hour]) ? inemaildata[hour].length : 0;
		GLOBAL.HOURITR++
		//console.log(numenemies);
		if (GLOBAL.HOURITR > totalhourloops) {
			//console.log(hour, 'hour')
			//console.log(inemaildata[hour], 'hour len')
			if (GLOBAL.HOURITR > totalhourloops + (2 * GLOBAL.FPS)
			&& GLOBAL.ENEMIES.length === 0) {
				GLOBAL.HOURITR = 0;
				GLOBAL.HOURENEMYNUMBER = 0;
				GLOBAL.GAMEHOUR++;
          			GameInfoDisplay.hourSplash();
			}
			// TODO: replace the gameover message 
			if (GLOBAL.GAMEHOUR > 23) {
				alert('Game Over. Refresh page to play again');
			}
				return 0
			}
			if (numenemies === 0) {
				return 0
			}

			//Todo: fails when numenemies > totalhourloops
			if (GLOBAL.HOURITR % Math.round(totalhourloops / numenemies) === 0) {
				var nextEnemy = GLOBAL.INCOMINGEMAILDATA[GLOBAL.GAMEHOUR][GLOBAL.HOURENEMYNUMBER];
				return nextEnemy
			}

			return 0;
			//return Math.random() < 0.1
		},
		
	_collides : function (a, b) {
		"use strict"
		return a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y;
	},
	
	_handleCollisions : function (GLOBAL, player, _collides) {
		"use strict"
		GLOBAL.PLAYERBULLETS.forEach(function (bullet) {
			GLOBAL.ENEMIES.forEach(function (enemy) {
				if (_collides(bullet, enemy)) {
					enemy.explode();
					bullet.active = false;
				}
			});
		});

		GLOBAL.ENEMIES.forEach(function (enemy) {
			if (_collides(enemy, player)) {
				enemy.explode();
				player.explode();
			}
		});
	},
	
	getGameData : function (email, incoming, callback) {
		/*getGameData function
		use getEmailData('h@hh.com', true) //gets incoming email data
		use getEmailData('h@hh.com', false) //gets outgoing email data
		 */

		if (incoming === 'resTime') {
			var url = '/stats.json?id=getAvgResponseTime&email=' + email;
			Utils.getJson(url, function (err, json) {
				if (err)
					callback(err);
				else
					callback(null, incoming, json);
			});
			return
		}
		//Make url
		incoming = (incoming) ? 1 : 0;
		var url = '/stats.json?id=getSpaceGameData&email=' + email + '&incoming=' + incoming;
			Utils.getJson(url, function (err, json) {
				if (err)
					callback(err);
				else
					callback(null, incoming, json);
			});
		}
	}
});
