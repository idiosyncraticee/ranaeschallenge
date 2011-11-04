<?php
include("./setupDatabase.php");

$json = array();

// Below is a very simple PHP 5 script that hosts the RPX sign-in interface, and also acts as the token_url.  
// If a token is present it processes the token using the backchannel auth_info API call.  Otherwise it simply 
// renders the RPX interface using the embeded iframe.
// This php is used for the RPX sign-in
//


///////////////////////////////////////////////////////////////////
///////////  GET USER DATA FROM RPX ///////////////////////////////
///////////////////////////////////////////////////////////////////

if(isset($_GET['token'])) {
  $apiKey = '491d14e6ae657a9e286a16a76f882e2591056e1a';
  $siteName = "idiocracy";  // This will be expanded to idiocracy.rpxnow.com
  
  $port = $_SERVER['SERVER_PORT'] == '80' ? '' : ':'.$_SERVER['SERVER_PORT'];
  
  // this script will also process the token url
  $token_url = 'http://' . $_SERVER['SERVER_NAME'] . $port . $_SERVER['SCRIPT_NAME'];
  
  $post_data = array('token' => $_GET['token'],
                     'apiKey' => $apiKey,
                     'format' => 'json'); 
  
  // make the api call using libcurl
  $curl = curl_init();
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_URL, 'https://rpxnow.com/api/v2/auth_info');
  curl_setopt($curl, CURLOPT_POST, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $post_data);
  curl_setopt($curl, CURLOPT_HEADER, false);
  curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
  $raw_json = curl_exec($curl);
  curl_close($curl);
  
  // parse the json response into an associative array
  $auth_info = json_decode($raw_json, true);
  
  //IF THE AUTHORIZATION IS OK ACCESS THE DATABASE
  if ($auth_info['stat'] === 'fail') {

    $json['replyCode'] = 505;
    $json['replyText'] = "ERROR: {$auth_info['err']['msg']} and status = {$auth_info['stat']} probably because the token expired";
    $encoded = json_encode($json);
    echo($encoded);
    return;
  } else if($auth_info['stat'] === 'ok') {
	//OK
  } else {
     $json['replyCode'] = 511;
    $json['replyText'] = "Unexpected authorization status: {$auth_info['stat']}";
    $encoded = json_encode($json);
    echo($encoded);
    return; 
  
  }

  //GET DATA FROM RPX
  //I DONT REMEMBER WHAT THIS DOES
  if (isset($auth_info['profile']['name']['formatted']))  {
    $displayName = $auth_info['profile']['name']['formatted'];
  } else if (isset($auth_info['profile']['displayName'])) {
  	$displayName = $auth_info['profile']['displayName'];
  } else {
    $json['replyCode'] = 506;
    $json['replyText'] = 'No username available for this profile';

    $encoded = json_encode($json);
    echo($encoded);
    return;
  } 
  
  //GET DATA FROM RPX
  if (isset($auth_info['profile']['identifier']))  {
    $userName = urlencode($auth_info['profile']['identifier']);
  } else {
    $json['replyCode'] = 507;
    $json['replyText'] = 'No identifier available for this profile';
    $encoded = json_encode($json);
    echo($encoded);
    return;
  } 
// I DONT REMEMBER WHAT SCENARIO THIS IS USED FOR
//} else if(isset($_GET['username'])) {
//  $userName = urlencode($_GET["username"]);

//TODO: THIS IS A SECURITY PROBLEM
} else if(isset($_GET['workoffline'])) {
  //UNCOMMENT THIS LINE IF YOU ARE OFFLINE
  $userName = "https%3A%2F%2Fwww.google.com%2Faccounts%2Fo8%2Fid%3Fid%3DAItOawkMhg6Ijql50Iobe8zvF1nOPNWFJzs-044";
  $userName = "idiosyncraticee";

} else {
    $json['replyCode'] = 508;
    $json['replyText'] = 'No token provided';
    $encoded = json_encode($json);
    echo($encoded);
    return;
}



//////////////////////////////////////////////////
// BY HERE YOU SHOULD HAVE A userName
//////////////////////////////////////////////////


if ( empty($userName) ) {
    $json['replyCode'] = 509;
    $json['replyText'] = 'No userName is available here';
    $encoded = json_encode($json);
    echo($encoded);
    return;
}

if (!$con) {
    $json['replyText'] = 'Could not connect: ' . mysql_error();
    $json['replyCode'] = 400;
    $encoded = json_encode($json);
    echo($encoded);
    return;  
} 

mysql_select_db("ranae", $con);




$result = mysql_query("SELECT * FROM users WHERE username = '{$userName}'");

    if(mysql_error()) {
		$json['replyText'] = mysql_error().":{$userName}:". $sql;
		$json['replyCode'] = 510;
		$encoded = json_encode($json);
    	echo($encoded);
		return;  
    }

$row = mysql_fetch_array($result, MYSQL_ASSOC);

    //print_r("username = {$userName}<br>\n");
	//print_r("row = {$row}<br>\n");
if ( $row['id'] ) { //SUCCESS
	//THIS IS A REGISTERED USER
	//$json['userid'] = $row['id'];
	$json['userid'] = $row['username']; //LETS USE THE BIG OLD NAME INSTEAD OF THE ID
	$json['admin'] = $row['admin'];
	$json['activation'] = $row['activation'];
	
	//TODO: INSERT INTO THE DATABASE THE ACCESSED TIME
	date_default_timezone_set('PST');
    $lastVisitDate = date( "YmdHms"); // TODAY

    $sql_query = "UPDATE users SET lastVisitDate = {$lastVisitDate} WHERE username= '{$json['userid']}'";

    $result = mysql_query($sql_query);
    if(mysql_error()) {
		$json['replyText'] = "ERROR: Problem update lastVisitDate: " .mysql_error()." with SQL = {$sql_query}";
		$json['replyCode'] = 512;
		$encoded = json_encode($json);
    	echo($encoded);
		return;  
    }
 
} else {
	//THIS IS NOT A REGISTERED USER

	//CREATE A NEW ROW AND GIVE IT THE INFORMATIONS THAT IS PROVIDED

	//TODO: Figure out the registerDate
	date_default_timezone_set('PST');
    $registerDate = date( "YmdHms"); // TODAY
    
    $userName = urlencode($auth_info['profile']['identifier']);
    
    $sql_query = "INSERT INTO users ( name, email,username,registerDate,lastVisitDate,avatar,activation) VALUES ".
    	"('{$displayName}','{$auth_info['profile']['email']}','{$userName}','{$registerDate}','{$registerDate}','{$auth_info['profile']['photo']}',0)";
    
    $result = mysql_query($sql_query);
    if(mysql_error()) {
		$json['replyText'] = "ERROR: Problem inserting a new users: " .mysql_error()." with SQL = {$sql_query}";
		$json['replyCode'] = 513;
		$encoded = json_encode($json);
    	echo($encoded);
		return;  
    }
    $json['userid'] = mysql_insert_id();
    $json['userid'] = $userName;


}

$json['replyCode'] = 201;
$json['replyText'] = "OK";


mysql_close($con);

//print_r($json);

$encoded = json_encode($json);
echo($encoded);




?>
