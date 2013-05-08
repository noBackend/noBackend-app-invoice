var hoodie;
if (location.port == 1234) {
  hoodie  = new Hoodie('http://hoodie-invoice.dev/_api');
} else {
  hoodie  = new Hoodie('http://hoodie-invoice.jit.su/_api');
}

$('document').ready( function() {

  // bootstrap & render App
  hoodie.store.findAll('invoice').then( renderApp );

  // handle App events
  App.on('invoice:save',   handleInvoiceSave);
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

  // handle hoodie events
  hoodie.account.on('authenticated', App.renderUserSignedIn)
  hoodie.account.on('signout', App.renderUserSignedOut)
  hoodie.on('account:error:unauthenticated remote:error:unauthenticated', App.renderUserAuthenticationError)
});

var renderApp = function(invoices) {
  invoices.forEach( App.addInvoice );
  App.render();
}
var handleInvoiceSave = function(properties) {
  hoodie.store.update('invoice', properties.id, properties);
}
var handleInvoiceDelete = function(properties) {
  hoodie.store.remove('invoice', properties.id, properties);
}
var handleInvoiceDownload = function(invoice) {
  hoodie.convert( invoice.$el )
  .to( invoice.fileName('png') )
  .download()
}
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
var handleSignUp = function(inputs) {
  hoodie.account.signUp(inputs.username, inputs.password)
  .then( App.hideModalForm, App.renderModalFormError )
};
var handleSignIn = function(inputs) {
  hoodie.account.signIn(inputs.username, inputs.password)
  .then( App.hideModalForm, App.renderModalFormError )
};
var handleSignOut = function(inputs) {
  hoodie.account.signOut()
};
var handleChangePassword = function(inputs) {
  hoodie.account.changePassword(inputs.current_password, inputs.new_password)
  .then( App.hideModalForm, App.renderModalFormError )
};
var handleChangeUsername = function(inputs) {
  hoodie.account.changeusername(inputs.current_password, inputs.new_username)
  .then( App.hideModalForm, App.renderModalFormError )
};
var handleResetPassword = function(inputs) {
  var magic = hoodie.account.resetPassword(inputs.email)
  .then( App.hideModalForm, App.renderModalFormError )
  magic.done(function() {
    alert("send new password to " + inputs.email);
  })
};
var handleAccountDestroy = function() {
  hoodie.account.destroy()
};