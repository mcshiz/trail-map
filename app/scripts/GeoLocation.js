/**
 * Created by brianmccall on 2/14/16.
 */
var GeoLocation = (function(callback) {
    var options = {
        enableHighAccuracy : true,
        timeout : 1500
    };
    var watchOptions =  {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    function watchLocation() {
        navigator.geolocation.watchPosition(success,error, watchOptions)
    }
    function error(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
        GeoLocation.watching = false;
        $('.geolocate-status').text(" Off");
        $('.geolocate-symbol').removeClass("btn-active");
    }
    function success(position){
        GeoLocation.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude };
        mapModule.updatePosition(position);
        GeoLocation.watching = position;
        $('.geolocate-status').text(" On")
    }
    function stopWatching(){
        navigator.geolocation.clearWatch(GeoLocation.watching);
        GeoLocation.watching = false;
        $('.geolocate-status').text(" Off")
    }
    function getLocation(position) {
        console.log(position);
        document.cookie = "geoLocation=true";
        GeoLocation.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude };
        GeoLocation.canWatch = true;
        callback(window, document, L)

    }
    function fallback(error) {
        console.log("GeoLocation Error:", error.message);
        console.log("using double fallback location");

        $.ajax({
            dataType: "json",
            url: '//freegeoip.net/json/',
            timeout: 1500,

            success: function(data){
                GeoLocation.userLocation = {
                    lng: data.longitude,
                    lat: data.latitude
                };
                callback(window, document, L);
            },
            error: function() {
                $.getJSON('http://ip-api.com/json', function (data) {
                    console.log("super backup");
                    GeoLocation.userLocation = {
                        lng: data.lon,
                        lat: data.lat
                    };
                    callback(window, document, L);

                })
            }
        });
    }
    if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getLocation, fallback, options);
    } else {
        fallback();
    }

    return {
        //setting default
        userLocation : {
            lng: -121.904297,
            lat: 42.0390942
        },
        canWatch : false,
        watching: false,
        watchLocation: watchLocation,
        stopWatching: stopWatching
    }

});
