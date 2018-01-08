var MappingAPI = MappingAPI || {};

MappingAPI.GoogleMaps = function($pSelector, pAPIKey, pCenter) {
    this.Constants = {
        Events: {
               BOUNDS_CHANGED: 'bounds_changed',
               CENTER_CHANGED: 'center_changed',
               CLICK: 'click',
               DBLCLICK: 'dblclick',
               DRAG: 'drag',
               DRAGEND: 'dragend',
               DRAGSTART: 'dragstart',
               HEADING_CHANGED: 'heading_changed',
               IDLE: 'idle',
               MAPTYPE_CHANGED: 'maptypeid_changed',
               MOSEMOVE: 'mousemove',
               MOSEOUT: 'mouseout',
               MOUSEOVER: 'mouseover',
               PROJECTION_CHANGED: 'projection_changed',
               RESIZE: 'resize',
               RIGHT_CLICK: 'rightclick',
               TILES_LOADED: 'tilesloaded',
               TILT_CHANGED: 'tilt_changed',
               ZOOM_CHANGED: 'zoom_changed'
        },
        Animation: {
            BOUNCE: google.maps.Animation.BOUNCE,
            DROP: google.maps.Animation.DROP
        },
        MapType: {
            HYBRID: google.maps.MapTypeId.HYBRID,
            ROADMAP: google.maps.MapTypeId.ROADMAP,
            SATELLITE: google.maps.MapTypeId.SATELLITE,
            TERRAIN: google.maps.MapTypeId.TERRAIN
        }
    };

    var height = $(window).height();
    var oMapStyle = {
        'height': height,
        'width': '100%'
    };
    var oCenter = new google.maps.LatLng(pCenter.Latitude, pCenter.Longitude); 

    $pSelector.css(oMapStyle);

    this.API_KEY = pAPIKey;

    this.map = new google.maps.Map($pSelector[0], {
        center: oCenter,
        zoom:   MappingAPI.Constants.DEFAULT_ZOOM,
        maxZoom: MappingAPI.Constants.MAX_ZOOM,
        minZoom: MappingAPI.Constants.MIN_ZOOM,
        mapTypeId: this.Constants.MapType.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });

    this.infoWindow = new google.maps.InfoWindow();
    this.directions = new google.maps.DirectionsService();
    this.geocoding =  new google.maps.Geocoder();

    this.ZoomToMarkerHandler = function(pMarker, pToolTip) {
        this.map.setZoom(MappingAPI.Constants.MAX_ZOOM);
        this.map.setCenter(pMarker.getPosition());
        this.infoWindow.setContent(pToolTip);
        this.infoWindow.open(this.map, pMarker);
    };

    this.CustomControlZoomToMarker = function(pMarker) {
        this.map.setZoom(MappingAPI.Constants.MAX_ZOOM);
        this.map.setCenter(pMarker.getPosition());
        this.infoWindow.setContent(pMarker.tooltip);
        this.infoWindow.open(this.map, pMarker);
    };

    this.TooltipHandler = function(pMarker, pToolTip) {
        this.infoWindow.setContent(pToolTip);
        this.infoWindow.open(this.map, pMarker);
    };

};

MappingAPI.GoogleMaps.prototype.fitBounds = function(pBounds) {
    this.map.fitBounds(pBounds);
};

MappingAPI.GoogleMaps.prototype.setZoom = function(pZoom) {
    this.map.setZoom(pZoom);
};

MappingAPI.GoogleMaps.prototype.initRoute = function(pOptions) {
    return new google.maps.DirectionsRenderer(pOptions);
};

MappingAPI.GoogleMaps.prototype.getIcon = function(pPath, pWidth, pHeight) {
    return {
        url: pPath,
        size: new google.maps.Size(pWidth, pHeight)
    }
};

MappingAPI.GoogleMaps.prototype.getMarker = function(pId, pLat, pLng, pZindex, pIcon, pTitle, pTooltip, pDraggable) {
    return new google.maps.Marker({
        id: pId,
        position: new google.maps.LatLng(pLat, pLng),
        zIndex: pZindex,
        icon: pIcon,
        title: pTitle,
        tooltip: pTooltip,
        draggable: pDraggable
    });
};

MappingAPI.GoogleMaps.prototype.getBounds = function(pUpperLeft, pLowerRight) {
    return new google.maps.LatLngBounds(
        new google.maps.LatLng(pUpperLeft.Latitude, pUpperLeft.Longitude),
        new google.maps.LatLng(pLowerRight.Latitude, pLowerRight.Longitude)
    );
};

MappingAPI.GoogleMaps.prototype.getLatLng = function(pLat, pLng) {
    return new google.maps.LatLng(pLat, pLng);
};

MappingAPI.GoogleMaps.prototype.getDistance = function(pPointA, pPointB) {
    return google.maps.geometry.spherical.computeDistanceBetween(pPointA, pPointB);
};

MappingAPI.GoogleMaps.prototype.addEventHandler = function(pObject, pEventType, pCallback) {
    pObject.addListener(pEventType, pCallback);
};

MappingAPI.GoogleMaps.prototype.addAnimation = function(pObject, pAnimationType) {
    pObject.setAnimation(pAnimationType);
};

MappingAPI.GoogleMaps.prototype.batchGeoCode = function(pAddresses, pCallback) {
    var byRef = {
        dicGeolocations: [],
        aryResults: []
    };
    var geocodeCallback = function(results, status) {
        if (status == 'OK') {
            var kvp = {};
            kvp.Key = results[0].formatted_address;
            kvp.Value = results[0].geometry.location.lat() + "|" + results[0].geometry.location.lng();
            byRef.dicGeolocations.push(kvp);
            byRef.aryResults.push(true);
        }else {
            byRef.aryResults.push(false);
        }
        if(byRef.aryResults.length > 0 && byRef.aryResults.length === pAddresses.length) {       
            pCallback(byRef.dicGeolocations);
        }
    }

    for (var i = 0; i < pAddresses.length; i++) {
        this.geocoding.geocode({address: pAddresses[i]}, geocodeCallback);
    }
};

MappingAPI.GoogleMaps.prototype.geoCode = function(pAddress, pCallback) {
    var geocodeCallback = function(results, status) {
        var dicGeolocations = [];       
        if (status == 'OK') {
            var kvp = {};
            kvp.Key = results[0].formatted_address;
            kvp.Value = results[0].geometry.location.lat() + "|" + results[0].geometry.location.lng();
            dicGeolocations.push(kvp);
        }
     
        pCallback(dicGeolocations);
    }

    this.geocoding.geocode({address: pAddress}, geocodeCallback);
};


MappingAPI.GoogleMaps.prototype.calculateRoute = function(pCoordOne, pCoordTwo, pCallback, pOptions) {
    var directionsCallback = function(result, status) {
        if (status == 'OK') {
            pCallback(result);
        }
    }

    this.directions.route({
       origin: pCoordOne,
       destination: pCoordTwo,
       travelMode: 'DRIVING',
       avoidTolls: true,
       drivingOptions: {trafficModel: 'pessimistic', departureTime: new Date(Date.now())}
    }, directionsCallback);

};

MappingAPI.GoogleMaps.prototype.initLayerGroup = function(pLayerGroup, pProp) {
    if(pLayerGroup[pProp] === null) {
        pLayerGroup[pProp] = [];   
    }
};

MappingAPI.GoogleMaps.prototype.addLayer = function(pLayerGroup, pProp, pLayer, pOptions) {
    pLayerGroup[pProp].push(pLayer);
};

MappingAPI.GoogleMaps.prototype.removeLayers = function(pLayerGroup, pProp) {
    for (var i = 0; i < pLayerGroup[pProp].length; i++) {
        pLayerGroup[pProp][i].setMap(null);
    }
    pLayerGroup[pProp].length = 0;
};

MappingAPI.GoogleMaps.prototype.initPolyLayerGroup = function(pLayerGroup, pProp, pOptions) {
    if(pLayerGroup[pProp] === null) {
        pLayerGroup[pProp] = [];
        pLayerGroup[pProp].push(new google.maps.Polyline(pOptions));      
    }else {
        pLayerGroup[pProp].push(new google.maps.Polyline(pOptions));
    }
};

MappingAPI.GoogleMaps.prototype.addPolyLine = function(pLayerGroup, pProp, pCoords, pOptions) {
    for (var i = 0; i < pCoords.length; i++) {
        pLayerGroup[pProp][pLayerGroup[pProp].length - 1].getPath().push(pCoords[i]);
    }
};

MappingAPI.GoogleMaps.prototype.bindLayerGroupToMap = function(pLayerGroup, pProp) {
    if(pLayerGroup[pProp] instanceof Array) {
        for (var i = 0; i < pLayerGroup[pProp].length; i++) {
            pLayerGroup[pProp][i].setMap(this.map);
        }
    }else {
        pLayerGroup[pProp].setMap(this.map);
    }
};

MappingAPI.GoogleMaps.prototype.initCustomControls = function(pLayerGroup, pProp, pOptions) {
    return;
};

MappingAPI.GoogleMaps.prototype.makeRouteOptions =  function(pColor, pOpacity, pWeight, pDraggable, pKeepView, pShowMarkers, pPath) {
    var makePolyLineOptions =  function(pColor, pOpacity, pWeight, pDraggable, pKeepView, pShowMarkers, pPath) {
        return {
            path: pPath,
            geodesic: true,
            draggable: pDraggable,
            strokeColor: pColor,
            strokeOpacity: pOpacity,
            strokeWeight: pWeight
        };
    };

    if (pPath instanceof Array) { return makePolyLineOptions(pColor, pOpacity, pWeight, pDraggable, pKeepView, pShowMarkers, pPath); }

    return {
        draggable: pDraggable,
        preserveViewport: pKeepView,
        polylineOptions: {
            geodesic: true,
            draggable: pDraggable,
            strokeColor: pColor,
            strokeOpacity: pOpacity,
            strokeWeight: pWeight
        },
        markerOptions: {
            visible: pShowMarkers
        }
    };
};

MappingAPI.GoogleMaps.prototype.initMarkerOptions =  function(pZindex) {
    return {};
};

MappingAPI.GoogleMaps.prototype.initCustomControlOptions =  function() {
    return;
};

MappingAPI.GoogleMaps.prototype.plotRoute = function(pLayerGroup, pProp, pRoute, pOptions) {
    pLayerGroup[pProp].setDirections(pRoute);
};

MappingAPI.GoogleMaps.prototype.clearMap = function(pLayerGroup) {
    for(var key in pLayerGroup){
        if(pLayerGroup[key] instanceof Array) {
            for (var i = 0; i < pLayerGroup[key].length; i++) {
                pLayerGroup[key][i].setMap(null);
            }
            pLayerGroup[key].length = 0;            
        }
    }
};

