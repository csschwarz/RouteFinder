/**
 * TODO
 * 1) Fix fillGaps to deal with condition where no points left between search points
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
    self.alertBox = $('#'+options['alertBoxId']);
    self.map = new google.maps.Map(options['map'][0], mapOptions);
    self.directionsService = new google.maps.DirectionsService();
    self.placesService = new google.maps.places.PlacesService(self.map);
    self.transitLayer = new google.maps.TransitLayer();
    self.directionsDisplay = new google.maps.DirectionsRenderer();
    self.directions = [];
    self.searchResults = [];
    self.searchRadius = 450;
    self.numSearches = 20;
    self.tolerance = 0.005;
    self.directionsDisplay.setMap(self.map);
    self.transitLayer.setMap(self.map);
    return self;
  }

  self.calcRoute = function(start, stop, travelMode, searchTerm) {
    if(start && stop) {
      self.directionsService.route({
        origin : start,
        destination : stop,
        travelMode : travelMode
      }, function(result, status) {
        if(status == google.maps.DirectionsStatus.OK) {
          var distance = result['routes'][0]['legs'][0]['distance']['value'];
          self.setSearchRadius(self.numSearches, distance);
          if(self.searchRadius > 50000) { // max allowed google places search radius
            showAlert(self.alertBox, "<strong>Sorry!</strong> Your route is too long.", "alert-error");
          } else {
            self.directionsDisplay.setDirections(result);
            self.directions = result['routes'][0]['overview_path'];
            self.showDirectionsMarkers(); // debug only
            var searchPoints = self.determineSearchPoints(self.directions);
            self.searchPlaces(searchTerm, self.directions, searchPoints);
          }
        } else {
          showAlert(self.alertBox, "<strong>Sorry!</strong> I can't find a route.", "alert-error");
        }
      });
    }
  }

  self.findCorners = function(path) {
    var curHeading = google.maps.geometry.spherical.computeHeading(path[0], path[1]);
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
    return corners;
  }

  self.determineSearchPoints = function(path) {
    console.log('***DETERMINING SEARCH POINTS***');
    console.log('search radius: '+self.searchRadius);
    var minDist = self.searchRadius / 1.25;
    var maxDist = (self.searchRadius * 2) - 0.1 * self.searchRadius;
    console.log('(min, max): ('+minDist+', '+maxDist+')');

    console.log('***FINDING CORNERS***');
    var corners = self.findCorners(path);
    console.log('...done.');

    var result = [];
    result.push(0);
    
    console.log('***ADDING CORNERS***');
    result = addCorners(path, result, corners, minDist);
    console.log('...done.');

    result.push(path.length-1); // Need an endpoint, else we might miss the end of the route

    console.log('***FILLING IN GAPS***');
    result = fillGaps(path, result, maxDist);
    console.log('...done.');

    console.log('***SEARCH POINTS DETERMINED***');
    console.log(result.toString());
    self.totalSearchPoints = result.length;
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

  // THIS IS AWFUL FIX IT TIMEOUTS SUCK USE THE ACTUAL JSON PLACES API INSTEAD!!!
  self.searchPlaces = function(searchTerm, path, searchPoints) {
    searchPoints = searchPoints.reverse(); // makes resulting list (a little) better
    self.searchesComplete = 0;
    for(var i=0; i<5 && searchPoints.length; i++) {
      var request = {
        location : path[searchPoints.pop()],
        radius : self.searchRadius,
        keyword : searchTerm
      };
      self.placesService.nearbySearch(request, handlePlacesResults);
    }
    self.tempSearchInfo = [searchTerm, path, searchPoints];
  }

  // SAME AS SELF.SEARCHPLACES!!!
  function handlePlacesResults(results, status) {
    self.searchesComplete++;
    self.totalSearchPoints--;
    if(status == google.maps.places.PlacesServiceStatus.OK) {
      self.searchResults = addUniquePlaces(results);
      console.log(self.searchResults.length);
    } else {
      console.log("Places search failed! Status: "+status.toString());
      throw "Place search failed!";
    }
    if(self.searchesComplete == 5) {
      console.log("Waiting 1s...");
      setTimeout(function() { 
        self.searchPlaces(self.tempSearchInfo[0], self.tempSearchInfo[1], self.tempSearchInfo[2].reverse()); 
      }, 1000);
      self.searchesComplete = 0;
    }
    if(!self.totalSearchPoints) {
      console.log('All places found.');
      narrowResults(self.tempSearchInfo[1], self.tolerance);
      renderPlacesMarkers();
    }
  }

  function addUniquePlaces(results) {
    var set = {};
    for(var i=0; i<self.searchResults.length; i++) {
      set[self.searchResults[i]['name']] = self.searchResults[i];
    }
    for(var i=0; i<results.length; i++) {
      set[results[i]['name']] = results[i];
    }
    var places = [];
    for(var place in set) {
      places.push(set[place]);
    }
    return places;
  }

  function narrowResults(path, tolerance) {
    places = [];
    for(var i=0; i<self.searchResults.length; i++) {
      var location = self.searchResults[i].geometry.location;
      var pathPolyLine = new google.maps.Polyline();
      pathPolyLine.setPath(path);
      var isNearPath = google.maps.geometry.poly.isLocationOnEdge(location, pathPolyLine, tolerance);
      if(isNearPath) {
        places.push(self.searchResults[i]);
      }
    }
    console.log(places.length+' of '+self.searchResults.length+' places are near route.');
    self.chosenLocations = places;
  }

  // Determine size of search circles
  self.setSearchRadius = function(numSearches, distance) {
    console.log("ROUTE DISTANCE: "+distance);
    var newRadius = Math.floor(distance/numSearches);
    self.searchRadius = Math.max(newRadius, 450); // 450 seems the best minimum
  }

  self.placesMarkers = [];
  function renderPlacesMarkers() {
    for(var i=0; i<self.placesMarkers.length; i++) { self.placesMarkers[i].setMap(null); }
    self.placesMarkers = [];
    for(var i=0; i<self.chosenLocations.length; i++) {
      self.placesMarkers.push(new google.maps.Marker({
        position: self.chosenLocations[i].geometry.location,
        map: self.map,
        title: self.searchResults[i].name
      }));
    }
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
        title: ''+i,
        visible: false
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
//

// THESE NEED TO BE REFACTORED OUT OF THE MODULE

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
