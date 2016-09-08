/*! 
 * stVideo 
 * HTML5 video canvas player. Prevents video fullscreen on iPhone/iPad.
 * 
 * Licensed under the MIT license: 
 * http://www.opensource.org/licenses/mit-license.php 
 * 
 * Any and all use of this script must be accompanied by this copyright/license notice in its present form. 
 * 
 * Version: 0.8.0
 * Author: Tomasz Stabla <t.stabla@hotmail.com> (http://stabla.com)
 * Site: https://github.com/tstabla/stVideo/
 */
(function(root, factory) {
  if(typeof define === 'function' && define.amd) {
    define([], function() {
      return factory(root);
    });
  } else if(typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.stVideo = factory(root);
  }
})(typeof global !== 'undefined' ? global : this.window || this.global, function(root) {
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


	var stVideo = function(el, settings) {
		this.useCanvas = (/iPhone|iPad|iPod/i.test(navigator.userAgent));

		this.element = document.querySelector(el);

    this.defaults = {
      force: ''
    };

    this.settings = this.getSettings(settings);

    if(!(this.settings.mp4 || this.settings.webm || this.settings.ogg) ||
      !this.settings.width || !this.settings.height) {

      this.isError = true;

      this.error.checkSettings();

      return;

    }

    if(this.settings.force === 'video') {
      this.useCanvas = false;
    } else if(this.settings.force === 'canvas') {
      this.useCanvas = true;
    }

    this.classNames = {
      init        : 'stvideo-box',
      error       : 'stvideo-box--error',
      isPlaying   : 'stvideo-box--is-playing',
      isPaused    : 'stvideo-box--is-paused',
      isEnded     : 'stvideo-box--is-ended',
      isMuted     : 'stvideo-box--is-muted',
      hasAudio    : 'stvideo-box--has-audio',
      player      : 'stvideo-box__player',
      poster      : 'stvideo-box__poster',
      play        : 'stvideo-box__play',
      playPause   : 'stvideo-box__play-pause',
      controls    : 'stvideo-box__controls',
      timeline    : 'stvideo-box__timeline',
      progress    : 'stvideo-box__progress',
      duration    : 'stvideo-box__duration',
      volume      : 'stvideo-box__volume',
    };

    this.eventsUserCollection = [];
    this.eventsVideoCollection = [];
    this.eventsControlsCollection = [];

		this.initPlayer();
	};


	stVideo.prototype.getSettings = function(settings) {
    var attr, options, key;

    if(!settings) {
      attr = this.element.getAttribute('data-stvideo');
      attr = attr.replace(/\'/g, '"');
      settings = JSON.parse(attr);
    }

    options = this.defaults;

    for(key in settings) {
      if(settings.hasOwnProperty(key)) {
        options[key] = settings[key];
      }
    }

		return options;
	};


	stVideo.prototype.initPlayer = function() {
		var format, wrapper, video, videoSource, type, canvas, context;

    this.element.classList.add(this.classNames.init);

		video = document.createElement('video');
		video.setAttribute('width', this.settings.width);
		video.setAttribute('height', this.settings.height);

		format = this.supportedVideoFormat(video);

		if(!format || (this.useCanvas && !this.settings.mp4) || !this.settings[format.ext]) {
			this.error.badVideoFormat.call(this);

			return;
		}

		videoSource = document.createElement('source');
		videoSource.setAttribute('src', this.settings[format.ext]);
		videoSource.setAttribute('type', format.type);

		video.appendChild(videoSource);

    wrapper = document.createElement('div');
    wrapper.classList.add(this.classNames.player);

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
    this.addVideoListeners();
    this.addControlsListeners();
	};


  stVideo.prototype.supportedVideoFormat = function(video) {
	  var options = {};

		if (video.canPlayType('video/webm') == 'probably' || video.canPlayType('video/webm') == 'maybe') {
			options.ext = 'webm';
      options.type = 'video/webm; codecs="vp8, vorbis"';
		} else if(video.canPlayType('video/mp4') == 'probably' || video.canPlayType('video/mp4') == 'maybe') {
			options.ext = 'mp4';
      options.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
		} else if(video.canPlayType('video/ogg') == 'probably' || video.canPlayType('video/ogg') == 'maybe') {
			options.ext = 'ogg';
      options.type = 'video/ogg; codecs="theora, vorbis"';
		}

	  return options;
	};


  stVideo.prototype.videoAudio = function(video) {
    var self = this, tempEvent, volume;

    if(video.mozHasAudio || Boolean(video.webkitAudioDecodedByteCount) || Boolean(video.audioTracks && video.audioTracks.length)) {
      this.hasAudio = true;

      this.element.classList.add(this.classNames.hasAudio);

      volume = document.createElement('div');
      volume.classList.add(this.classNames.volume);

      this.elControls.appendChild(volume);

      this.elVolume = volume;

      this.elVolume.addEventListener('click', tempEvent = function() {
        if(self.isMuted) {
          self.video.volume = 1;
        } else {
          self.video.volume = 0;
        }
  		});
      this.eventsControlsCollection.push(tempEvent);
    } else {
      this.hasAudio = false;
    }
  };


  stVideo.prototype.playerControls = function() {
    var self = this, poster, controls, timeline, progress, playPause, play, duration;

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

    this.elControls  = controls;
    this.elPlay      = play;
    this.elPlayPause = playPause;
    this.elProgress  = progress;
    this.elDuration  = duration;
  };


  stVideo.prototype.addVideoListeners = function() {
    var self = this, tempEvent;

    this.video.addEventListener('loadedmetadata', tempEvent = function() {
      self.videoAudio(this);
    });
    self.eventsVideoCollection.push(tempEvent);

    this.video.addEventListener('canplaythrough', tempEvent = function() {
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

    this.video.addEventListener('volumechange', tempEvent = function() {
			if(this.volume > 0) {
        self.changeState('muted', false);
      } else {
        self.changeState('muted', true);
      }
		});
    self.eventsVideoCollection.push(tempEvent);

    this.video.addEventListener('error', tempEvent = function(ev) {
      self.isError = true;

			self.error.custom(ev);
		});
    self.eventsVideoCollection.push(tempEvent);
  };


  stVideo.prototype.addControlsListeners = function(controlsBox) {
    var self = this, tempEvent;

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


  /*stVideo.prototype.addEventListeners = function() {
		var self = this, tempEvent;

    this.allowedEvents = ['canplay', 'canplaythrough', 'play', 'playing', 'pause', 'ended', 'abort', 'error', 'timeupdate'];
	};*/


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
        progress  = (current / duration).toFixed(4);

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
      this.video.play();
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

    if(action == 'muted') {
      this.isMuted = value;

      if(value) {
        ec.add(this.classNames.isMuted);
      } else {
        ec.remove(this.classNames.isMuted);
      }
    }
  };


  stVideo.prototype.destroy = function() {

  };


	return stVideo;

});
