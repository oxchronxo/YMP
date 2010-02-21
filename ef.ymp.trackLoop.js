/**
Yahoo Media Player - trackLoop extension

Displays a visual indicator and loops tracks randomly

@author: Eric Fehrenbacher
@company: Yahoo!
*/
var TrackLoop = function() {
	
	// reference to YMP
	this.player = YAHOO.MediaPlayer;
	
	// coookie handler
	this.cookie = new CookieCutter();
	
	// just some setup options
	this.config = {
		loop: 0,
		cookieCrumb: {
			loop : 'ympRPT'
		}
	};
	
	// whether the playlist loops
	this.loop = Number(this.cookie.get(this.config.cookieCrumb.loop) || this.config.loop);
	
    // create playlist reference
    this.playlist = YAHOO.mediaplayer.Controller.playlistmanager.playlistArray;
    
    // 
    this.stack = [];
    
    //
	this.init();
	
};
TrackLoop.create = function(args) {
	YAHOO.mediaplayer.TrackLoop = new TrackLoop(args[0]);
	return YAHOO.mediaplayer.TrackLoop;
};
TrackLoop.prototype = {
	
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
		var list = document.getElementById('ymp-tray-list');
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
        
        
        // create loop button
		var loopButton = document.createElement('div');
		loopButton.id = 'ymp-loop-button';
        YAHOO.ympyui.util.Dom.setStyles(loopButton, {
            float: 'right',
			height: '14px',
            fontSize: '12px',
            color: '#C5C5C5',
            marginLeft: '10px',
            cursor: 'pointer'
		});
        YAHOO.ympyui.util.Event.on(loopButton, 'click', this.toggleLoop, this, true);
        playlistControlsContainer.appendChild(loopButton);
		var loopIcon = document.createElement('div');
		loopIcon.id = 'ymp-loop-button-icon';
        YAHOO.ympyui.util.Dom.setStyles(loopIcon, {
            float: 'left',
			height: '10px',
            width: '12px',
            margin: '2px 2px 0px 0px',
			backgroundImage: 'url(http://github.com/oxchronxo/YMP/raw/master/images/loop.gif)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0px ' + (this.loop ? -(10) : 0) + 'px'
		});
        YAHOO.ympyui.util.Event.on(loopButton, 'mouseover', function() {
            YAHOO.ympyui.util.Dom.setStyle(loopIcon, 'backgroundPosition', '0px -20px');
		}, this, true);
        YAHOO.ympyui.util.Event.on(loopButton, 'mouseout', this.toggleLoopHighlight, this, true);
        loopButton.appendChild(loopIcon);
		
		var loopText = document.createTextNode('Loop');
        loopButton.appendChild(loopText);
        
	},
    
    /**
    */
	toggleLoop: function() {
        // toggle local var
        this.loop = this.loop ? 0 : 1;
        
        // store token
        this.cookie.set(this.config.cookieCrumb.loop, this.loop, 90);
        
        // change appearance
        this.toggleLoopHighlight();
        
    },
    /**
    */
	toggleLoopHighlight: function() {
        YAHOO.ympyui.util.Dom.setStyle('ymp-loop-button-icon', 'backgroundPosition', '0px ' + (this.loop ? -(10) : 0) + 'px');
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
        
        if (this.loop) {
            
            if (!YAHOO.mediaplayer.TrackShuffle || (YAHOO.mediaplayer.TrackShuffle && !YAHOO.mediaplayer.TrackShuffle.shuffle)) {
                
                var currentIndex = 0;
                
                for (var i = 0; i < this.playlist.length; i++) {
                    if (this.playlist[i].id == track.mediaObject.id) {
                        var currentIndex = i;
                        break;
                    }
                }
                
                if (currentIndex == (this.playlist.length - 1)) {
                    
                    // switch to new song
                    this.player.play(this.playlist[0], 0);
                }
                
            }
            
            // cancel the event
            return false;
            
        } else {
            
            return true;
        }
        
	}
	
};

/**
*/
(typeof YAHOO != 'undefined') && YAHOO.ympyui.util.Event.onAvailable('ymp-tray-list', TrackLoop.create, TrackLoop);
