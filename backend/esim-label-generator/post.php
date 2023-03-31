<?php

header('Access-Control-Allow-Origin: http://label.lan');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: *');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(400);
    exit('Only POST method supported!');
}

require_once "src/Esim.php";
require_once "src/EsimPrint.php";


$img = imageCreateFromPng('php://input');
$ep = new Makerspacelt\EsimLabelGernerator\EsimPrint();
$ep->setCopies(1);
$bin = $ep->printGd($img);
file_put_contents("/dev/usb/lp0", $bin); 
exit;

$data = file_get_contents('php://input');
if (strlen($data) > 100) {
    $ep = new Makerspacelt\EsimLabelGernerator\EsimPrint();
    $ep->setCopies(1);
    $bin = $ep->printGd($data);

    file_put_contents("/dev/usb/lp0", $bin); 
}
