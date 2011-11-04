<?php
include("./setupDatabase.php");

$tableName = "users";
if ( $_GET["userid"] ) { //GET the data

    $username = urlencode(mysql_real_escape_string($_GET["userid"], $con));

    
    $sql_query = "SELECT activation FROM users WHERE username='{$username}'";
    //COMMENT THIS IF YOU DONT WANT TO WRITE UPDATES TO THE DATABASE
    $result = mysql_query($sql_query);

    if(mysql_error()) {
      $json['replyText'] = mysql_error()."::".$newValue."|". $sql_query;
      $json['replyCode'] = 515;
      $encoded = json_encode($json);
    	echo($encoded);
    	return; 

    } else {
        $activationRow = mysql_fetch_array($result, MYSQL_ASSOC);

	    if($activationRow['activation'] != 1) { // THERE ARE SOME ENTRIES ALREADY
    		$sql = "SELECT id,name,perLostSinceLast,perLostThisMonth,perLostTotal FROM {$tableName} WHERE username='{$username}'";
	    } else {
	    	// GRAB RANKINGS FROM ALL THE PARTICIPANTS
    		$sql = "SELECT id,name,perLostSinceLast,perLostThisMonth,perLostTotal FROM {$tableName} WHERE activation=1 ORDER BY perLostSinceLast DESC";
	    }

    }
 
    $cnt = 0;

    $result = mysql_query($sql);
   if(mysql_error()) {
      $json['replyText'] = mysql_error()."::".$newValue."|". $sql_query;
      $json['replyCode'] = 516;
        $encoded = json_encode($json);
    echo($encoded);
    return; 
   }
    while ( $row = mysql_fetch_array($result, MYSQL_ASSOC) ) {

        //FOR EACH ROW FORMAT THE DATE
        //$timestamp = $row['timestamp'];
        $arr1 = str_split($row['timestamp']);
        $row['timestamp'] = $arr1[4].$arr1[5]."/".$arr1[6].$arr1[7]."/".$arr1[0].$arr1[1].$arr1[2].$arr1[3];
        $json['ResultSet']['Result'][] = $row;
             
        $cnt++;
    }
    
    $json['ResultSet'][] = "totalResultsReturned:" . $cnt;

    //AT THIS POINT LETS TRY AND FIGURE OUT THE TOTAL WEIGHT LOSS AS A GROUP
	    $userid = username2userid($username);
		$startDate = getStartDate($userid);

	    if($activationRow['activation'] != 1) { // THERE ARE SOME ENTRIES ALREADY
    		$sql = "SELECT id FROM {$tableName} WHERE username='{$username}'";
	    } else {
	    	// GRAB RANKINGS FROM ALL THE PARTICIPANTS
    		$sql = "SELECT id FROM {$tableName} WHERE activation=1";
	    }

	   $result = mysql_query($sql);
	   if(mysql_error()) {
	      $json['replyText'] = mysql_error()."::".$newValue."|". $sql_query;
	      $json['replyCode'] = 517;
	      $encoded = json_encode($json);
	      echo($encoded);
	      return; 
	   }
	   
	   $weightLossGroup = 0;
	    while ( $row = mysql_fetch_array($result, MYSQL_ASSOC) ) {
			$weightLossGroup = (getStartWeight($row['id']) - getLastWeight($row['id'])) + $weightLossGroup;
			
	    }
	    $json['ResultSet']['weightLossGroup'] = $weightLossGroup;

    
} else {
    $json['replyText'] = "Wrong parameters supplied to updateJourneyDatabase";
    $json['replyCode'] = 301;
}

$json['replyText'] = "Ok";
$json['replyCode'] = 201;
$encoded = json_encode($json);
echo($encoded);
//     print_r($json);

?>
