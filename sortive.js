(function($, _){
  'use strict';
  // TODO - make clone flag
  // TODO - consider $.data rather than event.data
  // TODO - consider invalidate method
  // TODO - add axis
  // TODO - multi drag
  var defaults = {
    item: 'div',
    // drag specific selector inside item
    match: '',
    // drag except selector inside item
    exclude: 'a',

    zIndex: 1000,
    appendTo: 'body',
    cloneClass: 'dragging',
    selectClass: 'selected',
    // selector
    scrollElement: 'self',
    delay: 400,

    acceptive: true,
    // could be selector string, element,
    // array of elements or jquery object
    acceptiveFrom: '*',
    // TODO - enable clone
    placeholder: '<h2>this is pleceholder</h2>',

    // TODO
    // if true, clone is automatically removed,
    // if false, clone is passed when mouseup
    cloneRemove: false,
    // if false, only sort inside another sortive element
    selfSort: true
    // TODO - it may be useful to add option like below
    // insertive : true,
    // insertiveTo : '*', // potentially selector, element, jQuery object

  },
  
  // store all sortive element
  container = [ ],
  
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
        .off('mousedown.sortive')
        .each(function() {
          var index = _.indexOf(this);
          container.splice(index, 1);
        });
      return this;
    },

    options : function(options) {
      var data = this.data('sortive');
      // getter
      if(!options) {
        return data;
      }
      // setter
      $.extend(data, options);
    },

    getAcceptives : function() {
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

  getRects = function($acceptives, data) {
    var $target = data.$sortive,
      elementIndex = data.originalIndex,
      options = data.options;

    return _.map($acceptives, function(sortive) {
      var $sortive = $(sortive),
        isSelfSort = $target.is(sortive),
        offset = $sortive.offset(),
        rect = _.extend( offset, {
          right : offset.left + $sortive.width(),
          bottom : offset.top + $sortive.height()
        });

      return {
        rect: rect,
        $el: $sortive,
        //children : dimensions,
        isSelfSort: isSelfSort,
        // TODO - somewhere else
        elementIndex: elementIndex
      };
    });
  },

  getDimensions = function(rect, data) {
    console.log('get dimension');
    var options = data.options,
      dimensions = {
        top : [],
        bottom : [],
        $el: []
      };

    rect.$el.children(options.item).each(function() {
      var $self = $(this),
        offset = $self.offset();

      dimensions.top.push(offset.top);
      dimensions.bottom.push(offset.top + $self.height());
      dimensions.$el.push($self);
    });

    // if selfSort, remove dragging element's dimension
    if(rect.isSelfSort) {
      var elementIndex = rect.elementIndex;
      dimensions.top.splice(elementIndex, 1);
      dimensions.bottom.splice(elementIndex, 1);
      dimensions.$el.splice(elementIndex, 1);
    }

    rect.children = dimensions;
    return dimensions;
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
      $delegateTarget = $(e.delegateTarget),
      data = $delegateTarget.data('sortive'),
      $target = $(e.target),
      match = data.match || '',
      exclude = data.exclude || '';

    // if target doesn't match or exclude item , return
    if( match !== '' && !$target.is(match) && !$target.parents(match).length ) {
        return;
    }
    // if target is a item to be excluded, return
    if(exclude !== '' && $target.is(exclude) ) {
        return;
    }
    function timeoutHandler(e) {
      if(timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    timeoutId = setTimeout(function() {
      timeoutId = undefined;
      $(document).off('mouseup.sortive', timeoutHandler);
      $(self).trigger('dragstart', {
        $target: $target,
        $delegateTarget: $delegateTarget
      });
      startDrag.call(self, e);
    }, data.delay);
    
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

    $acceptives = $sortive.sortive('getAcceptives'),

    $scrollEl = options.scrollElement === 'self' ? $sortive : $(options.scrollElement),

    $clone = $self
      .clone()
      .css({
        left: offset.left,
        top: offset.top,
        position: 'absolute',
        width: w,
        height: h,
        zIndex: options.zIndex
      })
      .addClass(options.cloneClass)
      .appendTo(options.appendTo),

    data = {
      $original: $self,
      $scrollEl: $scrollEl,
      $clone: $clone,
      $sortive: $sortive,
      $placeholder: null,
      offsetX: offsetX,
      offsetY: offsetY,
      centerOffsetX: w * 0.5,
      centerOffsetY: h * 0.5,
      height: h,
      originalIndex: index,
      options: options,
      scrollTop: NaN,
      scrollLeft: NaN,
      currentIndex : (options.selfSort && index)
    };

    data.rects = ( !!$acceptives.length && getRects($acceptives, data));
    // TODO - if no acceptive, should be return??
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
        left: data.offsetX + e.clientX,
        top: data.offsetY + e.clientY
      },
      rects = data.rects,
      $scrollEl = data.$scrollEl,
      // TODO - currently only support up and down
      direction;

    $clone.css(offset);

    if( !data.rects ) {
      return;
    }

    var x = offset.left + data.centerOffsetX,
        y = offset.top + data.centerOffsetY,
        targetRect = _.find(rects, function(rect) {
          return !isOutOfBound(rect.rect, x, y);
        });

    if(!targetRect) {
      var eData = eventData(),
        $focusedTarget = eData && eData.$target;
      if($focusedTarget) {
        $focusedTarget.trigger('sortfocusout');
      }
      eventData.clear();
      data.$placeholder && data.$placeholder.remove();
    } else {
      // if selfsort, add scroll

      var dimensions = targetRect.children;
      if(!dimensions) {
        dimensions = getDimensions(targetRect, data);
        if(targetRect.isSelfSort) {
          data.scrollTop = $scrollEl.scrollTop();
          data.scrollLeft = $scrollEl.scrollLeft();
        }
      }

      if(targetRect.isSelfSort) {
        offset.left += $scrollEl.scrollLeft() - data.scrollLeft;
        offset.top += $scrollEl.scrollTop() - data.scrollTop;
      }

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
        //targetRect.$el.trigger('indexchange', eventData());
      }
    }
  };

  $.fn['sortive'] = function(method) {
    if( methods[method] ) {
      return methods[method].apply(this, Array.prototype.slice.call( arguments, 1 ));
    } else if( typeof method === 'object' || !method ){
      return methods['init'].apply(this, arguments);
    } else {
      $.error( 'Method ' +  method + ' is invalid' );
    }
  };
  
})(jQuery, _);