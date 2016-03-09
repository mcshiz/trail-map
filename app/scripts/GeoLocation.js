/**
 * Created by brianmccall on 2/14/16.
 */
var GeoLocation = (function(callback, $, window) {
    var options = {
        enableHighAccuracy : true,
        timeout : 1500
    };
    var watchOptions =  {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    var exports = {};
    exports.canWatch = false;
    exports.watching = false;
    exports.watchLocation = function() {
        navigator.geolocation.watchPosition(success,error, watchOptions);
    };
    exports.stopWatching = function(){
        navigator.geolocation.clearWatch(GeoLocation.watching);
        exports.watching = false;
        $('.geolocate-status').text(' Off');
    };
    function error(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
        exports.watching = false;
        $('.geolocate-status').text(' Off');
        $('.geolocate-symbol').removeClass('btn-active');
    }
    function success(position){
        console.log(position)
        mapModule.map.panTo(new L.LatLng(position.coords.latitude, position.coords.longitude));
        exports.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude };
        mapModule.updatePosition(position);
        exports.watching = position;
        $('.geolocate-status').text(' On');
    }
    exports.getLocation = function(position) {
        console.log(position);
        window.document.cookie = 'geoLocation=true';
        exports.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude };
        exports.canWatch = true;
        callback(window, window.document, L);

    };
    function fallback(error) {
        console.log('GeoLocation Error:', error.message);
        console.log('using double fallback location');

        $.ajax({
            dataType: 'json',
            url: '//freegeoip.net/json/',
            timeout: 1500,

            success: function(data){
                exports.userLocation = {
                    lng: data.longitude,
                    lat: data.latitude
                };
                callback(window, window.document, L);
            },
            error: function() {
                $.getJSON('http://ip-api.com/json', function (data) {
                    console.log('super backup');
                    GeoLocation.userLocation = {
                        lng: data.lon,
                        lat: data.lat
                    };
                    callback(window, window.document, L);

                });
            }
        });
    }
    if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(exports.getLocation, fallback, options);
    } else {
        fallback();
    }
    return exports;
}(mapModule.init, $, window));

