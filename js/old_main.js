var directionsDisplay;
var directionsService;
var map;

/**
 * Initializes map object and attaches functions
 */
function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(41.937871, -87.653911), // my apt
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.HYBRID
  };

  map = new google.maps.Map($('#map_canvas')[0], mapOptions);
  
  directionsDisplay = new google.maps.DirectionsRenderer();
  directionsService = new google.maps.DirectionsService();
  directionsDisplay.setMap(map);

  var marker = new google.maps.Marker({
    position: map.getCenter(),
    map: map, // render immediately
    title: 'Hello!'
  });

  var transitLayer = new google.maps.TransitLayer();
	transitLayer.setMap(map);
};

/**
 * Calculate and display route
 */
function calcRoute() {
	var start = $('#start').val();
	var stop = $('#stop').val();
	var request = {
    origin: start,
    destination: stop,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
    } else {
    	alert('Fail :(');
    }
  });
}

/**
 * Attach a popup to a marker when clicked
 */
function attachMessage(marker, theMessage) {
	var message = theMessage;
	var infowindow = new google.maps.InfoWindow(
	  { content: message,
  	  size: new google.maps.Size(1,1)
  	});
	google.maps.event.addListener(marker, 'click', function() {
  	infowindow.open(map, marker);
  	marker.setAnimation(google.maps.Animation.BOUNCE);
  	setTimeout(function() { marker.setAnimation(null); }, 2150);
	});
};

/**
 * Load script after rest of page loaded
 */
function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyC6LAzdvnuFGZ3bIt6zTjGaHsGcA0_6JWM&sensor=false&callback=initialize";
  document.body.appendChild(script);
};

/**
 * Run on page load
 */
$(function() {
	loadScript();
})