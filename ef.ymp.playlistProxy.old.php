<?php
	
	function hexToChars($hex) {
		$a = array();
		$b = (substr($hex, 0, 2) == "0x") ? 2 : 0;
		while ($b < strlen($hex)) {
			array_push($a, intval(substr($hex, $b, 2), 16));
			$b += 2;
		}
		return $a;
	}
	
	function charsToStr($chars) {
		$a = "";
		$b = 0;
		while ($b < count($chars)) {
			$a .= chr($chars[$b]);
			++$b;
		}
		return $a;
	}
	
	function strToChars($str) {
		$a = array();
		$b = 0;
		while ($b < strlen($str)) {
			array_push($a, ord($str[$b]));
			++$b;
		}
		return $a;
	}
	
	function calculate($plaintxt, $psw) {
		$sbox = array();
		$mykey = array();
		
		$a = 0;
		$b;
		$c = count($psw);
		$d = 0;
		while ($d <= 255) {
			$mykey[$d] = $psw[$d % $c];
			$sbox[$d] = $d;
			++$d;
		}
		$d = 0;
		while ($d <= 255) {
			$a = ($a + $sbox[$d] + $mykey[$d]) % 256;
			$b = $sbox[$d];
			$sbox[$d] = $sbox[$a];
			$sbox[$a] = $b;
			++$d;
		}
		
		$a = 0;
		$b = 0;
		$c = array();
		$d;
		$e;
		$f;
		$g = 0;
		while ($g < count($plaintxt)) {
			$a = ($a + 1) % 256;
			$b = ($b + $sbox[$a]) % 256;
			$e = $sbox[$a];
			
			$sbox[$a] = $sbox[$b];
			
			$sbox[$b] = $e;
			$h = ($sbox[$a] + $sbox[$b]) % 256;
			$d = $sbox[$h];
			$f = $plaintxt[$g] ^ $d;
			array_push($c, $f);
			++$g;
		}
		return $c;
	}
	
	function decrypt($src, $key) {
		return charsToStr(calculate(hexToChars($src), strToChars($key)));
	}
	
	$hashKey = "sdf883jsdf22";
	
	$playlist = $_GET["playlist"];
	if (!$playlist) {
		exit;
	}
	$url = "http://pl.playlist.com/pl.php?playlist=".$playlist;
	
	$dom = new DOMDocument("1.0", "UTF-8");
	$dom->formatOutput = true;
	
	$playlist = $dom->createElement("playlist");
	$playlist->setAttribute("version", "0");
	$playlist->setAttribute("xmlns", "http://xspf.org/ns/0/");
	$dom->appendChild($playlist);
	
	$metaCacheControl = $dom->createElement("meta");
	$metaCacheControl->setAttribute("http-equiv", "Cache-Control");
	$metaCacheControl->setAttribute("content", "no-cache");
	$playlist->appendChild($metaCacheControl);
	
	$metaPragma = $dom->createElement("meta");
	$metaPragma->setAttribute("http-equiv", "Pragma");
	$metaPragma->setAttribute("content", "no-cache");
	$playlist->appendChild($metaPragma);
	
	$info = $dom->createElement("info", $url);
	$playlist->appendChild($info);
	
	$contents = file_get_contents($url, "r");
	if (!empty($contents)) {
		$xml = new SimpleXMLElement($contents);
		if (!empty($xml)) {
			$title = $dom->createElement("title", $xml->title);
			$playlist->appendChild($title);
			
			$trackList = $dom->createElement("trackList");
			$playlist->appendChild($trackList);
			
			if ($xml->trackList && (count($xml->trackList) > 0)) {
				foreach ($xml->trackList->track as $item) {
					$track = $dom->createElement("track");
					$trackList->appendChild($track);
					
					$location = $dom->createElement("location");
					$usableLocation = empty($item->location) ? $item->originallocation : decrypt($item->location, $hashKey);
					$location->appendChild($dom->createTextNode($usableLocation));
					$track->appendChild($location);
					
					$title = $dom->createElement("title");
					$title->appendChild($dom->createTextNode($item->tracktitle));
					$track->appendChild($title);
					
					$creator = $dom->createElement("creator");
					$creator->appendChild($dom->createTextNode($item->artist));
					$track->appendChild($creator);
					
					/*
					$duration = $dom->createElement("duration");
					$creator->appendChild($dom->createTextNode($item->duration));
					$track->appendChild($duration);
					*/
					
					/*
					$album = $dom->createElement("album");
					$creator->appendChild($dom->createTextNode($item->album));
					$track->appendChild($album);
					*/
					
					/*
					$image = $dom->createElement("image");
					$creator->appendChild($dom->createTextNode($item->image));
					$track->appendChild($image);
					*/
				}
			}
		}
	}
	
	header("Content-Type: application/xspf+xml");
	
	echo $dom->saveXML();
	
?>
