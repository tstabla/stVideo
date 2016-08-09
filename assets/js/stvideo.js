/*!
* stVideo
*
* Copyright (c) 2016 - Tomasz Stabla | http://www.stabla.com
*
* Licensed under the MIT license:
* http://www.opensource.org/licenses/mit-license.php
*
* Any and all use of this script must be accompanied by this copyright/license notice in its present form.
*
* Usage: new stVideo('selector');
*
* @author: Tomasz Stabla
* @Version:  0.8
* @Last update: 08.08.2016
*/

(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([], factory(root));
    } else if ( typeof exports === 'object' ) {
        module.exports = factory(root);
    } else {
        root.stVideo = factory(root);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {
	'use strict';

	(function(window) {
	  var lastTime = 0;
	  var vendors = ['ms', 'moz', 'webkit', 'o'];

	  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	  }

	  if (!window.requestAnimationFrame) {
	    window.requestAnimationFrame = function(callback, element) {
	      var currTime = new Date().getTime();
	      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
	        timeToCall);
	      lastTime = currTime + timeToCall;
	      return id;
	    };
	  }

	  if (!window.cancelAnimationFrame) {
	    window.cancelAnimationFrame = function(id) {
	      clearTimeout(id);
	    };
	  }
	}(root));


	function stVideo(el, settings) {
		this.useCanvas = navigator.userAgent.indexOf('iPhone') >= 0;

		this.element = document.querySelector(el);

		this.settings = settings || this.getSettings();

    if(!(this.settings.mp4 || this.settings.webm || this.settings.ogg) ||
      !this.settings.width || !this.settings.height) {

      this.isError = true;

      this.error.checkSettings();

      return;
    }

    this.classNames = {
      init        : 'stvideo-box',
      error       : 'stvideo-box--error',
      isPlaying   : 'stvideo-box--is-playing',
      isPaused    : 'stvideo-box--is-paused',
      isEnded     : 'stvideo-box--is-ended',
      player      : 'stvideo-box__player',
      poster      : 'stvideo-box__poster',
      play        : 'stvideo-box__play',
      playPause   : 'stvideo-box__play-pause',
      controls    : 'stvideo-box__controls',
      timeline    : 'stvideo-box__timeline',
      progress    : 'stvideo-box__progress',
      duration    : 'stvideo-box__duration',
    };

		this.initPlayer();
	};


	stVideo.prototype.getSettings = function() {
		var attr = this.element.getAttribute('data-stvideo');
			  attr = attr.replace(/\'/g, '"');

		return JSON.parse(attr);
	};


	stVideo.prototype.initPlayer = function() {
		var ext, wrapper, video, source, type, canvas, context;

    this.element.classList.add(this.classNames.init);

		video = document.createElement('video');
		video.setAttribute('width', this.settings.width);
		video.setAttribute('height', this.settings.height);

		ext = this.supportedVideoFormat(video);

		if(!ext || (this.useCanvas && !this.settings.mp4) || !this.settings[ext]) {
			this.error.badVideoFormat.call(this);

			return;
		} else if(ext == 'mp4') {
			type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
		} else if(ext == 'webm') {
			type = 'video/webm; codecs="vp8, vorbis"';
		} else if(ext == 'ogg') {
			type = 'video/ogg; codecs="theora, vorbis"';
		}

		source = document.createElement('source');
		source.setAttribute('src', this.settings[ext]);
		source.setAttribute('type', type);

		video.appendChild(source);

    wrapper = document.createElement('div');
    wrapper.classList.add(this.classNames.player)

		if(this.useCanvas) {
			canvas = document.createElement('canvas');
			canvas.setAttribute('width', this.settings.width);
			canvas.setAttribute('height', this.settings.height);

			context = canvas.getContext("2d");

			context.fillStyle = '#ffffff';
			context.fillRect(0, 0, this.settings.width, this.settings.height);

			context.drawImage(video , 0, 0, this.settings.width, this.settings.height);

			this.canvasContext = context;

			wrapper.appendChild(canvas);
		} else {
			wrapper.appendChild(video);
		}

    this.element.appendChild(wrapper);

    video.load();

		this.video = video;

    this.playerControls();
		this.addEventListeners();
	};


  stVideo.prototype.supportedVideoFormat = function(video) {
	  var extension = '';

		if (video.canPlayType('video/webm') == 'probably' || video.canPlayType('video/webm') == 'maybe') {
			extension = 'webm';
		} else if(video.canPlayType('video/mp4') == 'probably' || video.canPlayType('video/mp4') == 'maybe') {
			extension = 'mp4';
		} else if(video.canPlayType('video/ogg') == 'probably' || video.canPlayType('video/ogg') == 'maybe') {
			extension = 'ogg';
		}

	  return extension;
	};


  stVideo.prototype.playerControls = function() {
    var poster, controls, timeline, progress, playPause, play, duration;

    if(this.settings.poster) {
      poster = document.createElement('div');
      poster.classList.add(this.classNames.poster);
      poster.style.backgroundImage = 'url('+this.settings.poster+')';

      this.element.appendChild(poster);
    }

    play = document.createElement('div');
    play.classList.add(this.classNames.play);

    controls = document.createElement('div');
    controls.classList.add(this.classNames.controls);

    playPause = document.createElement('div');
    playPause.classList.add(this.classNames.playPause);

    timeline = document.createElement('div');
    timeline.classList.add(this.classNames.timeline);

    progress = document.createElement('div');
    progress.classList.add(this.classNames.progress);

    duration = document.createElement('div');
    duration.classList.add(this.classNames.duration);

    timeline.appendChild(progress);
    controls.appendChild(timeline);
    controls.appendChild(playPause);
    controls.appendChild(duration);

    this.element.appendChild(controls);
    this.element.appendChild(play);

    this.elPlay      = play;
    this.elPlayPause = playPause;
    this.elProgress  = progress;
    this.elDuration  = duration;
  };


  stVideo.prototype.addEventListeners = function() {
		var self = this, tempEvent;

    this.allowedEvents = ['canplay', 'canplaythrough', 'play', 'playing', 'pause', 'ended', 'abort', 'error', 'timeupdate'];
    this.eventsUserCollection = [];
    this.eventsVideoCollection = [];
    this.eventsControlsCollection = [];


		this.video.addEventListener('canplay', tempEvent = function() {
			if(self.useCanvas) {
				self.canvasDrawFrame();
			}

      self.progressUpdate();
		});
    self.eventsVideoCollection.push(tempEvent);

    if(!self.useCanvas) {
      this.video.addEventListener('play', tempEvent = function() {
        self.changeState('play', true);
        self.changeState('end', false);
  		});
      self.eventsVideoCollection.push(tempEvent);

      this.video.addEventListener('pause', tempEvent = function() {
        self.changeState('pause', true);
        self.changeState('play', false);
  		});
      self.eventsVideoCollection.push(tempEvent);

      this.video.addEventListener('ended', tempEvent = function() {
        self.changeState('end', true);
        self.changeState('play', false);
  		});
      self.eventsVideoCollection.push(tempEvent);
    }

		this.video.addEventListener('timeupdate', tempEvent = function() {
			if(self.useCanvas) {
				self.canvasDrawFrame();
			}

      self.progressUpdate();
		});
    self.eventsVideoCollection.push(tempEvent);

    this.video.addEventListener('error', tempEvent = function(ev) {
      self.isError = true;

			self.error.custom(ev);
		});
    self.eventsVideoCollection.push(tempEvent);


    this.elPlay.addEventListener('click', tempEvent = function() {
			if(!self.isPlaying) {
        self.play();
      } else {
        self.pause();
      }
		});
    self.eventsControlsCollection.push(tempEvent);

    this.elPlayPause.addEventListener('click', tempEvent = function() {

      if(!self.isPlaying) {
        self.play();
      } else {
        self.pause();
      }
		});
    self.eventsControlsCollection.push(tempEvent);
	};


  stVideo.prototype.canvasControl = function(action) {
    if(action == 'play' || (action == 'play' && this.isEnded)) {
      if(this.isEnded) {
        this.changeState('end', false);

        this.video.currentTime = 0;

        this.lastTime = Date.now();
      }

      this.changeState('play', true);

      this.animationFrame = root.requestAnimationFrame(this.canvasFrameUpdate.bind(this));

    } else if(action == 'pause' || action == 'ended') {
      if(action == 'ended') {
        this.changeState('end', true);
      } else {
        this.changeState('pause', true);
      }

      this.changeState('play', false);

      root.cancelAnimationFrame(this.animationFrame);
    }
  };


	stVideo.prototype.canvasFrameUpdate = function(){
		var time = Date.now(),
			elapsed = (time - (this.lastTime || time)) / 1000;

		if(!elapsed || elapsed >= 1 / 25) {
			this.video.currentTime = this.video.currentTime + elapsed;

			this.lastTime = time;
		}

    if (this.video.currentTime >= this.video.duration) {
      this.canvasControl('ended');
    } else {
      this.animationFrame = root.requestAnimationFrame(this.canvasFrameUpdate.bind(this));
    }
	};


	stVideo.prototype.canvasDrawFrame = function() {
		this.canvasContext.drawImage(this.video , 0, 0, this.settings.width, this.settings.height);
	};


  stVideo.prototype.progressUpdate = function() {
    var current   = this.video.currentTime,
        duration  = this.video.duration,
        progress  = (current / duration).toFixed(2);

    this.elProgress.style.width = (+progress*100)+'%';

    this.elDuration.innerText = this.formatTime(current) + ' / ' + this.formatTime(duration);
  };


  stVideo.prototype.formatTime = function(seconds) {
    var min, sec;

    min = Math.floor(seconds / 60);
    min = (min >= 10) ? min : '0' + min;
    sec = Math.floor(seconds % 60);
    sec = (sec >= 10) ? sec : '0' + sec;

    return min + ':' + sec;
  };


  stVideo.prototype.error = {
		badVideoFormat: function() {
			if(this.useCanvas) {
				console.error('Apple devices support only .mp4 format');
			} else {
				console.error('Best use .webm and .mp4 video formats');
			}

      this.element.classList.add(this.classNames.error);
		},
    checkSettings: function() {
      console.error('Check all required settings');

      this.element.classList.add(this.classNames.error);
    },
    custom: function(msg) {
      console.error(msg);

      this.element.classList.add(this.classNames.error);
    }
	};


	stVideo.prototype.on = function(name, callback) {
    if(this.isError) return;

		var self = this, tempEvent;

		if(this.allowedEvents.indexOf(name) == -1) return;

		this.video.addEventListener(name, tempEvent = function() {
			callback.call(this);
		});

		self.eventsUserCollection.push(tempEvent);
	};


	stVideo.prototype.play = function() {
    if(this.isError) return;

		this.lastTime = Date.now();

    if(this.useCanvas) {
      this.canvasControl('play');
    } else {
      this.video.play()
    }
	};


  stVideo.prototype.pause = function() {
    if(this.isError) return;

    if(this.isPlaying) {
      if(this.useCanvas) {
        this.canvasControl('pause');
      } else {
        this.video.pause();
      }
    }
	};


  stVideo.prototype.changeState = function(action, value) {
    var ec = this.element.classList;

    if(action == 'play') {
      this.isPlaying = value;

      if(value) {
        ec.add(this.classNames.isPlaying);
      } else {
        ec.remove(this.classNames.isPlaying);
      }
    }

    if(action == 'pause') {
      this.isPaused = value;

      if(value) {
        ec.add(this.classNames.isPaused);
      } else {
        ec.remove(this.classNames.isPaused);
      }
    }

    if(action == 'end') {
      this.isEnded = value;

      if(value) {
        ec.add(this.classNames.isEnded);
      } else {
        ec.remove(this.classNames.isEnded);
      }
    }
  };


  stVideo.prototype.destroy = function() {

  };


	return stVideo;

});
