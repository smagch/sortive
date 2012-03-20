(function($, _, Backbone){
'use strict';

var ItemCollection = Backbone.Collection.extend({
  initialize: function() {}
});

var ItemView = Backbone.View.extend({
  template: _.template($('#template').html()),
  initialize: function() {
    this.collection
      .on('reset', this.render, this);

    this.$el.sortive({
    });
    this.render();
  },
  render: function() {
    var out = this.template({
      models: this.collection.toJSON()
    });
    this.$el.html(out);
  }
});

var getModels = (function(){
  var strings = 'hoge foo bar this is good or bad I am not sure'.split(/\s+/g),
    strLength = strings.length;

  function getString() {
    var index = Math.floor(strLength * Math.random());
    return strings[index];
  }

  return function(num) {
    var ret = [];
    for(var i = 0; i < num; i++) {
      ret[i] = {
        string: getString()
      }
    }
    return ret;
  };
})();



$('.box').each(function() {
  var itemView = new ItemView({
    el: '#' + this.id,
    collection: new ItemCollection(getModels(30))
  });
})

})(jQuery, _, Backbone);