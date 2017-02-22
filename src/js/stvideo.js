/* global define */

( function( root, factory ) {
  if ( typeof define === 'function' && define.amd ) {
    define( [], function() {
      return factory( root );
    } );
  } else if ( typeof module === 'object' && module.exports ) {
    module.exports = factory( root );
  } else {
    root.stVideo = factory( root );
  }
} )( typeof global !== 'undefined' ? global : this.window || this.global, function( root ) {
  'use strict';

  ( function( window ) {
    var lastTime = 0;
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

    for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x ) {
      window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
      window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }

    if ( !window.requestAnimationFrame ) {
      window.requestAnimationFrame = function( callback, element ) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
        var id = window.setTimeout( function() {
          callback( currTime + timeToCall );
        }, timeToCall );
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if ( !window.cancelAnimationFrame ) {
      window.cancelAnimationFrame = function( id ) {
        clearTimeout( id );
      };
    }
  }( root ) );

  var stVideo = function( el, settings ) {
    this.iOS = ( /iPhone|iPad|iPod/i.test( navigator.userAgent ) );

    this.isMobile = navigator.userAgent.match( /Android|AvantGo|BlackBerry|DoCoMo|Fennec|iPod|iPhone|iPad|J2ME|MIDP|NetFront|Nokia|Opera Mini|Opera Mobi|PalmOS|PalmSource|portalmmm|Plucker|ReqwirelessWeb|SonyEricsson|Symbian|UP\\.Browser|webOS|Windows CE|Windows Phone OS|Xiino/i );

    this.useTouch = !!( 'ontouchstart' in window ) || !!( 'ontouchstart' in document.documentElement ) || !!window.ontouchstart || !!window.onmsgesturechange || ( window.DocumentTouch && window.document instanceof window.DocumentTouch );

    this.element = document.querySelector( el );

    this.defaults = {
      force           : '', // video | canvas
      framesPerSecond : 30,
      volume          : 1
    };

    this.settings = this.getSettings( settings );

    if ( !( this.settings.mp4 || this.settings.webm || this.settings.ogg ) ||
      !this.settings.width || !this.settings.height ) {

      this.isError = true;

      this.error.checkSettings();

      return;
    }

    if ( this.settings.force === 'video' ) {
      this.useCanvas = false;
    } else if ( this.settings.force === 'canvas' ) {
      this.useCanvas = true;
    }

    this.classNames = {
      init      : 'stvideo-box',
      error     : 'stvideo-box--error',
      isPlaying : 'stvideo-box--is-playing',
      isPaused  : 'stvideo-box--is-paused',
      isEnded   : 'stvideo-box--is-ended',
      isMuted   : 'stvideo-box--is-muted',
      isHandle  : 'stvideo-box--is-handle',
      hasAudio  : 'stvideo-box--has-audio',
      player    : 'stvideo-box__player',
      poster    : 'stvideo-box__poster',
      play      : 'stvideo-box__play',
      playPause : 'stvideo-box__play-pause',
      controls  : 'stvideo-box__controls',
      timeline  : 'stvideo-box__timeline',
      progress  : 'stvideo-box__progress',
      handle    : 'stvideo-box__handle',
      duration  : 'stvideo-box__duration',
      volume    : 'stvideo-box__volume',
    };

    this.timelineSettings = {
      wrapperWidth   : 0,
      isMouseDown    : false,
      isHandleMoving : false,
      startX         : 0,
      touchObj       : null,
      posLeft        : 0,
      lastPosLeft    : 0,
      lastDistance   : 0,
      lastDirection  : ''
    };

    this.eventsUserCollection = [];
    this.eventsVideoCollection = [];
    this.eventsControlsCollection = [];

    this.initPlayer();
  };

  stVideo.prototype.getSettings = function( settings ) {
    var attr, options, key;

    if ( !settings ) {
      attr = this.element.getAttribute( 'data-stvideo' );
      attr = attr.replace( /\'/g, '"' );
      settings = JSON.parse( attr );
    }

    options = this.defaults;

    for ( key in settings ) {
      if ( settings.hasOwnProperty( key ) ) {
        options[ key ] = settings[ key ];
      }
    }

    return options;
  };

  stVideo.prototype.isContained = function( m, ev ) {
    var e = ev || window.event;

    var c = /(click)|(mousedown)|(mouseup)/i.test( e.type ) ? e.target : ( e.relatedTarget || ( ( e.type == 'mouseover' ) ? e.fromElement : e.toElement ) );

    while ( c && c != m ) {
      try {
        c = c.parentNode;
      } catch ( er ) {
        c = m;
      }
    }

    if ( c == m ) {
      return true;
    } else {
      return false;
    }
  };

  stVideo.prototype.initPlayer = function() {
    var self = this, format, wrapper, video, videoSource, type, canvas, canvasContext, itemIndex;

    this.element.classList.add( this.classNames.init );

    video = document.createElement( 'video' );
    video.setAttribute( 'width', this.settings.width );
    video.setAttribute( 'height', this.settings.height );

    format = this.supportedVideoFormat( video );

    if ( !format || ( this.useCanvas && !this.settings.mp4 ) || !this.settings[ format.ext ] ) {
      this.error.badVideoFormat.call( this );

      return;
    }

    videoSource = document.createElement( 'source' );
    videoSource.setAttribute( 'src', this.settings[ format.ext ] );
    videoSource.setAttribute( 'type', format.type );

    video.appendChild( videoSource );

    wrapper = document.createElement( 'div' );
    wrapper.classList.add( this.classNames.player );

    if ( this.useCanvas ) {
      canvas = document.createElement( 'canvas' );
      canvas.setAttribute( 'width', this.settings.width );
      canvas.setAttribute( 'height', this.settings.height );

      canvasContext = canvas.getContext( '2d' );

      canvasContext.fillStyle = '#ffffff';
      canvasContext.fillRect( 0, 0, this.settings.width, this.settings.height );

      canvasContext.drawImage( video, 0, 0, this.settings.width, this.settings.height );

      this.canvasContext = canvasContext;

      wrapper.appendChild( canvas );
    } else {
      wrapper.appendChild( video );
    }

    this.element.appendChild( wrapper );

    video.load();

    this.video = video;

    this.playerControls();
    this.addVideoListeners();
    this.addControlsListeners();

    if ( this.isMobile ) {
      window.addEventListener( 'orientationchange', function() {
        if ( this.resizeTo ) {
          clearTimeout( this.resizeTo );
        }

        this.resizeTo = setTimeout( function() {
          for ( itemIndex = 0; itemIndex < self.resizeCacheArr.length; itemIndex++ ) {
            self.resizeCacheArr[ itemIndex ]();
          }
        }, 200 );
      }, false );
    } else {
      window.addEventListener( 'resize', function() {
        if ( this.resizeTo ) {
          clearTimeout( this.resizeTo );
        }

        this.resizeTo = setTimeout( function() {
          for ( itemIndex = 0; itemIndex < self.resizeCacheArr.length; itemIndex++ ) {
            self.resizeCacheArr[ itemIndex ]();
          }
        }, 200 );
      } );
    }
  };

  stVideo.prototype.resizeHandler = function( fn ) {
    this.resizeCacheArr = this.resizeCacheArr || [];

    fn();

    this.resizeCacheArr.push( fn );
  };

  stVideo.prototype.supportedVideoFormat = function( video ) {
    var options = {};

    if ( video.canPlayType( 'video/webm' ) === 'probably' || video.canPlayType( 'video/webm' ) === 'maybe' ) {
      options.ext = 'webm';
      options.type = 'video/webm; codecs="vp8, vorbis"';
    } else if ( video.canPlayType( 'video/mp4' ) === 'probably' || video.canPlayType( 'video/mp4' ) === 'maybe' ) {
      options.ext = 'mp4';
      options.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    } else if ( video.canPlayType( 'video/ogg' ) === 'probably' || video.canPlayType( 'video/ogg' ) === 'maybe' ) {
      options.ext = 'ogg';
      options.type = 'video/ogg; codecs="theora, vorbis"';
    }

    return options;
  };

  stVideo.prototype.videoAudio = function( video ) {
    var self = this, tempEvent, volume;

    if ( video.mozHasAudio || Boolean( video.webkitAudioDecodedByteCount ) || Boolean( video.audioTracks && video.audioTracks.length ) ) {
      this.hasAudio = true;

      this.element.classList.add( this.classNames.hasAudio );

      volume = document.createElement( 'div' );
      volume.classList.add( this.classNames.volume );

      this.elControls.appendChild( volume );

      this.elVolume = volume;

      this.elVolume.addEventListener( 'click', tempEvent = function() {
        if ( self.isMuted ) {
          self.video.volume = self.settings.volume;

          if ( self.audio ) {
            self.audio.volume = self.settings.volume;

            self.audio.currentTime = self.video.currentTime;

            if ( self.isPlaying ) {
              self.audio.play();
            }

            if ( self.iOS ) {
              self.changeState( 'muted', false );
            }
          }
        } else {
          self.video.volume = 0.01;

          if ( self.audio ) {
            self.audio.volume = 0.01; // hmm doesn't work on iPhone
            self.audio.pause();

            if ( self.iOS ) {
              self.changeState( 'muted', true );
            }
          }
        }
      } );
      this.eventsControlsCollection.push( tempEvent );
    } else {
      this.hasAudio = false;
    }

    return this.hasAudio;
  };

  stVideo.prototype.playerControls = function() {
    var self = this, poster, controls, timeline, progress, handle, playPause, play, duration;

    if ( this.settings.poster ) {
      poster = document.createElement( 'div' );
      poster.classList.add( this.classNames.poster );
      poster.style.backgroundImage = 'url(' + this.settings.poster + ')';

      this.element.appendChild( poster );
    }

    play = document.createElement( 'div' );
    play.classList.add( this.classNames.play );

    controls = document.createElement( 'div' );
    controls.classList.add( this.classNames.controls );

    playPause = document.createElement( 'div' );
    playPause.classList.add( this.classNames.playPause );

    timeline = document.createElement( 'div' );
    timeline.classList.add( this.classNames.timeline );

    progress = document.createElement( 'div' );
    progress.classList.add( this.classNames.progress );

    handle = document.createElement( 'div' );
    handle.classList.add( this.classNames.handle );

    duration = document.createElement( 'div' );
    duration.classList.add( this.classNames.duration );

    timeline.appendChild( progress );
    timeline.appendChild( handle );
    controls.appendChild( timeline );
    controls.appendChild( playPause );
    controls.appendChild( duration );

    this.element.appendChild( controls );
    this.element.appendChild( play );

    this.elControls  = controls;
    this.elPlay      = play;
    this.elPlayPause = playPause;
    this.elTimeline  = timeline;
    this.elProgress  = progress;
    this.elHandle    = handle;
    this.elDuration  = duration;

    setTimeout( function() {
      self.resizeHandler( function() {
        self.timelineSettings.wrapperWidth = self.elTimeline.offsetWidth;
      } );
    }, 100 );
  };

  stVideo.prototype.addVideoListeners = function() {
    var self = this, tempEvent;

    this.video.addEventListener( 'loadedmetadata', tempEvent = function() {
      var audio = self.videoAudio( this );

      if ( self.useCanvas && audio ) {
        self.canvasAudio();
      }
    } );
    self.eventsVideoCollection.push( tempEvent );

    this.video.addEventListener( 'canplaythrough', tempEvent = function() {
      if ( self.useCanvas ) {
        self.canvasDrawFrame();
      }

      self.progressUpdate();
    } );
    self.eventsVideoCollection.push( tempEvent );

    if ( !self.useCanvas ) {
      this.video.addEventListener( 'play', tempEvent = function() {
        self.changeState( 'play', true );
        self.changeState( 'end', false );
      } );
      self.eventsVideoCollection.push( tempEvent );

      this.video.addEventListener( 'pause', tempEvent = function() {
        self.changeState( 'pause', true );
        self.changeState( 'play', false );
      } );
      self.eventsVideoCollection.push( tempEvent );

      this.video.addEventListener( 'ended', tempEvent = function() {
        self.changeState( 'end', true );
        self.changeState( 'play', false );
      } );
      self.eventsVideoCollection.push( tempEvent );
    }

    this.video.addEventListener( 'timeupdate', tempEvent = function() {
      if ( self.useCanvas ) {
        self.canvasDrawFrame();
      }

      self.progressUpdate();
    } );
    self.eventsVideoCollection.push( tempEvent );

    this.video.addEventListener( 'volumechange', tempEvent = function() {
      if ( this.volume > 0.01 ) {
        self.changeState( 'muted', false );
      } else {
        self.changeState( 'muted', true );
      }
    } );
    self.eventsVideoCollection.push( tempEvent );

    this.video.addEventListener( 'error', tempEvent = function( ev ) {
      self.isError = true;

      self.error.custom( ev );
    } );
    self.eventsVideoCollection.push( tempEvent );
  };

  stVideo.prototype.addControlsListeners = function( controlsBox ) {
    var self = this, tempEvent;

    this.elPlay.addEventListener( 'click', tempEvent = function() {
      if ( !self.isPlaying ) {
        self.play();
      } else {
        self.pause();
      }
    } );
    self.eventsControlsCollection.push( tempEvent );

    this.elPlayPause.addEventListener( 'click', tempEvent = function() {
      if ( !self.isPlaying ) {
        self.play();
      } else {
        self.pause();
      }
    } );
    self.eventsControlsCollection.push( tempEvent );

    if ( !this.useTouch ) {
      document.body.addEventListener( 'mousedown', tempEvent = function( e ) {
        e.preventDefault();

        self.timelineSettings.isHandleMoving = true;

        if ( self.isContained( self.elHandle, e ) ) {
          self.timelineSettings.touchObj = e;
          self.timelineSettings.posLeft  = self.timelineSettings.lastPosLeft;
          self.timelineSettings.startX   = parseInt( e.clientX );

          self.timelineSettings.isMouseDown = true;

          self.changeState( 'handle', true );
        } else if ( self.isContained( self.elTimeline, e ) ) {
          self.timelineSettings.touchObj = e;
          self.timelineSettings.posLeft  = 0;
          self.timelineSettings.startX   = parseInt( e.layerX );

          var dist = self.timelineSettings.startX;

          self.moveHandle( dist, true );

          self.timelineSettings.isHandleMoving = false;
        } else {
          self.timelineSettings.isHandleMoving = false;
        }
      }, false );
      self.eventsControlsCollection.push( tempEvent );

      document.body.addEventListener( 'mousemove', tempEvent = function( e ) {
        e.preventDefault();

        if ( self.timelineSettings.isMouseDown && self.timelineSettings.isHandleMoving ) {
          self.timelineSettings.touchObj = e;

          var dist = parseInt( self.timelineSettings.touchObj.clientX ) - self.timelineSettings.startX;

          self.moveHandle( dist );
        }
      }, false );
      self.eventsControlsCollection.push( tempEvent );

      document.body.addEventListener( 'mouseup', tempEvent = function( e ) {
        e.preventDefault();

        if ( self.timelineSettings.isMouseDown ) {
          self.timelineSettings.touchObj = e;
          self.timelineSettings.posLeft  = self.timelineSettings.lastPosLeft;
          self.timelineSettings.startX   = parseInt( self.timelineSettings.touchObj.clientX );

          self.timelineSettings.isMouseDown = false;

          self.moveHandle( 0, true );

          self.changeState('handle', false);

          self.timelineSettings.isHandleMoving = false;
        }
      }, false );
      self.eventsControlsCollection.push( tempEvent );

    } else {
      this.elHandle.addEventListener( 'touchstart', tempEvent = function( e ) {
        // e.preventDefault();
        e.stopPropagation();

        self.timelineSettings.isHandleMoving = true;

        self.timelineSettings.touchObj = e.changedTouches[ 0 ];
        self.timelineSettings.posLeft  = self.timelineSettings.lastPosLeft;
        self.timelineSettings.startX   = parseInt( self.timelineSettings.touchObj.clientX );

        self.changeState( 'handle', true );
      }, false );
      self.eventsControlsCollection.push( tempEvent );

      this.elHandle.addEventListener( 'touchmove', tempEvent = function( e ) {

        if ( self.timelineSettings.isHandleMoving ) {
          // e.preventDefault();
          e.stopPropagation();

          self.timelineSettings.touchObj = e.changedTouches[ 0 ];

          var dist = parseInt( self.timelineSettings.touchObj.clientX ) - self.timelineSettings.startX;

          self.moveHandle( dist );
        }
      }, false );
      self.eventsControlsCollection.push( tempEvent );

      this.elHandle.addEventListener( 'touchend', tempEvent = function( e ) {
        e.preventDefault();

        self.timelineSettings.posLeft = self.timelineSettings.lastPosLeft;

        self.moveHandle( 0, true );

        self.changeState( 'handle', false );

        self.timelineSettings.isHandleMoving = false;
      }, false );
      self.eventsControlsCollection.push( tempEvent );
    }
  };

  stVideo.prototype.canvasAudio = function() {
    this.audio = document.createElement( 'audio' );

    this.audio.innerHTML = this.video.innerHTML;

    this.audio.load();
  };

  stVideo.prototype.canvasControl = function( action ) {
    if ( action === 'play' || ( action === 'play' && this.isEnded ) ) {
      if ( this.isEnded ) {
        this.changeState( 'end', false );

        this.video.currentTime = 0;

        if ( this.audio ) {
          this.audio.currentTime = 0;
        }

        this.lastTime = Date.now();
      }

      if ( this.audio && this.isMuted !== true ) {
        this.audio.play();
      }

      this.changeState( 'play', true );

      this.animationFrame = root.requestAnimationFrame( this.canvasFrameUpdate.bind( this ) );

    } else if ( action === 'pause' || action === 'ended' ) {
      if ( action === 'ended' ) {
        this.changeState( 'end', true );
      } else {
        this.changeState( 'pause', true );
      }

      if ( this.audio ) {
        this.audio.pause();
      }

      this.changeState( 'play', false );

      root.cancelAnimationFrame( this.animationFrame );
    }
  };

  stVideo.prototype.canvasFrameUpdate = function() {
    var time = Date.now(),
      elapsed = ( time - ( this.lastTime || time ) ) / 1000;

    if ( !elapsed || elapsed >= 1 / this.settings.framesPerSecond ) {
      this.video.currentTime = this.video.currentTime + elapsed;

      /* if(this.audio && Math.abs(this.audio.currentTime - this.video.currentTime) > 0.3){
        this.audio.pause();
  			this.audio.currentTime = this.video.currentTime;
        this.audio.play();
  		} */

      this.lastTime = time;
    }

    if ( this.video.currentTime >= this.video.duration ) {
      this.canvasControl( 'ended' );
    } else {
      this.animationFrame = root.requestAnimationFrame( this.canvasFrameUpdate.bind( this ) );
    }
  };

  stVideo.prototype.canvasDrawFrame = function() {
    this.canvasContext.drawImage( this.video, 0, 0, this.settings.width, this.settings.height );
  };

  stVideo.prototype.progressUpdate = function( movedByDistance ) {
    var current = this.video.currentTime,
      duration  = this.video.duration,
      timeline  = this.timelineSettings;

    if ( movedByDistance ) {
      current = this.video.currentTime = ( movedByDistance / timeline.wrapperWidth ) * duration;
    }

    var progress  = ( current / duration * timeline.wrapperWidth ).toFixed( 2 );

    if ( progress < 0 ) {
      progress = 0;
    } else if ( progress > timeline.wrapperWidth ) {
      progress = timeline.wrapperWidth;
    }

    this.elProgress.style.width = +progress + 'px';

    if ( !timeline.isHandleMoving ) {
      this.elHandle.style.left = +progress + 'px';
    }

    this.elDuration.innerText = this.formatTime( current ) + ' / ' + this.formatTime( duration );
  };

  stVideo.prototype.formatTime = function( seconds ) {
    var min, sec;

    min = Math.floor( seconds / 60 );
    min = ( min >= 10 ) ? min : '0' + min;
    sec = Math.floor( seconds % 60 );
    sec = ( sec >= 10 ) ? sec : '0' + sec;

    return min + ':' + sec;
  };

  stVideo.prototype.moveHandle = function( movedByDistance, touchEnd ) {
    var opt = this.timelineSettings;

    if ( !opt.isHandleMoving ) {
      return;
    }

    var direction = ( ( touchEnd ? opt.lastDistance : movedByDistance ) > 0 ) ? 'right' : 'left';

    var newPosition = opt.posLeft + movedByDistance;

    if ( newPosition < 0 ) {
      newPosition = 0;
    } else if ( newPosition > opt.wrapperWidth ) {
      newPosition = opt.wrapperWidth;
    }

    this.elHandle.style.left = newPosition + 'px';

    opt.lastPosLeft = newPosition;
    opt.lastDistance = movedByDistance;
    opt.lastDirection = direction;

    if ( touchEnd ) {
      this.progressUpdate( newPosition );
    }
  };

  stVideo.prototype.error = {
    badVideoFormat: function() {
      if ( this.useCanvas ) {
        console.error( 'Apple devices support only .mp4 format' );
      } else {
        console.error( 'Best use .webm and .mp4 video formats' );
      }

      this.element.classList.add( this.classNames.error );
    },
    checkSettings: function() {
      console.error( 'Check all required settings' );

      this.element.classList.add( this.classNames.error );
    },
    custom: function( msg ) {
      console.error( msg );

      this.element.classList.add( this.classNames.error );
    }
  };

  stVideo.prototype.on = function( name, callback ) {
    if ( this.isError ) {
      return;
    }

    var self = this, tempEvent;

    // this.allowedEvents = ['canplay', 'canplaythrough', 'play', 'playing', 'pause', 'ended', 'abort', 'error', 'timeupdate'];

		// if(this.allowedEvents.indexOf(name) == -1) return;

    this.video.addEventListener( name, tempEvent = function() {
      callback.call( this );
    } );

    tempEvent.fnName = name;

    self.eventsUserCollection.push( tempEvent );
  };

  stVideo.prototype.eventCallback = function( name ) {
    if ( this.useCanvas ) {
      for ( var k in this.eventsUserCollection ) {
        if ( this.eventsUserCollection[ k ].fnName === name ) {
          this.eventsUserCollection[ k ]();
        }
      }
    }
  };

  stVideo.prototype.play = function() {
    if ( this.isError ) {
      return;
    }

    this.lastTime = Date.now();

    if ( this.useCanvas ) {
      this.canvasControl( 'play' );
    } else {
      this.video.play();
    }
  };

  stVideo.prototype.pause = function() {
    if ( this.isError ) {
      return;
    }

    if ( this.isPlaying ) {
      if ( this.useCanvas ) {
        this.canvasControl( 'pause' );
      } else {
        this.video.pause();
      }
    }
  };

  stVideo.prototype.changeState = function( action, value ) {
    var ec = this.element.classList;

    if ( action === 'play' ) {
      this.isPlaying = value;

      if ( value ) {
        ec.add( this.classNames.isPlaying );

        this.eventCallback( 'play' );
      } else {
        ec.remove( this.classNames.isPlaying );
      }
    }

    if ( action === 'pause' ) {
      this.isPaused = value;

      if ( value ) {
        ec.add( this.classNames.isPaused );

        this.eventCallback( 'pause' );
      } else {
        ec.remove( this.classNames.isPaused );
      }
    }

    if ( action === 'end' ) {
      this.isEnded = value;

      if ( value ) {
        ec.add( this.classNames.isEnded );

        this.eventCallback( 'end' );
      } else {
        ec.remove( this.classNames.isEnded );
      }
    }

    if ( action === 'muted' ) {
      this.isMuted = value;

      if ( value ) {
        ec.add( this.classNames.isMuted );

        this.eventCallback( 'muted' );
      } else {
        ec.remove( this.classNames.isMuted );
      }
    }

    if ( action === 'handle' ) {
      this.isMuted = value;

      if ( value ) {
        ec.add( this.classNames.isHandle );
      } else {
        ec.remove( this.classNames.isHandle );
      }
    }
  };

  stVideo.prototype.destroy = function() {

  };

  return stVideo;
} );
