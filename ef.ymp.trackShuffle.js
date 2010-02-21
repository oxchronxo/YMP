/**
Yahoo Media Player - trackShuffle extension

Displays a visual indicator and shuffles tracks randomly

@author: Eric Fehrenbacher
@company: Yahoo!
*/
var TrackShuffle = function() {
	
	// reference to YMP
	this.player = YAHOO.MediaPlayer;
	
	// coookie handler
	this.cookie = new CookieCutter();
	
	// just some setup options
	this.config = {
		shuffle: 0,
		cookieCrumb: {
			shuffle  : 'ympSHF'
		}
	};
	
	// whether the playlist shuffles
	this.shuffle = Number(this.cookie.get(this.config.cookieCrumb.shuffle) || this.config.shuffle);
	
    // create playlist reference
    this.playlist = YAHOO.mediaplayer.Controller.playlistmanager.playlistArray;
    
    // 
    this.stack = [];
    
    //
	this.init();
	
};
TrackShuffle.create = function(args) {
	YAHOO.mediaplayer.TrackShuffle = new TrackShuffle(args[0]);
	return YAHOO.mediaplayer.TrackShuffle;
};
TrackShuffle.attachElement = 'ymp-tray-list';
TrackShuffle.prototype = {
	
	/**
	Attach some handlers for track play and progress
	*/
	init: function() {
		
        //
		this.setupUI();
        
		//
		this.player.onTrackComplete.subscribe(this.onComplete, this, true);
		
	},
	
	/**
	We just setup the GUI here.
	*/
	setupUI: function() {
		
		// re-style the transport controls
		var list = document.getElementById(TrackFocus.attachElement);
		list.style.height = '160px';
		
        
		// create panel for playlist controls
        var playlistControlsContainerId = 'ymp-playlist-controls';
        var playlistControlsContainer = YAHOO.ympyui.util.Dom.get(playlistControlsContainerId);
        if (!playlistControlsContainer) {
            playlistControlsContainer = document.createElement('div');
            playlistControlsContainer.id = playlistControlsContainerId;
            YAHOO.ympyui.util.Dom.setStyles(playlistControlsContainer, {
                position: 'absolute',
                top: '184px',
                width: (parseInt(YAHOO.ympyui.util.Dom.getStyle('ymp-tray', 'width')) - 10) + 'px',
                height: '14px',
                zIndex: '2',
                padding: '2px 5px 3px 5px',
                borderTop: '1px solid #636363'
            });
            playlistControlsContainer.setAttribute('class', 'ymp-color-tray');
            list.parentNode.appendChild(playlistControlsContainer);
        }
        
        
        // create shuffle button
		var shuffleButton = document.createElement('div');
		shuffleButton.id = 'ymp-shuffle-button';
        YAHOO.ympyui.util.Dom.setStyles(shuffleButton, {
            float: 'right',
			height: '14px',
            fontSize: '12px',
            color: '#C5C5C5',
            marginLeft: '10px',
            cursor: 'pointer'
		});
        YAHOO.ympyui.util.Event.on(shuffleButton, 'click', this.toggleShuffle, this, true);
        playlistControlsContainer.appendChild(shuffleButton);
		var shuffleIcon = document.createElement('div');
		shuffleIcon.id = 'ymp-shuffle-button-icon';
        YAHOO.ympyui.util.Dom.setStyles(shuffleIcon, {
            float: 'left',
			height: '10px',
            width: '12px',
            margin: '2px 2px 0px 0px',
			backgroundImage: 'url(http://fehrenbacher.com/lib/images/shuffle.gif)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0px ' + (this.shuffle ? -(10) : 0) + 'px'
		});
        YAHOO.ympyui.util.Event.on(shuffleButton, 'mouseover', function() {
            YAHOO.ympyui.util.Dom.setStyle(shuffleIcon, 'backgroundPosition', '0px -20px');
		}, this, true);
        YAHOO.ympyui.util.Event.on(shuffleButton, 'mouseout', this.toggleShuffleHighlight, this, true);
        shuffleButton.appendChild(shuffleIcon);
		
		var shuffleText = document.createTextNode('Shuffle');
        shuffleButton.appendChild(shuffleText);
        
	},
    
    /**
    */
	toggleShuffle: function() {
        // toggle local var
        this.shuffle = this.shuffle ? 0 : 1;
        
        // store token
        this.cookie.set(this.config.cookieCrumb.shuffle, this.shuffle, 90);
        
        // change appearance
        this.toggleShuffleHighlight();
        
    },
    /**
    */
	toggleShuffleHighlight: function() {
        YAHOO.ympyui.util.Dom.setStyle('ymp-shuffle-button-icon', 'backgroundPosition', '0px ' + (this.shuffle ? -(10) : 0) + 'px');
    },
    
	/**
	Provides a shortcut for stopping an event
	*/
	stopEvent: function(evt) {
		YAHOO.ympyui.util.Event.stopEvent(evt);
	},
	
	/**
	*/
	onComplete: function(track) {
        
        track = track.mediaObject;
        
        var cancel = false;
        
        if (this.shuffle) {
            
            var trackIndex = null;
            
            // find a random song
            do {
                trackIndex = Math.floor(Math.random() * this.playlist.length);
                if (this.stack.indexOf(trackIndex) == -1) {
                    break;
                }
            } while (trackIndex);
            
            if (trackIndex) {
                
                track = this.playlist[trackIndex];
                
                // throw this on the top of the stack
                this.stack.splice(0, 0, trackIndex);
                
                // how many songs should we make sure we have burned through before we start letting them play again
                this.stack.length = (this.stack.length > 10) ? 10 : this.stack.length;
                
                // switch to new song
                this.player.play(track, 0);
                
            }
            
            cancel = true;
            
        }
        
        return cancel;
	}
	
};

/**
*/
(typeof YAHOO != 'undefined') && YAHOO.ympyui.util.Event.onAvailable(TrackShuffle.attachElement, TrackShuffle.create, TrackShuffle);
