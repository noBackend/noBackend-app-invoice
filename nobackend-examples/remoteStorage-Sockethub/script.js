
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


var invoices = {};
$('document').ready( function() {

  // handle App events
  App.on('invoice:save',   handleInvoiceSave);
  App.on('invoice:delete', handleInvoiceDelete);
  App.on('invoice:download', handleInvoiceDownload);
  App.on('invoice:send', handleInvoiceSend);

  App.render();

  remoteStorage.util.silenceAllLoggers();
  remoteStorage.claimAccess({documents:'rw'}).then(function () {
    remoteStorage.displayWidget('remotestorage-connect');
    remoteStorage.documents.init();
    invoices = remoteStorage.documents.getPrivateList('invoices');

    invoices.getAll().then(function (list) {
      for (var key in list) {
        App.addInvoice(list[key].content);
      }
    });

    invoices.on('change', function () {
      console.log('RS onChange fired!', arguments);
    });

    invoices.on('error', function () {
      console.log('RS onError fired!', arguments);
    });
  });


});


var handleInvoiceSave = function(properties) {
  console.log('handleInvoiceSave');

  if (!invoices.setContent) { return false; }
  invoices.setContent(properties.id, properties).then(function () {
    console.log('saved to remotestorage!');
  }, function (err) {
    console.log('failed to save to remotestorage ', err, properties);
  });
};

var handleInvoiceDelete = function(properties) {
  console.log('handleInvoiceDelete');

  if (!invoices.setContent) { return false; }
  invoices.setContent(properties.id, '').then(function () {
    console.log('invoice deleted!');
  }, function (err) {
    console.log('failed to delete invoice ', err, properties);
  });
};
var handleInvoiceDownload = function(invoice) {
  console.log('handleInvoiceDownload');
};

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

    var creds = {};
    creds['credentials'] = {};
    creds['credentials'][inputs.email] = {
      'smtp': {
        username: inputs.username,
        password: inputs.password,
        host: inputs.host
      }
    };


    sc.set('email', creds).then(function () {
      console.log('successfully set smtp credentials');
      var recipient = prompt("Recipient: ");
      if (! recipient)
        return;

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
      }, function () {
        console.log('Email Failed :(');
      });

    }, function (err) {
      console.log('failed to set smtp credentials: ', err);
    });

  });

};
