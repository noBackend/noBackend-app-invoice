var AccountBar = function( $el, attributes ) {
  this.$el = $el;
  this.$body = $(document.body);

  this.bindToEvents();
  this.renderSignedOut();
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
      $form = $.modalForm({
        fields: [ 'username', 'password', 'password_confirmation' ],
        submit: 'Sign Up'
      });
      break;
    case 'signin':
      $form = $.modalForm({
        fields: [ 'username', 'password' ],
        submit: 'Sign in'
      });
      break;
    case 'resetpassword':
      $form = $.modalForm({
        fields: [ 'username' ],
        submit: 'Reset Password'
      });
      break;
    case 'changepassword':
      $form = $.modalForm({
        fields: [ 'current_password', 'new_password' ],
        submit: 'Reset Password'
      });
      break;
    case 'changeusername':
      $form = $.modalForm({
        fields: [ 'current_password', 'new_username' ],
        submit: 'Reset Password'
      });
      break;

    case 'destroy':
      if( window.confirm("you sure?") ) {
        this.trigger(action);
      }
      return;
      
    default:
      this.trigger(action);
      return;
  }

  $form.on('submit', function(event, inputs) {
    this.trigger(action, inputs);
  }.bind(this));
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

AccountBar.prototype.on = function(eventName, callback) {
  this.$el.on.apply(this.$el, [eventName, function(event, properties) {
    callback(properties);
  }]);
};

AccountBar.prototype.trigger = function() {
  this.$el.trigger.apply(this.$el, arguments);
};