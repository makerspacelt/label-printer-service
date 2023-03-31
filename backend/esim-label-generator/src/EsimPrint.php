<?php

namespace Makerspacelt\EsimLabelGernerator;

class EsimPrint {

	private $esim;
	private $copies;

	public function __construct()
	{
		$this->esim = new Esim();
		$this->copies = 1;
	}

	public function setCopies($copies)
	{
		if ($copies >= 1 && $copies <= 100) {
			$this->copies = (int)$copies;
		} else {
			$copies = 1;
		}
		$this->copies = $copies;
	}

	public function setupPrinter($w, $h)
	{
		$this->esim->density(15);
		$this->esim->speedSelect(4);
		$this->esim->topOfFormBacup(true);
		$this->esim->mediaFeedAdj(110);
		$this->esim->printDirectionTopBottom(false);
		$this->esim->options('DN');
		$this->esim->setupPrintCopy(1);
		$this->esim->setLabelWidth($w);
		$this->esim->setFormLength($h+12, 16, 8);
	}

	public function printGd($img)
	{
		$w=imagesx($img);
		$h=imagesy($img);

		$this->setupPrinter($w, $h);

		$this->esim->clearImageBuffer();

		$data="";
		$byte=0;
		$index=-1;
		for ($y=0; $y<$h; $y++) {
			for ($x=0; $x<$w; $x++) {
				$data_bit=$x&7;
				if ($data_bit == 0 && !($x==0 && $y==0) ) {
					$data.=chr($byte&0xFF);
					$byte=0xff;
				}

				$i=imageColorAt($img, $x, $y);
				if ($index==$i) {
					// nothing to do, skip to the next pixel
					continue;
				}

				$c=imageColorsForIndex($img, $i);
				$c=($c['red']+$c['green']+$c['blue'])>>2;

				if ($c<128) {
					$byte &= ~(1<<(7-$data_bit));
				} else {
					$index=$i;
				}	
			}
		}
		$this->esim->drawGraphics(0,0,$w,$h,$data);
		$this->esim->printLabel($this->copies);
		return $this->esim->getData();
	}

	public function printFile($file)
	{
		$mime = mime_content_type($file);
		switch ($mime) {
			case 'image/gif':
				$img = imageCreateFromGif($file);
				break;
			case 'image/jpeg':
				$img = imageCreateFromJpeg($file);
				break;
			case 'image/png':
				$img = imageCreateFromPng($file);
				break;
			default:
				$img = false;

		}
		if ($img) {
			return $this->printGd($img);
		} else {
			return;
		}
	}

	public function printPng($file)
	{
		$img=imageCreateFromPng($file);
		return $this->printGd($img);
	}

	public function printJpeg($file)
	{
		$img=imageCreateFromJpeg($file);
		return $this->printGd($img);
	}

	public function printGif($file)
	{
		$img=imageCreateFromGif($file);
		return $this->printGd($img);
	}

}


