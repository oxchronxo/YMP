/**
Yahoo Media Player - resumeTrack extension

Enables resuming of tracks from the last seek position.

@author: Eric Fehrenbacher
@company: Yahoo!
@version 0.1.2
*/
var TrackResume = function() {
	
	// reference to YMP
	this.player = YAHOO.MediaPlayer;
	
	// coookie handler
	this.cookie = new CookieCutter();
	
	// just some setup options
	this.config = {
        volume: this.player.getVolume(),
		elapsed: 0,
		duration: 0,
		token: '',
		paused: false,
		cookieCrumb: {
            volume   : 'ympVOL',
			paused   : 'ympPAU',
			elapsed  : 'ympTET',
			duration : 'ympTDR',
			token    : 'ympTTK'
		}
	};
	
	// reference to the currently playing track
	this.track = null;
	
	// keep the volume if we are resuming from another page
	this.volume = this.cookie.get(this.config.cookieCrumb.volume) || this.config.volume;
    this.volumeStack = [];
        
	// elapsed time of the currently playing track
	this.elapsed = this.cookie.get(this.config.cookieCrumb.elapsed) || this.config.elapsed;
	
	// total time of the currently playing track
	this.duration = this.cookie.get(this.config.cookieCrumb.duration) || this.config.duration;
	
	// md5 hash of token
	// we use md5 to keep this cookie size down to 120 bits and to guarantee the track is unique
	this.token = this.cookie.get(this.config.cookieCrumb.token) || this.config.token;
	
	// was the track paused when we left the player last time
	this.paused = (this.cookie.get(this.config.cookieCrumb.paused) == 1) ? true : this.config.paused;
	
	// 
	this.init();
	
};
TrackResume.create = function(args) {
	YAHOO.mediaplayer.TrackResume = new TrackResume(args);
	return YAHOO.mediaplayer.TrackResume;
};
//TrackSeek.attachElement = 'ymp-meta-album-title';
TrackResume.prototype = {
	
	/**
	Gets fired during the construction of the object
	@method init
	@param {Object} options
	*/
	init: function(options) {
		
        // adjust the volume to it's previous level
        this.adjustVolume();
        
		// track hash of active track when play is clicked
		this.player.onTrackStart.subscribe(this.onPlay, this, true);
		
		// track hash of active track when pausing
		this.player.onTrackPause.subscribe(this.onPause, this, true);
		
		// track elapsed time of active track
		this.player.onProgress.subscribe(this.onProgress, this, true);
		
		// handle resume play
		this.player.onMediaUpdate.subscribe(this.onUpdate, this, true);
		
	},
	
	/**
	@method play
	*/
	play: function(track, elapsed) {
		this.updateSeekPosition();
		track = track || this.track;
		elapsed = elapsed || this.elapsed;
		this.player.play(track, elapsed);
	},
	
	/**
	@method pause
	*/
	pause: function(track, elapsed) {
		track = track || this.track;
		elapsed = elapsed || this.elapsed;
		// reduce the volume before we play so that no one here's the brief noise
		var volume = volume = this.player.getVolume();
		this.player.setVolume(0);
		this.play(track, elapsed);
		/*
		this is a total hack :)
		
		because we don't have any exposed methods for setting the seek time of the track
		except for the 'play' method, we have to actually 'play' the track and then 'pause' it.
		the problem with this is that the 'play' method fires asyncronously which means that
		calling the 'pause' method following the 'play' method will most likely fail due to the
		fact that the 'play' method is not finished and cancels the 'pause'
		the solution here is to use an interval to execute the pause method only after the
		state of the player is in 'play' mode.
		a more legitimate solution would be to have a method exposed that allows us to set the
		seek position in any state. so even if the track is paused the player seeks to the
		requested position
		*/
		this.playCheck = YAHOO.ympyui.lang.later(100, this, function(volume) {
			if (this.player.getPlayerState() == 2) {
				this.playCheck.cancel();
				this.updateSeekPosition();
				this.player.pause();
				this.player.setVolume(volume);
			}
		}, [volume], true);
	},
	
    /**
    */
    setVolume: function() {
        
        this.volume = this.player.getVolume();
        
        var saveVolume = true;
        
        if (this.volumeStack.length < 3) {
            saveVolume = false;
        } else {
            for (var i = 0; i < this.volumeStack.length; i++) {
                if (this.volumeStack[i] != this.volume) {
                    saveVolume = false;
                }
            }
        }
        this.volumeStack.splice(0, 0, this.volume);
        this.volumeStack.length = 3;
        
        if (saveVolume) {
            this.cookie.set(this.config.cookieCrumb.volume, this.volume, 90);
        }
        
    },
    
    /**
    */
    adjustVolume: function(volume) {
        this.volume = volume || this.volume;
        this.player.setVolume(this.volume);
    },
    
	/**
	@method setCurrentTrack
	@param {Object} track
	*/
	setCurrentTrack: function(track) {
//console.log("getting ready to save md5 token");
		this.track = track.mediaObject;
		var token = md5(this.track.token.substr(0,(this.track.token.toLowerCase().indexOf(".mp3") + 4)));
/*
console.log("this.track",this.track);
console.log("this.track.title",this.track.title);
console.log("this.track.token",this.track.token);
console.log("this.track.token.substr(0,(this.track.token.toLowerCase().indexOf(\".mp3\") + 4))",this.track.token.substr(0,(this.track.token.toLowerCase().indexOf(".mp3") + 4)));
console.log("token",token);
*/
		this.elapsed = (token != this.token) ? 0 : this.elapsed;
		this.token = token;
		this.cookie.set(this.config.cookieCrumb.token, token, 90);
	},
	
	/**
	@method setTrackTime
	@param {Object} options
	*/
	setTrackTime: function(options) {
		if (options.duration > 0) {
			this.elapsed = options.elapsed;
			this.cookie.set(this.config.cookieCrumb.elapsed, options.elapsed, 90);
			this.cookie.set(this.config.cookieCrumb.duration, options.duration, 90);
			return true;
		}
		return false;
	},
	
	/**
	@method setPausedState
	@param {Boolean} state Wheather YMP is currently paused. true || false
	*/
	setPausedState: function(state) {
		this.paused = state;
		this.cookie.set(this.config.cookieCrumb.paused, (this.paused ? 1 : 0), 90);
	},
	
	/**
	@method updateSeekPosition
	*/
	updateSeekPosition: function() {
		YAHOO.mediaplayer.TrackSeek && YAHOO.mediaplayer.TrackSeek.onProgress({elapsed: this.elapsed, duration: this.duration});
	},
	
	/**
	Event handler for 'play'
	@method onPlay
	@param {Object} track
	*/
	onPlay: function(track) {
		//console.log("onPlay::this.elapsed",this.elapsed);
		this.setCurrentTrack(track);
		this.setPausedState(false);
		this.play(this.track, this.elapsed);
	},
	
	/**
	Event handler
	This function tracks the elapsed time of the currently playing track
	@method onProgress
	@param {Object} options
	*/
	onProgress: function(options) {
		//console.log("onProgress::this.elapsed",this.elapsed);
		this.setTrackTime(options);
        this.setVolume();
	},
	
	/**
	Event handler for 'pause'
	@method onPause
	@param {Object} track
	*/
	onPause: function(track) {
		this.setPausedState(true);
	},
	
	/**
	Event handler for when a mediaObject exists and is updated
	*/
	onUpdate: function(mediaObject) {
		if (MD5(mediaObject.token) == this.token) {
			this.track = mediaObject;
			if (this.paused) {
				this.pause(this.track, this.elapsed);
			} else {
				this.play(this.track, this.elapsed);
			}
		}
	}
	
};

/*
This creates a new TrackResume object and attaches to the MediaPlayer
*/
(typeof YAHOO != 'undefined') && YAHOO.MediaPlayer.onAPIReady.subscribe(TrackResume.create);
//(typeof YAHOO != 'undefined') && YAHOO.ympyui.util.Event.onAvailable(TrackResume.attachElement, TrackResume.create, TrackResume);
