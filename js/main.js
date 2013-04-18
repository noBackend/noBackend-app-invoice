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

var serializeCurrentInvoiceData = function() {
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
  return data;
}

var saveInvoice = function() {
  data = serializeCurrentInvoiceData();
  hoodie.store.add('invoice', data)
  .done(function(data){
    console.log("Invoice saved", data)
    buildInvoiceList()
  })
  .fail(function(data){
    console.log("Invoice not saved", data)
  })
}

var currentInvoiceToHTML = function() {
  var $result = $('#page-wrap').clone();
  $result.find('#hiderow, .notPartOfInvoice').remove()
  return $result.html();
}

var currentInvoiceToText = function() {
  var text = "";
  $('#header, #address, #customer-title').each(function(index){
    text += $(this).val().trim()+"\n\n"
  })
  $('#meta tr').each(function(index){
    text += $(this).find('td:eq(0)').text()+ ": "+$(this).find('td:eq(1)').text()+ '\n'
  })
  text += '\n'
  $('.item-row').each(function(index){
    text += $(this).find('textarea:eq(0)').text()+ "\n"
    text += $(this).find('textarea:eq(1)').text()+' - ';
    text += $(this).find('textarea:eq(3)').text()+' x ';
    text += $(this).find('textarea:eq(2)').text()+'\n';
    text += 'Price: '+$(this).find('.price').text()+'\n\n';
  })
  text += 'Subtotal: '+$('#subtotal').text()+'\n'
  text += 'Total: '+$('#total').text()+'\n'
  text += 'Amount paid: '+$('#paid').val()+'\n\n'
  text += 'Balance due: '+$('.total-value .due').text()+'\n\n'
  text += 'Terms: '+$('#terms textarea').val()+'\n\n'
  return text;
}

window.downloadInvoice = function() {
  html2canvas($('#page-wrap')[0], {
    onrendered: function(canvas) {
      downloadWithName(canvas.toDataURL("image/pdf"), "invoice.png")
    }
  })

  function downloadWithName(uri, name) {
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
      link.download = name;
      link.href = uri;
      eventFire(link, "click");

  }
};

$( init )