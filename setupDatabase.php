<?php
header("Content-Type: text/javascript");
header("Cache-Control: no-cache, must-revalidate");
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // A date in the past


$json = array();
//$con = mysql_connect("ranae.db.6080705.hostedresource.com","ranae","Milton0");
$con = mysql_connect("localhost","root","");

if (!$con) {
    $json['db_connect_status'] = 'Could not connect: ' . mysql_error();
    $json['replyText'] = $json['db_connect_status'];
    $json['status'] = -1;
    $json['replyCode'] = 400;
    $encoded = json_encode($json);
    echo($encoded);
    return; 
}

mysql_select_db("ranae", $con); //NAME OF THE DATABASE TO USE GOES HERE

$production = 0;
$development = 1;

if($production) {
  ini_set('display_errors', 0);
  ini_set('error_reporting', 'E_ALL');
  ini_set('log_errors', 1);
  ini_set('error_log', './chris_error.txt');
} else if($development) {
  ini_set('display_errors', 1);
  ini_set('error_reporting', 'E_ALL');
  ini_set('log_errors', 1);
  ini_set('error_log', './chris_error.txt');
}

///////////////////////////////////////////////////////////////
///////////////  FUNCTIONS BELOW HERE /////////////////////////
///////////////////////////////////////////////////////////////

function username2userid($username) {

    $sql = "SELECT id FROM users WHERE username='{$username}'";
    $result = mysql_query($sql);
    if($result) {
      $row = mysql_fetch_array($result, MYSQL_ASSOC);
		if($row['id']){
			$userid = $row['id'];
		} else {
	      $json['replyText'] = "NOTHING RETURNED FROM row ARRAY";
	      $json['replyCode'] = 522;		
    	}
    } else if(mysql_error()) {
      $json['replyText'] = mysql_error().":".$userid.":". $sql;
      $json['replyCode'] = 523;
    } else {
      $json['replyCode'] = 524;      
    }
  return ($userid);
}

function getTableId($getid,$column,$userid,$newValue,$con) {
 
  if(strcmp($getid,'undefined')==0) { //NO ID IS DEFINED THIS IS A NEW ROW
    
    //CREATE A NEW ROW AND GIVE IT THE INFORMATIONS THAT IS PROVIDED
    $sql_query = "INSERT INTO journey ( userid, {$column}) VALUES ('{$userid}','{$newValue}')";
    $result = mysql_query($sql_query);

    $DBid = mysql_insert_id();

  } else { // ID IS ALREADY DEFINED
    $DBid = mysql_real_escape_string($getid, $con);     

  }

  return ($DBid);
}

function getStartWeight($userid) {

  	//GET THE START WEIGHT
    $sql = "SELECT weight FROM journey WHERE userid = {$userid} AND weight != '' AND timestamp = (select min(timestamp) from journey where userid = {$userid} and weight != '')";

    $result = mysql_query($sql);
    if(mysql_error()) {
      $json['replyText'] = mysql_error().":$userid:". $sql;
      $json['replyCode'] = 505;
      $encoded = json_encode($json);
      echo($encoded);
      return; 
    }

    $row = mysql_fetch_array($result, MYSQL_ASSOC);
    if($row['weight']) { // THERE ARE SOME ENTRIES ALREADY
		$startWeight = $row['weight'];
    } else {
    	//NO DATA YET FOR THIS USER
    	$startWeight = $newValue;
    }
    
    return ($startWeight);
}

function getLastWeight($userid) {

    //GET THE LAST WEIGHT
    $sql = "SELECT weight FROM journey WHERE userid = {$userid} AND weight != '' and timestamp = (select max(timestamp) from journey where userid = {$userid} and weight != '')";

    $result = mysql_query($sql);
    $rowCount = mysql_num_rows($result);

    if(mysql_error()) {
      $json['replyText'] = mysql_error().":{$userid}:". $sql;
      $json['replyCode'] = 506;
      $encoded = json_encode($json);
      echo($encoded);
      return; 
    }
    

    $row = mysql_fetch_array($result, MYSQL_ASSOC);
    if($row['weight']) { // THERE ARE SOME ENTRIES ALREADY
		$lastWeight = $row['weight'];  
    } else {
    	//NO DATA YET FOR THIS USER
    	$lastWeight = $newValue;
    }

    if(!isset($lastWeight) && $rowCount>0) {
      $json['replyText'] = "ERROR: lastWeight is undefined:".$lastWeight;
      $json['replyCode'] = 504;
      $encoded = json_encode($json);
      echo($encoded);
      return;         
    }
    
    return ($lastWeight);
}

function getTimestampFromId($userid,$DBid) {
		
	    $sql = "SELECT timestamp FROM journey WHERE id = {$DBid} AND userid = {$userid}";

	    $result = mysql_query($sql);
	    if(mysql_error()) {
	      $json['replyText'] = mysql_error()."::". $sql;
	      $json['replyCode'] = 513;
	      $encoded = json_encode($json);
	      echo($encoded);
	      return; 
	    }
	
	    $row = mysql_fetch_array($result, MYSQL_ASSOC);
	    
	    return($row['timestamp']);
}

function getStartDate($userid) {

	$sql = "SELECT min(j.timestamp) FROM journey AS j, users AS u WHERE j.userid = u.id AND u.id='{$userid}' AND weight != ''";

    $result = mysql_query($sql);

    if($result) {
      while ( $row = mysql_fetch_array($result, MYSQL_ASSOC) ) {
        $startDate = $row['min(j.timestamp)'];
      }
    } else if(mysql_error()) {
      $json['replyText'] = mysql_error().":".$userid.":". $sql;
      $json['replyCode'] = 506;
    } else {
      $json['replyCode'] = 507;      
    }

    return($startDate);
}
function getWeightFromId($userid,$DBid) {
		
	    $sql = "SELECT weight FROM journey WHERE id = {$DBid}";

	    $result = mysql_query($sql);
	    if(mysql_error()) {
	      $json['replyText'] = mysql_error()."::". $sql;
	      $json['replyCode'] = 513;
	      $encoded = json_encode($json);
	      echo($encoded);
	      return; 
	    }
	
	    $row = mysql_fetch_array($result, MYSQL_ASSOC);
	    return($row['weight']);
}

function getFirstMonthWeight($userid,$timestamp) {

	//TODO: MAKE THIS WORK
    /////////////////////////////////////////////////////////////////
    //GET THE MONTH WEIGHT
    $sql = "SELECT weight,timestamp FROM journey WHERE userid = {$userid} AND timestamp != '' AND weight != '' ORDER BY timestamp ASC";
    
    $result = mysql_query($sql);
    //$rowCount = mysql_num_rows($result);
    
    if(mysql_error()) {
      $json['replyText'] = mysql_error().":{$userid}:". $sql;
      $json['replyCode'] = 506;
      $encoded = json_encode($json);
      echo($encoded);
      return; 
    }

	$arr1 = str_split($timestamp);
	$thisMonth = $arr1[4].$arr1[5];
        
    //TODO: GET THIS WORKING
      $lastMonth = 0;
      while ( $row = mysql_fetch_array($result, MYSQL_ASSOC) ) {

        $arr1 = str_split($row['timestamp']);
        $row['timestamp'] = $arr1[4].$arr1[5]."/".$arr1[6].$arr1[7]."/".$arr1[0].$arr1[1].$arr1[2].$arr1[3];
        $month = $arr1[4].$arr1[5];

        // TODO: THIS DOES THE MONTHLY CALCS
        if( $lastMonth == 0 ) { //FIRST ENTRY IN THE WHOLE THING REPRESENTS THE FIRST MONTH
        	$firstMonth = $month;
        	//IF THE ENTRY IS FOR THE FIRST MONTH THE FIRST ENTRY IS THE FIRST ENTRY OF THIS MONTH

        	if($firstMonth == $thisMonth) {
        		$firstWeightThisMonth = $row['weight'];
        	    return($firstWeightThisMonth);       		
        	}
        } else if( $month != $lastMonth) { //FIRST ENTRY OF THE MONTH BEGINS A NEW MONTH
        	//GET THE LAST ENTRY FOR THE PREVIOUS MONTH
  		
            if($month == $thisMonth) {
        		$firstWeightThisMonth = $lastWeight;
        	    return($firstWeightThisMonth);       		
        	}        	
        }
        
        //print_r("{$row['timestamp']} {$row['weight']} {$perLostThisMonth}\n");
               
        $lastMonth = $month;
        $lastWeight = $row['weight'];
      }

}
?>
