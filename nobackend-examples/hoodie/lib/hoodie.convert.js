// FAKE IT UNTIL YOU MAKE IT!
Hoodie.prototype.convert = function( element ) {
  return {
    to: function( fileName ) {
      return convertElementToDataUrl( element, fileName )
    }
  }
}

// 
var convertElementToDataUrl = function( el, fileName ) {
  var fileName
  var fileType
  var fileExtension
  var defer = $.Deferred()


  // be nice to jQuery-ists
  if (el[0]) { el = el[0]; }

  if (! fileName) {
    fileName = "invoice.png";
    fileType = "image/png";
  } else {
    fileExtension = fileName.match(/\.(.*)$/)
    if (! fileExtension) {
      defer.reject("Sorry, you need to set a supported file extension (.jpeg, .png, .pdf)!")
      var promise = defer.promise()
      promise.download = function() {
        this.then( download )
      }
      return promise;
    }
    fileExtension = fileExtension.pop()
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        fileType = "image/jpeg"
        break;

      case 'png':
        fileType = "image/png"
        break;

      // unfortunately not supported yet, that'll need some backend magic.
      // case 'pdf':
      //   fileType = "application/pdf"
      //   break;
      default:
        defer.reject("Sorry, you need to set a supported file extension (.jpeg, .png, .pdf)!")
        var promise = defer.promise()
        promise.download = function() {
          this.then( download )
        }
        return promise;
    }
  }

  $('.notPartOfInvoice', el).hide()
  html2canvas(el, {
    onrendered: function(canvas) {
      defer.resolve(canvas.toDataURL( fileType ), fileName, fileType)
      $('.notPartOfInvoice', el).show()
    }
  })

  var promise = defer.promise()
  promise.download = function() {
    this.then( download )
  }
  return promise
};

var downloadInvoice = function() {
  var invoiceName = $('.invoiceNr').val() || "invoice";
  var fileName = invoiceName + ".png";

  return convertElementToDataUrl( $('.invoiceSheet'), fileName )
  .then( function(dataUrl) {
    download(dataUrl, fileName)
  })
};

var download = function(uri, fileName) {
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
  link.download = fileName;
  link.href = uri;
  eventFire(link, "click");
}