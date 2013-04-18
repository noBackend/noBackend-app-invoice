// FAKE IT UNTIL YOU MAKE IT!
var convert = function( element ) {
  return {
    to: function( fileName ) {
      return convertElementToDataUrl( element, fileName )
    }
  }
};

function sendEmail (options) {
  if (! options.attachments) {
    return hoodie.store.add('$email', options)
  }

  return options.attachments[0]
  .then( function(uri, fileName, fileType) { 
    uri = uri.split(/,/).pop()
    options._attachments = {}
    options._attachments[fileName] = {
      content_type: fileType,
      data: uri
    }
    return hoodie.store.add('$email', options)
  } )
}