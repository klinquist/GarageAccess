var sys = require('util'),
    rest = require('restler');
    
var listenport = 8999;   										

var express = require('express');
var twilio = require('twilio');
var client = new twilio.RestClient('TWILIO_CLIENT', 'TWILIO_SECRET');
var app = express();
app.use(express.bodyParser());
var fullname = "";
var usergroup = "";

 
function formatnumber(phno)
{
	phno = phno.replace(/\-/g, '');
	phno = phno.replace(/\(/g, '');
	phno = phno.replace(/\)/g, '');
	phno = phno.replace(/\s/g, '');
	phno = phno.replace(/\./g, '');	
	if ((phno.substring(0, 1) != "1") && (phno.substring(0, 1) != "+")) { phno = "1" + phno;}
	if (phno.substring(0, 1) != "+") { phno = "+" + phno; }
	return phno;
} 

function garagestatus(callback)
{   

	rest.get('https://graph.api.smartthings.com/api/devices/garage_sensor_device_id', {
	  	username: 'smartthings@email.com',
	  	password: 'smartthings_password'
	  }).once('complete', function(data) {
		  for (i = 0;i < data.device.currentStates.length; i++){
			  	if (data.device.currentStates[i].name == "contact") { callback(data.device.currentStates[i].value); }
		  }
	});
}
    

function pushbutton()
{
	rest.put('https://graph.api.smartthings.com/api/smartapps/installations/smart_app_id/switches/garage_relay_id', {
	  username: 'smartthings@email.com',
	  password: 'smartthings_password',
	  headers: {'Content-Type': 'application/json'},
	  data: '{command: on}'
	}).once('complete', function(data) {
	  console.log(data);
	});
}


app.post('/twilioSMS', function(req, res){ 
		try {
			console.log("upper case " + req.body.Body.toUpperCase());
			if (req.body.Body.toUpperCase() == "OPEN GARAGE"){
				
				
				rest.post('https://accounts.google.com/o/oauth2/token', {
						data: {
							'client_id': 'google_client_id',
							'client_secret': 'google_client_secret',
							'refresh_token': 'google_refresh_token',
							'grant_type': 'refresh_token'
						}  	
						  	
						}).once('complete', function(data) {
						  	rest.get('https://www.google.com/m8/feeds/contacts/default/thin?alt=json&max-results=2000', {
						  	headers:  {'Authorization': 'OAuth ' + data.access_token}
						  }).once('complete', function(contacts) {
						  	  
						  	  
						  	  	for (i=0; i < contacts.feed.entry.length; i++){
									if (contacts.feed.entry[i].gd$phoneNumber){
										//console.log(data.feed.entry[i].gd$phoneNumber);
										for (p=0; p < contacts.feed.entry[i].gd$phoneNumber.length; p++){
											if (req.body.From == formatnumber(contacts.feed.entry[i].gd$phoneNumber[p].$t))
											{
												var fullname = contacts.feed.entry[i].title.$t;
												if (contacts.feed.entry[i].gContact$groupMembershipInfo){
													for (g=0; g < contacts.feed.entry[i].gContact$groupMembershipInfo.length; g++){
														if ((contacts.feed.entry[i].gContact$groupMembershipInfo[g].deleted == "false") && (contacts.feed.entry[i].gContact$groupMembershipInfo[g].href.indexOf("garageaccess_contact_group_id"))) {
															usergroup = "garage";
														}
													}
												}
											}
										}
									}
								}
						  	  
						  	  console.log ("name: " + fullname + " group: " + usergroup);
						  	  

						  	  if (usergroup == ""){
							  	  console.log("sending msg to " + req.body.To);
							  	  client.sendSms({
								    to: req.body.From,
								    from: req.body.To,
								    body:'Sorry ' + fullname + ' but you are not authorized to perform this action.'
								    }, function(error, message) { if (!error) {
								        console.log('Success! The SID for this SMS message is:' + message.sid);
								    } else {
								        console.log('There was an error sending SMS.');
								    }
								  });
								
							  	  client.sendSms({
								    to: '+1408MYPHONE',
								    from: req.body.To,
								    body: fullname + ' tried to open the garage. I said no.'
								    }, function(error, message) { if (!error) {
								        console.log('Success! The SID for this SMS message is:' + message.sid);
								    } else {
								        console.log('There was an error sending SMS.');
								    }
								  });
						  	  }	
						  	  
						  	  
						  	  if (usergroup == "garage"){	
							  	  client.sendSms({
								    to: req.body.From,
								    from: req.body.To,
								    body:'Welcome to the geekflat, ' + fullname + '. Reply with \'close garage\' to close.'
								    }, function(error, message) { if (!error) {
								        console.log('Success! The SID for this SMS message is:' + message.sid);
								    } else {
								        console.log('There was an error sending SMS.');
								    }
								  });
								
							  	  client.sendSms({
								    to: '+1408MYPHONE',
								    from: req.body.To,
								    body: fullname + ' just opened the garage.'
								    }, function(error, message) { if (!error) {
								        console.log('Success! The SID for this SMS message is:' + message.sid);
								    } else {
								        console.log('There was an error sending SMS.');
								    }
								  });
								  
								  garagestatus(function(status) {
									  if (status == "closed"){
										  console.log("current status: " + status);
										  pushbutton();
									  }
								  });
						  	  				  	  
						  	  }
						  	  
						  	  var fullname = "";
						  	  var usergroup = "";
						  	  
						  });		
						});
				
				
				
				
			}
			
			if (req.body.Body.toUpperCase() == "CLOSE GARAGE"){
							  	  client.sendSms({
								    to: req.body.From,
								    from: req.body.To,
								    body: 'Thank you!'
								    }, function(error, message) { if (!error) {
								        console.log('Success! The SID for this SMS message is:' + message.sid);
								    } else {
								        console.log('There was an error sending SMS.');
								    }
								  });
								
							  	  client.sendSms({
								    to: '+1408MYPHONE',
								    from: req.body.To,
								    body: 'The garage has been closed'
								    }, function(error, message) { if (!error) {
								        console.log('Success! The SID for this SMS message is:' + message.sid);
								    } else {
								        console.log('There was an error sending SMS.');
								    }
								  });
								  
								  garagestatus(function(status) {
									  if (status == "open"){
										  console.log("current status: " + status);
										  pushbutton();
									  }
								  });
			
			}
			
			

		} catch (e) {
			// An error has occured, handle it, by e.g. logging it
	  	console.log("Error.  Likely caused by an invalid POST from " + req.connection.remoteAddress + ":");
	  	console.log(e);
	  	res.end();
	  }

  
});


app.post('/twilioVoice', function(req, res){ 
	
		try {
			res.send('<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say voice=\"woman\">If you would like to be transferred to the resident of this property, please hold. Otherwise, hang up.</Say><Pause length=\"5\"/><Say voice=\"woman\">Transferring you now.  One moment.</Say><Dial>408-XXX-XXXX</Dial></Response>');

		} catch (e) {
			// An error has occured, handle it, by e.g. logging it
	  	console.log("Error.  Likely caused by an invalid POST from " + req.connection.remoteAddress + ":");
	  	console.log(e);
	  	res.end();
	   }

  
});

app.listen(listenport);




















