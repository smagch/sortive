(function($, _, Backbone, undefined){
  

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
      .on('reset', this.render, this)
      .on('remove', this.removeItem, this);
    this.render();
  },
  change : function() {
    console.log('change');
  },
  removeItem : function(model) {
    console.log('removeItem');
    this.render();
  },
  addItem : function(model, coll) {
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
    var index = this.collection.indexOf(model);
    //this.$el.append(view.render().el);
    var target = this.$el.children(view.tagName + ':nth-child(' + (index + 1) + ')');
    if(target.length) {
      console.log('target length');
      view.render().$el.insertBefore(target);
    } else {
      this.$el.append(view.render().el);
    }        
  },
  addView : function(view) {
    var model = view
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
  
// setup
(function(){
  var getColor = function() {
        return '#'+(Math.random()*0xFFFFFF>>0).toString(16);
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

  var LeftView = PlaneListView.extend({    
    el : '#left-column',
    initialize : function(options) {      
      this.$el
      .sortive()
      .on('indexchange', _.bind(this.setMarker, this))
      .on('itemmove', _.bind(this.moveItem, this))
    //  .on('sortfocusin', _.bind(this.focusIn, this))
      .on('sortfocusout', _.bind(this.focusOut, this));
      PlaneListView.prototype.initialize.call(this, options);
    },
    events : {
      
    },
    focusOut : function(e, data) {
      console.log('focusout');
      $('#marker').removeClass('active');
    },
    setMarker : function(e, data) {
      console.log('index change catch');
      console.dir( data );
      var isOriginal = data.index === data.originalIndex;  
      if(isOriginal && data.isSelfSort) {
        $('#marker').removeClass('active');
      } else {
        // TODO
        // offset
        var offset = -20;
        var top = data.dimension.top;
        if(top) {
          top += offset;
        } else {
          var last = this.$el.children(':last-child');
          top =  last.offset().top + last.height() - offset;
        }
                                                  
         $('#marker')
         .addClass('active')
         .css({
           top : top
         });        
      }
    },   
    moveItem : function(e, data) {
      console.log('item move');
      $('#marker').removeClass('active');
      console.dir( data );
      var currentIndex = data.originalIndex,
          indexToInsert = data.index;
      
      var model = this.collection.at(currentIndex);
      this.collection.remove(model);
      var json = model.toJSON();
      console.log('indexToInsert : ' + indexToInsert);
      
      
      this.collection.add(json, {
        at : indexToInsert
      });      
    }
  });
  

  var RightView = PlaneListView.extend({    
    el : '#right-column',
    initialize : function(options) {
      this.$el.sortive({  
        selfSort : false,
        acceptive : false  
      }).on('itemsend', _.bind(this.sendItem, this));
      PlaneListView.prototype.initialize.call(this, options);
    },
    sendItem : function(e, data) {
      $('#marker').removeClass('active');
      console.log('item send');
      var model = this.collection.at(data.originalIndex);

      Left.collection.add(model.toJSON(), {
         at :  data.index
      });
      this.collection.remove(model);      
    }
  });
  var Left = new LeftView({
    collection : new PlaneCollection(getModels(10))
  }),
  Right = new RightView({
    collection : new PlaneCollection(getModels(10))
  });
  
})();
		



// return dimension witout element

})(jQuery, _, Backbone);