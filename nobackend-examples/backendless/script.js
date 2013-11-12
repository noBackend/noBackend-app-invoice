/* global Backendless, App */
/* exported store */
Backendless.initApp('686DE39A-2283-06BB-FF39-7DD2C26E1400', '9CE4DBF8-1562-23F1-FF51-A954975CEE00', 'v1');

var _promise = function () {
  var defer = $.Deferred();
  defer.resolve.apply( defer, arguments );
  return defer.promise();
};

//
// data store implementations
//
App.store = {};
App.store.invoice = Backendless.Persistence.of(function invoice(){});

var store = {

  // find all objects of one type
  findAll : function(type) {
    try {
      var result = App.store[type].find({
        options:{
          related: ['items']
        }
      }).data;


      for( var i = 0; i < result.length; i++ )
        result[ i ][ "date" ] = result[i][ "invoiceDate" ];

      return _promise(result);
    } catch(e){
      return _promise([]);
    }
  },

  // add a new or update an existing object
  save : function(properties) {
    var type = properties.type;

     for(var j = 0; j < properties.items.length; j++)
       properties.items[ j ][ "___class"]  = "item";

    try{
      var obj = App.store[type].find({
        options:{ related: ['items'] },
        condition: "id='" + properties.id +"'"
      }).data[0];
      console.log('obj : ', obj);

      if(obj)
      {
        obj[ "date"] = obj[ "invoiceDate" ];
        properties.objectId = obj.__updated__objectId || obj.objectId;

        for(var i = 0; i < obj.items.length; i++)
        {
          for(var j = 0; j < properties.items.length; j++)
          {
            properties.items[ j ][ "___class"]  = "item";

            if(properties.items[j].id == obj.items[i].id)
              properties.items[j].objectId = obj.items[i].objectId;
          }
        }
      }
      return _promise(properties);
    } catch(e){
    } finally {
      properties[ "___class" ] = "invoice";
      properties[ "invoiceDate" ] = properties[ "date" ];
      delete properties[ "date" ];
      App.store.invoice.save(properties);
      return _promise(properties);
    }
  },

  // remove object from store
  remove : function(object) {
    var defer = $.Deferred();
    var type = object.type;
    console.log('delete invoice');
    App.store[type].remove( object, new Backendless.Async( defer.resolve ));
    return defer.promise();
  }
};

var currentUser = Backendless.UserService.getCurrentUser();
var account = {
  username : currentUser && currentUser.login,

  signUp : function( username, password ) {
    var defer = $.Deferred();

    var user = new Backendless.User();
    user.login = username;
    //user.email = username;
    user.password = password;
    Backendless.UserService.register( user,
      new Backendless.Async( defer.resolve, defer.reject)
    );

    return defer.promise();
  },

  signIn : function( username, password ) {
    var defer = $.Deferred();

    App.renderUserSignedIn();

    Backendless.UserService.login( username, password,
      new Backendless.Async( function(data){
        App.user = new Backendless.User(data);
        account.username = App.user.login;
        defer.resolve( App.user.login );
      }, defer.reject )
    );

    return defer.promise();
  },
  signOut : function() {
    var defer = $.Deferred();
    Backendless.UserService.logout(new Backendless.Async(defer.resolve,defer.reject));

    return defer.promise();
  },
  resetPassword : function() {
    var defer = $.Deferred();
    var async = new Backendless.Async( defer.resolve, defer.reject );
    Backendless.UserService.restorePassword( 'login', async);

    return defer.promise();
  },
  changePassword : function( current_password, new_password ) {
    var defer = $.Deferred();

    App.user.password = new_password;
    Backendless.UserService.update(App.user, new Backendless.Async( defer.resolve, defer.reject ));

    return defer.promise();
  },
  changeUsername : function( current_password, new_username ) {
    var defer = $.Deferred();

    App.user.login = new_username;
    account.username = App.user.login;
    Backendless.UserService.update(App.user, new Backendless.Async( defer.resolve, defer.reject ));

    return defer.promise();
  },

  // to handle user account events
  on : function(event, callback) {
    console.log('account.on("'+event+'")', callback);

    // TODO add handlers for events like 'signin', 'signout', 'signup', 'unauthenticated'
  }
};



// subscribe to account events
account.on('signin', App.renderUserSignedIn);
account.on('signout', App.renderUserSignedOut);
account.on('unauthenticated', App.renderUserAuthenticationError);

// TODO: make these work

//
// remote / sync dreamcode
//
var remote = {
  on : function (event, callback) {
    console.log('remote.on("'+event+'")', callback);
  }
};
remote.on('add:invoice', App.addInvoiceFromRemote );
remote.on('remove:invoice', App.removeInvoiceFromRemote);
remote.on('update:invoice', App.updateInvoiceFromRemote);