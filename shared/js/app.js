App = {
  init : function() {
    this.$el = $(document.body);
    this.accountBar = new AccountBar( $('.accountbar') );
    this.reset()
    this.bindToEvents();

    // bootstrap
    store.findAll('invoice').then( this.addInvoicesAndRender )

    // track with gaug.es
    this.addTrackCode()
  },

  reset : function() {
    this.invoices = [];
    this.currentInvoice = null;
    this.accountBar.render()
  },

  bindToEvents : function() {
    this.$el.unbind();
    this.$el.on('click', '[data-action=newInvoice]', this.addNewInvoiceAndRender.bind(this));
    this.$el.on('click', '[data-action=showInvoice]', this.handleShowInvoice.bind(this));
    this.$el.on('click', '[data-action=deleteInvoice]', this.deleteCurrentInvoice.bind(this));
    this.$el.on('click', '[data-action=download]', this.downloadCurrentInvoice.bind(this));
    this.$el.on('click', '[data-action=send]', this.sendCurrentInvoice.bind(this));
    this.$el.on('click', '.toggle-invoiceList', this.renderInvoiceList.bind(this));
  },    

  addInvoice : function( properties ) {
    var $invoiceEl = this.$el.find('.invoiceSheet');
    var invoice = new Invoice( $invoiceEl, properties );
    this.invoices.unshift( invoice );
    return invoice;
  },

  removeInvoice : function( id ) {
    var invoice, currentInvoiceId;

    // normalize input
    if (typeof id === 'object') {
      id = id.id;
    }

    // try to find invoice
    var invoice = this.findInvoice(id)
    if (!invoice ) {
      return
    }

    // remove from store
    store.remove( invoice )

    currentInvoiceId = this.currentInvoice.id
    this.invoices.forEach( function( invoice, index) {
      if (invoice.id === id) {
        this.invoices.splice(index, 1);
      }
    }, this );
    if (currentInvoiceId === id) {
      this.showLastInvoice()
    }
    return this;
  },

  addNewInvoiceAndRender : function() {
    var invoice = this.addInvoice();
    this.showLastInvoice();
    invoice.save();
  },

  addInvoiceFromRemote : function(invoice) {
    this.addInvoice( invoice )
  },

  removeInvoiceFromRemote : function(invoice) {
    this.removeInvoice( invoice )
  },

  updateInvoiceFromRemote : function(invoice) {
    App.updateInvoice( invoice )
  },

  deleteCurrentInvoice : function() {
    if (window.confirm("Really delete this invoice?")) {      
      this.removeInvoice( this.currentInvoice.toJSON() )
      this.showLastInvoice();
    }
  },

  downloadCurrentInvoice : function() {
    if (! this.currentInvoice)
      return;
    
    download( convert( $('.invoiceSheet') ).to( 'invoice.pdf ') )
  },

  sendCurrentInvoice : function() {
    if (! this.currentInvoice)
      return;


    var recipient = prompt("Recipient: ");
    if (! recipient)
      return

    sendEmail({
      to          : recipient,
      subject     : this.currentInvoice.title(),
      html        : this.currentInvoice.toHTML(),
      text        : this.currentInvoice.toText(),
      attachments : [ convert( $('.invoiceSheet') ).to("invoice.pdf") ]
    })
  },

  findInvoice : function(id) {
    var foundInvoice = null;
    if (typeof id === 'object') {
      id = id.id;
    }
    this.invoices.forEach( function( invoice, index) {
      if (invoice.id === id) {
        foundInvoice = invoice;
      }
    }.bind(this) );
    return foundInvoice;
  },

  showInvoice : function(id) {
    var invoice = this.findInvoice( id );
    if (invoice) {
      this.currentInvoice = invoice;
      this.currentInvoice.render();
    } else {
      alert("invoice could not be found (id="+id+")");
    }
  },

  updateInvoice : function(properties) {
    var invoice = this.findInvoice( properties.id );
    if (invoice) {
      for ( var property in properties) {
        invoice.property = property;
      }
    }
  },

  getLastInvoice : function() {
    if (this.invoices.length === 0) 
      return;

    return this.invoices[ 0 ];
  },

  showLastInvoice : function() {
    var invoice = this.getLastInvoice();
    if (! invoice) 
      return;
    this.showInvoice( invoice );
  },

  renderInvoiceList : function() {
    console.log('this.invoices', this.invoices)
    var html = ''
    this.invoices.forEach(function(invoice){
      var title;
      if(invoice.customer === ""){
        title = 'untitled invoice'
      } else {
        title = invoice.customer+' - '+invoice.nr
      }
      html += '<li><a href="#" data-id="'+invoice.id+'" data-action="showInvoice">'+title+'</a></li>';
    });
    this.$el.find('.invoiceList').html(html);
  },

  render : function() {
    if (this.invoices.length === 0) {
      this.addNewInvoiceAndRender();
    } else {
      App.showLastInvoice();
    }
    this.$el.show();
  },

  addInvoicesAndRender : function(invoices) {
    invoices.forEach( this.addInvoice );
    this.render();
  },

  renderUserSignedIn : function(username) {
    this.accountBar.renderSignedIn(username)
  },

  renderUserSignedOut : function() {
    this.accountBar.renderSignedOut()
  },

  renderUserAuthenticationError : function() {
    this.accountBar.renderAuthenticationError()
  },

  hideModalForm : function() {
    $modal = $('.modalForm .modal')
    $modal.find('.alert').remove()
    $modal.modal('hide')
  },

  renderModalFormError : function(error) {
    $modal = $('.modalForm .modal')
    $modal.find('.alert').remove()
    $modal.trigger('error', error)
  },

  handleShowInvoice : function(event) {
    var $el, id;
    event.preventDefault();

    $el = $(event.currentTarget).closest('[data-id]');
    id  = $el.data('id');

    this.showInvoice(id);
  },

  addTrackCode : function() {
    // Analytics
    if( /nobackend.org/.test(location.host) ) {
      var _gauges = _gauges || [];
      (function() {
        var t   = document.createElement('script');
        t.type  = 'text/javascript';
        t.async = true;
        t.id    = 'gauges-tracker';
        t.setAttribute('data-site-id', '519a2c84f5a1f516e9000011');
        t.src = '//secure.gaug.es/track.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(t, s);
      })();
    }
  }
};

// save all the .bind(this)
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
App.init = __bind(App.init, App)
App.addInvoice = __bind(App.addInvoice, App)
App.addInvoicesAndRender = __bind(App.addInvoicesAndRender, App)
App.addInvoiceFromRemote = __bind(App.addInvoiceFromRemote, App)
App.removeInvoiceFromRemote = __bind(App.removeInvoiceFromRemote, App)
App.updateInvoiceFromRemote = __bind(App.updateInvoiceFromRemote, App)
App.removeInvoice = __bind(App.removeInvoice, App)
App.renderUserSignedIn = __bind(App.renderUserSignedIn, App)
App.renderUserSignedOut = __bind(App.renderUserSignedOut, App)
App.renderUserAuthenticationError = __bind(App.renderUserAuthenticationError, App)
App.renderInvoiceList = __bind(App.renderInvoiceList, App)

$('document').ready( App.init )