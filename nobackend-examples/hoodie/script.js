// initialize Hoodie with the URL of the backend
var whereTheMagicHappens = 'http://hoodie-invoice.jit.su/_api'
var hoodie = new Hoodie(whereTheMagicHappens);

// 
// data store implementations
// 
var store = {

  // find all objects of one type
  findAll : function(type) {
    return hoodie.store.findAll(type)
  },

  // add a new or update an existing object
  save : function(object) {
    return hoodie.store.update(object.type, object.id, object)
  },

  // remove object from store
  remove : function(object) {
    return hoodie.store.save(object.type, object.id)
  }
}


// 
// account implementation
// 
var account = {
  username : hoodie.account.username,

  signUp : function( username, password ) {
    return hoodie.account.signUp(username, password)
  },
  signIn : function( username, password ) {
    return hoodie.account.signIn(username, password)
  },
  signOut : function() {
    return hoodie.account.signOut()
  },
  resetPassword : function( username ) {
    return hoodie.account.resetPassword(username)
  },
  changePassword : function( current_password, new_password ) {
    return hoodie.account.changePassword(current_password, new_password)
  },
  changeUsername : function( current_password, new_username ) {
    return hoodie.account.changeUsername(current_password, new_username)
  },
  destroy : function() {
    return hoodie.account.destroy()
  },

  // to handle user account events
  on : function(event, callback) {
    hoodie.account.on(event, callback)
  }
}

// subscribe to account events
account.on('signin', App.renderUserSignedIn)
account.on('signout', App.renderUserSignedOut)
account.on('unauthenticated', App.renderUserAuthenticationError)


// 
// remote / sync implementation
// 
hoodie.remote.on('add:invoice', App.addInvoiceFromRemote )
hoodie.remote.on('remove:invoice', App.removeInvoiceFromRemote)
hoodie.remote.on('update:invoice', App.updateInvoiceFromRemote)


//
// download & convert dreamcode
// 
// In the current implementation, the download method
// is only used in the context of converting the current
// page to an image. The passed attribute is the promise
// of the convert( el ).to( filename ) method.
// 
var download = function ( promise ) {
  promise.then( function(uri, fileName) {
    function eventFire(el, etype){
        if (el.fireEvent) {
            (el.fireEvent('on' + etype));
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
        }
    }

    var link = document.createElement("a");
    link.download = fileName;
    link.href = uri;
    eventFire(link, "click");
  })
}
var convert = hoodie.convert


// 
// email dreamcode
// 
var sendEmail = hoodie.email.send