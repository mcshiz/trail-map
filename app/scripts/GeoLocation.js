/**
 * Created by brianmccall on 2/14/16.
 */
var GeoLocation = (function(callback) {
    var options = {
        enableHighAccuracy : true,
        timeout : 1000
    };
    function getLocation(position) {
        console.log(position);
        document.cookie = "geoLocation=true";
        GeoLocation.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude };
        callback(window, document, L)

    }
    function fallback(error) {
        console.log("GeoLoacation Error:", error.message);
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
        }
    }

})(mapModule.init);
