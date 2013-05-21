
/**
 * Lets initialize our Sockethub connection.
 * Sockethub communicates via WebSockets. It is highly recommended you use
 * an SSL connection for any public facing instances.
 *
 * After the following code is completed, we should have a variable 'sc' which
 * contains a sockethub connection instance.
 *
 * At any time we can verify the connection by calling sc.isConnected()
 */
var sc; // sockethub connection instance
SockethubClient.connect({
  host: 'wss://silverbucket.net:443/sockethub',
  confirmationTimeout: 3000
}).then(function (connection) {
  sc = connection;

  sc.on('message', function (data) {
    console.log('SH received message: ', data);
  });
  sc.on('error', function (data) {
    console.log('SH received error: ', data);
  });
  sc.on('response', function (data) {
    console.log('SH received response: ', data);
  });
  sc.on('close', function (data) {
    console.log('SH received close: ', data);
  });

  return sc.register({
    secret: '1234567890'
  });

}).then(function () {
  console.log('connected and registered with sockethub');
}, function (err) {
  console.log("ERROR: Failed connecting to sockethub: ", err);
});


/**
 * This section of code runs when the document loading is complete.
 *
 * It initializes App events (save, delete, download, send) specifying
 * the functions to call when those events fire.
 *
 * Then remoteStorage is initialized, we use the 'documents' module, and within
 * that module, we store our invoices in the 'invoices' subdirectory.
 */
var invoices = {};
$('document').ready( function() {

  // handle App events
  App.on('invoice:save',   handleInvoiceSave);
  App.on('invoice:delete', handleInvoiceDelete);
  App.on('invoice:send', handleInvoiceSend);

  App.render();

  remoteStorage.util.silenceAllLoggers();
  // request 'rw' access to the documents module
  remoteStorage.claimAccess({documents:'rw'}).then(function () {
    remoteStorage.displayWidget('remotestorage-connect');
    remoteStorage.documents.init(); // initialize documents module

    // get an obect to operate just on the 'invoices' subdirectory of the
    // 'documents' module.
    invoices = remoteStorage.documents.getPrivateList('invoices');

    // get all existing invoices in your remoteStorage account, and populate
    // the invoice list.
    invoices.getAll().then(function (list) {
      for (var key in list) {
        App.addInvoice(list[key].content);
      }
    });

    // Below are two event listeners, which are currently unused
    invoices.on('change', function () {
      console.log('RS onChange fired!', arguments);
    });

    invoices.on('error', function () {
      console.log('RS onError fired!', arguments);
    });
  });

});


/**
 * Function: handleInvoiceSave
 *
 * When invoices are saved, the 'invoice:save' event is fired and this function
 * is called.
 *
 * We call the setContent() function to save our invoice.
 *
 * If the invoice id (invoice.id) does not exist, a new document is
 * automatically created. Otherwise the existing invoice is updated.
 *
 * Parameters:
 *
 *   invoice - the invoice document
 *
 */
var handleInvoiceSave = function(invoice) {
  console.log('handleInvoiceSave');

  if (!invoices.setContent) { return false; }
  invoices.setContent(invoice.id, invoice).then(function () {
    console.log('saved to remotestorage!');
  }, function (err) {
    console.log('failed to save to remotestorage ', err, invoice);
  });
};

/**
 * Function: handleInvoiceDelete
 *
 * When invoices are deleted, the 'invoice:delete' event is fired and this
 * function is called.
 *
 * We call the remove() function with the invoice id (property.id) to remove the
 * invoice from remoteStorage.
 *
 * Parameters:
 *
 *   invoice - the invoice document
 *
 */
var handleInvoiceDelete = function(invoice) {
  console.log('handleInvoiceDelete');

  if (!invoices.remove) { return false; }
  invoices.remove(invoice.id).then(function () {
    console.log('invoice deleted!');
  }, function (err) {
    console.log('failed to delete invoice ', err, invoice);
  });
};

/**
 * Function: handleInvoiceSend
 *
 * When invoices is to emailed, the 'invoice:send' event is fired and this
 * function is called.
 *
 * First, we display a modal form to get the users SMTP credentials so that
 * Sockethub can authenticate and send the email via. the users SMTP server.
 *
 * Once we get the credentials, we use the sc.set() function to set the
 * credentials with Sockethub.
 *
 * Finally, when the credentials have been set, we use sc.submit() to send
 * the message to Sockethub, for delivery.
 *
 * Parameters:
 *
 *   invoice - the invoice document
 *
 */
var handleInvoiceSend = function (invoice) {
  console.log('handleInvoiceSend');
  if (!sc.isConnected()) { return false; }

  $.modalForm({
    title: 'SMTP Credentials<p style="font-size: 12px;"><i>(all data encrypted, and after this session is deleted)</i></p>',
    fields: [ 'email', 'username', 'password', 'host' ],
    submit: 'Save'
  }).on('submit', function(event, inputs) {
    // event.target => <div class="modal">
    // inputs       => { username, password }
    var from = inputs.email;

    // retreived credentials from form
    var creds = {};
    creds['credentials'] = {};
    creds['credentials'][inputs.email] = {
      'smtp': {
        username: inputs.username,
        password: inputs.password,
        host: inputs.host
      }
    };

    // set email credentials
    sc.set('email', creds).then(function () {
      console.log('successfully set smtp credentials');
      var recipient = prompt("Recipient: ");
      if (! recipient)
        return;

      // submit email message to sockethub for delivery
      sc.submit({
        platform: 'email',
        verb: 'send',
        actor: { address: from },
        target: [{ address: recipient }],
        object: {
          subject: invoice.title(),
          html: invoice.toHTML(),
          text: invoice.toText()
        }
      }).then(function () {
        console.log('Email Sent!');
        alert('Email has been sent sucessfully');
      }, function (err) {
        console.log('Email Failed :( ', err);
        alert('There was a problem sending the email. '+ err);
      });

    }, function (err) {
      console.log('failed to set smtp credentials: ', err);
      alert('There was a problem setting the SMTP credentials. '+err);
    });
  });
};