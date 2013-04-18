// FAKE IT UNTIL YOU MAKE IT!
var convert = function( element ) {
  return {
    to: function( fileName ) {
      return convertElementToDataUrl( element, fileName )
    }
  }
};