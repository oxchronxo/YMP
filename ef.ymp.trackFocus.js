/**
Yahoo Media Player - trackFocus extension

Focuses the currently playing track

@author: Eric Fehrenbacher
@company: Yahoo!
*/
var TrackFocus = function() {
	
	// reference to YMP
	this.player = YAHOO.MediaPlayer;
	
    // create playlist reference
    this.playlist = YAHOO.mediaplayer.Controller.playlistmanager.playlistArray;
    
    //
	this.init();
	
};
TrackFocus.create = function(args) {
	YAHOO.mediaplayer.TrackFocus = new TrackFocus(args[0]);
	return YAHOO.mediaplayer.TrackFocus;
};
TrackFocus.attachElement = 'ymp-tray-list';
TrackFocus.prototype = {
	
	/**
	Attach some handlers for track play
	*/
	init: function() {
        this.player.onTrackStart.subscribe(this.onPlay, this, true);
	},
	
	/**
	*/
	onPlay: function(track) {
		
        var trackRegion = YAHOO.ympyui.util.Dom.getRegion(YAHOO.ympyui.util.Dom.get(track.mediaObject.id));
        var trackList = YAHOO.ympyui.util.Dom.get(TrackFocus.attachElement);
        var trackListRegion = YAHOO.ympyui.util.Dom.getRegion(trackList);
        var scrollTop = Math.abs((trackRegion.top - trackListRegion.top) + trackList.scrollTop);
		
		new YAHOO.ympyui.util.Scroll(trackList, { scroll: { to: [0, scrollTop] } }, 1, YAHOO.ympyui.util.Easing.easeOut).animate();
		
	}
	
};

/**
*/
(typeof YAHOO != 'undefined') && YAHOO.ympyui.util.Event.onAvailable(TrackFocus.attachElement, TrackFocus.create, TrackFocus);
