var AccountBar = function( $el, attributes ) {
  this.$el = $el;
  this.$body = $(document.body);

  this.bindToEvents();

  if ( account.username ) {
    this.renderSignedIn( account.username );  
  } else {
    this.renderSignedOut();  
  }
  
};

AccountBar.prototype.bindToEvents = function() {
  this.$el.unbind();
  this.$el.on('click', '[data-action]', this.handleUserAction.bind(this));
};

AccountBar.prototype.handleUserAction = function(event) {
  event.preventDefault();
  var action   = $(event.target).data('action');

  switch(action) {
    case 'signup':
      $.modalForm({
        fields: [ 'username', 'password', 'password_confirmation' ],
        submit: 'Sign Up'
      }).on('submit', function(event, inputs) {
        account.signUp( inputs.username, inputs.password )
        .fail( App.renderModalFormError )
      })
      break;
    case 'signin':
      $.modalForm({
        fields: [ 'username', 'password' ],
        submit: 'Sign in'
      }).on('submit', function(event, inputs) {
        account.signIn( inputs.username, inputs.password )
        .fail( App.renderModalFormError )
      })
      break;
    case 'signout':
      account.signOut()
      break;
    case 'resetpassword':
      $.modalForm({
        fields: [ 'username' ],
        submit: 'Reset Password'
      }).on('submit', function(event, inputs) {
        account.signIn( inputs.username )
        .fail( App.renderModalFormError )
      })
      break;
    case 'changepassword':
      $.modalForm({
        fields: [ 'current_password', 'new_password' ],
        submit: 'Reset Password'
      }).on('submit', function(event, inputs) {
        account.changePassword( inputs.current_password, inputs.new_password )
        .fail( App.renderModalFormError )
      })
      break;
    case 'changeusername':
      $.modalForm({
        fields: [ 'current_password', 'new_username' ],
        submit: 'Reset Password'
      }).on('submit', function(event, inputs) {
        account.changeUsername( inputs.current_password, inputs.new_username )
        .fail( App.renderModalFormError )
      })
      break;

    case 'destroy':
      if( window.confirm("you sure?") ) {
        account.destroy()
      }
      return;
  }
};

AccountBar.prototype.render = function() {
  this.$body.attr('data-account-status', this.status);
  this.$el.find('.username').text( this.username || '');
};

AccountBar.prototype.renderSignedOut = function() {
  this.username = undefined;
  this.status = 'signedout';
  this.render();
};
AccountBar.prototype.renderSignedIn = function(username) {
  this.username = username;
  this.status = 'signedin';
  this.render();
};
AccountBar.prototype.renderAuthenticationError = function() {
  this.status = 'error';
  this.render();
};