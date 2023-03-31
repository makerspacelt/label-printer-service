<html>
	<head>
		<style>
			* {
				font-size: 18px;
			}
			button, input[type="submit"] {
				padding: 0.5rem;
			}
			.file_button {
				font-size:24px;
				padding: 40px 100px;
			}
		</style>
	</head>
	<body>
<div style="float:right;">
  <img height="50%" src="/my-foto.jpg">
</div>
<p>
  Upload a 780x1210 resolution JPEG / GIF image here and I will try to print a sticky label.
</p>
<form method="post" enctype="multipart/form-data">
			<p><label>Image: <input type="file" name="img"></label></p>
			<p><label>Esim: <input type="file" name="bin"></label></p>
			<p><label for="copies">Copies: <input type="text" name="copies" value="1"></label></p>
			<p><input type="submit" value="Print"></p>
			<hr>
			<p>Paruoštukai:</p>
<?php
	$files = scandir("/root/labels");
	foreach ($files as $file) {
		if ( preg_match('~^[a-zA-Z0-9_.-]*.(gif|png)$~', $file) ) {
?>
			<input class="file_button" type="submit" name="file" value="<?=$file?>">
<?php
		}
	}
?>
			<hr>
		</form>

		<code>
<?php

if ( empty($_FILES) && !empty($_GET['url']) )
{
	$url = $_GET['url'];
	if ( preg_match('~^https?://[^#]*.(gif)$~', $url) )
	{
		file_put_contents('/tmp/img.gif', file_get_contents($url, false, null, 0, 300000));
		$_FILES['img'] = array(
			'error' => 0,
			'tmp_name' => '/tmp/img.gif',
		);
	} else {
		echo "Error: invalid url. only gif links are supported.";
	}
}
if ( !empty($_POST['file']) )
{
	$file = $_POST['file'];
	if ( preg_match('~^[a-zA-Z0-9_.-]*.(gif|png)$~', $file) )
	{
		$_FILES['img'] = array(
			'error' => 0,
			'tmp_name' => "/root/labels/$file",
		);
	} else {
		echo "hey! no cheating!";
	}
}

if ( !empty($_FILES) && $_FILES['bin']['error'] === 0 )
{
	file_put_contents("/dev/usb/lp0", file_get_contents($_FILES['bin']['tmp_name']));
}
elseif ( !empty($_FILES) && $_FILES['img']['error'] === 0 )
{
	require_once "src/Esim.php";
	require_once "src/EsimPrint.php";
	$ep = new Makerspacelt\EsimLabelGernerator\EsimPrint();
	$ep->setCopies($_POST['copies']);
	$bin = $ep->printFile($_FILES['img']['tmp_name']);

	file_put_contents("/dev/usb/lp0", $bin);
}
?>
		</code>
	</body>
</html>
