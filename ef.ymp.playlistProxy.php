<?php
// specify mime type
#header("Content-Type: application/xspf+xml");
header("Content-Type: text/xml");
// create document to work with
$dom = new DOMDocument("1.0", "UTF-8");
// grab playlist id
$playlist = $_GET["playlist"];
if ($playlist) {
	// fetch normalized xml with yql
	$xml = simplexml_load_file("http://query.yahooapis.com/v1/public/yql?q=USE%20%22http%3A%2F%2Fgithub.com%2Foxchronxo%2FYQL%2Fraw%2Fmaster%2Fplaylist.com.db.table.xml%22%20AS%20playlists%3B%0ASELECT%20*%20FROM%20playlists%20WHERE%20playlist%3D" . $playlist . "%3B&format=xml");
	// attach to document
	$dom->loadXML($xml->results->playlist->asXML());
}
// export as xml
echo $dom->saveXML();
?>
