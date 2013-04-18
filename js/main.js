window.hoodie  = new Hoodie('http://api.editableinvoicehoodie.dev');

var init = function() {
  currentId = null;
  defaultData = {
    items: [
       {
           "item-name": "Example item",
           "item-description": "Example item description",
           "item-cost": "$650.00",
           "item-qty": "2"
       }
   ],
   date: new Date().ddmmyyyy(),
   paid: "$0.00",
   header: "INVOICE",
   terms: 'NET 30 Days. Finance Charge of 1.5% will be made on unpaid balances after 30 days.'
  }
  $('textarea').autosize();
  $('button.newInvoice').click(function(event){
    event.preventDefault();
    var html = ich.invoice(defaultData);
    $('#page-wrap').empty().append(html);
    $('.item-row').each(function(){update_price(this)});
    $('textarea').autosize();
    saveInvoice();
  });
  $('.invoiceList').on('click', 'a', function(event) {
    event.preventDefault();
    var id = $(this).data('id')
    hoodie.store.find('invoice', id).done(function(invoice){
      var html = ich.invoice(invoice);
      $('#page-wrap').empty().append(html);
      $('.item-row').each(function(){update_price(this)});
      $('textarea').autosize();
      currentId = invoice.id;
    })
  });
  $('#page-wrap').on('input change', 'textarea', function(event){
    var data = null;
    if($(this).closest('.item-row').length !== 0){
      data = serializeItems();
    } else {
      data = {};
      data[$(this).attr('name')] = $(this).val()
    }
    hoodie.store.update('invoice', currentId , data).done(function(){
      buildInvoiceList();
    })
  })
  buildInvoiceList();
}

var onAddRow = function() {
  hoodie.store.update('invoice', currentId , serializeItems());
}

var onDeleteRow = function() {
  hoodie.store.update('invoice', currentId , serializeItems());
}

var serializeItems = function() {
  var data = {}
  data.items = []
  $('.item-row').each(function(index){
    $('textarea', this).each(function(index){
      var datatype = $(this).attr('name');
      if(datatype !== undefined){
        if(datatype === 'item-name'){
          item = {}
        }
        item[datatype] = $(this).val()
        if(datatype === 'item-qty'){
          data.items.push(item)
        }
      }
    })
  })
  console.log("data: ",data);
  return data;
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
    currentId = data.id;
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

 Date.prototype.ddmmyyyy = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return (dd[1]?dd:"0"+dd[0]) +'.'+ (mm[1]?mm:"0"+mm[0]) +'.'+ yyyy; // padding
  };

d = new Date();
d.ddmmyyyy();

$( init )