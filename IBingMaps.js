var MappingAPI = MappingAPI || {};

MappingAPI.BingMaps = function($pSelector, pAPIKey, pCenter) {
    this.Constants = {
        Events: {
               BOUNDS_CHANGED: 'bounds_changed',
               CENTER_CHANGED: 'center_changed',
               CLICK: 'click',
               DBLCLICK: 'dblclick',
               DRAG: 'viewchange',
               DRAGEND: 'viewchangeend',
               DRAGSTART: 'viewchangestart',
               HEADING_CHANGED: 'viewchange',
               IDLE: '',
               MAPTYPE_CHANGED: 'maptypechanged',
               MOSEMOVE: 'mousemove',
               MOSEOUT: 'mouseout',
               MOUSEOVER: 'mouseover',
               PROJECTION_CHANGED: 'projection_changed',
               RESIZE: 'mapresize',
               RIGHT_CLICK: 'rightclick',
               TILES_LOADED: '',
               TILT_CHANGED: 'viewchange',
               ZOOM_CHANGED: 'viewchangeend'
        },
        MapType: {
            AERIAL: Microsoft.Maps.MapTypeId.aerial,
            STREET: Microsoft.Maps.MapTypeId.streetside,
            ROAD: Microsoft.Maps.MapTypeId.road,
            SURVEY: Microsoft.Maps.MapTypeId.ordnanceSurvey,
            grayscale: Microsoft.Maps.MapTypeId.grayscale,
            birdseye: Microsoft.Maps.MapTypeId.birdseye,
            LIGHT: Microsoft.Maps.MapTypeId.canvasLight,
            DARK: Microsoft.Maps.MapTypeId.canvasDark
        },
        Animation: {}
    };

    var height = $(window).height();
    var oMapStyle = {
        'height': height,
        'width': '100%'
    };
    var oCenter = new Microsoft.Maps.Location(pCenter.Latitude, pCenter.Longitude); 

    $pSelector.css(oMapStyle);

    this.API_KEY = pAPIKey;

    this.map = new Microsoft.Maps.Map($pSelector[0], {
        center: oCenter,
        zoom:   MappingAPI.Constants.DEFAULT_ZOOM,
        maxZoom: MappingAPI.Constants.MAX_ZOOM,
        minZoom: MappingAPI.Constants.MIN_ZOOM,
        mapTypeId: this.Constants.MapType.ROAD
    });

    this.infoWindow = new Microsoft.Maps.Infobox();
    this.infoWindow.setOptions({visible: false});
    this.infoWindow.setMap(this.map);
    var infoWindow = this.infoWindow;

    this.ZoomToMarkerHandler = function(pMarker, pToolTip) {
        var location = pMarker.getLocation();
        var html = "<div style='background-color:white;padding: 20px;'>" + pToolTip + "</div>"
        this.map.setView({zoom: MappingAPI.Constants.MAX_ZOOM, center: location});
        this.infoWindow.setLocation(location);
        this.infoWindow.setHtmlContent(html);
        this.infoWindow.setOptions({visible: true, zIndex: 1000, offset: new Microsoft.Maps.Point(8, 30)});
        setTimeout(function(){ infoWindow.setOptions({visible: false}); }, 5000);
    };

    this.CustomControlZoomToMarker = function(pMarker) {
        var location = pMarker.getLocation();
        var html = "<div style='background-color:white;padding: 20px;'>" + pMarker.metadata[1] + "</div>"
        this.map.setView({zoom: MappingAPI.Constants.MAX_ZOOM, center: location});
        this.infoWindow.setLocation(location);
        this.infoWindow.setHtmlContent(html);
        this.infoWindow.setOptions({visible: true, zIndex: 1000, offset: new Microsoft.Maps.Point(8, 30)});
        setTimeout(function(){ infoWindow.setOptions({visible: false}); }, 4000);
    };

    this.TooltipHandler = function(pMarker, pToolTip) {
        var location = pMarker.getLocation();
        var html = "<div style='background-color:white;padding: 20px;'>" + pToolTip + "</div>"
        this.infoWindow.setLocation(location);
        this.infoWindow.setHtmlContent(html);
        this.infoWindow.setOptions({visible: true, zIndex: 1000, offset: new Microsoft.Maps.Point(2, 10)});
        setTimeout(function(){ infoWindow.setOptions({visible: false}); }, 5000);
    };

};

MappingAPI.BingMaps.prototype.fitBounds = function(pBounds) {
    this.map.setView({bounds: pBounds});
};

MappingAPI.BingMaps.prototype.setZoom = function(pZoom) {
    this.map.setView({zoom: pZoom});
};

MappingAPI.BingMaps.prototype.initRoute = function(pOptions) {
    return new Microsoft.Maps.Layer();
};

MappingAPI.BingMaps.prototype.getIcon = function(pPath, pWidth, pHeight) {
    return pPath;
};

MappingAPI.BingMaps.prototype.getMarker = function(pId, pLat, pLng, pZindex, pIcon, pTitle, pTooltip, pDraggable) {
    var aryMetadata = [pId, pTooltip];
    var marker = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(pLat, pLng), {
        id: pId,
        zIndex: pZindex,
        icon: pIcon,
        draggable: pDraggable
    });

    marker.metadata = aryMetadata;

    return marker;
};

MappingAPI.BingMaps.prototype.getBounds = function(pUpperLeft, pLowerRight) {
    return new Microsoft.Maps.LocationRect.fromLocations([
        new Microsoft.Maps.Location(pUpperLeft.Latitude, pUpperLeft.Longitude),
        new Microsoft.Maps.Location(pLowerRight.Latitude, pLowerRight.Longitude)
    ]);
};

MappingAPI.BingMaps.prototype.getLatLng = function(pLat, pLng) {
    return new Microsoft.Maps.Location(pLat, pLng);
};

MappingAPI.BingMaps.prototype.getDistance = function(pPointA, pPointB) {
    return MappingAPI.Utils.getDistanceBetweenCoords(pPointA, pPointB);
};

MappingAPI.BingMaps.prototype.addAnimation = function(pObject, pAnimationType) {
    return;
};

MappingAPI.BingMaps.prototype.addEventHandler = function(pObject, pEventType, pCallback) {
    Microsoft.Maps.Events.addHandler(pObject, pEventType, pCallback);
};

MappingAPI.BingMaps.prototype.batchGeoCode = function(pAddresses, pCallback) {
    var byRef = {
        dicGeolocations: [],
        aryResults: [],
        map: this.map
    };
    var geocodeCallback = function(answer, userData) {
        if (answer.results.length > 0) {
            var kvp = {};
            kvp.Key = answer.results[0].address.formattedAddress;
            kvp.Value = answer.results[0].location.latitude + "|" + answer.results[0].location.longitude;
            byRef.dicGeolocations.push(kvp);
            byRef.aryResults.push(true);
        }else {
            byRef.aryResults.push(false);
        }
        if(byRef.aryResults.length > 0 && byRef.aryResults.length === pAddresses.length) {       
            pCallback(byRef.dicGeolocations);
        }
    }

    Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
        var geocoding =  new Microsoft.Maps.Search.SearchManager(byRef.map);
        for (var i = 0; i < pAddresses.length; i++) {
            geocoding.geocode({where: pAddresses[i], callback: geocodeCallback});
        }
    });
};

MappingAPI.BingMaps.prototype.geoCode = function(pAddress, pCallback) {
    var map = this.map;

    var geocodeCallback = function(answer, userData) {
        var dicGeolocations = [];       
        if (answer.results.length > 0) {
            var kvp = {};
            kvp.Key = answer.results[0].address.formattedAddress;
            kvp.Value = answer.results[0].location.latitude + "|" + answer.results[0].location.longitude;
            dicGeolocations.push(kvp);
        }
     
        pCallback(dicGeolocations);
    }

    Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
        var geocoding =  new Microsoft.Maps.Search.SearchManager(map);

        geocoding.geocode({where: pAddress, callback: geocodeCallback});
    });
};

MappingAPI.BingMaps.prototype.calculateRoute = function(pCoordOne, pCoordTwo, pCallback, pOptions) {
    var map = this.map;

    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
        var origin = new Microsoft.Maps.Directions.Waypoint({location: pCoordOne});
        var destination = new Microsoft.Maps.Directions.Waypoint({location: pCoordTwo});

        var directions = new Microsoft.Maps.Directions.DirectionsManager(map);

        directions.setRequestOptions({
            routeMode: Microsoft.Maps.Directions.RouteMode.driving,
            routeAvoidance: [Microsoft.Maps.Directions.RouteAvoidance.avoidToll],
            routeOptimization: Microsoft.Maps.Directions.RouteOptimization.timeWithTraffic,
            time: null
        });

        directions.setRenderOptions({
            autoUpdateMapView: false,
            displayDisclaimer: false, 
            displayManeuverIcons: false, 
            displayPostItineraryItemHints: false,
            displayPreItineraryItemHints: false,
            drivingPolylineOptions: pOptions,
            waypointPushpinOptions: {visible: false}
        });

        directions.addWaypoint(origin);
        directions.addWaypoint(destination);
        directions.calculateDirections();
    });
};

MappingAPI.BingMaps.prototype.initLayerGroup = function(pLayerGroup, pProp) {
    if(pLayerGroup[pProp] === null) {
        pLayerGroup[pProp] = new Microsoft.Maps.Layer();   
    }
};

MappingAPI.BingMaps.prototype.addLayer = function(pLayerGroup, pProp, pLayer, pOptions) {
    pLayerGroup[pProp].add(pLayer);
    pLayerGroup[pProp].setZIndex(pOptions.zindex);
};

MappingAPI.BingMaps.prototype.removeLayers = function(pLayerGroup, pProp) {
    pLayerGroup[pProp].clear();
};

MappingAPI.BingMaps.prototype.initPolyLayerGroup = function(pLayerGroup, pProp, pOptions) {
    if(pLayerGroup[pProp] === null) {
        pLayerGroup[pProp] = new Microsoft.Maps.Layer();
    }
};

MappingAPI.BingMaps.prototype.addPolyLine = function(pLayerGroup, pProp, pCoords, pOptions) {
    pLayerGroup[pProp].add(new Microsoft.Maps.Polyline(pCoords, pOptions));
};

MappingAPI.BingMaps.prototype.bindLayerGroupToMap = function(pLayerGroup, pProp) {
    this.map.layers.insert(pLayerGroup[pProp]);
};

MappingAPI.BingMaps.prototype.initCustomControls = function(pLayerGroup, pProp, pOptions) {
    return;
};

MappingAPI.BingMaps.prototype.makeRouteOptions =  function(pColor, pOpacity, pWeight, pDraggable, pKeepView, pShowMarkers, pPath) {
    return {
        strokeColor: Microsoft.Maps.Color.fromHex(pColor),
        strokeThickness: pWeight,
        visible: true
    };
};

MappingAPI.BingMaps.prototype.initMarkerOptions =  function(pZindex) {
    return {
        zindex: pZindex
    };
};

MappingAPI.BingMaps.prototype.initCustomControlOptions =  function() {
    return;
};

MappingAPI.BingMaps.prototype.plotRoute = function(pLayerGroup, pProp, pRoute, pOptions) {
    return;
};

MappingAPI.BingMaps.prototype.clearMap = function(pLayerGroup) {
    this.map.layers.clear();
};