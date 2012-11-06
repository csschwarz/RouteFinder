var mapModule;
var mapOptions = {
  mapId : 'map_canvas',
  origId : 'start',
  destId : 'stop',
  alertBoxId : 'searchAlert'
};

// Load script
function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyC6LAzdvnuFGZ3bIt6zTjGaHsGcA0_6JWM&sensor=false&callback=setup";
  document.body.appendChild(script);
};

// Setup--callback for loadScript
function setup() {
  mapModule = routeFinder().init(mapOptions);
};

// Run on page ready
$(function() {
	loadScript();
  $('#search').click(function() {
    mapModule.calcRoute();
  });
  $('#transitMode').children().click(function(event) {
    mapModule.setTransitModeButtons($('#transitMode'), $(this).attr('id'));
  })
});