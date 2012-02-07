(function($, _, Backbone, undefined){
  

// jQuery plugin 





var PlaneModel = Backbone.Model.extend({});
var PlaneCollection = Backbone.Collection.extend({
  model : PlaneModel
});
var PlaneView = Backbone.View.extend({
  tagName : 'div',
  initialize : function() {
    
  },
  //template : _.template('<div></div>'),
  render : function() {
    this.$el.css(this.model.toJSON());
          
    return this;
  }
});
var PlaneListView = Backbone.View.extend({
  
  initialize : function() {
    //this.collection = new PlaneCollection();
    this.collection
      .on('add', this.addItem, this)
      .on('change', this.change, this)
      .on('reset', this.render, this);
    this.render();
  },
  change : function() {
    console.log('change');
  },
  addItem : function(model) {
    console.log('add');
    if(_.isArray(model)) {
      model.each(this.createItem);
    } else {
      this.createItem(model);
    }
  },
  createItem : function(model) {
    console.log('create');
    var view = new PlaneView({model: model});
    this.$el.append(view.render().el);
  },
  render : function() {
    console.log('render');
    this.$el.html('');
    if( this.collection.length ) {                    
      this.collection.each( this.createItem, this );
    } 
    return this;                    
  }
});
  

$('#left-column').sortive({
  
})
.on('indexchange', function(e, data) {
  console.log('index change catch');
  console.dir( data );
  var isOriginal = data.index === data.originalIndex;  
  if(isOriginal && data.isSelfSort) {
    $('#marker').removeClass('active');
  } else {
    // TODO
    var offset = data.direction === 'up' ? 20 : -20;
    var css = offset + data.dimension.top;
    
    console.log('css : ' + css);
      
    $('#marker')
    .addClass('active')
    .css({
      top : css
    });        
  }  
})
.on('drop', function(e, data) {
  console.log('drop');
  $('#marker').removeClass('active');
  // move model here
  // get model from data
  
  
  
});



$('#right-column').sortive({  
  selfSort : false,
  acceptive : false  
}).on('drop', function(e, data) {
  $('#marker').removeClass('active');
});


// setup
(function(){
  var getColor = function() {
        return (Math.random() * 0xFFFFFF >> 0).toString(16); 
      },
      getHeight = function() {
        return 50 + Math.floor(Math.random() * 50);
      },
      getModel = function() {
        return {
          background: getColor(),
      		height : getHeight()
        };
      },
      getModels = function(num) {
        var models = [];
        for(var i=0; i < num; i++) {
          models.push(getModel());
        }
        return models;
      };

  var LeftView = new PlaneListView({
    collection : new PlaneCollection(getModels(10)),
    el : '#left-column'
  });
  

  var RightView = new PlaneListView({
    collection : new PlaneCollection(getModels(10)),
    el : '#right-column'
  });
  //$('#left-column').append(divs);
  //$('#right-column').append(getDivs(20));
})();
		



// return dimension witout element

})(jQuery, _, Backbone);