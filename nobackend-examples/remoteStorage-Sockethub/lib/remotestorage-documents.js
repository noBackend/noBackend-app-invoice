(function() {
  var moduleName = 'documents';

  remoteStorage.defineModule(moduleName, function(privateClient, publicClient) {

    function getUuid() {
      var uuid = '',
      i,
      random;

      for ( i = 0; i < 32; i++ ) {
        random = Math.random() * 16 | 0;
        if ( i === 8 || i === 12 || i === 16 || i === 20 ) {
          uuid += '-';
        }
        uuid += ( i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random) ).toString( 16 );
      }
      return uuid;
    }

    function init() {
      privateClient.release('');
      publicClient.release('');
    }

    function getPrivateList(listName) {
      privateClient.use(listName+'/');

      function getIds() {
        return privateClient.getListing(listName+'/');
      }
      function getAll() {
        return privateClient.getAll(listName + '/');
      }
      function getContent(id) {
        return privateClient.getObject(listName+'/'+id).
          then(function(obj) {
            return obj ? obj.content : '';
          });
      }
      function getTitle(id) {
        return getContent(id).then(function(content) {
          return content.slice(0, 50);
        });
      }
      function setContent(id, content) {
        if(content === '') {
          return privateClient.remove(listName+'/'+id);
        } else {
          return privateClient.storeObject('text', listName+'/'+id, {
            content: content
          });
        }
      }
      function add(content) {
        var id = getUuid();
        return privateClient.storeObject('text', listName+'/'+id, {
          content: content
        }).then(function() {
          return id;
        });
      }
      function on(eventType, cb) {
        privateClient.on(eventType, function (event) {
          if (event.path.substr(2+moduleName.length, listName.length) === listName) {
            cb(event);
          }
        });
      }
      function set(id, obj) {
        return privateClient.storeObject('text', listName+'/'+id, obj);
      }
      function get(id) {
        return privateClient.getObject(listName+'/'+id).
          then(function(obj) {
            return obj || {};
          });
      }

      function remove(id) {
        return privateClient.remove(listName+'/'+id);
      }

      return {
        init          : init,
        getIds        : getIds,
        getAll        : getAll,
        getContent    : getContent,
        getTitle      : getTitle,
        setContent    : setContent,
        set           : set,
        get           : get,
        add           : add,
        on            : on,
        remove        : remove
      };
    }


    return {
      name: moduleName,
      dataHints: {
        "module": "documents can be text documents, or etherpad-lite documents or pdfs or whatever people consider a (text) document. But spreadsheets and diagrams probably not",
        "objectType text": "a human-readable plain-text document in utf-8. No html or markdown etc, they should have their own object types",
        "string text#content": "the content of the text document",

        "directory documents/notes/": "used by litewrite for quick notes",
        "item documents/notes/calendar": "used by docrastinate for the 'calendar' pane",
        "item documents/notes/projects": "used by docrastinate for the 'projects' pane",
        "item documents/notes/personal": "used by docrastinate for the 'personal' pane"
      },
      exports: {
        init: init,
        getPrivateList: getPrivateList,
        onChange: function(listName, callback) {
          myBaseClient.on('change', function(event) {
            var md = event.relativePath.match(new RegExp('^' + listName + '/(.+)$'));
            if(md) {
              event.id = md[1];
              callback(event);
            }
          });
        }
      }
    };
  });
})();
