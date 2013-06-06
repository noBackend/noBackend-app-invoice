var Invoice = function( $el, attributes ) {
  this.$el = $el;
  if (! attributes) {
    attributes = this.defaultAttributes();
  }
  $.extend(this, attributes);
};

Invoice.prototype.defaultAttributes = function() {
  return {
    id       : this.uuid(),
    nr       : "",
    items    : [ this.defaultItemAttributes() ],
    date     : ( new Date() ).toJSON().substr(0,10),
    header   : "INVOICE",
    terms    : 'NET 30 Days. Finance Charge of 1.5% will be made on unpaid balances after 30 days.',
    address  : "",
    customer : ""
  }
}


Invoice.prototype.defaultItemAttributes = function() {
  return {
    id          : this.uuid(),
    name        : "",
    description : "",
    cost        : 100.00,
    quantity    : 1
  }
}

Invoice.prototype.title = function() {
  return  "Invoice #" + this.nr;
};
Invoice.prototype.fileName = function(ext) {
  if (!ext) ext = 'pdf';
  var date = new Date().toJSON().substr(0,10).replace(/-/g,'');
  var basename = date + "_invoice"

  if (this.nr) {
    basename = basename + "_" + this.nr;
  } 
  return  basename + "." + ext;
};

Invoice.prototype.bindToEvents = function() {
  this.$el.unbind()
  this.$el.on('change', this.save.bind(this) );
  this.$el.on('keyup', '.item-row', this.updatePricesInHTML.bind(this) );
  this.$el.on('click', '[data-action=addItem]', this.addItem.bind(this) );
  this.$el.on('click', '[data-action=removeItem]', this.removeItem.bind(this) );
};
Invoice.prototype.render = function() {
  this.updatePrices();
  this.$el.html( ich.invoice( this ) );
  this.bindToEvents()
  this.$el.find('textarea').autosize();
  this.$items = this.$el.find('table.items tbody')
};
Invoice.prototype.updatePrices = function() {
  var total = 0;
  this.items.forEach( function(item) {
    item.total = item.cost * item.quantity;
    total += item.total;
  });
  this.total = total;
};
Invoice.prototype.updatePricesInHTML = function(event) {
  if (event) {
    var $input = $(event.target)
    var $row = $input.closest('[data-item-id]');
    var itemId = $row.data('item-id');
    var item = this.findItem( itemId )

    if (! item)
      return

    if ($input.is("[name=item-quantity]")) {
      item.quantity = $input.val()
    }
    if ($input.is("[name=item-cost]")) {
      item.cost = $input.val()
    }

    this.updatePrices();
    $row.find('.item-total').text( item.total );
  } else {
    this.updatePrices();
  }
  this.$el.find('.total').text( this.total );
};
Invoice.prototype.findItem = function(id) {
  var foundItem = null;
  if (typeof id === 'object') {
    id = id.id;
  }
  this.items.forEach( function( item, index) {
    if (item.id === id) {
      foundItem = item;
    }
  }.bind(this) );
  return foundItem;
};
Invoice.prototype.reset = function() {
  this.id       = this.id || this.uuid()
  this.items    = []
  this.date     = ''
  this.header   = ''
  this.terms    = ''
  this.address  = ''
  this.customer = ''
  this.nr       = ''
}
Invoice.prototype.toJSON = function() {
  return $.extend(true, {}, {
    type      : 'invoice',
    id        : this.id,
    items     : this.items,
    date      : this.date,
    header    : this.header,
    terms     : this.terms,
    address   : this.address,
    customer  : this.customer,
    nr        : this.nr
  });
}
Invoice.prototype.save = function(event) {
  if (event) 
    event.stopPropagation();

  var this_ = this;
  var item;
  this.reset();

  this.$el.find('textarea').each( function(index, el){
    var property = $(el).attr('name');

    if(property){
      if(property.indexOf('item-') === -1){

        // regular data
        this[property] = $(el).val()
      }  else {
        property = property.replace(/^item-/, '')
        // item data
        if(property === 'name'){
          item = {}
        }
        item[property] = $(el).val()
        if(property === 'quantity'){
          item.id = $(el).closest('[data-item-id]').data('item-id')
          this.items.push(item)
        }
      }
    }
  }.bind(this))

  store.save( this.toJSON() )
};

Invoice.prototype.addItem = function() {
  var item = this.defaultItemAttributes();
  var html = ich.invoiceItem( item )
  this.$items.append( html );  
  var $el = this.$items.find('[data-item-id="'+item.id+'"]')
  $el.find('textarea').autosize();
  this.items.push( item );
  this.save()
  this.updatePricesInHTML({
    target : $el
  })
}
Invoice.prototype.removeItem = function(id) {
  var $row = $(event.target).closest('[data-item-id]');
  var itemId = $row.data('item-id');
  var item = this.findItem( itemId )

  this.items.forEach( function( item, index) {
    if (item.id === itemId) {
      this.items.splice(index, 1);
    }
  }.bind(this) );
  $row.remove();
  this.save();
  this.updatePricesInHTML()
};

Invoice.prototype.toText = function() {
  var text = "";
  this.$el.find('#header, #address, #customer-title').each(function(){
    text += $(this).val().trim()+"\n\n"
  })
  this.$el.find('#meta tr').each(function(){
    text += $(this).find('td:eq(0)').text()+ ": "+$(this).find('td:eq(1)').text()+ '\n'
  })
  text += '\n'
  this.$el.find('.item-row').each(function(){
    text += $(this).find('textarea:eq(0)').text()+ "\n"
    text += $(this).find('textarea:eq(1)').text()+' - ';
    text += $(this).find('textarea:eq(3)').text()+' x ';
    text += $(this).find('textarea:eq(2)').text()+'\n';
    text += 'Price: '+$(this).find('.price').text()+'\n\n';
  })
  text += 'Subtotal: '+this.$el.find('#subtotal').text()+'\n'
  text += 'Total: '+this.$el.find('#total').text()+'\n'
  text += 'Balance due: '+this.$el.find('.total-value .due').text()+'\n\n'
  text += 'Terms: '+this.$el.find('#terms textarea').val()+'\n\n'
  return text;
};

Invoice.prototype.toHTML = function() {
  var $result = this.$el.clone();
  $result.find('.notPartOfInvoice, .btn').remove();
  return $result.html().replace(/<textarea[^>]*>/g, '');
};

Invoice.prototype.print = function() {
  window.print();
};

Invoice.prototype.on = function(eventName, callback) {
  this.$el.on.apply(this.$el, [eventName, function(event, properties) {
    callback(properties);
  }]);
},

Invoice.prototype.uuid = function(len) {
  var chars, i, radix;
  if (len == null) {
    len = 7;
  }
  chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
  radix = chars.length;
  return ((function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      _results.push(chars[0 | Math.random() * radix]);
    }
    return _results;
  })()).join('');
};