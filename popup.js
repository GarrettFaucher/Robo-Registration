//popup.js for javascript event handling and data saving on the popup.html page

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-91404173-10', 'auto');
ga('set', 'checkProtocolTask', function(){});
ga('send', 'pageview', '/popup.html');

var appFillComplete = false;

var crnCache = [];
//getCourseData converts a crn to courseName, totalEnrolled, totalSeats, and totalRemaining
async function getCourseData(crn){
  // $.get("https://giraffe.uvm.edu/~rgweb/batch/swrsectc_spring_soc_202001/all_sections.html", function(data, status){
  //   var regex = /<pre>([\s\S]*)<\/pre>/;
  //   var matched = regex.exec(data)[1];
  //   matched = matched.replace(/(>>>====>)(.*?)(<====<<<)/g,"");
  //   console.log(matched);
  // });
  var returnVal;
  await $.get("https://www.uvm.edu/coursedirectory/?term=202109&crn="+crn, function(data,status){

    if(status != "success"){
      console.log(status)
      returnVal = false;
    }

    try {

      var courseNameRegex = /rel="displayInfoLink">(.*?)<\/a><\/h3>/g;
      var courseName = courseNameRegex.exec(data)[1];

      console.log("Course name for "+crn+" is "+decodeURI(courseName));

      var seatCountRegex = /Enrolled\/Seats:<\/span>(.*?)<br>/g;
      var seatCount = seatCountRegex.exec(data)[1];

      console.log("Seat Count for "+crn+" is "+seatCount);
      var seatDist = seatCount.split("/");
      var totalEnrolled = seatDist[0];
      var totalSeats = seatDist[1];
      var seatsRemaining = totalSeats - totalEnrolled;

      console.log("Total Enrolled: "+totalEnrolled);
      console.log("Total Seats: "+totalSeats);
      console.log("Seats Remaining: "+seatsRemaining);

      returnVal = {totalEnrolled: Number(totalEnrolled), totalSeats: Number(totalSeats), totalRemaining: seatsRemaining, courseName: courseName}

    } catch (e) {

      returnVal = false;

    }



  });

  return returnVal;
}

async function beginCountdown(){

}

function updateAllCrnInfo(updateChangedOnly){
  console.log("running updateAllCrnInfo")
  var index = -1;
  console.log(crnCache);
  $(".crnResolver").each(async function(){
    index+=1;
    var newCrn = $('> input',this).val();
    console.log("previous crn "+crnCache[index]+", new crn: "+newCrn);
    console.log("updateChangedOnly: "+updateChangedOnly+", cache:"+crnCache[index]+" new:"+newCrn+", index:"+index);
    if((updateChangedOnly && crnCache[index]!=newCrn) || (!updateChangedOnly)){


      crnCache[index] = newCrn;

      $('> .crnSeatInfo',this).hide();
      $('> .crnSeatInfo > .seatsDetail',this).hide();
      $('> input',this).removeClass("empty");
      $('> input',this).removeClass("valid");
      $('> .crnInfo',this).removeClass('warning');
      $('> .crnSeatInfo',this).removeClass("danger");

      if(newCrn){
        console.log("Checking crn "+newCrn)
        var crnData = await getCourseData(newCrn);
        if(crnData){
          console.log("Found crndata for "+newCrn);
          console.log(crnData);
          $('> input',this).addClass("valid");
          $('> .crnInfo > .courseLink',this).html(crnData.courseName);
          $('> .crnSeatInfo',this).show();

          if(crnData.totalRemaining < 1){
            console.log(crnData.courseName+" is full");
            $('> .crnSeatInfo',this).removeClass("fa-user-check");
            $('> .crnSeatInfo > .fas',this).addClass("fa-user-slash");
            $('> .crnSeatInfo',this).addClass("danger");

          }
          else{
            console.log(crnData.courseName+" is not full");
            $('> .crnSeatInfo',this).removeClass("fa-user-slash");
            $('> .crnSeatInfo > .fas',this).addClass("fa-user-check");
          }

          $('> .crnInfo > .courseLink',this).attr('href',"http://www.uvm.edu/academics/courses/?term=202001&crn="+newCrn);
          $('> .crnSeatInfo > .seatsRemaining',this).html(crnData.totalRemaining+" seats left");
          $('> .crnSeatInfo > .seatsDetail',this).html(crnData.totalRemaining+" of "+crnData.totalSeats+" seats remaining - "+ Math.round((1 - (crnData.totalRemaining / crnData.totalSeats))*100) +"% full" );

        }
        else{
          console.log("No crndata for "+newCrn);
          $('> .crnInfo > .courseLink',this).html("Invalid CRN");
          $('> .crnInfo',this).addClass('warning');
          $('> .crnSeatInfo',this).hide();
        }
      }
      else{
        $('> input',this).addClass("empty");
        $('> .crnInfo > .courseLink',this).html("")
      }
    }


  });
  appFillComplete = true;
  console.log("*** APP FILL COMPLETE ***");
}

$(document).ready(function(){
  $('body').on('click', 'a.openExternal', function(){
   chrome.tabs.create({url: $(this).attr('href')});
   return false;
  });

  $('.crnSeatInfo').each(function(){

  });

  $('.crnSeatInfo').on('click', function(){
    if(!$(this).attr("expanded")){
      $(this).siblings(":text").fadeOut(250);
      var currentElem = $(this);
      setTimeout(function(){
        currentElem.addClass("seatInfoExpanded");
      }, 275);

      $('> .seatsRemaining',this).fadeOut(500);
      $('> .seatsDetail',this).delay(500).fadeIn(500);
      $(this).attr("expanded","true");
    }
    else{
      $('> .seatsDetail',this).fadeOut(500);
      var currentElem = $(this);
      setTimeout(function(){
        currentElem.removeClass("seatInfoExpanded");
      }, 500);
      $('> .seatsRemaining',this).delay(750).fadeIn(500);
      $(this).siblings(":text").delay(750).fadeIn(250);
      $(this).removeAttr("expanded");
    }


  });



});

// When save is clicked on popup.html, collectData is called.
window.addEventListener('load', async function load(event){
    $("#testError").hide();

    var testError = await new Promise((resolve, reject)=>{
      chrome.storage.local.get(["testError"],function(result){
        console.log("testError contains "+result.testError);
        resolve(result.testError);
      })
    });

    if(testError){
      $("#testError").show();
    }


    fillData();
    setTimeout(function(){
      updateAllCrnInfo(false);
    }, 500);

    document.getElementById('dataForm').addEventListener('change', function() {
        collectData();
        updateAllCrnInfo(true);
    });

    document.getElementById('username').addEventListener('change', function() {
      console.log("USERNAME CHANGED!!")
      chrome.storage.local.set({'tested': false}); // mark as untested
      $(".hideBeforeTest").hide();
      $(".hideAfterTest").show();
      $("#test").val("Test Login");
      $("#test").removeClass("secondaryBtn");
      // $("#testError").hide();

    });
    document.getElementById('password').addEventListener('change', function() {
      console.log("PASSWORD CHANGED!!!")
      chrome.storage.local.set({'tested': false}); // mark as untested
      $(".hideBeforeTest").hide();
      $(".hideAfterTest").show();
      $("#test").val("Test Login");
      $("#test").removeClass("secondaryBtn");
        // $("#testError").hide();
    });

    var running = await new Promise((resolve, reject)=>{
      chrome.storage.local.get(["running"],function(result){
        resolve(result.running);
      })
    });

    var tested = await new Promise((resolve, reject)=>{
      chrome.storage.local.get(['tested'],function(result){
        resolve(result.tested);
      })
    });

    console.log("tested: ")
    console.log(tested);
    if(!tested || tested == undefined){
      $(".hideBeforeTest").hide();
      $("#test").val("Test Login");
      $("#test").removeClass("secondaryBtn");
    }
    else{
      $("#test").val("Test Login Again");
      $("#test").addClass("secondaryBtn");
      $(".hideAfterTest").hide();
    }

    if(running){
      beginCountdown();
      $("#dataForm").hide();
      $("#countDown").show();
    }
    else{
      $("#dataForm").show();
      $("#countDown").hide();
    }

    //listen for clicks on the "run" button
    var runButton = document.getElementById('run');
    runButton.addEventListener('click', event => {
      //when a click is detected, send a message to the background page
      console.log('sending click event to background page')
      ga('send', 'event', 'Button', 'click', 'Run');
      chrome.runtime.sendMessage({event: 'runClick'}, function(response){});

      chrome.storage.local.get(['time'], function(result) {
        var savedTime = result.time;
        console.log("Got "+savedTime)
        var output = [savedTime.slice(0, 1), ":", savedTime.slice(1)].join('');
        $("#countdownText").html("Registration will commence at "+output)
      });

      $("#dataForm").fadeOut(500);
      $("#countDown").delay(500).fadeIn(500);
      beginCountdown();
      chrome.storage.local.set({'running': true});
    });

    $("#cancelBtn").on('click', function(){
      chrome.storage.local.set({'running': false});
      $("#countDown").fadeOut(500);
      $("#dataForm").delay(500).fadeIn(500);
    });

    //listen for clicks on the "test" button
    var testButton = document.getElementById('test');
    testButton.addEventListener('click', event => {
      //when a click is detected, send a message to the background page
      console.log('sending click event to background page')
      chrome.runtime.sendMessage({event: 'testClick'}, function(response){

      });

      ga('send', 'event', 'Button', 'click', $("#test").val());


    });
});


//fillData fills the form with data previously saved by the user
function fillData(){
  // Store the data from each textbox
  var username = document.getElementById('username');
  var password = document.getElementById('password');
  var date = document.getElementById('reg_date'); // Date stored in format YYYY-MM-DD
  // Possible values for time: 600am, 630am, 700am
  var time = document.getElementById('reg_time');
  var crn_1a = document.getElementById('crn_1a');
  var crn_2a = document.getElementById('crn_2a');
  var crn_3a = document.getElementById('crn_3a');
  var crn_4a = document.getElementById('crn_4a');
  var crn_5a = document.getElementById('crn_5a');
  var crn_6a = document.getElementById('crn_6a');
  var crn_7a = document.getElementById('crn_7a');
  var crn_8a = document.getElementById('crn_8a');
  var crn_1b = document.getElementById('crn_1b');
  var crn_2b = document.getElementById('crn_2b');
  var crn_3b = document.getElementById('crn_3b');
  var crn_4b = document.getElementById('crn_4b');
  var crn_5b = document.getElementById('crn_5b');
  var crn_6b = document.getElementById('crn_6b');
  var crn_7b = document.getElementById('crn_7b');
  var crn_8b = document.getElementById('crn_8b');

  chrome.storage.local.get(['username'], function(result) { if (result.username){ username.value = result.username; }});
  chrome.storage.local.get(['password'], function(result) { if (result.password){ password.value = result.password; }});
  chrome.storage.local.get(['date'], function(result) { if (result.date){ date.value = result.date; }});
  chrome.storage.local.get(['time'], function(result) { if (result.time){ time.value = result.time; }});
  chrome.storage.local.get(['crn_1a'], function(result) { if (result.crn_1a){ console.log(result.crn_1a); crn_1a.value = result.crn_1a; }});
  chrome.storage.local.get(['crn_2a'], function(result) { if (result.crn_2a){ crn_2a.value = result.crn_2a; }});
  chrome.storage.local.get(['crn_3a'], function(result) { if (result.crn_3a){ crn_3a.value = result.crn_3a; }});
  chrome.storage.local.get(['crn_4a'], function(result) { if (result.crn_4a){ crn_4a.value = result.crn_4a; }});
  chrome.storage.local.get(['crn_5a'], function(result) { if (result.crn_5a){ crn_5a.value = result.crn_5a; }});
  chrome.storage.local.get(['crn_6a'], function(result) { if (result.crn_6a){ crn_6a.value = result.crn_6a; }});
  chrome.storage.local.get(['crn_7a'], function(result) { if (result.crn_7a){ crn_7a.value = result.crn_7a; }});
  chrome.storage.local.get(['crn_8a'], function(result) { if (result.crn_8a){ crn_8a.value = result.crn_8a; }});
  chrome.storage.local.get(['crn_1b'], function(result) { if (result.crn_1b){ crn_1b.value = result.crn_1b; }});
  chrome.storage.local.get(['crn_2b'], function(result) { if (result.crn_2b){ crn_2b.value = result.crn_2b; }});
  chrome.storage.local.get(['crn_3b'], function(result) { if (result.crn_3b){ crn_3b.value = result.crn_3b; }});
  chrome.storage.local.get(['crn_4b'], function(result) { if (result.crn_4b){ crn_4b.value = result.crn_4b; }});
  chrome.storage.local.get(['crn_5b'], function(result) { if (result.crn_5b){ crn_5b.value = result.crn_5b; }});
  chrome.storage.local.get(['crn_6b'], function(result) { if (result.crn_6b){ crn_6b.value = result.crn_6b; }});
  chrome.storage.local.get(['crn_7b'], function(result) { if (result.crn_7b){ crn_7b.value = result.crn_7b; }});
  chrome.storage.local.get(['crn_8b'], function(result) { if (result.crn_8b){ crn_8b.value = result.crn_8b; }});

}

// collectData retrieves the filled in text boxes from the HTML display and
// populate input.json with the data gathered.
function collectData() {
     console.log("collectData called.");

     // // Clear local storage
     // chrome.storage.local.clear(function() {
     //      var error = chrome.runtime.lastError;
     //      if (error) {
     //           console.error(error);
     //      }
     // });

     // Store the data from each textbox
     var username = document.getElementById('username').value;
     var password = document.getElementById('password').value;
     var date = document.getElementById('reg_date').value; // Date stored in format YYYY-MM-DD
     // Possible values for time: 600am, 630am, 700am
     var time = document.getElementById('reg_time').value;
     var crn_1a = document.getElementById('crn_1a').value;
     var crn_2a = document.getElementById('crn_2a').value;
     var crn_3a = document.getElementById('crn_3a').value;
     var crn_4a = document.getElementById('crn_4a').value;
     var crn_5a = document.getElementById('crn_5a').value;
     var crn_6a = document.getElementById('crn_6a').value;
     var crn_7a = document.getElementById('crn_7a').value;
     var crn_8a = document.getElementById('crn_8a').value;
     var crn_1b = document.getElementById('crn_1b').value;
     var crn_2b = document.getElementById('crn_2b').value;
     var crn_3b = document.getElementById('crn_3b').value;
     var crn_4b = document.getElementById('crn_4b').value;
     var crn_5b = document.getElementById('crn_5b').value;
     var crn_6b = document.getElementById('crn_6b').value;
     var crn_7b = document.getElementById('crn_7b').value;
     var crn_8b = document.getElementById('crn_8b').value;

     var crnData = [username, password, date, time,
                    crn_1a, crn_2a, crn_3a, crn_4a, crn_5a, crn_6a, crn_7a, crn_8a,
                    crn_1b, crn_2b, crn_3b, crn_4b, crn_5b, crn_6b, crn_7b, crn_8b];
     console.log(crnData); // Show the data for bug fixing

     var crnAB = [crn_1a, crn_2a, crn_3a, crn_4a, crn_5a, crn_6a, crn_7a, crn_8a,
                  crn_1b, crn_2b, crn_3b, crn_4b, crn_5b, crn_6b, crn_7b, crn_8b];

     chrome.storage.local.set({'crnAB': crnAB});

     chrome.storage.local.set({'username': username});
     chrome.storage.local.set({'password': password});
     chrome.storage.local.set({'date': date});
     chrome.storage.local.set({'time': time});
     chrome.storage.local.set({'crn_1a': crn_1a});
     chrome.storage.local.set({'crn_2a': crn_2a});
     chrome.storage.local.set({'crn_3a': crn_3a});
     chrome.storage.local.set({'crn_4a': crn_4a});
     chrome.storage.local.set({'crn_5a': crn_5a});
     chrome.storage.local.set({'crn_6a': crn_6a});
     chrome.storage.local.set({'crn_7a': crn_7a});
     chrome.storage.local.set({'crn_8a': crn_8a});
     chrome.storage.local.set({'crn_1b': crn_1b});
     chrome.storage.local.set({'crn_2b': crn_2b});
     chrome.storage.local.set({'crn_3b': crn_3b});
     chrome.storage.local.set({'crn_4b': crn_4b});
     chrome.storage.local.set({'crn_5b': crn_5b});
     chrome.storage.local.set({'crn_6b': crn_6b});
     chrome.storage.local.set({'crn_7b': crn_7b});
     chrome.storage.local.set({'crn_8b': crn_8b});
}
