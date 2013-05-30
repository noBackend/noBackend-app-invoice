// initialize Hoodie with the URL of the backend
var whereTheMagicHappens = 'http://hoodie-invoice.jit.su/_api'
var hoodie = new Hoodie(whereTheMagicHappens);

$('document').ready( function() {

  // bootstrap & render App
  hoodie.store.findAll('invoice').then( renderApp );

  // handle App events
  App.on('invoice:save', handleInvoiceSave);
  App.on('invoice:delete', handleInvoiceDelete);
  App.on('invoice:download', handleInvoiceDownload);
  App.on('invoice:send', handleInvoiceSend);

  App.on('account:signin', handleSignIn);
  App.on('account:signup', handleSignUp);
  App.on('account:signout', handleSignOut);
  App.on('account:changepassword', handleChangePassword);
  App.on('account:changeusername', handleChangeUsername);
  App.on('account:resetpassword', handleResetPassword);
  App.on('account:destroy', handleAccountDestroy);
});

hoodie.remote.on('add:invoice', handleNewInvoiceFromRemote)
hoodie.remote.on('remove:invoice', handleRemovedInvoiceFromRemote)
hoodie.remote.on('change:invoice', handleChangedInvoiceFromRemote)

// add passed invoices to App UI and render it
var renderApp = function(invoices) {
  invoices.forEach( App.addInvoice );
  App.render();
}

// update invoice in Hoodie store
var handleInvoiceSave = function(properties) {
  hoodie.store.update('invoice', properties.id, properties);
}

// delete invoice from Hoodie store
var handleInvoiceDelete = function(properties) {
  hoodie.store.remove('invoice', properties.id, properties);
}

// download invoice
var handleInvoiceDownload = function(invoice) {
  hoodie.convert( invoice.$el )
  .to( invoice.fileName('png') )
  .download()
}

// send invoice as multipart email
var handleInvoiceSend = function(invoice) {
  var recipient = prompt("Recipient: ");
  if (! recipient)
    return

  hoodie.email.send({
    to: recipient,
    subject: invoice.title(),
    html: invoice.toHTML(),
    text: invoice.toText(),
    attachments: [ hoodie.convert( $('.invoiceSheet') ).to("invoice.png") ]
  })
};

// sign up a new user with Hoodie
var handleSignUp = function(inputs) {
  hoodie.account.signUp(inputs.username, inputs.password)
  .then( App.hideModalForm, App.renderModalFormError )
};

// sign in to existing account
var handleSignIn = function(inputs) {
  hoodie.account.signIn(inputs.username, inputs.password)
  .then( App.hideModalForm, App.renderModalFormError )
};

// sign out
var handleSignOut = function(inputs) {
  hoodie.account.signOut()
};

// change password
var handleChangePassword = function(inputs) {
  hoodie.account.changePassword(inputs.current_password, inputs.new_password)
  .then( App.hideModalForm, App.renderModalFormError )
};

// change username
var handleChangeUsername = function(inputs) {
  hoodie.account.changeusername(inputs.current_password, inputs.new_username)
  .then( App.hideModalForm, App.renderModalFormError )
};

// reset password
var handleResetPassword = function(inputs) {
  var magic = hoodie.account.resetPassword(inputs.email)
  .then( App.hideModalForm, App.renderModalFormError )
  magic.done(function() {
    alert("send new password to " + inputs.email);
  })
};

// destroy account and all its data
var handleAccountDestroy = function() {
  hoodie.account.destroy()
};

// when a new invoice gets synced from remote,
// add it to the app and rerender the InvoiceList
var handleNewInvoiceFromRemote = function( invoice ) {
  App.addInvoiceFromRemote( invoice )
};

// when an invoice got removed from remote, 
// remove it from the app and rerender the InvoicList
var handleRemovedInvoiceFromRemote = function( invoice ) {
  App.removeInvoice( invoice )
  App.renderInvoiceList()
};

// when an invoice got updated from remote, 
// update it in the app and rerender the InvoicList
var handleChangedInvoiceFromRemote = function(invoice) { 
  App.updateInvoice( invoice )
  App.renderInvoiceList()
};