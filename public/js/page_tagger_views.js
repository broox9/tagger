/* ===================== TEMPLATE MODULE ==================================== */
(function () {
  'use-strict';

  function _getInputBounds (element) {;
    return {
      top: element.offsetTop,
      left: element.offsetLeft,
      height: element.offsetHeight,
      width: element.offsetWidth
    }
  }

  // The View
  var PopoutView = Backbone.View.extend({
    className: 'srm-page-tagger-popout',
    template: _.template('<ul><% for(i=0;i<items.length;i++){ %> <li class="srm-tagger-result-item" data-page-id="<%= items[i].id %>"><%= items[i].name %></li> <% } %></ul>'),

    delegateEvents: function () {
      $(this.wrapper).on('click', '.srm-tagger-result-item',  this.handleSelectTag);
      return this;
    },

    initialize: function (opts) {
      //console.log("temp init", this)
      _.bindAll(this, 'handleSelectTag');
      this.eventTunnel = this.options.eventTunnel;
      this.isActive = false;
      this.currentAnchor;
      this.currentData;
      this.inputBounds = _getInputBounds(this.el);
      this.preRender();
      this.render();
    },

    // getInputBounds: function () {
    //   var el = this.el;
    //   return {
    //     top: el.offsetTop,
    //     left: el.offsetLeft,
    //     height: el.offsetHeight,
    //     width: el.offsetWidth
    //   }
    // },

    preRender: function () {
        this.wrapper = document.createElement('div');
        this.wrapper.className = this.className;
        var insertTarget = this.el.nextSibling;
        this.el.parentElement.insertBefore(this.wrapper, insertTarget);
    },

    render: function (data) {
      this.currentData = data;
      var items = (data)? {items: data} : {items: [{id: '', name:''}]};
      var html = this.template(items);

      this.wrapper.innerHTML = html;
      return this;
    },

    setPosition: function (element) {
      var range = document.createRange();
      range.selectNode(element);
      var bounds = range.getClientRects()[0];
      var el_bound = element.getBoundingClientRect();
      var top = this.inputBounds.top; //+ element.offsetTop + element.offsetHeight; //(this.inputBounds.top + element.offsetTop + element.offsetHeight + 3);

      //this.el.style.display = 'inline-block';
      var left = this.inputBounds.width; //element.offsetLeft + this.inputBounds.width; //(element.offsetLeft)


      console.log("EL Bound", this.el.offsetWidth,  this.el.style.paddingLeft)

      this.wrapper.style.top = top +  'px'; //TODO: switch 22 to line-height
      this.wrapper.style.left = left + 'px';
      this.show();
    },

    show: function () {
      this.isActive = true;
      $(this.wrapper).addClass('active');
    },

    hide: function () {
      this.isActive = false;
      $(this.wrapper).removeClass('active');
    },

    update: function (data, anchor) {
      this.setPosition(anchor.node)
      this.render(data);
      this.currentAnchor = anchor
    },

    handleSelectTag: function (evt) {
      var index =  $(evt.target).index();
      var pageID = $(evt.target).data('page-id');
      var text = evt.target.textContent;
      this.eventTunnel.callback(pageID, this.currentAnchor, text, index);
    }
  });





  /* = Tooltip View --------------------------------------------------------- */
  var TooltipView = Backbone.View.extend({
    className: 'srm-page-tagger-tooltip',
    template: _.template('<strong><%= text %></strong>'),

    initialize: function (options) {
      console.log("Tooltip", this)
      this.preRender();
      this.inputBounds = _getInputBounds(options.popoutEl);
    },

    preRender: function () {
      var div = this.wrapper = document.createElement('div');
      var nextSibling = this.el.nextSibling;
      div.className = this.className;

      if (nextSibling) {
        this.el.parentElement.insertBefore(div, nextSibling)
      } else {
        this.el.appendChild(div)
      }

      div.style.left = this.el.style.left;
      div.style.top = this.el.style.top;
    },

    render: function (tag) {
      var html = this.template({text: tag.text });
      this.wrapper.innerHTML = html;
      this.show();
    },

    setPosition: function (element) {
      console.log("set position", element)
      var range = document.createRange();
      range.selectNode(element);
      var bounds = range.getClientRects()[0];
      var el_bound = element.getBoundingClientRect();
      var top = this.inputBounds.top; //(this.inputBounds.top + element.offsetTop + element.offsetHeight + 3);
      var left = this.inputBounds.width; //(element.offsetLeft)


      this.wrapper.style.top = top +  'px'; //TODO: switch 22 to line-height
      this.wrapper.style.left = left + 'px';
      this.show();
    },

    show: function () {
      $(this.wrapper).addClass('active');
    },

    hide: function () {
      $(this.wrapper).removeClass('active');
    },

    update: function (tag) {
      this.setPosition(tag.node)
      this.render(tag);
      this.currentTag = tag
    },

  });

  return SRM.widgets.FacebookPageTaggerViews = {PopoutView: PopoutView, TooltipView: TooltipView}
})();
