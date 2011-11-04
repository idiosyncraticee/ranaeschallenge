// function loadServerData(){
var loadServerData = function(){

  var activeSystem = YAHOO.weReef.activeSystem;

  var measData = new Array();
//   var activeParameter = [];

  YAHOO.weReef.activeParameter = [];

  var handleMeasQuerySuccess = function(o){
    if(o.responseText !== undefined){
      var response=o.responseText;
      measData=eval("("+response+")");

// alert('total is: ' + measData['Response']['Total']);
// alert(measData['Response']['ParCount']);

      var timelineData = new google.visualization.DataTable();

      /* populate the data source for the charts */
      timelineData.addColumn('date', 'Date');
      timelineData.addRows( measData['Response']['Total'] );

      var columnCounter = 0;
      var rowCounter = -1;
      for (var i=0; i<measData['Response']['ParCount']; i++) {
        columnCounter++;
        timelineData.addColumn('number', measData['Response']['ParXRef'][i]['name']);

        for (var j=0; j<measData['Response']['Total']; j++) {
          if ( measData['Response']['Results'][j]['parameter_id'] == measData['Response']['ParXRef'][i]['id'] ) {
            var parts = measData['Response']['Results'][j]['timestamp'].split("/");
            rowCounter++;
            timelineData.setValue(rowCounter, 0, new Date(parts[0], parts[1]-1 ,parts[2]));
            timelineData.setValue(rowCounter, columnCounter, 1*measData['Response']['Results'][j]['measurement']);
          }
        }
      }

      var timelineView = new google.visualization.DataView(timelineData);

      createGauges(timelineView, measData);

      YAHOO.weReef.activeParameter[measData['Response']['ParXRef'][0]['name']] = 1;
      YAHOO.util.Dom.addClass(measData['Response']['ParXRef'][0]['name'], 'hover2');
      displayTrendChart(measData, timelineView );
    }
  }

  var handleMeasQueryFailure = function(o){
  	if(o.responseText !== undefined){
      alert( 'Load failure. Status msg: ' + o.statusText ); // o.tId, o.status
  	}
  }

  var measQueryCallback = {
    success:handleMeasQuerySuccess,
    failure:handleMeasQueryFailure
  };

  /* Get the system measurements if necessary*/
  if ( YAHOO.weReef.state_charts_firstload == 1 || YAHOO.weReef.state_stale_data == 1 ) {

    var request = YAHOO.util.Connect.asyncRequest(
                      'GET',
                      "systemMeasurementsQuery.php?system_id=" + activeSystem['id'],
                      measQueryCallback  );

  }
}


	
function addYUIChart(event) {

	YAHOO.widget.Chart.SWFURL = "http://yui.yahooapis.com/2.8.0r4/build/charts/assets/charts.swf";

    // Use an XHRDataSource

    var oDS = new YAHOO.util.XHRDataSource("./updateJourneyDatabase.php?userid=" + YAHOO.weReef.userid);
    //var oDS = YAHOO.weReef.journeyDataSource;
    // Set the responseType
    oDS.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;

    // Define the schema of the delimited results
	        oDS.responseSchema = {
	          resultsList : "ResultSet.Result",
	          metaFields : {
              description : "ResultSet.description"
            }
	        }; 
    // Enable caching
    oDS.maxCacheEntries = 50;

  var seriesDef =  
   [ 
    //{ displayName: "Date", yField: "date" },
    { displayName: "% Lost Since Last Week", yField: "perLostSinceLast",
      style:{
        lineColor:0xFF0000, 
	      lineAlpha:.5, 
        borderColor:0xFF0000, 
	      fillColor:0xFF0000 
      } 
    },
    { displayName: "% Lost Total", yField: "perLostTotal" }
    //{ displayName: "CheckIn", yField: "checkinSeries", style:{size:10, skin:'DiamondSkin'}  }
   ];

  var styleDef =
  {
  	xAxis:
  	{
  		labelRotation:-45
  	},
  	legend:
  	{
      display: "right"
    },
  	yAxis:
  	{
      zeroGridLine: 
      { 
      size:2, 
      color:0xff0000 
      }
  		//titleRotation:-90
  	}
  }


	YAHOO.example.formatCurrencyAxisLabel = function( value )
	{
		return YAHOO.util.Number.format( value,
		{
			suffix: "%",
			thousandsSeparator: ",",
			decimalPlaces: 2
		});
	}

	YAHOO.example.getDataTipText = function( item, index, series )
	{
		var toolTipText = series.displayName + " for " + item.timestamp;
		toolTipText += "\n" + YAHOO.example.formatCurrencyAxisLabel( item[series.yField] );
		return toolTipText;
	}

	var currencyAxis = new YAHOO.widget.NumericAxis();
	currencyAxis.labelFunction = YAHOO.example.formatCurrencyAxisLabel;

	var mychart = new YAHOO.widget.LineChart( "dashboardTabDiv", oDS,
	{
		series: seriesDef,
		style: styleDef,
		xField: "timestamp",
		yAxis: currencyAxis,
		dataTipFunction: YAHOO.example.getDataTipText,
		//only needed for flash player express install
		expressInstall: "assets/expressinstall.swf"
	});



}


function addDashboard(activeSystem) {

  /* Layout widget for dashboard HTML elements */
  var dashboardLayout = new YAHOO.widget.Layout('dashboardTabDiv', {
                   minHeight: 500, //I NEED TO FIGURE OUT HOW TO GET RID OF THIS
                   resize: true,
                   units: [
                      { position: 'top', height: 25, resize: false, body: 'dashboardTopbar', gutter: '2' },
                      { position: 'left', width: 100, resize: false, body: 'dashboardLeftSideMenu', gutter: '5 5 5 5', minWidth: 80, maxWidth: 300 },
                      { position: 'center', resize: false, body: 'dashboardDataTable', minHeight: 200 },
                      { position: 'right', width: 100, resize: false, body: 'dashboardRightSideMenu', gutter: '5 5 5 5', minWidth: 80, maxWidth: 300, top: 10 },
                      { position: 'bottom', height: 25, resize: false, body: 'dashboardBottom', gutter: '0 5 0 2' , minWidth: 150, maxWidth: 300}
                   ]
              });
  dashboardLayout.render();  // DEBUG - how to call this with google charts?

  YAHOO.weReef.state = new Array();

  YAHOO.weReef.state.charts_firstload = 1;

// alert(YAHOO.weReef.state.charts_firstload);

  YAHOO.weReef.state_charts_firstload = 1;
  YAHOO.weReef.state_stale_data = 1;

  tabView.getTab(0).addListener("click", loadServerData);
}

function createGauges(timelineView, measData) {

  if ( YAHOO.weReef.state_charts_firstload == 1 ) {
      YAHOO.weReef.state_charts_firstload = 0;
      alert('Changes state_charts_firstload to 0');
  }

//   /* remove any existing gauges */
//   var oldgauges = YAHOO.util.Dom.getElementsByClassName('gaugediv');
//
// alert('number of gauges to remove is ' + oldgauges.length);
//
//   for (x=0; x<oldgauges.length; x++) {
// //     alert('removing ' + oldgauges[x].id);
// //     if ( oldgauges[x].parentNode ) {
//     oldgauges[x].parentNode.removeChild(oldgauges[x]);
// //     }
//   }


  var mouseoverGauge = function(e) {
//     if(activeParameter[this.id]!=1) { // IF THE PARAMETER IS NOT ACTIVE
    if(YAHOO.weReef.activeParameter[this.id]!=1) {
//       this.className = "hover";
//       this.addClass = "hover";
      YAHOO.util.Dom.addClass(this, 'hover');
    }
  };

  var mouseoutGauge = function(e) {
//     if(activeParameter[this.id]!=1) { // IF THE PARAMETER IS NOT ACTIVE
    if(YAHOO.weReef.activeParameter[this.id]!=1) {
      this.className = "";
//       this.removeClass = "hover";
      YAHOO.util.Dom.removeClass(this, 'hover');
    }
  };

  var clickGauge = function(e){
    var parameter = this.id;

//     if(activeParameter[parameter]==1) {
    if(YAHOO.weReef.activeParameter[parameter]==1) {
//       activeParameter[parameter]=0;
      YAHOO.weReef.activeParameter[parameter]=0;
      this.className = "";
    }
    else {
//       activeParameter[parameter]=1;
      YAHOO.weReef.activeParameter[parameter]=1;
      this.className = "hover2";
      YAHOO.util.Dom.get('dashboardTopbar').innerHTML=parameter;
//           createTrendTable(jsonObj, parameter, activeSystem);
//           displayTrendTable(jsonObj, timelineView, timelineTable);

      //NEED TO DISPLAY THE TABLE FOR THE PARAMETER THAT WAS SELECTED
      displayTrendChart(measData, timelineView );
    }
  }

  var cnt = 0;
  for (var i=0; i<measData['Response']['ParCount']; i++) {
    var measurements = [];
    for (var j=0; j<measData['Response']['Total']; j++) {
      if ( measData['Response']['ParXRef'][i]['id'] == measData['Response']['Results'][j]['parameter_id'] ) {
        measurements[measurements.length] = measData['Response']['Results'][j]['measurement'];
      }
    }

    var last_index = measurements.length-1;
    var last_meas  = measurements[last_index];

    if ( last_meas ) {
      var mod_i = cnt % 2;
      cnt++;

      var eraseme = YAHOO.util.Dom.get( measData['Response']['ParXRef'][i]['name'] );
      if ( eraseme ) {
// alert('removing ' + measData['Response']['ParXRef'][i]['name']);
        eraseme.parentNode.removeChild(eraseme);
      }

      var newdiv = document.createElement('div');
      newdiv.setAttribute('id', measData['Response']['ParXRef'][i]['name']);
//       YAHOO.util.Dom.addClass(newdiv, 'gaugediv');
// alert('adding class to ' + measData['Response']['ParXRef'][i]['name']);

      if(mod_i == 0) {
        YAHOO.util.Dom.get('dashboardLeftSideMenu').appendChild(newdiv);
      } else {
        YAHOO.util.Dom.get('dashboardRightSideMenu').appendChild(newdiv);
      }

      YAHOO.util.Event.addListener(newdiv, "click", clickGauge);
      YAHOO.util.Event.addListener(newdiv, "mouseover", mouseoverGauge);
      YAHOO.util.Event.addListener(newdiv, "mouseout", mouseoutGauge);

      var gaugeData = new google.visualization.DataTable();
      gaugeData.addColumn('number', measData['Response']['ParXRef'][i]['name']);
      gaugeData.addRows(1);
      gaugeData.setCell(0, 0, 1*last_meas);

//       var gaugeChart = new google.visualization.Gauge( newdiv );
      var gaugeChart = new google.visualization.Gauge( YAHOO.util.Dom.get( measData['Response']['ParXRef'][i]['name']) );

//       var options = {width: 400, height: 120,
//       var options = {width: 200, height: 90,
//                      redFrom: measData['Response']['ParXRef'][i]['redmin'],
//                      redTo: measData['Response']['ParXRef'][i]['redmax'],
//                      yellowFrom: measData['Response']['ParXRef'][i]['yellowmin'],
//                      yellowTo: measData['Response']['ParXRef'][i]['yellowmax'],
//                      minorTicks: 5};
      var options = {width: 200, height: 90,
                     minorTicks: 5};

      gaugeChart.draw(gaugeData, options);

// alert( measData['Response']['ParXRef'][i]['redmin'] );

    }
  }

// alert('gauges added=' + cnt);
}


function displayTrendChart(measData, view ) {

  //var timelineChart = new google.visualization.AnnotatedTimeLine( YAHOO.util.Dom.get('dashboardTabDiv') );
  var timelineChart = new google.visualization.AnnotatedTimeLine( YAHOO.util.Dom.get('dashboardDataTable') );
  //var timelineChart = new google.visualization.AnnotatedTimeLine( YAHOO.util.Dom.get('dashboardLeftSideMenu') );

  var activeParameter = YAHOO.weReef.activeParameter;

  var columnArray = new Array;
  columnArray.push(0); // DATE
  for (var i=0; i<measData['Response']['ParCount']; i++) {
    if ( activeParameter[measData['Response']['ParXRef'][i]['name']] == 1 ) {
      columnArray.push(i+1);
    }
  }

  if (columnArray.length>1) {
    view.setColumns(columnArray);

//    var chartOptions = {width: 50, height: 50, displayAnnotations: true, thickness: 5};
    var chartOptions = {width: 300, height: 300, displayAnnotations: true, thickness: 5};
//    var chartOptions = {width: 800, height: 600, displayAnnotations: true, thickness: 5};

//    timelineChart.draw(view );
   timelineChart.draw(view, chartOptions);
  }
}




