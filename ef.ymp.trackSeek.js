/**
Yahoo Media Player - TrackSeek extension

Displays a visual position indicator and allows the user to control the seek position

@author: Eric Fehrenbacher
@company: Yahoo!
@version 0.1.2
*/
var TrackSeek = function() {
	
	// reference to YMP
	this.player = YAHOO.MediaPlayer;
	
	// position of the left edge of the slider relative to the page
	this.seekControlX = 0;
	
	// reference to the currently playing track
	this.track = null;
	
	// the elapsed time of the currently playing track
	this.elapsed = 0;
	
	// the duration of the currently playing track
	this.duration = 0;
	
	// tells us if the track is playing or not
	this.paused = true;
	
	// tells us if we are dragging the slider or not
	this.dragging = false;
	
	// tracks the percentage of movement from the left edge of the control
	this.position = 0;
	
	// setup of delegates, subscribers, and UI
	this.init();
	
};
TrackSeek.create = function(args) {
	YAHOO.mediaplayer.TrackSeek = new TrackSeek(args[0]);
	return YAHOO.mediaplayer.TrackSeek;
};
TrackSeek.attachElement = 'ymp-meta-album-title';
TrackSeek.prototype = {
	
	/**
	Fires during the contruction of this object
	@method init
	*/
	init: function() {
		
		// 
		this.setupUI();
		
		// some ui specs
		this.ui = {
			// define the total width
			width: function() {
				return parseInt(YAHOO.ympyui.util.Dom.getStyle('ymp-seek', 'width'));
			},
			// define the left edge
			left: function() {
				return Math.round(parseInt(YAHOO.ympyui.util.Dom.getStyle('ymp-seek-thumb', 'width')) / 2);
			},
			// define the right edge
			right: function() {
				return this.width() - this.left();
			}
		};
		
		// initialize default seek position...
		this.onPositionChange(1);
		
		// handle mousedown on the position control
		YAHOO.ympyui.util.Event.on('ymp-seek', 'mousedown', this.seekStartDrag, this, true);
		
		// handle clicks on the position control
		YAHOO.ympyui.util.Event.on('ymp-seek', 'click', this.stopEvent);
		
		// track hash of active track when play is clicked
		this.player.onTrackStart.subscribe(this.onPlay, this, true);
		
		// update position based on elapsed time of active track
		this.player.onProgress.subscribe(this.onProgress, this, true);
		
		//
		this.player.onTrackPause.subscribe(this.onPause, this, true);
		
		// 
		YAHOO.ympyui.util.Event.addListener(['ymp-next','ymp-prev'], 'click', function() {
			this.onPositionChange(1);
		}, this, true);
		
	},
	
	/**
	We just setup the GUI here.
	@method setupUI
	*/
	setupUI: function() {
		
		// grab the volume control
		var displaced = document.getElementById(TrackSeek.attachElement);
		YAHOO.ympyui.util.Dom.setStyles(displaced, {display: 'none'});
		
		// create slider
		var seekContainer = document.createElement('div');
		seekContainer.id = 'ymp-seek';
		YAHOO.ympyui.util.Dom.setStyles(seekContainer, {
			position: 'absolute',
			width: '190px',
			height: '15px',
			zIndex: '2'
		});
		displaced.parentNode.insertBefore(seekContainer, displaced);
		/*
        // we need to be notified when the timer changes size so we can readjust
        // or better yet, why do we need to readjust the timer should be doing that
        var seekRegion = YAHOO.ympyui.util.Dom.getRegion(seekContainer);
        var seekWidth = seekRegion.right - seekRegion.left;
        YAHOO.ympyui.util.Dom.setStyle(seekContainer, 'width', (seekWidth - 10) + 'px');
        */
        
		var seekCover = document.createElement('div');
		seekCover.id = 'ymp-seek-cover';
		YAHOO.ympyui.util.Dom.setStyles(seekCover, {
			display: 'block',
			position: 'absolute',
			overflow: 'hidden',
			top: '5px',
			left: '0px',
			width: '100%',
			height: '4px',
			backgroundColor: '#D6D6D6'
		});
		seekContainer.appendChild(seekCover);
		
		var seekCoverElapsed = document.createElement('div');
		seekCoverElapsed.id = 'ymp-seek-cover-elapsed';
		YAHOO.ympyui.util.Dom.setStyles(seekCoverElapsed, {
			display: 'block',
			position: 'absolute',
			visibility: 'hidden',
			overflow: 'hidden',
			top: '0px',
			left: '0px',
			width: '100%',
			height: '4px',
			backgroundColor: '#929392'
		});
		seekCover.appendChild(seekCoverElapsed);
		YAHOO.ympyui.util.Event.addListener(seekContainer, 'mouseover', function() {
			this.style.backgroundColor = '#CEFD0D';
		}, seekCoverElapsed, true);
		YAHOO.ympyui.util.Event.addListener(seekContainer, 'mouseout', function() {
			this.style.backgroundColor = '#929392';
		}, seekCoverElapsed, true);
		
		var seekThumb = document.createElement('div');
		seekThumb.id = 'ymp-seek-thumb';
		YAHOO.ympyui.util.Event.addListener(seekThumb, 'mouseover', function() {
			this.style.borderColor = '#CEFD0D';
		}, seekThumb, true);
		YAHOO.ympyui.util.Event.addListener(seekThumb, 'mouseout', function() {
			this.style.borderColor = '#DDDDDD #B2B2B2 #B2B2B2 #DDDDDD';
		}, seekThumb, true);
		YAHOO.ympyui.util.Dom.setStyles(seekThumb, {
			display: 'block',
			position: 'absolute',
			overflow: 'hidden',
			top: '3px',
			left: '0px',
			width: '4px',
			height: '7px',
			cursor: 'pointer',
			backgroundColor: '#E9E8E8',
			borderWidth: '1px',
			borderStyle: 'solid',
			borderColor: '#DDDDDD #B2B2B2 #B2B2B2 #DDDDDD'
		});
		seekContainer.appendChild(seekThumb);
		
	},
	
	/**
	Provides a shortcut for stopping an event
	@method stopEvent
	@param {DOMEvent} evt
	*/
	stopEvent: function(evt) {
		YAHOO.ympyui.util.Event.stopEvent(evt);
	},
	
	/**
	Event handler for when the user starts to drag the position slider
	@method seekStartDrag
	@param {Object} eventObj The HTML event object.
	*/
	seekStartDrag: function(evt) {
		if (this.paused) {
			return;
		}
		
		this.stopEvent(evt);
		this.dragging = true;
		
		// get the current position of the left edge of the slider relative to the page
		this.seekControlX = YAHOO.ympyui.util.Dom.getX('ymp-seek');
		
		// notify everyone about position change
		this.notifySeekChange(evt);
		
		YAHOO.ympyui.util.Event.on(document, 'mousemove', this.notifySeekChange, this, true);
		YAHOO.ympyui.util.Event.on(document, 'mouseup', this.seekMouseUp, this, true);  
	},
	
	/**
	Event handler when the user releases the mouse after dragging the position slider. Remove the appropriate event listeners.
	@method seekMouseUp
	@param {Object} eventObj The HTML event object
	*/                                                    
	seekMouseUp: function(evt) {
		this.dragging = false;
		this.stopEvent(evt);
		this.elapsed = this.duration - (this.position * this.duration);
		
		YAHOO.ympyui.util.Event.removeListener(document, 'mousemove', this.notifySeekChange);
		YAHOO.ympyui.util.Event.removeListener(document, 'mouseup', this.seekMouseUp);
		
		if (this.paused) {
			
			this.player.pause();
			return;
			
			// reduce the volume before we play so that no one here's the brief noise
			var volume = this.player.getVolume();
			this.player.setVolume(0);
			this.player.play(this.track, this.elapsed);
			/*
			it would be nice to be able to move the position while paused, but...
			for some reason this hack won't work here, haven't figured out why yet
			*/
			/*
			this.playCheck = YAHOO.ympyui.lang.later(100, this, function(volume) {
				if (this.player.getPlayerState() == 2) {
					this.playCheck.cancel();
					//this.updateSeekPosition();
					this.onProgress({elapsed: this.elapsed, duration: this.duration})
					console.log("asddddddddd");
					this.player.pause();
					//this.player.setVolume(volume);
				}
			}, [volume], true);
			*/
		} else {
			this.player.play(this.track, this.elapsed);
		}
		
	},
	
	/**
	Get the right requested position based on where the user has dragged the position slider and then fire the position change request event for that position
	@method notifySeekChange
	@param {DOMEvent} evt
	*/
	notifySeekChange: function(evt) {
		this.stopEvent(evt);
		var newMouseX = YAHOO.ympyui.util.Event.getPageX(evt);
		var xDiff = (newMouseX - this.seekControlX);
		xDiff -= 0;
		var thumbLeft;
		
		// calculate position percentage (0 - 1) and fire the event to notify whoever is listening
		if ((xDiff >= this.ui.left()) && (xDiff < this.ui.right())) {
			// mouse is within the constraint
			thumbLeft = xDiff - this.ui.left();
		} else if (xDiff >= this.ui.right()) {
			// mouse is way below the position, so cap the thumb at the maximum x it is allowed to go
			thumbLeft = this.ui.right() - this.ui.left();
		} else if (xDiff < this.ui.left()) {
			// mouse is way above the position, so cap the x at 0
			thumbLeft = 0;
		}
		
		// percentage of movement from the left edge of the control
		this.position = 1 - (thumbLeft / (this.ui.right() - this.ui.left()));
		
		this.onPositionChange(this.position);
	},
	
	/**
	Event handler for onPlay. Record the track as a mediaObject for reference.
	@method onPlay
	@param {Object} track The currently playing track
	*/
	onPlay: function(track) {
		this.paused = false;
		this.track = track.mediaObject;
	},
	
	/**
	This function updates the seek position based on the elapsed time of the currently playing track
	@method onProgress
	@param {Object} options
	*/
	onProgress: function(options) {
		this.elapsed = options.elapsed;
		this.duration = options.duration || (YAHOO.mediaplayer.TrackResume && YAHOO.mediaplayer.TrackResume.duration) || 0;
		if (!this.dragging && (this.duration != 0)) {
			var thumbLeft;
			
			// convert thumb position into seek position
			var xDiff = Math.ceil((Math.ceil(this.elapsed) * this.ui.right() - this.ui.left()) / Math.ceil(this.duration));
			xDiff -= 0;
			
			// calculate position percentage (0 - 1) and fire the event to notify whoever is listening
			if ((xDiff >= this.ui.left()) && (xDiff < this.ui.right())) {
				// seek is within the constraint
				thumbLeft = xDiff - this.ui.left();
			} else if (xDiff >= this.ui.right()) {
				// seek is way below the position, so cap the thumb at the maximum x it is allowed to go
				thumbLeft = this.ui.right() - this.ui.left();
			} else if (xDiff < this.ui.left()) {
				// seek is way above the position, so cap the x at 0
				thumbLeft = 0;
			}
			
			// percentage of seek position from the left edge of the controle
			var position = 1 - (thumbLeft / (this.ui.right() - this.ui.left()));
			
			this.onPositionChange(position);
		}
	},
	
	/**
	Event handler for onPlay. Record the track as a mediaObject for reference.
	@method onPause
	@param {Object} track The currently playing track
	*/
	onPause: function(track) {
		this.paused = true;
	},
	
	/**
	Event handler for onPositionChange. If the seek position is changed through API update the view appropriately
	@method onPositionChange
	@param {Object} seek The new position [0-1]
	*/
	onPositionChange: function(position) {
		
		// convert seek position into thumb position
		var thumbLeft = (1 - position) * (this.ui.right() - this.ui.left());
		
		// adjust seek thumb position
		YAHOO.ympyui.util.Dom.setStyle('ymp-seek-thumb', 'left', thumbLeft + 'px');
		
		// adjust elapsed position
		YAHOO.ympyui.util.Dom.setStyle('ymp-seek-cover-elapsed', 'visibility', 'visible');
		YAHOO.ympyui.util.Dom.setStyle('ymp-seek-cover-elapsed', 'left', -((this.ui.right() - this.ui.left()) - thumbLeft) + 'px');
		
	}
	
};

/**
This creates a new TrackSeek object and attaches to the MediaPlayer
*/
(typeof YAHOO != 'undefined') && YAHOO.ympyui.util.Event.onAvailable(TrackSeek.attachElement, TrackSeek.create, TrackSeek);
