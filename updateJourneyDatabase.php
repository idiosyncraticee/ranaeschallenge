<?php

include("./setupDatabase.php");



$json = array();

if ( isset($_GET["userid"]) && !isset($_GET["newValue"]) && !isset($_GET['action'])) { //GET the data JUST TO DISPLAY IN THE TABLE


    $username = urlencode(mysql_real_escape_string($_GET["userid"], $con));

    $userid = username2userid($username);

    $startDate = getStartDate($userid);
    $startWeight = getStartWeight($userid);
	$lastWeight = getLastWeight($userid);


    
	$json['ResultSet']['startDate'] = $startDate;
    $json['ResultSet']['startWeight'] = $startWeight;
    


   
    // I WANT TO MAKE THIS QUERY DESCENDING BUT THE WHILE LOOP GOES THE WRONG WAY THEN 
    $cnt = 0;
    $firstTime = 1;
    $lastMonth = 0;
    $sql = "SELECT * FROM journey WHERE userid = {$userid} AND timestamp != '' AND weight != '' ORDER BY timestamp ASC";
    $result = mysql_query($sql);
    $rowCount = mysql_num_rows($result);

    //THIS IS REALLY REDUNDANT BUT I NEED TO KNOW HOW MANY ROWS THERE ARE
    $sql = "SELECT * FROM journey WHERE userid = {$userid} AND timestamp != '' AND weight != '' ORDER BY timestamp ASC";

    $result2 = mysql_query($sql);    
    while ( $row = mysql_fetch_array($result2, MYSQL_ASSOC) ) {

        //FOR EACH ROW FORMAT THE DATE
        //$timestamp = $row['timestamp'];
        $arr1 = str_split($row['timestamp']);
        $row['timestamp'] = $arr1[4].$arr1[5]."/".$arr1[6].$arr1[7]."/".$arr1[0].$arr1[1].$arr1[2].$arr1[3];
        $month = $arr1[4].$arr1[5];
        $json['ResultSet']['Result'][] = $row;
        
        $json['ResultSet']['Result'][$cnt]['perLostTotal'] = ($startWeight - $row['weight'])*100/$startWeight;
        $json['ResultSet']['Result'][$cnt]['lostTotal'] = ($startWeight - $row['weight']);

        if($cnt>0) {
          $lastWeight = $json['ResultSet']['Result'][$cnt-1]['weight'];
          
          $json['ResultSet']['Result'][$cnt]['perLostSinceLast'] = ($lastWeight - $row['weight'])*100/$lastWeight;
                    
          //PUT THE CURRENT WEIGHT PERCENTAGE INTO THE USER TABLE FOR CONVENIENCE

        } else {  //THIS IS THE FIRST DATAPOINT
          $json['ResultSet']['Result'][$cnt]['perLostSinceLast'] = 0;

        }

        
        // TODO: THIS DOES THE MONTHLY CALCS
        if( $lastMonth == 0 ) { //FIRST ENTRY IN THE WHOLE THING REPRESENTS THE FIRST MONTH
        	$firstWeightThisMonth = $row['weight'];
        } else if( $month != $lastMonth) { //FIRST ENTRY OF THE MONTH BEGINS A NEW MONTH	
        	$firstWeightThisMonth = $lastWeight;
        } else {
			1;
        }
        
//        print_r("{$row['timestamp']} {$row['weight']} {$perLostThisMonth}\n");
		$perLostThisMonth = ($firstWeightThisMonth-$row['weight'])*100/$firstWeightThisMonth;  
		$json['ResultSet']['Result'][$cnt]['perLostThisMonth'] = $perLostThisMonth;
        
        //TODO: I THINK THIS PART SHOULD GO IN THE EDIT PART INSTEAD OF THE ACCESS PART.  OTHERWISE IT WILL BE OUT OF SYNC
        if($cnt == $rowCount-1) {

            $sql_query = "UPDATE users SET currentWeight='".$row['weight']."' WHERE id={$userid}";
          $result = mysql_query($sql_query); 
            $sql_query = "UPDATE users SET perLostSinceLast='".$json['ResultSet']['Result'][$cnt]['perLostSinceLast']."' WHERE id={$userid}";
          $result = mysql_query($sql_query);
        	  

            $sql_query = "UPDATE users SET perLostThisMonth='{$perLostThisMonth}' WHERE id={$userid}";
          $result = mysql_query($sql_query); 
          	$sql_query = "UPDATE users SET perLostTotal='".$json['ResultSet']['Result'][$cnt]['perLostTotal']."' WHERE id={$userid}";
          $result = mysql_query($sql_query);          
            $sql_query = "UPDATE users SET lostTotal='".$json['ResultSet']['Result'][$cnt]['lostTotal']."' WHERE id={$userid}";
          $result = mysql_query($sql_query);  
        }
          
        $cnt++;
        
        $lastMonth = $month;

    }
    
    $json['ResultSet'][] = "totalResultsReturned:" . $cnt;
    

                
} elseif(isset($_GET['action']) && isset($_GET['id']) && isset($_GET['delete']) && isset($_GET['userid'])) { // delete the row

    $username = urlencode(mysql_real_escape_string($_GET["userid"], $con));

    $sql = "SELECT id FROM users WHERE username='{$username}'";
    $result = mysql_query($sql);
    if($result) {
      $row = mysql_fetch_array($result, MYSQL_ASSOC);
		if($row['id']){
			$userid = $row['id'];
		} else {
	      $json['replyText'] = "NOTHING RETURNED FROM row ARRAY";
	      $json['replyCode'] = 519;		
    	}
    } else if(mysql_error()) {
      $json['replyText'] = mysql_error().":".$userid.":". $sql;
      $json['replyCode'] = 520;
    } else {
      $json['replyCode'] = 521;      
    }
    
  $id = mysql_real_escape_string($_GET['id'], $con);
  if(strcmp($_GET['action'],'delete')==0) {

    $delete = "DELETE FROM journey WHERE id = {$id} AND userid = '{$userid}'";

    //COMMENT THIS IF YOU DONT WANT TO WRITE UPDATES TO THE DATABASE
    $result = mysql_query($delete);

    $json['replyText'] = "Ok";
    $json['replyCode'] = 200;
  }
  
  
//BELOW HERE IS CHRIS'S IMPLEMENTATION FOR CELL EDITS
} else if (isset($_GET['action']) && isset($_GET['column']) && isset($_GET['newValue']) && isset($_GET['userid'])){  //EDIT THE CELL

    $username = urlencode(mysql_real_escape_string($_GET["userid"], $con));
	$column = mysql_real_escape_string($_GET['column'], $con);
	$newValue = mysql_real_escape_string($_GET['newValue'], $con);
  
    $userid = username2userid($username);

        
  //IF WE NEED TO CONVERT TO A DATE, I.E. DATA FROM THE CALENDAR YUI COMPONENT 
  if(strcmp($column,'timestamp')==0) {
    //MODIFY JAVASCRIPT DATE TO FIT INTO THE DATABASE 
    
  //THE BIZZARE FORMATTING THAT APPEARS BELOW IS HERE TO ADD 1 DAY TO THE VALUE THAT PHP THINKS
  // IT GOT FROM THE DATE STRING OF THE YUI.  I THINK IT MAY HAVE SOMETHING TO DO WITH THE 
  // TIME ZONES BEING OUT OF SYNC.
  
  	//DONT FORMAT BECAUSE IE HAS A DIFFERENT DATE THAN FIREFOX USING strtotime
  	//print_r(trim($_GET['newValue']));
    //$newValue = date( "Ymd", strtotime('+1 day', strtotime($_GET['newValue']))); // 11th
    //$newValue = strtotime(trim($_GET['newValue']));
  	//print_r("newValue = " .$newValue);
  }


  	//GET THE TABLE ID
	$DBid = getTableId($_GET['id'],$column,$userid,$newValue,$con);
	$json['id'] = $DBid;


	$startWeight = getStartWeight($userid);
	$lastWeight = getLastWeight($userid);




    ///////////////////////////////////////////////////
	if(strcmp($_GET['id'],'undefined')==0) { // IF THIS IS THE WEIGHT BUT ITS JUST GETTING ENTERED, HENCE NO DATE, DONT TRY TO SET THE TOTALS
		//BY NOT SETTING THESE WE GET A NAN
		//TODO: NEED TO RETURN SOMETHING MORE ACCURATE    
	} else if(strcmp($column,'weight')==0) {  // THERE IS ALREADY AN ID AND ITS A WEIGHT EDIT

		$timestamp = getTimestampFromId($userid,$DBid);

    	$firstWeightThisMonth = getFirstMonthWeight($userid,$timestamp);		

	    if($timestamp) {
	    	if($startWeight == ''){  //THIS IS SPECIAL HANDLING FOR THE VERY FIRST ENTRY
	    		$startWeight=$newValue; 
	    	}
	    	$json['perLostTotal'] = ($startWeight - $newValue)*100/$startWeight;
    	
	    	$json['lostTotal'] = ($startWeight - $newValue);
	
	    	$json['perLostSinceLast'] = ($lastWeight - $newValue)*100/$lastWeight;
	    	$json['perLostThisMonth'] = ($firstWeightThisMonth-$newValue)*100/$firstWeightThisMonth; 
	    } else {
			//BY NOT SETTING THESE WE GET A NAN
			//TODO: NEED TO RETURN SOMETHING MORE ACCURATE   	    
	    }
	} else if(strcmp($column,'timestamp')==0) {  //THIS IS AN UPDATE TO THE DATE
	  	//GET THE START WEIGHT
	  	
		$timestamp = $newValue;
	    $firstWeightThisMonth = getFirstMonthWeight($userid,$timestamp);
    
		$thisWeight = getWeightFromId($userid,$DBid);

	    if($thisWeight) { // THERE ARE SOME ENTRIES ALREADY

	    	$json['perLostTotal'] = ($startWeight - $thisWeight)*100/$startWeight;
	    	$json['lostTotal'] = ($startWeight - $thisWeight);
	    	$json['perLostSinceLast'] = ($lastWeight - $thisWeight)*100/$lastWeight;
	    	$json['perLostThisMonth'] = ($firstWeightThisMonth-$thisWeight)*100/$firstWeightThisMonth;
	    } else {
		//BY NOT SETTING THESE WE GET A NAN
		//TODO: NEED TO RETURN SOMETHING MORE ACCURATE 
	    }


	} else {
		//THIS IS EDITING THINGS THAT DONT EFFECT THE WEIGHT LIKE THE MEASUREMENTS
	}


	////////////////////////////////////////////////////////////////

    //THIS IS REALLY REDUNDANT BUT I NEED TO KNOW HOW MANY ROWS THERE ARE
    $sql = "SELECT * FROM journey WHERE userid = {$userid} AND timestamp != '' AND weight != '' ORDER BY timestamp ASC";

    $result2 = mysql_query($sql);    
    while ( $row = mysql_fetch_array($result2, MYSQL_ASSOC) ) {

        //FOR EACH ROW FORMAT THE DATE
        //$timestamp = $row['timestamp'];
        $arr1 = str_split($row['timestamp']);
        $row['timestamp'] = $arr1[4].$arr1[5]."/".$arr1[6].$arr1[7]."/".$arr1[0].$arr1[1].$arr1[2].$arr1[3];
        $month = $arr1[4].$arr1[5];
        $json['ResultSet']['Result'][] = $row;
        
        $json['ResultSet']['Result'][$cnt]['perLostTotal'] = ($startWeight - $row['weight'])*100/$startWeight;
        $json['ResultSet']['Result'][$cnt]['lostTotal'] = ($startWeight - $row['weight']);

        if($cnt>0) {
          $lastWeight = $json['ResultSet']['Result'][$cnt-1]['weight'];
          $thisWeight = $json['ResultSet']['Result'][$cnt]['weight'];
          
          $json['ResultSet']['Result'][$cnt]['perLostSinceLast'] = ($lastWeight - $row['weight'])*100/$lastWeight;
                    
          //PUT THE CURRENT WEIGHT PERCENTAGE INTO THE USER TABLE FOR CONVENIENCE

        } else {
          $json['ResultSet']['Result'][$cnt]['perLostSinceLast'] = 0;
        }

        $thisMonth = date( "m"); // 11th
        if($month == $thisMonth && $firstTime) { //IF ITS THE FIRST ENTRY OF THE CURRENT MONTH
        	$firstTime = 0;
        	$firstWeightThisMonth = $row['weight'];
        }
        

        //TODO: I THINK THIS PART SHOULD GO IN THE EDIT PART INSTEAD OF THE ACCESS PART.  OTHERWISE IT WILL BE OUT OF SYNC
        if($cnt == $rowCount-1) {

            $sql_query = "UPDATE users SET currentWeight='".$row['weight']."' WHERE id={$userid}";
          $result = mysql_query($sql_query); 
            $sql_query = "UPDATE users SET perLostSinceLast='".$json['ResultSet']['Result'][$cnt]['perLostSinceLast']."' WHERE id={$userid}";
          $result = mysql_query($sql_query);
        	$perLostThisMonth = ($firstWeightThisMonth-$thisWeight)*100/$firstWeightThisMonth;  

            $sql_query = "UPDATE users SET perLostThisMonth='{$perLostThisMonth}' WHERE id={$userid}";
          $result = mysql_query($sql_query); 
          	$sql_query = "UPDATE users SET perLostTotal='".$json['ResultSet']['Result'][$cnt]['perLostTotal']."' WHERE id={$userid}";
          $result = mysql_query($sql_query);          
            $sql_query = "UPDATE users SET lostTotal='".$json['ResultSet']['Result'][$cnt]['lostTotal']."' WHERE id={$userid}";
          $result = mysql_query($sql_query);  
        }
          
        $cnt++;
    }
    ///////////////////////////////////////////
    //UPDATE ONE OF THE EXISTING ROWS 

  $sql_query = "UPDATE journey SET {$column}='{$newValue}' WHERE id={$json['id']} AND userid = {$userid}";
  //COMMENT THIS IF YOU DONT WANT TO WRITE UPDATES TO THE DATABASE
  $result = mysql_query($sql_query);   
  

  if(mysql_error()) {
    $json['replyText'] = mysql_error().":{$column}:{$newValue}|". $sql_query;
    $json['replyCode'] = 501;

  } else {
    $json['replyText'] = "Ok";
    $json['replyCode'] = 201;
    //PASS BACK THE SAME VALUE WE RECEIVED JUST TO PROVE THAT THE SERVER FOUND IT
    $json['data'] = $newValue;

  }
    
} else {
    $json['replyText'] = "Wrong parameters supplied to table '".$tableName."'";
    $json['replyCode'] = 301;
}

$encoded = json_encode($json);
echo($encoded);
//     print_r($json);


?>
