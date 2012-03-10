(function($, _){
  
  // TODO - make clone flag
  // TODO - consider $.data rather than event.data
  // TODO - consider invalidate method
  // TODO - add axis
  // TODO - multi drag
  var defaults = {
    item: 'div',
    zIndex: 1000,
    appendTo: 'body',
    cloneClass: 'dragging',
    selectClass: 'selected',
    // selector
    scrollElement: 'self',
    delay: 100,
    
    acceptive: true,
    // could be selector string, element,
    // array of elements or jquery object
    acceptiveFrom: '*',
    
    // TODO - enable self
    placeholder: '<h2>this is pleceholder</h2>',
    // TODO
    // if true, clone is automatically removed,
    // if false, clone is passed when mouseup
    cloneRemove: false,
    // TODO - it may be useful to add option like below
    // insertive : true,
    // insertiveTo : '*', // potentially selector, element, jQuery object
    
    selfSort: true
  },
  
  // store all sortive element
  container = [ ],
  
  //timeoutId = undefined,
  
  // isUpped = true,
  
  
  methods = {
    init : function(options) {
      options = $.extend({}, defaults, options);
      
      // reset all sortive elements
      // determine which containers is acceptive to this
      this
        .data('sortive', options)
        .on('mousedown.sortive', options.item, downHandler)
        .each(function() {
          container.push(this);
        });
      
      return this;
    },
    destroy : function() {
      
      this
        .removeData('sortive')
        .off('mousedown.sortive', downHandler)
        .each(function() {
          var index = _.indexOf(this);
          container.splice(index, 1);
        });
      
      return this;
    },
    
    options : function(options) {
      var data = this.data('sortive');
      if(!options) {
        return data;
      }
      
      $.extend(data, options);
      // if(data.scrollElement === 'self') {
      //   data.scrollElement = $(this);
      // } else {
      //   data.scrollElement = $(data.scrollElement);
      // }
    },
    
    getAcceptive : function() {
      
      var ret = [ ];
      this.each(function() {
        var $self = $(this);
        
        _.each(container, function(sortive) {
          var options = $(sortive).data('sortive');
          if(!$self.is(sortive) ) {
            // TODO - test if acceptiveFrom is correctly performed
            options.acceptive && ( options.acceptiveFrom === '*' ||
              $(options.acceptiveFrom).is(sortive) ) && ret.push(sortive);
          } else {
            options.selfSort && ret.push(sortive);
          }
        });
      });
      return ret;
    }
  },
  
  getRects = function(sortives, $target, elementIndex, options) {
    // TODO cache scrollEl somewhere
    var $scrollEl = options.scrollElement === 'self' ? $target : $(options.scrollElement),
      scrollTop = $scrollEl.scrollTop(),
      scrollLeft = $scrollEl.scrollLeft();
    function toGlobal(offset) {
      return {
        left: offset.left + scrollLeft,
        top: offset.top + scrollTop
      };
    }
    
    return _.map(sortives, function(sortive) {
      var $sortive = $(sortive),
      selfOffset = toGlobal($sortive.offset()),
      rect = _.extend( {}, selfOffset, {
        right : selfOffset.left + $sortive.width(),
        bottom : selfOffset.top + $sortive.height()
      }),
      dimensions = {
        top : [],
        bottom : [],
        $el: []
      },
      isSelfSort = $target.is(sortive);
      
      $sortive.children(options.item).each(function() {
        var $self = $(this),
          offset = toGlobal($self.offset());
          dimensions.top.push(offset.top);
          dimensions.bottom.push(offset.top + $self.height());
          dimensions.$el.push($self);
        });
      
      // if selfSort, remove dragging element's dimension
      if(isSelfSort) {
        dimensions.top.splice(elementIndex, 1);
        dimensions.bottom.splice(elementIndex, 1);
        dimensions.$el.splice(elementIndex, 1);
      }
      
      return {
        // bounding rect of sortive instance
        rect : rect,
        children : dimensions,
        isSelfSort : isSelfSort,
        $el : $sortive
      };
    });
  },
  
  downHandler = function(e) {
    
    // TODO - when missed mouseup event, should excute upHandler
    // if( $el ) {
     //   throw new Error('$el is not removed')
     //   mouseUpHandler.call(this);
     // }
     //options = e.data,
     //_.bind(startDrag, this, e)
    var timeoutId,
      self = this,
      delay = $(e.delegateTarget).data('sortive').delay;
    
    function timeoutHandler(e) {
      if(timeoutId) {
        clearTimeout(timeoutId);
      }
    }
    
    timeoutId = setTimeout(function() {
      timeoutId = undefined;
      $(document).off('mouseup.sortive', timeoutHandler);
      startDrag.call(self, e);
    }, delay);
    
    $(document).one('mouseup.sortive', timeoutHandler);
  },
  
  startDrag = function(e) {
    var $sortive = $(e.delegateTarget),
    options = $sortive.data('sortive'),
    $self = $(this),
    offset = $self.offset(),
    w = $self.width(),
    h = $self.height(),
    index = $self.index(),
    
    offsetX = offset.left - e.clientX,
    offsetY = offset.top - e.clientY,
    
    acceptives = $sortive.sortive('getAcceptive'),
    
    $scrollEl = options.scrollElement === 'self' ? $sortive : $(options.scrollElement),
    
    $clone = $self
      .clone()
      .css({
        //left: $scrollEl.scrollLeft() + offset.left,
        //top: $scrollEl.scrollTop() + offset.top,
        left: offset.left,
        top: offset.top,
        position: 'absolute',
        width: w,
        height: h,
        zIndex: options.zIndex
      })
      .addClass(options.cloneClass)
      //appendTo(options.scrollElement),
      .appendTo(options.appendTo),

    rects = ( !!acceptives.length && getRects(acceptives, $sortive, index, options)),
  
    data = {
      $original: $self,
      $scrollEl: $scrollEl,
      $clone: $clone,
      $sortive: $sortive,
      $placeholder: null,
      rects: rects,
      offsetX: offsetX,
      offsetY: offsetY,
      centerOffsetX: w * 0.5,
      centerOffsetY: h * 0.5,
      height: h,
      originalIndex: index,
      options: options,
      currentIndex : (options.selfSort && index)
    };

    //currentIndex = data.originalIndex;
    $self.addClass(options.selectClass);
    $(document)
      .on('mousemove.sortive', data, moveHandler)
      .on('mouseup.sortive', data, upHandler);
  },
  
  upHandler = function(e) {
    $(document)
      .off('mousemove.sortive', moveHandler)
      .off('mouseup.sortive', upHandler);
    
    var data = e.data;
    data.$original.removeClass(data.options.selectClass);
    data.$clone.remove();
    data.$placeholder && data.$placeholder.remove();
    
    
    //e.data.$sortive.trigger('itemdropped', eventData());
    var dataToSend = eventData();
    if( dataToSend ){
      // TODO - send clone itself
      if( dataToSend.isSelfSort) {
        dataToSend.$target.trigger('itemmove', dataToSend);
      } else {
        e.data.$sortive.trigger('itemsend', dataToSend);
      }
    }
    
    eventData.clear();
  },
  
  
  
  isOutOfBound = function(rect, x, y) {
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  },
  
  eventData = (function(){
    var _data = { },
    ret = function(data) {
      if(!data) {
        return _data;
      }
      if(!_data) {
        _data = {};
      }
      _.extend( _data , data);
    };
    
    ret.clear = function() {
      _data = undefined;
    };
    return ret;
  })(),
  
  moveHandler = function(e) {
    var data = e.data,
    $clone = data.$clone,
    offset = {
      //left : data.$scrollEl.scrollLeft() + data.offsetX + e.clientX,
      //top : data.$scrollEl.scrollTop() + data.offsetY + e.clientY
      left: data.offsetX + e.clientX,
      top: data.offsetY + e.clientY
    },
    rects = e.data.rects,
    // TODO - currently only support up and down
    direction;
    
    $clone.css(offset);
    
    offset.left += data.$scrollEl.scrollLeft();
    offset.top += data.$scrollEl.scrollTop();
    if( !data.rects ) {
      return;
    }
    
    var x =  offset.left + data.centerOffsetX,
        y =  offset.top + data.centerOffsetY,
        targetRect = _.find(rects, function(rect) {
          return !isOutOfBound(rect.rect, x, y);
        });
    
    if(!targetRect) {
      var eData = eventData(),
          $focusedTarget = eData && eData.$target;
      if( $focusedTarget ) {
        $focusedTarget.trigger('sortfocusout');
      }
      eventData.clear();
      data.$placeholder && data.$placeholder.remove();
    } else {
      var dimensions = targetRect.children;
      // if not selfSort, use top
      if( targetRect.isSelfSort && data.$original.offset().top < offset.top ) {
        direction = 'bottom';
        offset['bottom'] = offset.top + data.height;
      } else {
        direction = 'top';
      }
      
      var index = _.sortedIndex( dimensions[direction], offset[direction]);
      // TODO - targetRect change
      if( index !== data.currentIndex ) {
        data.currentIndex = index;
        eventData({
          index: {
            from: data.originalIndex,
            to: index
          },
          isSelfSort: targetRect.isSelfSort,
          direction: direction,
          // current elements dimension
          dimension: {
            top: dimensions.top[index],
            bottom: dimensions.bottom[index]
          },
          $original: data.$original,
          $target: targetRect.$el
        });
        
        if(data.originalIndex === index && targetRect.isSelfSort) {
          data.$placeholder && data.$placeholder.remove();
        } else if(index !== dimensions.top.length) {
          data.$placeholder || (data.$placeholder = $(data.options.placeholder));
          dimensions.$el[index].before(data.$placeholder);
        } else {
          data.$placeholder || (data.$placeholder = $(data.options.placeholder));
          targetRect.$el.append(data.$placeholder);
        }
        targetRect.$el.trigger('indexchange', eventData());
      }
    }
  };
  
  
  $.fn['sortive'] = function(method) {
    if( methods[method] ) {
      return methods[method].apply(this, Array.prototype.slice.call( arguments, 1 ));
    } else if( method in defaults ) {
      if( arguments[1] ) {
        // options setter
        return methods.options.call(this, {
          method : arguments[1]
        });
      }
      // options getter
      return methods.options.call(this)[method];
    } else if( typeof method === 'object' || !method ){
      return methods['init'].apply(this, arguments);
    } else {
      $.error( 'Method ' +  method + ' is invalid' );
    }
  };
  
})(jQuery, _);