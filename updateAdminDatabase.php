<?php
include("./setupDatabase.php");
$json = array();

$tableName = "users";
if ( $_GET["userid"] && !isset($_GET['id'])) { //GET the data

    $username = urlencode(mysql_real_escape_string($_GET["userid"], $con));

    $sql = "SELECT id FROM users WHERE username='{$username}'";
    $result = mysql_query($sql);
    if($result) {
      $row = mysql_fetch_array($result, MYSQL_ASSOC);

      if($row['id']){
			$userid = $row['id'];
		} else {
	      $json['replyText'] = "NOTHING RETURNED FROM row ARRAY";
	      $json['replyCode'] = 518;
	      $encoded = json_encode($json);
    	echo($encoded);
    	return; 
    	}
    } else if(mysql_error()) {
      	$json['replyText'] = mysql_error().":".$userid.":". $sql;
      	$json['replyCode'] = 516;
		$encoded = json_encode($json);
    	echo($encoded);
    	return; 
    } else {
      	$json['replyCode'] = 517; 
      	$encoded = json_encode($json);
    	echo($encoded);
		return;      
    }

    
    $sql_query = "SELECT admin FROM users WHERE id='{$userid}'";
    //COMMENT THIS IF YOU DONT WANT TO WRITE UPDATES TO THE DATABASE
    $result = mysql_query($sql_query);



    if(mysql_error()) {
      $json['replyText'] = mysql_error().":".$_GET['column'].":".$newValue."|". $sql_query;
      $json['replyCode'] = 515;

    } else {
        $row = mysql_fetch_array($result, MYSQL_ASSOC);
	    if($row['admin'] == 1) { // THERE ARE SOME ENTRIES ALREADY
			$administrator = $row['weight'];
	    } else {
			//UNLESS THE JAVASCRIPT IS HACKED YOU SHOULDNT MAKE IT THIS FAR
			$json['replyText'] = "NOT AN ADMINISTRATOR";
			$json['replyCode'] = 516;
			$encoded = json_encode($json);
			echo($encoded);
			return; 
	    }

    }
    
    $cnt = 0;
    
    //VALIDATE THAT THE USER IS AN ADMINISTRATOR

    if($_GET["timestamp"]) {
		$timestamp = urlencode(mysql_real_escape_string($_GET["timestamp"], $con));    	
      $sql = "SELECT ".$tableName.".*,journey.weight FROM ".$tableName.",journey WHERE journey.timestamp='{$timestamp}' and journey.userid=users.id";
      $sql = "SELECT * FROM ".$tableName;
    } else {
      $sql = "SELECT * FROM ".$tableName;
    }
    $result = mysql_query($sql);
    while ( $row = mysql_fetch_array($result, MYSQL_ASSOC) ) {

        //FOR EACH ROW FORMAT THE DATE
        //$timestamp = $row['timestamp'];
        $arr1 = str_split($row['timestamp']);
        $row['timestamp'] = $arr1[4].$arr1[5]."/".$arr1[6].$arr1[7]."/".$arr1[0].$arr1[1].$arr1[2].$arr1[3];
        $json['ResultSet']['Result'][] = $row;
		//PUT THE DECODED url BACK FOR THE TABLE
        $json['ResultSet']['Result'][$cnt]['username'] = urldecode($json['ResultSet']['Result'][$cnt]['username']);

             
        $cnt++;
    }
    
    $json['ResultSet'][] = "totalResultsReturned:" . $cnt;
    

                
} else if(isset($_GET['action']) && isset($_GET['id']) && isset($_GET['delete'])) { // delete the row
  if(strcmp($_GET['action'],'delete')==0) {

	$DBid = mysql_real_escape_string($_GET['id'], $con);  
    $delete = "DELETE FROM ".$tableName." WHERE id = ".$DBid;

    //COMMENT THIS IF YOU DONT WANT TO WRITE UPDATES TO THE DATABASE
    $result = mysql_query($delete);

    $json['replyText'] = "Ok";
    $json['replyCode'] = 200;
  }
//BELOW HERE IS CHRIS'S IMPLEMENTATION FOR CELL EDITS
} else if (isset($_GET['action']) && isset($_GET['column']) && isset($_GET['newValue'])){

  //MAKE THIS THE DEFAULT, UNFORMATTED VALUE
  $newValue = $_GET['newValue'];
  $column = $_GET['column'];
    
  //IF WE NEED TO CONVERT TO A DATE, I.E. DATA FROM THE CALENDAR YUI COMPONENT 
  if(strcmp($_GET['column'],'timestamp')==0) {
    //MODIFY JAVASCRIPT DATE TO FIT INTO THE DATABASE 

    
  //THE BIZZARE FORMATTING THAT APPEARS BELOW IS HERE TO ADD 1 DAY TO THE VALUE THAT PHP THINKS
  // IT GOT FROM THE DATE STRING OF THE YUI.  I THINK IT MAY HAVE SOMETHING TO DO WITH THE 
  // TIME ZONES BEING OUT OF SYNC.     
    $newValue = date( "Ymd", strtotime('+1 day', strtotime($_POST['newValue']))); // 11th 
  }
  
  if(strcmp($_GET['id'],'undefined')==0) {
  

    //CREATE A NEW ROW AND GIVE IT THE INFORMATIONS THAT IS PROVIDED
//    $sql_query = "INSERT INTO ".$tableName." ( id, ".$_POST['column'].") VALUES ('".$_POST['userid']."','".$newValue."')";
    $sql_query = "INSERT INTO ".$tableName." ( ".$column.", registerDate) VALUES ('".$newValue."','".date( "Ymd")."')";

    $result = mysql_query($sql_query);

    $DBid = mysql_insert_id();
    $json['id'] = $DBid;
  } else {
    //UPDATE ONE OF THE EXISTING ROWS
	$DBid = mysql_real_escape_string($_GET['id'], $con);      
    $sql_query = "UPDATE ".$tableName." SET ".$column."='".$newValue.
              "' WHERE id=".$DBid;
    //COMMENT THIS IF YOU DONT WANT TO WRITE UPDATES TO THE DATABASE
    $result = mysql_query($sql_query);              
  }

    if(mysql_error()) {
      $json['replyText'] = mysql_error().":".$_GET['column'].":".$newValue."|". $sql_query;
      $json['replyCode'] = 501;

    } else {
      $json['replyText'][] = "Ok";
      $json['replyCode'] = 201;
      //PASS BACK THE SAME VALUE WE RECEIVED JUST TO PROVE THAT THE SERVER FOUND IT
      $json['data'] = $_GET['newValue'];

    }
    
} else {
    $json['replyText'] = "Wrong parameters supplied to table '".$tableName."'";
    $json['replyCode'] = 301;
}

$encoded = json_encode($json);
echo($encoded);
//     print_r($json);

?>
