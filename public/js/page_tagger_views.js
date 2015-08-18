/* ===================== TEMPLATE MODULE ==================================== */
(function () {
  'use-strict';

  function _getInputBounds (element) {;
    return {
      styles: window.getComputedStyle(element),
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
      _.bindAll(this, 'handleSelectTag');
      this.eventTunnel = this.options.eventTunnel;
      this.isActive = false;
      this.currentAnchor;
      this.currentData;
      this.inputBounds = _getInputBounds(this.el);
      this.paddingTotal = parseFloat(this.inputBounds.styles.paddingLeft) + parseFloat(this.inputBounds.styles.paddingRight);
      this.preRender();

      this.loaderElement = this.wrapper.querySelector('.srm-tagger-searching')
    },

    preRender: function () {
        this.wrapper = document.createElement('div');
        this.wrapper.className = this.className;
        var insertTarget = this.el.nextSibling;
        var searchDiv = '<div class="srm-tagger-searching">searching...</div>';
        var resultsDiv =  '<div class="srm-tagger-results"></div>';

        this.wrapper.innerHTML = searchDiv + resultsDiv;
        this.resultsList = this.wrapper.querySelector('.srm-tagger-results')

        this.el.parentElement.insertBefore(this.wrapper, insertTarget);
    },

    render: function (data) {
      this.currentData = data;
      var html;

      if (!data) {
        html = '<ul><li class="srm-tagger-no-results">No results</li></ul>';
      } else {
        if (data.items.length == 0) {
          html = '<ul><li class="srm-tagger-no-results">No results</li></ul>';
        } else {
          html = this.template(data);
        }
      }

      this.resultsList.innerHTML = html;
      this.show();
      return this;
    },

    setPosition: function (anchor) {
      console.log('setting ', anchor)
      // this.wrapper.style.top = ((anchor.offset.top - this.el.offsetTop) + (anchor.offset.height * 2) + parseFloat(this.inputBounds.styles.paddingTop)) +  'px';
      var isTextarea = this.el.tagName.toLowerCase() == 'textarea';
      var top = (isTextarea)? ((anchor.offset.top - this.el.offsetTop) + (anchor.offset.height * 2) + parseFloat(this.inputBounds.styles.paddingTop)) : (this.el.offsetTop + anchor.offset.height + 3)

      var left = (isTextarea)? (anchor.position.left - anchor.offset.height) : (anchor.offset.left + this.el.offsetLeft)

      this.wrapper.style.top = top +'px';
      this.wrapper.style.left = left + 'px';
    },

    show: function (anchor) {
      if (anchor) {
        this.setPosition(anchor)
      }
      $(this.wrapper).addClass('active');
      this.isActive = true;
    },

    hide: function () {
      this.isActive = false;
      $(this.wrapper).removeClass('active');
    },

    update: function (data, anchor) {
      if (!this.isActive) {
        this.setPosition(anchor)
      }
      this.setPosition(anchor)
      this.render(data);
      this.currentAnchor = anchor;
    },

    handleSelectTag: function (evt) {
      var index =  $(evt.target).index();
      var pageID = $(evt.target).data('page-id');
      var text = evt.target.textContent;
      this.eventTunnel.callback(pageID, this.currentAnchor, text, index);
    },

    showLoading: function () {
      $(this.loaderElement).addClass('active')
    },

    hideLoading: function () {
      $(this.loaderElement).removeClass('active')
    }
  });












  /* = Tooltip View --------------------------------------------------------- */
  var TooltipView = Backbone.View.extend({
    className: 'srm-page-tagger-tooltip',
    template: _.template('<strong><%= text %></strong>'),

    initialize: function (options) {
      console.log("Tooltip", this);
      this.popoutEl = options.popoutEl;
      this.preRender();
      this.inputBounds = _getInputBounds(options.popoutEl);
      this.paddingTotal = parseFloat(this.inputBounds.styles.paddingLeft) + parseFloat(this.inputBounds.styles.paddingRight);
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
      // var range = document.createRange();
      // range.selectNode(element);
      // var bounds = range.getClientRects()[0];
      // var el_bound = element.getBoundingClientRect();
      // var top = this.inputBounds.top; //(this.inputBounds.top + element.offsetTop + element.offsetHeight + 3);
      // var left = this.inputBounds.width; //(element.offsetLeft)
      //
      // this.wrapper.style.top = top +  'px'; //TODO: switch 22 to line-height
      // this.wrapper.style.left = left + 'px';
      // this.show();

      console.log("set position" , this)
      this.wrapper.style.top = (this.el.offsetTop) + 'px';
      this.wrapper.style.left = (this.popoutEl.offsetWidth + this.paddingTotal) + 'px';
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
