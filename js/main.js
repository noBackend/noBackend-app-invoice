window.hoodie  = new Hoodie('http://api.editableinvoicehoodie.dev');

var init = function() {
  $('textarea').autosize();
  $('button.save').click(function(event){
    event.preventDefault();
    saveInvoice();
  });
  $('.invoiceList').on('click', 'a', function(event) {
    event.preventDefault();
    var id = $(this).data('id')
    console.log("load invoice "+id)
    hoodie.store.find('invoice', id).done(function(invoice){
      console.log("invoice: ",invoice);
      var html = ich.invoice(invoice);
      console.log("html: ",html);
      $('#page-wrap').empty().append(html);
      $('.item-row').each(function(){update_price(this)});
      $('textarea').autosize();
    })
  });
  buildInvoiceList();
}

var buildInvoiceList = function() {
  $('.invoiceList').empty();
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
    buildInvoiceList()
  })
  .fail(function(data){
    console.log("Invoice not saved", data)
  })
}

$( init )