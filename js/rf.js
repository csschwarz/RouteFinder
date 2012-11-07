/**
 * TODO
 * 1) Remove jQuery dependency (all page interaction should be outside this module)
 * 2) Fix fillGaps to deal with condition where no points left between search points
 *    that are too far apart
 */

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
    self.searchRadius = 450;
    self.numSearches = 20;
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
    var curHeading = google.maps.geometry.spherical.computeHeading(path[0], path[1]);
    console.log('***FINDING CORNERS***');
    console.log('Initial heading (0->1): '+curHeading);
    var corners = [];
    for(i=1; i<path.length-1; i++) {
      var newHeading = google.maps.geometry.spherical.computeHeading(path[i], path[i+1]);
      var delta = Math.min(Math.abs(newHeading-curHeading),Math.abs(360-newHeading+curHeading),Math.abs(360-curHeading+newHeading));
      curHeading = newHeading;
      console.log('New heading ('+i+'->'+(i+1)+'): '+newHeading+' (del='+delta+')');
      if(delta > 35) { // 35 deg threshold
        corners.push(i);
        console.log('Corner found at '+i);
      }
    }
    console.log('***CORNERS FOUND***');
    return corners;
  }

  self.determineSearchPoints = function(path) {
    console.log('***DETERMINING SEARCH POINTS***');
    console.log(self.searchRadius);
    var minDist = self.searchRadius / 1.25;
    var maxDist = (self.searchRadius * 2) - 0.1 * self.searchRadius;
    console.log('(min, max): ('+minDist+', '+maxDist+')');
    var corners = self.findCorners(path);
    var result = [];
    result.push(0);
    
    console.log('Adding corners...');
    result = addCorners(path, result, corners, minDist);
    console.log('...done.');

    result.push(path.length-1); // Need an endpoint, else we might miss the end of the route

    console.log('Filling in gaps...');
    result = fillGaps(path, result, maxDist);
    console.log('...done.');

    console.log('***SEARCH POINTS DETERMINED***');
    console.log(result.toString());
    return result;
  }

  function addCorners(path, searchPoints, corners, minDist) {
    for(i=0; i<corners.length; i++) {
      var distance = google.maps.geometry.spherical.computeDistanceBetween(path[corners[i]], path[searchPoints.slice(-1)[0]]);
      console.log(i+'->'+(i+1)+' distance: '+distance);
      if(distance > minDist) {
        searchPoints.push(corners[i]);
        console.log(i+' added');
      }
    }
    return searchPoints;
  }

  // Algorithm: 1) Look for gaps between consecutive points, 2) Add search point closest to middle of gap,
  // 3) If any points were added, repeat.
  // Naively protected against "large gap & no points left" scenario (will simply skip gap)
  function fillGaps(path, searchPoints, maxDist) {
    var repeat = false, addedSearchPoints = [];
    for(i=0; i<searchPoints.length-1; i++) {
      var distance = google.maps.geometry.spherical.computeDistanceBetween(path[searchPoints[i]], path[searchPoints[i+1]]);
      console.log(i+'->'+(i+1)+' distance: '+distance);
      if(distance > maxDist && searchPoints[i+1]-searchPoints[i] > 1) {
        repeat = true;
        var bestFiller = 0, bestDiff = distance, lb = searchPoints[i], ub = searchPoints[i+1];
        for(j=lb; j<ub; j++) {
          var d1 = google.maps.geometry.spherical.computeDistanceBetween(path[lb], path[j]);
          var d2 = google.maps.geometry.spherical.computeDistanceBetween(path[j], path[ub]);
          if(Math.abs(d1-d2) < bestDiff) {
            bestDiff = Math.abs(d1-d2);
            bestFiller = j;
          }
        }
        addedSearchPoints.push(bestFiller);
        console.log(bestFiller+' added to fill gap');
      }
    }
    searchPoints = searchPoints.concat(addedSearchPoints).sort(function(x, y) { return x-y; });
    if(repeat) {
      console.log('Need to rescan...')
      searchPoints = fillGaps(path, searchPoints, maxDist);
    }
    return searchPoints;
  }

  // Determine size of search circles
  self.setSearchRadius = function(numSearches, distance) {
    console.log("ROUTE DISTANCE: "+distance);
    var newRadius = Math.floor(distance/numSearches);
    self.searchRadius = Math.max(newRadius, 450); // 450 seems the best minimum
  }

// DEBUG METHODS
  self.markers = [];
  self.circles = [];
  self.showDirectionsMarkers = function() {
    for(var i=0; i<self.markers.length; i++) { self.markers[i].setMap(null); }
    self.markers = [];
    for(var i=0; i<self.circles.length; i++) { self.circles[i].setMap(null); }
    self.circles = [];
    for(var i=0; i<self.directions.length; i++) {
      self.markers.push(new google.maps.Marker({
        position: self.directions[i],
        map: self.map,
        title: ''+i
      }));
      self.attachMessage(self.markers[i], '#'+i);
    }
    var searchPoints = self.determineSearchPoints(self.directions);
    for(var i=0; i<searchPoints.length; i++) {
      self.circles.push(new google.maps.Circle({
        strokeColor: "#0000FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#0000FF",
        fillOpacity: 0.2,
        map: self.map,
        center: self.directions[searchPoints[i]],
        radius: self.searchRadius
      }));
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
// --END DEBUG METHODS

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
// --END BAD METHODS--

  return {init: init};
};
