/**
 * Route Finder module
 */
var routeFinder = function() {
  
  var self = {};

  // Build module core
  // params (as dict): mapId, origId, destId, alertBoxId
  var init = function(options) {
    var mapOptions = {
      center : new google.maps.LatLng(41.937871, -87.653911),
      zoom : 15,
      mapTypeId : google.maps.MapTypeId.HYBRID
    };
    // maybe try $.extend({OPTIONS : HERE}, options); and set some defaults
    // instead of self.whatever = whatever_else;
    self.orig = $('#'+options['origId']);
    self.dest = $('#'+options['destId']);
    self.alertBox = $('#'+options['alertBoxId']);
    self.map = new google.maps.Map($('#'+options['mapId'])[0], mapOptions);
    self.directionsService = new google.maps.DirectionsService();
    self.transitLayer = new google.maps.TransitLayer();
    self.directionsDisplay = new google.maps.DirectionsRenderer();
    self.directions = [];
    self.searchRadius = 500;
    self.numSearches = 15;
    self.transitMode = google.maps.TravelMode.WALKING
    self.directionsDisplay.setMap(self.map);
    self.transitLayer.setMap(self.map);
    return self;
  }

  self.calcRoute = function() {
    self.getDirections(self.orig.val(), self.dest.val());
  }

  self.getDirections = function(start, stop) {
    if(start && stop) {
      self.directionsService.route({
        origin : start,
        destination : stop,
        travelMode : self.transitMode
      }, function(result, status) {
        if(status == google.maps.DirectionsStatus.OK) {
          var distance = result['routes'][0]['legs'][0]['distance']['value'];
          self.setSearchRadius(self.numSearches, distance);
          if(self.searchRadius > 50000) {
            showAlert(self.alertBox, "<strong>Sorry!</strong> Your route is too long.", "alert-error");
          } else {
            self.directionsDisplay.setDirections(result);
            self.directions = result['routes'][0]['overview_path'];
            self.showDirectionsMarkers(); // debug only
          }
        } else {
          showAlert(self.alertBox, "<strong>Sorry!</strong> I can't find a route.", "alert-error");
        }
      });
    }
  }

  self.findCorners = function(path) {
    path = path || self.directions;
    
    var curHeading = google.maps.geometry.spherical.computeHeading(path[0], path[1]);
    console.log('***FINDING CORNERS***');
    console.log('Initial heading (0->1): '+curHeading);
    self.corners = [];
    for(i=1; i<path.length-1; i++) {
      var newHeading = google.maps.geometry.spherical.computeHeading(path[i], path[i+1]);
      var delta = Math.min(Math.abs(newHeading-curHeading),Math.abs(360-newHeading+curHeading),Math.abs(360-curHeading+newHeading));
      curHeading = newHeading;
      console.log('New heading ('+i+'->'+(i+1)+'): '+newHeading+' (del='+delta+')');
      if(delta > 35) {
        self.corners.push(i);
        console.log('Corner found at '+i);
      }
    }
  }

  // Determine size of search circles
  self.setSearchRadius = function(numSearches, distance) {
    console.log("ROUTE DISTANCE: "+distance);
    var newRadius = Math.floor(distance/numSearches);
    self.searchRadius = Math.max(newRadius, 500); // 500 seems the best minimum
  }

// THESE NEED TO BE REFACTORED OUT OF THE MODULE

  // Transit option button handler
  // Recalculates route (for convenience)
  self.setTransitModeButtons = function(btnContainer, btnId) {
    self.transitMode = google.maps.TravelMode[btnId];
    btnContainer.children().removeClass('btn-info');
    btnContainer.children('#'+btnId).addClass('btn-info');
    self.calcRoute();
  }

  // Helper function to show alerts briefly
  var pendingTimeouts = [];
  function showAlert(element, message, typeClass) { // alert-success, -failure, -info
    for(var i=0; i<pendingTimeouts.length; i++) {
      clearTimeout(pendingTimeouts[i]);
    }
    element.css('display', 'none');
    element.addClass(typeClass);
    element.html(message);
    element.fadeIn(100);
    pendingTimeouts.push(setTimeout(function() { element.fadeOut(100); }, 2000));
  }

  self.markers = new Array();
  self.showDirectionsMarkers = function() {
    for(var i=0; i<self.markers.length; i++) { self.markers[i].setMap(null); }
    self.markers = new Array();
    for(var i=0; i<self.directions.length; i++) {
      self.markers.push(new google.maps.Marker({
        position: self.directions[i],
        map: self.map,
        title: ''+i
      }));
      self.attachMessage(self.markers[i], '#'+i);
    }
  }

  self.attachMessage = function(marker, theMessage) {
    var message = theMessage;
    var infowindow = new google.maps.InfoWindow(
      { content: message,
        size: new google.maps.Size(1,1)
      });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(self.map, marker);
    });
  };
// --END BAD METHODS--

  return {init: init};
};
