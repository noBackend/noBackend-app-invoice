window.hoodie  = new Hoodie('http://api.editableinvoicehoodie.dev');

var init = function() {
  $('textarea').autosize();
  $('button.save').click(function(event){
    event.preventDefault();
    saveInvoice();
  });
  $('.invoiceList').on('click', 'a', function(event) {
    event.preventDefault();
    console.log("load invoice "+$(this).data('id'))
  });
  buildInvoiceList();
}

var buildInvoiceList = function() {
  hoodie.store.findAll('invoice').done(function(invoices){
    invoices.forEach(function(invoice){
      $('.invoiceList').append('<li><a href="#" data-id="'+invoice.id+'">'+invoice.customer+' - '+invoice.invoiceNr+'</a></li>')
    });
  });
}

var saveInvoice = function() {
  var data = {}
  var item = null
  data.items = []
  $('textarea').each(function(index){
    var datatype = $(this).attr('name');
    if(datatype !== undefined){
      if(datatype.indexOf('item-') === -1){
        // regular data
        data[datatype] = $(this).val()
      }  else {
        // item data
        if(datatype === 'item-name'){
          item = {}
        }
        item[datatype] = $(this).val()
        if(datatype === 'item-qty'){
          data.items.push(item)
        }
      }
    }
  })
  hoodie.store.add('invoice', data)
  .done(function(data){
    console.log("Invoice saved", data)
  })
  .fail(function(data){
    console.log("Invoice not saved", data)
  })
}

$( init )