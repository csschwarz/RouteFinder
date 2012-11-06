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
    self.btnMappings = {
      transitBtn : google.maps.TravelMode.TRANSIT,
      walkBtn : google.maps.TravelMode.WALKING,
      bikeBtn : google.maps.TravelMode.BICYCLING,
      driveBtn : google.maps.TravelMode.DRIVING
    };
    self.orig = $('#'+options['origId']),
    self.dest = $('#'+options['destId']),
    self.alertBox = $('#'+options['alertBoxId']),
    self.map = new google.maps.Map($('#'+options['mapId'])[0], mapOptions),
    self.directionsService = new google.maps.DirectionsService(),
    self.transitLayer = new google.maps.TransitLayer(),
    self.directionsDisplay = new google.maps.DirectionsRenderer(),
    self.directions = [];
    self.searchRadius = 500,
    self.numSearches = 15,
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
          self.directionsDisplay.setDirections(result);
          self.directions = result['routes'][0]['overview_path'];
        } else {
          showAlert(self.alertBox, "<strong>Sorry!</strong> I can't find a route.", "alert-error");
        }
      });
    }
  }

  // Transit option button handler
  // Recalculates route (for convenience)
  self.setTransitModeButtons = function(btnContainer, btnId) {
    self.transitMode = self.btnMappings[btnId];
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

  return {init: init};
};


/*
    //
    // Calculate and display a route if fields filled in
    // 
    self.calcRoute = function() {
      var start = self.orig.val();
      var stop = self.dest.val();
      if(start != '' && stop != '') {
        var request = {
          origin: start,
          destination: stop,
          travelMode: self.transitMode
        };
        self.directionsService.route(request, function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            self.directionsDisplay.setDirections(result);
            self.directions = result;
            self.setSearchRadius(self.numSearches);
            if(self.searchRadius > 50000) {
              showAlert(self.alertBox, "<strong>Sorry!</strong> Your route is too long.", "alert-error");
            } else {
              self.showDirectionsMarkers(self.directions['routes'][0]);
            }
          } else {
            showAlert(self.alertBox, "<strong>Sorry!</strong> I can't find a route.", "alert-error");
          }
        });
      }
    }

    //
    // Determine size of search circles
    //
    self.setSearchRadius = function(numSearches) {
      var distance = self.directions['routes'][0]['legs'][0]['distance']['value'];
      console.log("ROUTE DISTANCE: "+distance);
      var newRadius = Math.floor(distance/numSearches);
      self.searchRadius = Math.max(newRadius, 500); // 500 seems the best minimum
    }


    //****************** DEBUG METHOD ********************
    // Show a marker for each point on directions route
    // Show a circle for each search point
    // (clear old stuff first)
    self.markers = new Array();
    self.circles = new Array();
    self.showDirectionsMarkers = function(resultPath) {
      for(var i=0; i<self.markers.length; i++) { self.markers[i].setMap(null); }
      self.markers = new Array();
      for(var i=0; i<self.circles.length; i++) { self.circles[i].setMap(null); }
      self.circles = new Array();

      var route = resultPath; // One route by default, though could have more
      var path = route['overview_path'];
      
      for(var i=0; i<path.length; i++) {
        self.markers.push(new google.maps.Marker({
          position: path[i],
          map: self.map,
          title: ''+i
        }));
        self.attachMessage(self.markers[i], '#'+i);
      }
    }

    // Attach a popup to a marker when clicked
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

    return {initialize: initialize};
};



// Converts numeric degrees to radians 
if (typeof Number.prototype.toRad == 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}
*/
