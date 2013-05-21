App = {
  init : function() {
    this.$el = $(document.body);
    this.accountBar = new AccountBar( $('.accountbar') );
    this.reset()
    this.bindToEvents();
    this.bindToAccountBarEvents();
  },

  reset : function() {
    this.invoices = [];
    this.currentInvoice = null;
    this.accountBar.render()
  },

  bindToEvents : function() {
    this.$el.unbind();
    this.$el.on('click', '[data-action=newInvoice]', this.addNewInvoiceAndRender.bind(this) );
    this.$el.on('click', '[data-action=showInvoice]',   function(event) {
      event.preventDefault();
      var $el = $(event.currentTarget).closest('[data-id]');
      var id  = $el.data('id');
      this.showInvoice(id);
    }.bind(this));
    this.$el.on('click', '[data-action=deleteInvoice]', this.deleteCurrentInvoice.bind(this));
    this.$el.on('click', '[data-action=download]', this.downloadCurrentInvoice.bind(this));
    this.$el.on('click', '[data-action=send]', this.sendCurrentInvoice.bind(this));
    this.$el.on('click', '.toggle-invoiceList', this.renderInvoiceList.bind(this));
  },

  bindToAccountBarEvents : function() {
    var eventNames = ['signup', 'signin', 'resetpassword', 'changepassword', 'changeusername', 'signout', 'destroy']
    
    eventNames.forEach( this.proxyEvent(this.accountBar, 'account').bind(this) )
  },

  proxyEvent : function(module, namespace) {
    return function(eventName, args) {
      module.on(eventName, function() {
        var args = Array.prototype.slice.call(arguments)
        args.unshift( namespace +':'+ eventName )
        this.$el.trigger.apply(this.$el, args);
      }.bind(this))
    }.bind(this);
  },

  addInvoice : function( properties ) {
    var $invoiceEl = this.$el.find('.invoiceSheet');
    var invoice = new Invoice( $invoiceEl, properties );
    this.invoices.unshift( invoice );
    return invoice;
  },

  removeInvoice : function( id ) {
    if (typeof id === 'object') {
      id = id.id;
    }
    var currentInvoiceId = this.currentInvoice.id
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
    this.trigger('invoice:new', invoice);
  },

  deleteCurrentInvoice : function() {
    if (window.confirm("Really delete this invoice?")) {
      this.currentInvoice['delete']();
      this.showLastInvoice();
    }
  },

  downloadCurrentInvoice : function() {
    if (! this.currentInvoice)
      return;

    this.trigger('invoice:download', this.currentInvoice)
  },

  sendCurrentInvoice : function() {
    if (! this.currentInvoice)
      return;

    this.trigger('invoice:send', this.currentInvoice)
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
      this.currentInvoice.on('save', this.handleInvoiceSave.bind(this));
      this.currentInvoice.on('delete', this.handleInvoiceDelete.bind(this));
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

  on : function(eventName, callback) {
    this.$el.on.apply(this.$el, [eventName, function(event, properties) {
      callback(properties);
    }]);
  },

  trigger : function() {
    this.$el.trigger.apply(this.$el, arguments);
  },

  handleInvoiceSave : function(properties) {
    this.trigger('invoice:save', properties);
  },
  handleInvoiceDelete : function(properties) {
    this.removeInvoice( properties )
    this.trigger('invoice:delete', properties);
  }
};

// save all the .bind(this)
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
App.init = __bind(App.init, App)
App.addInvoice = __bind(App.addInvoice, App)
App.removeInvoice = __bind(App.removeInvoice, App)
App.renderUserSignedIn = __bind(App.renderUserSignedIn, App)
App.renderUserSignedOut = __bind(App.renderUserSignedOut, App)
App.renderUserAuthenticationError = __bind(App.renderUserAuthenticationError, App)
App.renderInvoiceList = __bind(App.renderInvoiceList, App)

$('document').ready( App.init )