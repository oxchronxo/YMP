<?php
	
	$playlist_id = $_GET["playlist"];
	
	if (!$playlist) {
		exit;
	}
	#echo "playlist:" . $playlist . "\n";
	
	$url = "http://query.yahooapis.com/v1/public/yql?q=USE%20%22http%3A%2F%2Fgithub.com%2Foxchronxo%2FYQL%2Fraw%2Fmaster%2Fplaylist.com.db.table.xml%22%20AS%20playlists%3B%0ASELECT%20*%20FROM%20playlists%20WHERE%20playlist%3D" . $playlist . "%3B&format=xml&diagnostics=false";
	#echo "url:" . $url . "\n";
	
	$xml = simplexml_load_file($url);
	$xml->addChild("playlist");
	$xml->playlist[0] = $xml->results->playlist;
	
	$dom = new DOMDocument("1.0", "UTF-8");
	$dom->formatOutput = true;
	$dom->preserveWhiteSpace = true;
	
	$dom->loadXML($xml->results->playlist->asXML());
	#echo "dom:" . $dom->saveXML() . "\n";
	
	# proper mime for xspf
	header("Content-Type: application/xspf+xml");
	
	echo $dom->saveXML();
	
?>
