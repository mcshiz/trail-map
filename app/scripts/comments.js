/**
 * Created by brianmccall on 2/29/16.
 */
var commentModule = (function(){
    var options = {};
    var local = {
        loggedIn: false
    };
    options.commentsArray = [];
    options.firebaseRef = new Firebase("https://shasta-bike-map.firebaseio.com");
    options.commentsRef = options.firebaseRef.child(decodeURI(window.location.pathname).replace("/", "")+"/comments");
    options.retrieveComments = function(callback){
        options.commentsRef.once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                options.commentsArray.push(childSnapshot.val());
            });
            if(callback) callback()
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    };

    options.initComments = function(){
        $('#comments-container').comments({
            enableEditing: true,
            currentUserIsAdmin: local.loggedIn,
            enableDeleting: true,
            forceResponsive: true,
            enableDeletingCommentWithReplies: true,
            profilePictureURL: commentModule.user ? commentModule.user.profilePictureURL :'http://bikeshasta.org/wp-content/themes/bikeshasta/images/logo_circle.jpg',
            getComments: function (success, error) {
                success(options.commentsArray);
            },
            postComment: function (data, success, error) {
                if(!commentModule.user) {
                    $('#loginPassword').modal('show');
                    return false;
                }
                var commentId = data.id;
                data.fullname = commentModule.user.name;
                data.profile_picture_url = commentModule.user.profilePictureURL;
                data.created_by_current_user = false;
                options.commentsRef.child(commentId).set(data);
                success(data);

            },
            putComment: function (data, success, error) {
                var commentId = data.id;
                options.commentsRef.child(commentId).set(data);
                success(data);
            },
            deleteComment: function (data, success, error) {
                var commentId = data.id;
                options.commentsRef.child(commentId).remove();
                success();
            },
            upvoteComment: function (data, success, error) {
                var commentId = data.id;
                options.commentsRef.child(commentId).set(data);
                success(data);
            }
        });
    };
    options.login = function(method){
        if(method === "facebook") {
            options.firebaseRef.authWithOAuthPopup("facebook", function (error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    $('#loginPassword').modal('hide');
                }
            });
        } else {
            options.firebaseRef.authWithPassword({
                "email": $('#email-login').val(),
                "password": $('#password-login').val()
            }, function(error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                    $('#loginPassword .modal-body').prepend('<span class="bg-danger bad-login"><b class="fa fa-warning"></b> '+error+'</span> ')
                    $('#loginPassword').modal('show');
                } else {
                    local.loggedIn = true;
                    $('#loginPassword').modal('hide');
                }
            });
        }
    };
    options.logout = function(){
        options.firebaseRef.unauth();
        options.checkLogin();
        commentModule.user = null;
        local.loggedIn = false;
        bootbox.alert("<span class=''>You have been successfully logged out</span>");
        options.initComments()
    };

    options.checkLogin = function(){
        var authData = commentModule.firebaseRef.getAuth();
        if (authData) {
            if(authData.provider === "facebook") {
                commentModule.user = {
                    name :authData.facebook.displayName,
                    profilePictureURL: authData.facebook.profileImageURL
                }
            } else if (authData.provider === "password"){
                local.loggedIn = true;
            }
            $('.login-link').hide();
            $('.logout-link').show();
        } else {
            $('.login-link').show();
            $('.logout-link').hide();
            console.log("User is logged out");
        }
    };


    return options;
}());
