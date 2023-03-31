#!/usr/bin/env php
<?php

require_once "src/Esim.php";
require_once "src/EsimPrint.php";

$ep = new Makerspacelt\EsimLabelGernerator\EsimPrint();

array_shift($argv);
foreach ($argv as $file) {
	echo $ep->printFile($file);
}

