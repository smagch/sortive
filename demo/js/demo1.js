(function($, _, Backbone, undefined){

var PlaneModel = Backbone.Model.extend({});
var PlaneCollection = Backbone.Collection.extend({
  model : PlaneModel
});

var PlaneListView = Backbone.View.extend({
  template: _.template($('#panel-template').html()),
  initialize: function() {
    this.collection
      .on('add', this.addItem, this)
      .on('reset', this.render, this)
      .on('remove', this.removeItem, this);
    this.render();
  },
  removeItem : function(model) {
    console.log('removeItem');
    this.render();
  },
  addItem : function(model, coll) {
    this.render();
  },
  createItem : function(model, anim) {
    console.log('create');
  },
  render : function() {
    console.log('render');
    return this.$el.html(
      this.template({models: this.collection.toJSON()})
    );
  }
});

var getModels = (function(){
  var getColor = function() {
        return '#'+(Math.random()*0xFFFFFF>>0).toString(16);
      },
      getHeight = function() {
        return 50 + Math.floor(Math.random() * 50);
      },
      getChar = function() {
        var chars = 'ABCDEFGHIJKLMNOPQUSTUVWZ',
          length = chars.length,
          index = Math.floor(Math.random() * length);
        return chars[index];
      },
      getModel = function() {
        return {
          background: getColor(),
          height : getHeight(),
          char: getChar()
        };
      };
  return function(num) {
    var models = [];
    for(var i=0; i < num; i++) {
      models.push(getModel());
    }
    return models;
  };
})();


var LeftView = PlaneListView.extend({
  el : '#left-column',
  initialize : function(options) {
    this.$el
    .sortive()
    .on('itemmove', _.bind(this.moveItem, this))
    PlaneListView.prototype.initialize.call(this, options);
  },
  events : {},
  moveItem : function(e, data) {
    console.log('item move');
    console.dir( data );    
    var model = this.collection.at(data.index.from);
    this.collection
      .remove(model)
      .add(model,{
        at: data.index.to
      });
  }
});

var left = new LeftView({
  collection: new PlaneCollection(getModels(2))
});

var RightView = PlaneListView.extend({
  el : '#right-column',
  initialize : function(options) {
    this.$el.sortive({
      selfSort: false,
      acceptive: false
    })
    .on('itemsend', _.bind(this.sendItem, this));

    PlaneListView.prototype.initialize.call(this, options);
  },
  sendItem : function(e, data) {
    var model = this.collection.at(data.index.from);
    console.dir( model );
    left.collection
      .add(model.toJSON(), {
        at: data.index.to
      })
      .remove(model);
  }
});


var right = new RightView({
  collection: new PlaneCollection(getModels(10))
});


})(jQuery, _, Backbone);