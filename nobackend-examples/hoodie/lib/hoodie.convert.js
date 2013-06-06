Hoodie._extensions['convert'] = function(hoodie) {
  return function( element ) {
    return {
      to: function( fileName ) {
        return convertElementToDataUrl( element, fileName )
      }
    }
  }
};

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
      return defer.promise();
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
        console.log(fileExtension, "is not yet supported. Changing to .png")
        fileType = "image/png"
        fileName = fileName.replace(fileExtension, 'png')
    }
  }

  $('.notPartOfInvoice', el).hide()
  html2canvas(el, {
    onrendered: function(canvas) {
      defer.resolve(canvas.toDataURL( fileType ), fileName, fileType)
      $('.notPartOfInvoice', el).show()
    }
  })

  return defer.promise();
};