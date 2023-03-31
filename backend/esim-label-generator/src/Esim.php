<?php

namespace Makerspacelt\EsimLabelGernerator;

# ESim V7 Language

class Esim {

	private $data;

	public function __construct()
	{
		$this->data='';
	}

	# ===== Wrappers
	#
	public function send($msg)
	{
		$this->data.="\r\n$msg\r\n";
	}

	public function error($msg)
	{
		error_log($msg);
	}

	public function getData()
	{
		return $this->data;
	}

	# ===== Controll Commands
	#
	public function serialPortSetup($baud=96, $parity='N', $data=8, $stop=1)
	{
		$this->send("Y$baud,$parity,$data,$stop");
	}

	public function density($d=10)
	{
		if ($d>15 || $d<0) {
			$this->error("ERROR: invalid density [$d] should be 0..15");
		}
		$this->send("D$d");
	}

	public function mediaFeed($len, $ctrl=0, $delay=0)
	{
		$this->send("PF$len,$ctrl,$delay");
	}

	public function setFormLength($len, $gap=24, $offset=0)
	{
		$this->send("Q$len,$gap+$offset");
	}

	public function speedSelect($s=2)
	{
		$this->send("S$s");
	}

	public function setupPrintCopy($p=0)
	{
			$this->send("SPC$p");
	}

	public function mediaFeedAdj($f=136)
	{
		$this->send("j$f");
	}

	public function setLabelWidth($w=832)
	{
		$this->send("q$w");
	}

	public function topOfFormBacup($enable=true)
	{
		if ($enable) {
			$this->send("JF");
		} else {
			$this->send("JB");
		}
	}

	public function options($options='N')
	{
		$this->send("O$options");
	}

	public function printDirectionTopBottom($topBottom=true)
	{
		if ($topBottom) {
			$this->send("ZT");
		} else {
			$this->send("ZB");
		}
	}

	public function resetToDefault()
	{
		$this->send("^default");
	}

	public function resetPrinter()
	{
		$this->send("^@");
	}

	public function printTestPage()
	{
		$this->send("U");
	}

	public function clearImageBuffer()
	{
		$this->send('N');
	}

	public function printLabel($count = 1)
	{
		$this->send(sprintf('P%d',$count));
	}

	# ===== Render Commands
	#
	public function drawText($x, $y, $rotation, $size, $xmult, $ymult, $invert, $text)
	{
		$this->send("A$x,$y,$rotation,$size,$xmult,$ymult,$invert,\"$text\"");
	}

	public function drawBarcode($x, $y, $rotation, $t1, $t2, $w, $h, $humanReadable=true, $data)
	{
		$this->send("B$x,$y,$rotation,$t1,$t2,$w,$h,B,\"$data\"");
	}

	public function drawLineBlack($x, $y, $w=0, $h=0)
	{
		$this->send("LO$x,$y,$w,$h");
	}

	public function drawBox($x1, $y1, $x2, $y2, $th=1)
	{
		$this->send("X$x1,$y1,$th,$x2,$y2");
	}

	public function drawGraphics($x,$y, $w, $h, $data)
	{
		$w=ceil($w/8);
		$this->send("GW$x,$y,$w,$h,$data");
	}

}


