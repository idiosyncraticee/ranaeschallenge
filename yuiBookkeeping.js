
function addBookkeeping(tableSetup) {

  var myColumnDefs;
  var myDataSource;
  var myDataTable;
  var columnDefs = [];
  
  /* ~~~ Add a DIV for the two units of the Layout */

  var mainDiv = YAHOO.util.Dom.get(tableSetup.tab);

  var topbar = document.createElement('div');
  topbar.setAttribute('id', 'topbar'+tableSetup.tab);
  topbar.setAttribute('name', 'topbar');
  mainDiv.appendChild(topbar);
  topbar.innerHTML='';

  var centerbar = document.createElement('div');
  centerbar.setAttribute('id', 'centerbar'+tableSetup.tab);
  centerbar.setAttribute('name', 'centerbar');
  mainDiv.appendChild(centerbar);
  
  // Define a custom row formatter function
  //var myRowFormatter = function(elTr, oRecord) {
  //    if (oRecord.getData('id') == YAHOO.weReef.userid) {
  //        YAHOO.util.Dom.addClass(elTr, 'mark');
  //    }
  //    return true;
  //}; 
  

  
  //FIGURE OUT WHICH Column DEFINITIONS TO USE
  switch(tableSetup.tableType) {

    case 'myRanking':
    	
    	//ALL OF THESE FUNCTIONS ARE HERE BECAUSE I HAD A PROBLEM WHERE THE XHR DATASOURCE SORTED WRONG.  I TRIED FOR
    	// DAYS TO FIX IT.  ULTIMATELY I ENDED UP USING AN ASYNC LOADER AND A LOCAL DATA SOURCE TO GET THE SORT WORKING
    	var handleSuccessRanking = function(o) {

    	    if(o.replyCode === undefined){

    	      var loginReply = YAHOO.lang.JSON.parse(o.responseText);

    	      if(loginReply.replyCode===201) {
    	    	  var weightLossGroup = loginReply.ResultSet.weightLossGroup;
    	    	  YAHOO.util.Dom.get('myRankingTabDivAnnouncement').innerHTML='So far as a group we\'ve lost <b>'+weightLossGroup+'</b> lbs!';
    	      	var myDataSource = new YAHOO.util.LocalDataSource(loginReply); 
    	        //var myDataSource = new YAHOO.util.XHRDataSource(tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid);
    	        YAHOO.weReef.rankingDataSource = myDataSource;
    	        myDataSource.maxCacheEntries = 0;
    	        myDataSource.responseSchema = {
    	      		  resultsList: "ResultSet.Result",
    	      		  fields : [
    	      		            {key: "id"},
    	      		            {key: "name"},
    	      		            {key: "perLostSinceLast", parser: "number"},
    	      		            {key: "perLostTotal", parser: "number"},
    	      		            {key: "perLostThisMonth", parser: "number"}
    	      		  ]
    	        };
    	        


    	        columnDefs = [
    	          {'name':'id', 'type':'id'},
    	          {'name':'name','type':'calculated','label':'Name'},
    	          {'name':'perLostSinceLast', 'type':'calculated', 'label':'% Lost This Week','formatter':myRankingPerLostFormatter,'sortOptions':{defaultDir:YAHOO.widget.DataTable.CLASS_DESC}},
    	          {'name':'perLostTotal', 'type':'calculated', 'label':'% Lost Total','formatter':myRankingPerLostFormatter,'sortOptions':{defaultDir:YAHOO.widget.DataTable.CLASS_DESC}},
    	          {'name':'perLostThisMonth', 'type':'calculated', 'label':'% Lost This Month','formatter':myRankingPerLostFormatter,'sortOptions':{defaultDir:YAHOO.widget.DataTable.CLASS_DESC}}
    	        ];

    	        myColumnDefs = createColumns(tableSetup,columnDefs);
    	              
    	        //myColumnDefs = createMeasurementColumns(tableSetup);
    	        //unhighlightActiveRow();
    	        
    	        myDataTable = new YAHOO.widget.DataTable("centerbar"+tableSetup.tab, myColumnDefs, myDataSource, {height: "100%", width:"100%"});
    	        YAHOO.weReef.rankingDataTable = myDataTable;
    	        
    	      } else {
    	        alert(loginReply.replyText);
    	      }

    	  	} else {
    	        alert(o.replyText);    
    	    }	
    	  };


    		var handleFailureRanking = function(o) {
    			alert('Ranking failure');
    		};
    	  
    	var callbackRanking = {
    		    success:handleSuccessRanking,
    		    failure:handleFailureRanking
    		  };
    	
    	var sUrl = "./" + tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid;
    	var obj1 = YAHOO.util.Connect.asyncRequest('GET', sUrl, callbackRanking);
    	


      break;
      
    case 'myJourney':
      myDataSource = new YAHOO.util.XHRDataSource(tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid);
      YAHOO.weReef.journeyDataSource = myDataSource;

      columnDefs = [
        {'name':'id', 'type':'id'},
        {'name':'timestamp','type':'date','label':'Date'},
        {'name':'weight', 'type':'text', 'label':'Weight','parser':'number','formatter':''},
        {'name':'lostTotal', 'type':'calculated', 'label':'Lost Total (lbs)','parser':'number','formatter':''},
        {'name':'perLostSinceLast', 'type':'calculated', 'label':'% Lost This Week','parser':'number','formatter':myPerLostFormatter},
        {'name':'perLostTotal', 'type':'calculated', 'label':'% Lost Total','parser':'number','formatter':myPerLostFormatter},
        {'name':'perLostThisMonth', 'type':'calculated', 'label':'% Lost This Month','formatter':myPerLostFormatter,'sortOptions':{defaultDir:YAHOO.widget.DataTable.CLASS_DESC}},
        {'name':'waist', 'type':'text', 'label':'Waist (in)','parser':'number','formatter':''},
        {'name':'arm', 'type':'text', 'label':'Arm (in)','parser':'number','formatter':''},
        {'name':'thigh', 'type':'text', 'label':'Thy (in)','parser':'number','formatter':''},
        {'name':'hips', 'type':'text', 'label':'Hips (in)','parser':'number','formatter':''},
        {'name':'chest', 'type':'text', 'label':'Chest (in)','parser':'number','formatter':''},
        {'name':'note', 'type':'textbox', 'label':'Notes','minWidth':'500px'},
        {'name':'delete', 'type':'delete'}
      ];

      myColumnDefs = createColumns(tableSetup,columnDefs);
            
      //myColumnDefs = createMeasurementColumns(tableSetup);

      myDataTable = new YAHOO.widget.DataTable("centerbar"+tableSetup.tab, myColumnDefs, myDataSource, {height: "100%", width:"100%", MSG_ERROR:"Please 'Add Row' to start inputting your data!", MSG_EMPTY:"Please 'Add Row' to start inputting your data!"});
      YAHOO.weReef.journeyDataTable = myDataTable;
      //alert('Something happened before');
      //myDataTable.MSG_ERROR="XXX";
      //myDataTable.MSG_EMPTY = "No records found";
      //myDataTable.set(MSG_EMPTY)
      //alert('Something happened');
      break;

    case 'myExercise':
      myDataSource = new YAHOO.util.XHRDataSource(tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid);
      YAHOO.weReef.exerciseDataSource = myDataSource;

      columnDefs = [
        {'name':'id', 'type':'id'},
        {'name':'timestamp','type':'date','label':'Date'},
        {'name':'activity', 'type':'text', 'label':'Activity'},
        {'name':'duration', 'type':'text', 'label':'Duration (min)','parser':'number'},
        {'name':'effort', 'type':'text', 'label':'Effort'},
        {'name':'note', 'type':'textbox', 'label':'Notes'},
        {'name':'delete', 'type':'delete'}
      ];

      myColumnDefs = createColumns(tableSetup,columnDefs);
            
      //myColumnDefs = createMeasurementColumns(tableSetup);
      
      myDataTable = new YAHOO.widget.DataTable("centerbar"+tableSetup.tab, myColumnDefs, myDataSource, {height: "100%", width:"100%"});
      YAHOO.weReef.exerciseDataTable = myDataTable;
      break;

    case 'myFood':
      myDataSource = new YAHOO.util.XHRDataSource(tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid);
            //YAHOO.weReef.measurementDataSource = myDataSource;

      columnDefs = [
        {'name':'id', 'type':'id'},
        {'name':'timestamp','type':'date','label':'Date'},
        {'name':'food', 'type':'text', 'label':'Food'},
        {'name':'meal', 'type':'text', 'label':'Meal'},
        {'name':'portionsize', 'type':'text', 'label':'Portion Size'},
        {'name':'note', 'type':'textbox', 'label':'Notes'},
        {'name':'delete', 'type':'delete'}
      ];

      myColumnDefs = createColumns(tableSetup,columnDefs);
            
      //myColumnDefs = createMeasurementColumns(tableSetup);
      
      myDataTable = new YAHOO.widget.DataTable("centerbar"+tableSetup.tab, myColumnDefs, myDataSource, {height: "100%", width:"100%"});
      YAHOO.weReef.foodDataTable = myDataTable;
      break;

    case 'Administrator':

      myDataSource = new YAHOO.util.XHRDataSource(tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid + "&timestamp=20100416");
      YAHOO.weReef.adminDataSource = myDataSource;

      columnDefs = [
        {'name':'id', 'type':'id'},
        {'name':'name','type':'text','label':'Name'},
        {'name':'username','type':'text','label':'Username','hidden':true},
        {'name':'switch','type':'active','label':'Switch','formatter':myActiveFormatter},
        {'name':'activation', 'type':'text', 'label':'Activation'},
        {'name':'email', 'type':'calculated', 'label':'Email', 'formatter':'email'},
        {'name':'registerDate', 'type':'calculated', 'label':'Registered','formatter':''},
        {'name':'lastvisitDate', 'type':'calculated', 'label':'Last Visit','formatter':''},
        {'name':'delete', 'type':'delete'}
      ];



      myColumnDefs = createColumns(tableSetup,columnDefs);

      //myColumnDefs = createMeasurementColumns(tableSetup);
      
      myDataTable = new YAHOO.widget.DataTable("centerbar"+tableSetup.tab, myColumnDefs, YAHOO.weReef.adminDataSource, {height: "100%", width:"100%", formatRow: highlightActiveRow});
      YAHOO.weReef.adminDataTable = myDataTable;

  		//YAHOO.util.Event.onDOMReady(calinit);
      
      //var xxxx = highlightActiveRow(myDataTable);
      break;

    case 'Administrator2':

      myDataSource = new YAHOO.util.XHRDataSource(tableSetup.phpScript + "?userid=" + YAHOO.weReef.userid + "&timestamp=20100416");
      YAHOO.weReef.adminDataSource = myDataSource;

      columnDefs = [
        {'name':'id', 'type':'id'},
        {'name':'name','type':'text','label':'Name'},
        {'name':'switch','type':'active','label':'Switch','formatter':myActiveFormatter},
        {'name':'activation', 'type':'text', 'label':'Activation'},
        {'name':'email', 'type':'text', 'label':'Email'},
        {'name':'registerDate', 'type':'calculated', 'label':'Registered','formatter':''},
        {'name':'lastvisitDate', 'type':'calculated', 'label':'Last Visit','formatter':''},
        {'name':'delete', 'type':'delete'}
      ];



      myColumnDefs = createColumns(tableSetup,columnDefs);

      //myColumnDefs = createMeasurementColumns(tableSetup);
      
      myDataTable = new YAHOO.widget.DataTable("centerbar"+tableSetup.tab, myColumnDefs, YAHOO.weReef.adminDataSource, {height: "100%", width:"100%", formatRow: highlightActiveRow});
      YAHOO.weReef.adminDataTable = myDataTable;

  		//YAHOO.util.Event.onDOMReady(calinit);
      
      //var xxxx = highlightActiveRow(myDataTable);
      break;

    default:

  }







  
  myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
  myDataSource.responseSchema = {
                                  resultsList: "ResultSet.Result",
                                  fields: myColumnDefs//tableSetup.columns
  };
/////// REFACTORING

  /* ~~~ these are used for the XHR table updating ~~~ */
  var mySuccessHandler = function( sRequest , oResponse , oPayload ) {
//     alert(oResponse.results.length);
    this.onDataReturnReplaceRows.apply(this, [sRequest , oResponse , oPayload]); // arguments
  };
  var myFailureHandler = function() {

    var len = this.getRecordSet().getLength();
    this.deleteRows(0,len);
    YAHOO.widget.DataTable.MSG_EMPTY = "No data found";
    this.showTableMessage(YAHOO.widget.DataTable.MSG_EMPTY, YAHOO.widget.DataTable.CLASS_EMPTY);
//       this.showTableMessage(YAHOO.widget.DataTable.MSG_ERROR, YAHOO.widget.DataTable.CLASS_ERROR);
  };
  var sendRequestCallbackObj = {
    success : mySuccessHandler,
    failure : myFailureHandler,
    scope : YAHOO.weReef.measurementDataTable
  };

  /* ~~~ functions myDataTable will subscribe to ~~~ */
  var highlightEditableCell = function(oArgs) {
    var elCell = oArgs.target;
    if(YAHOO.util.Dom.hasClass(elCell, "yui-dt-editable")) {
      this.highlightCell(elCell);
    }
  };
  var highlightNewRow = function(oArgs) {
    var elRow = oArgs.record;
    var recInd = this.getRecordIndex(elRow);
    this.selectRow(recInd);
  };
  var unhighlightTheRow = function(oArgs) {
    var elRow = oArgs.target;
    this.unselectRow(elRow);
  };



  ///CHRIS'S SUBSCRIPTIONS
  //THIS EVENT HANDLER IS LAUNCHED WHEN A CELL GETS CLICKED
  //  IF THE Column THAT IS SELECTED IS THE DELETE ColumnTHERE WILL BE PROMPT
  //  IF THE USER CONFIRMS, THAT ROW WILL BE DELETED FROM THE DATABASE RIGHT AWAY 
  myDataTable.subscribe('cellClickEvent',function(ev) {

      var target = YAHOO.util.Event.getTarget(ev);
      var column = this.getColumn(target);
      
      switch(column.key) {
        case 'insert':
          this.addRow( {} , this.getRecordIndex(target));
          break;
        case 'delete':
          if (confirm('Are you sure you want to permanently delete this row?')) {
              var record = this.getRecord(target);
              YAHOO.util.Connect.asyncRequest(
                'GET',
                tableSetup.phpScript+'?delete=1&action=delete' + myBuildUrl(this,record) + '&userid=' + YAHOO.weReef.userid,
                {
                    success: function (o) {
                        //NEED TO PUT RESULT INTO A JAVASCRIPT OBJECT
                        var jsonObj = YAHOO.lang.JSON.parse(o.responseText);
                        if (jsonObj.replyText == 'Ok') {
                            this.deleteRow(target);
                        } else {
                            alert('NOK:'+ o.responseText);
                        }
                    },
                    failure: function (o) {
                        alert(o.statusText);
                    },
                    scope:this
                  }
            );

          }
          break;
        case 'active':
          if (confirm('Are you sure you want to switch users?')) {
              var record = this.getRecord(target);
              var elTr = this.getRow(target);
              YAHOO.weReef.userid = myBuildUrl(this,record,'username');

              //reset the tabs so they are like first time access;

              //Remove THE CLASS MARK FROM EVERY ROW
              unhighlightActiveRow();
              //Add (THE CLASS MARK TO THE CLICKED ROW
              YAHOO.util.Dom.addClass(elTr, 'mark');

//              var elCell = this.getCell(target);
//              var elTr = this.getRow(target);
//
//               YAHOO.util.Connect.asyncRequest(
//                 'GET',
//                 tableSetup.phpScript,
//                 {
//                     success: function (o) {
//                         //NEED TO PUT RESULT INTO A JAVASCRIPT OBJECT
//                         var jsonObj = YAHOO.lang.JSON.parse(o.responseText);
//                         if (jsonObj.replyText == 'Ok') {
//                             alert('OK');
//                             //Remove(THE CALSS MARK FROM EVERY ROW
//                             var previousActiveRow = document.getElementsByClassName('mark');
//                             for (var i=0; i<previousActiveRow.length; i++) {
//                               YAHOO.util.Dom.removeClass(previousActiveRow[i], 'mark');
//                             }
//                             //Add (THE CLASS MARK TO THE CLICKED ROW
//                             YAHOO.util.Dom.addClass(elTr, 'mark');
// 
// 
//                         } else {
//                             alert('NOK:'+ o.responseText);
//                         }
//                     },
//                     failure: function (o) {
//                         alert(o.statusText);
//                     },
//                     scope:this
//                   },
//                   'active=1&userid=1' + myBuildUrl(this,record)
//             );

          }
          break;

        default:
          this.onEventShowCellEditor(ev);
      }
  });

  //myDataTable.subscribe("cellClickEvent", myDataTable.onEventShowCellEditor)
  myDataTable.subscribe("cellMouseoutEvent", myDataTable.onEventUnhighlightCell);
  myDataTable.subscribe("cellMouseoverEvent", highlightEditableCell);
  myDataTable.subscribe("rowAddEvent", highlightNewRow);
  myDataTable.subscribe("rowMouseoutEvent", unhighlightTheRow);

  //PUT A BUTTON ON THE SHEET
  var onAddRowButtonClick = function () {

    //myDataTable.addRow({timestamp: new Date(), measurement: -1 }, 0 );
    myDataTable.addRow({}, 0 );
  };

  	//IF THE BUTTON ALREADY EXISTS REMOVE IT AND CREATE A NEW ONE AGAIN
	if(YAHOO.util.Dom.inDocument("addrowbutton"+tableSetup.tab)==true) {
		var el = new YAHOO.util.Element("topbar"+tableSetup.tab);

		if (el.hasChildNodes()) {
		    el.removeChild(el.get('firstChild'));
		}
	}

	//IF THIS TAB IS SUPPOSED TO HAVE A BUTTON PUT ONE IN
  if(tableSetup.button==1) {
 
	  var oAddRowButton = new YAHOO.widget.Button({
	                                type: "push",
	                                label: "Create a New Entry",
	                                id: "addrowbutton"+tableSetup.tab,
	                                name: "addrowbutton",
	                                value: "addrowbuttonvalue",
	                                disabled: false,
	                                container: "topbar"+tableSetup.tab  });
	                                
	
	  oAddRowButton.on("click", onAddRowButtonClick);
  }

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   ~~~ END OF DATATABLE
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


}
var calinit = function() {

  function dateToLocaleString(dt, cal) {
          var wStr = cal.cfg.getProperty("WEEKDAYS_LONG")[dt.getDay()];
          var dStr = dt.getDate();
          var mStr = cal.cfg.getProperty("MONTHS_LONG")[dt.getMonth()];
          var yStr = dt.getFullYear();
          return (wStr + ", " + dStr + " " + mStr + " " + yStr);
  }

  function dateToTimestamp(dt) {
    var year = dt[0];
    if(dt[1]<10) {
      var month = "0"+dt[1];
    } else {
      var month = dt[1];
    }
    if(dt[2]<10) {
      var day = "0"+dt[2];
    } else {
      var day = dt[2];
    }
    return (year + month + day);
  }
  
  function mySelectHandler(type,args,obj) {
          var selected = args[0];
          var selDate = this.toDate(selected[0]);
          alert("SELECTED: " + dateToTimestamp(selected[0]));
          alert("SELECTED: " + dateToLocaleString(selDate, this));

         YAHOO.weReef.adminDate = dateToTimestamp(selected[0]);

         YAHOO.weReef.adminDataSource.sendRequest("&timestamp="+YAHOO.weReef.adminDate );

          var t = YAHOO.weReef.adminDataTable.getColumn('weight');
          t.getThLinerEl().innerHTML = dateToLocaleString(selDate, this);
 

  };

  function myDeselectHandler(type, args, obj) {
          var deselected = args[0];
          var deselDate = this.toDate(deselected[0]);

          alert("DESELECTED: " + dateToLocaleString(deselDate, this));
  };

  YAHOO.weReef.cal1 = new YAHOO.widget.Calendar("cal1","adminCalendarDiv");

  YAHOO.weReef.cal1.selectEvent.subscribe(mySelectHandler, YAHOO.weReef.cal1, true);
  YAHOO.weReef.cal1.deselectEvent.subscribe(myDeselectHandler, YAHOO.weReef.cal1, true);

  YAHOO.weReef.cal1.render();
  
	//YAHOO.weReef.cal1 = new YAHOO.widget.Calendar("cal1",'topbarcalendar'+tableSetup.tab);
	//YAHOO.weReef.cal1.render();
};

  		
YAHOO.widget.DataTable.editImage = function(oEditor, oSelf) {
    
    var elCell = oEditor.cell;
    var oRecord = oEditor.record;
    var oColumn = oEditor.column;
    var elContainer = oEditor.container;
    //EMPTY CONTAINER, GRAB PARENT AND CHILDREN TO DELETE BUTTONS
    var value = YAHOO.lang.isValue(oRecord.getData(oColumn.key)) ? oRecord.getData(oColumn.key) : "";

    var idObject = myBuildObject(oSelf,oRecord);
    var itemIdObject = myItemId(oSelf,oRecord, 'item_id');

    var imageObject = {user_id:YAHOO.weReef.userid, image_upload:1, tableImage:1, id:idObject.id, item_id:itemIdObject.item_id, phpScript: YAHOO.weReef.phpScript, systemid:YAHOO.weReef.activeSystem.id};


//ACTUALLY BUILD THE POPUP
    var elUploaderContainer = elContainer.appendChild(document.createElement("div"));
    elUploaderContainer.id="uploaderContainer";

    var elUploaderOverlay = elUploaderContainer.appendChild(document.createElement("div"));
    elUploaderOverlay.id="uploaderOverlay";

    var elSelectFilesLink = elUploaderContainer.appendChild(document.createElement("div"));
    elSelectFilesLink.id="selectFilesLink";    
        
    var elSelectFile = elSelectFilesLink.appendChild(document.createElement("a"));
    var selectTxt = document.createTextNode("Select File");
    elSelectFile.appendChild(selectTxt);
    elSelectFile.href="#";
    elSelectFile.id="selectLink";

	var uiLayer = YAHOO.util.Dom.getRegion('selectLink');
	var overlay = YAHOO.util.Dom.get('uploaderOverlay');
	YAHOO.util.Dom.setStyle(overlay, 'width', uiLayer.right-uiLayer.left + "px");
	YAHOO.util.Dom.setStyle(overlay, 'height', uiLayer.bottom-uiLayer.top + "px");
	
	
  //PROGRESS BOX
    var elSelectedFileDisplay = elContainer.appendChild(document.createElement("div"));
    elSelectedFileDisplay.id="selectedFileDisplay";
    var progressTxt = document.createTextNode("Progress: ");
    elSelectedFileDisplay.appendChild(progressTxt);
    
    var elProgressReport = elSelectedFileDisplay.appendChild(document.createElement("input"));
    elProgressReport.id="progressReport";
    elProgressReport.cols=50;
    elProgressReport.value="";
    elProgressReport.type="text";
    elProgressReport.readOnly="true";

  var elUploadButton = new YAHOO.widget.Button({
                                type: "push",
                                label: "Upload",
                                id: "uploadButton",
                                disabled: false,
                                container: elContainer});
  var elCancelButton = new YAHOO.widget.Button({
                                type: "push",
                                label: "Cancel",
                                id: "cancelButton",
                                disabled: false,
                                container: elContainer});

        
//    generateTableUploader();
//    elUploadButton.on("click", update);

//     YAHOO.widget.Uploader.SWFURL = "../../yui/build/uploader/assets/uploader.swf";
// 
//     // Instantiate the uploader and write it to its placeholder div.
// 	  YAHOO.weReef.uploader = new YAHOO.widget.Uploader( "uploaderOverlay" );
// 	
//   	YAHOO.weReef.uploader.onFileSelect = function(event) {
//   
//   		for (var file in event.fileList) {
//   		    if(YAHOO.lang.hasOwnProperty(event.fileList, file)) {
//   				fileID = event.fileList[file].id;
//   			}
//   		}
//   		
//   		this.progressReport = document.getElementById("progressReport");
//   		this.progressReport.value = "Selected " + event.fileList[fileID].name;
//   	}
// 	
//     var xxx = function(ev) {
//       alert('chocked');
//     };
//     
     //YAHOO.weReef.uploader.addListener('editorCancelEvent', function(oArgs) {    
     YAHOO.util.Event.addListener("uploadButton", "click", function(oArgs) {
        var successFlag = uploadTable(imageObject);
        alert("Image = " + YAHOO.weReef.uploader.tableImage);
        //updateCell(oSelf,oRecord,YAHOO.weReef.uploader.tableImage);
        
        elCell.innerHTML = YAHOO.lang.substitute(
              '<img src='+decodeURIComponent(YAHOO.weReef.uploader.tableImage)+' width="80" height="80" />', 
              oRecord.getData()
        );
	              
	              
        if(successFlag === 1) {
          oSelf.cancelCellEditor(); //IF IT DIDN'T WORK DONT CLOSE THE CELL EDITOR
        }
       }); 
     YAHOO.util.Event.addListener("cancelButton", "click", function(oArgs) {
        oSelf.cancelCellEditor();
       }); 
//      oEditor.subscribe("editorSaveEvent", function(oArgs) { 
//         alert('port,am');   
//       }); 

 


};

YAHOO.widget.DataTable.editNumber = function(oEditor, oSelf) {
    var elCell = oEditor.cell;
    var oRecord = oEditor.record;
    var oColumn = oEditor.column;
    var elContainer = oEditor.container;
    var value = YAHOO.lang.isValue(oRecord.getData(oColumn.key)) ? oRecord.getData(oColumn.key) : "";

    var elTextbox = elContainer.appendChild(document.createElement("input"));
    elTextbox.type = "text";
   // elTextbox.style.width = elCell.offsetWidth + "px";
    elTextbox.value = value;

    YAHOO.util.Event.addListener(elTextbox, 'keypress', function(ev){
        if (ev.keyCode !== 0) {return};
        if (ev.charCode >= 48 && ev.charCode <= 57) {return};
        YAHOO.util.Event.stopEvent(ev);
    });

    YAHOO.util.Event.addListener(elTextbox, "keyup", function(ev){
        oEditor.value = parseInt(elTextbox.value,10);
        oSelf.fireEvent("editorUpdateEvent",{editor:oEditor});
    });

    elTextbox.focus();
    elTextbox.select();
};

	// Define a custom row formatter function 
var myPerLostFormatter = function(elCell, oRecord, x, value) { 

  var result=Math.round(value*100)/100  //returns 28.45  
  elCell.innerHTML = result+'%';
  return true; 
};  

var myRankingPerLostFormatter = function(elCell, oRecord, x, value) { 

/*    if(oRecord.getData("perLostSinceLast") > 5) {
        YAHOO.util.Dom.addClass(elCell.parentNode, "up");
    }
    else {
        YAHOO.util.Dom.removeClass(elCell.parentNode, "up");
    }
*/
	  var result=Math.round(value*100)/100  //returns 28.45
	  //elCell.innerHTML = result;
	  elCell.innerHTML = result+'%';
	  return true; 
};  
	
var unhighlightActiveRow = function() {

  var previousActiveRow = document.getElementsByClassName('mark');
  for (var i=0; i<previousActiveRow.length; i++) {
    YAHOO.util.Dom.removeClass(previousActiveRow[i], 'mark');
  }
  return true;
};

var highlightActiveRow = function(elTr, oRecord) {

  if (oRecord.getData('username') === YAHOO.weReef.userid) {
    YAHOO.util.Dom.addClass(elTr, 'mark'); 
  }
  return true;
};

var myActiveFormatter = function(elCell, oRecord, oColumn, oData) {
  elCell.innerHTML = '<div  class="activeRow" title="Make System Active" />';

  return true;
};
              
var createColumns = function(tableSetup,columnSetup) {

  var myColumnDefs = [];
  var i;
  
  for (i = 0; i < columnSetup.length; i+=1) {
    switch(columnSetup[i].type) {
      case 'id':
        myColumnDefs.push({ key:'id',
          hidden:false,
          isPrimaryKey:true
        });       
        break;
      case 'date':
        myColumnDefs.push({ key:columnSetup[i].name,
           label:columnSetup[i].label,
           formatter:YAHOO.widget.DataTable.formatDate,
           parser:'date',
            sortable:true,
           editor: new YAHOO.widget.DateCellEditor(
           {
              //asyncSubmitter: editCellEvent(callback, newValue)
              
              asyncSubmitter: function (callback, newValue) {
        	   //DOING THE DATE FORMAT ON THE JAVASCRIPT SIDE BECAUSE I CANT GET IT TO WORK CROSS BROWSER ON THE PHP SIDE
        	   var dateValue = escape(newValue.format("yyyymmdd"));
                var record = this.getRecord(),
                    column = this.getColumn(),
                    oldValue = this.value,
                    datatable = this.getDataTable();
                    
                YAHOO.util.Connect.asyncRequest(
                    'GET',
                    tableSetup.phpScript+'?action=cellEdit&column=' + column.key + '&newValue=' + 
                    dateValue + '&userid=' + YAHOO.weReef.userid + myBuildUrl(datatable,record), 
                    {
                        success:function(o) {
                          try {
                            var r = YAHOO.lang.JSON.parse(o.responseText);
                            if (r.replyCode == 201) {
                            	var dateArray = r.data.split("");
                            	var year = dateArray[0]+dateArray[1]+dateArray[2]+dateArray[3];
                            	dateArray[5]=dateArray[5]-1; //MONTH IS ZERO BASED
                            	var month = dateArray[4]+dateArray[5];
                            	var day = dateArray[6]+dateArray[7];
                            	var newDate = new Date(year,month,day);
                                //var newDate = new Date(r.data);
                                if(newDate === 'Invalid Date') {
                                	alert('newDate='+newDate);
                            	}
                                if(r.id) {
                                  updateCell(datatable,record,r.id);
                                }
                                //TODO: IF THE DATE IS THE EARLIEST THE OTHER ROWS NEED TO BE UPDATED
                                updateCell(datatable,record,r.lostTotal,'lostTotal');
                                updateCell(datatable,record,r.perLostTotal,'perLostTotal');
                                updateCell(datatable,record,r.perLostSinceLast,'perLostSinceLast');
                                updateCell(datatable,record,r.perLostThisMonth,'perLostThisMonth');                                
                                callback(true, newDate);    
                            } else {
                                alert("FAILED TO GET THE RIGHT REPLY CODE. Reply Text = "+r.replyText);
                                callback();
                            }
                          } catch(e) {
                            alert("ERROR: Invalid JSON = "+o.responseText);
                          }                            
                        },
                        failure:function(o) {
                            alert("YIKES"+o.statusText);
                            callback();
                        },
                        scope:this
                    }
                    );                                 
                  }
    
                })
          });       
        break;
      case 'text':
        myColumnDefs.push(
          { key:columnSetup[i].name,
           label:columnSetup[i].label,
           editor: new YAHOO.widget.TextboxCellEditor(
           {
              asyncSubmitter: function (callback, newValue) {
                  var record = this.getRecord(),
                      column = this.getColumn(),
                      oldValue = this.value,
                      datatable = this.getDataTable();
                  YAHOO.util.Connect.asyncRequest(
                      'GET',
                      tableSetup.phpScript + '?action=cellEdit&column=' + column.key + '&newValue=' + 
                      escape(newValue) +  '&userid=' + YAHOO.weReef.userid + myBuildUrl(datatable,record), 
                      {
                          success:function(o) {
                              try {
                                var r = YAHOO.lang.JSON.parse(o.responseText);
                                if (r.replyCode == 201) {
                                    if(r.id) {
                                      updateCell(datatable,record,r.id);
                                    }

                                    updateCell(datatable,record,r.lostTotal,'lostTotal');
                                    updateCell(datatable,record,r.perLostTotal,'perLostTotal');
                                    updateCell(datatable,record,r.perLostSinceLast,'perLostSinceLast');
                                    updateCell(datatable,record,r.perLostThisMonth,'perLostThisMonth');
                                    
                                    callback(true, r.data);
                                } else {
                                    alert(r.replyText);
                                    callback();
                                }
                              }
                              catch(e) {
                                alert("ERROR: Invalid JSON = "+o.responseText);
                              }
                          },
                          failure:function(o) {
                              alert(o.statusText);
                              callback();
                          },
                          scope:this
                      }
                  );                                              
              },
              disableBtns:false
          }
           ),
           sortable:true,
           resizeable:true,
           parser:columnSetup[i].parser,
           hidden:columnSetup[i].hidden,
           formatter:columnSetup[i].formatter
          }
        );
      break;
      case 'textbox':
        myColumnDefs.push(
          { key:columnSetup[i].name,
           label:columnSetup[i].label,
           editor: new YAHOO.widget.TextareaCellEditor(
           {
              asyncSubmitter: function (callback, newValue) {
                  var record = this.getRecord(),
                      column = this.getColumn(),
                      oldValue = this.value,
                      datatable = this.getDataTable();
                  YAHOO.util.Connect.asyncRequest(
                      'GET',
                      tableSetup.phpScript + '?action=cellEdit&column=' + column.key + '&newValue=' + 
                      escape(newValue) + '&oldValue=' + escape(oldValue) + 
                      '&userid=' + YAHOO.weReef.userid +
                      myBuildUrl(datatable,record), 
                      {
                          success:function(o) {
                              var r = YAHOO.lang.JSON.parse(o.responseText);
                              if (r.replyCode == 201) {
                                  if(r.id) {
                                    updateCell(datatable,record,r.id);
                                  }
                                  callback(true, r.data);
                              } else {
                                  alert(r.replyText);
                                  callback();
                              }
                          },
                          failure:function(o) {
                              alert(o.statusText);
                              callback();
                          },
                          scope:this
                      }
                  );                                              
              },
              disableBtns:false
          }
           ),
           sortable:true,
           resizeable:true
          }        
        );
      break;
      case 'imagelink':
        myColumnDefs.push(
          { key:columnSetup[i].name,
           label:columnSetup[i].label,
           editor: new YAHOO.widget.TextboxCellEditor(
           {
              asyncSubmitter: function (callback, newValue) {
                  var record = this.getRecord(),
                      column = this.getColumn(),
                      oldValue = this.value,
                      datatable = this.getDataTable();
                  YAHOO.util.Connect.asyncRequest(
                      'GET',
                      tableSetup.phpScript + '?action=cellEdit&column=' + column.key + '&newValue=' + 
                      escape(newValue) + '&oldValue=' + escape(oldValue) + 
                      '&userid=' + YAHOO.weReef.userid + myBuildUrl(datatable,record), 
                      {
                          success:function(o) {
                              var r = YAHOO.lang.JSON.parse(o.responseText);
                              if (r.replyCode == 201) {
                                  if(r.id) {
                                    updateCell(datatable,record,r.id);
                                  }
                                  callback(true, r.data);
                              } else {
                                  alert("PHP RETURNED STATUS=> " + r.replyText);
                                  callback();
                              }
                          },
                          failure:function(o) {
                              alert("REQUEST FAILURE=> " + o.statusText);
                              callback();
                          },
                          scope:this
                      }
                  );                                              
              },
              disableBtns:false
          }
           ),
           sortable:true,
           resizeable:true,
           parser:columnSetup[i].parser,
          formatter: function (elCell, oRecord, oColumn, oData) {
              // This formatter sets the value of the input box (line above)
              // and sets two sets of action buttons, one active, the other not
              // which will be switched by later events
                elCell.innerHTML = YAHOO.lang.substitute(
	                    //'<img src="uploads/chris_small.jpg" width="80" height="80" />', 
	                    '<img src='+decodeURIComponent(oData)+' width="80" height="80" />', 
	                    oRecord.getData()
	              );
            }
          }
        );
      break;
      case 'image':
        myColumnDefs.push(
          {key:columnSetup[i].name, 
          label:columnSetup[i].label,
          hidden:false,
          editor:YAHOO.widget.DataTable.editImage,
          formatter: function (elCell, oRecord, oColumn, oData) {
              // This formatter sets the value of the input box (line above)
              // and sets two sets of action buttons, one active, the other not
              // which will be switched by later events
                elCell.innerHTML = YAHOO.lang.substitute(
	                    //'<img src="uploads/chris_small.jpg" width="80" height="80" />', 
	                    '<img src='+decodeURIComponent(oData)+' width="80" height="80" />', 
	                    oRecord.getData()
	              );
            }
          }
        );
        break;
      case 'calculated':
        myColumnDefs.push(
          { key:columnSetup[i].name,
           label:columnSetup[i].label,
           calculated:true,
           formatter:columnSetup[i].formatter,
           width:'500px',
           sortable:true,
           sortOptions:columnSetup[i].sortOptions,
           resizeable:true
              
        });
      break;
      case 'active': 
        myColumnDefs.push(
        { key:'active',
          label:columnSetup[i].label,
          formatter:columnSetup[i].formatter
        });
      break;
      case 'delete': 
        myColumnDefs.push(
        { key:'delete',
          label:' ',
          formatter:function(elCell) {
            elCell.innerHTML = '<div class="delRow" title="Delete Row" />';
          }
        });
      break;
      
      default:
        alert('Unexpected case for column definition: ' + columnSetup[i].type);
  
    }
  }

  return myColumnDefs;
};