/**
 * Created by Brookes on 7/8/15.

 Methods to the madness:
  - (_splitText) if contenteditable then split the nodes any time a space is typed
  - (_keydown) if contenteditable then don't create a <div> on enter, create 2 <br> tags so the parentElement stuff doesn't get thrown off
  - (_keyup) is like the point guard of the script. Decided what actions to take

Concepts:
  - anchors: @search_text that gets processed on every keyup.  " @" is the anchor for grabbing the text to searc with
  - tagged: @[123456789] facebook mention page ID's.
  - both have a seperate cache.  When a page is tagged the anchor that was associated with it is deleted

 */


/* ===================== Controller MODULE ================================== */
(function (exports, Views, fakeData) {
  'use-strict';

  var anchorClassName = 'srm-page-tagger-anchor';
  var taggedClassName ="srm-tagged-page";
  var _searchText = /\B@[A-Z0-9_]{3,}/gi;
  var _taggedText = /\B@\[[0-9]{5,}\]/gi
  var _spaceRegex = /\s/; // \u0200
  //var _atSymbolRegex = /\B\u0040/; // \B@
  //var keytimer;

  /* = Constructor ---------------------------------------------------------- */
  var _fbPageTaggerConstructor = function (watchElement, outputElement) {
    var boundKeyUp = _keyup.bind(this);
    var boundKeyDown = _keydown.bind(this);
    var positioning =  watchElement.style.position;
    this.isTextArea = watchElement.tagName.toLowerCase() === 'textarea';
    this.isContentEditable =  !this.isTextArea && watchElement.contentEditable;

    if (!this.isTextArea && !this.isContentEditable) {return}

    //this.cursor = {node: {}, offset: null}
    this.tempCache = {}; //Object.create(null);
    this.taggedCache = {}

    this.anchorCount = 0;
    this.currentAnchor;
    this.currentTag;
    this.element = watchElement;

    this.eventTunnel = {callback:_popoutCallback.bind(this)}; //for the template to communicate back with this
    this.popout = new Views.PopoutView({el: watchElement, eventTunnel: this.eventTunnel});
    this.tooltip = new Views.TooltipView({el: this.popout.wrapper, popoutEl: watchElement});


    //console.log("ELEMENT", watchElement, this);
    this.element.addEventListener('keyup', boundKeyUp, false);

    //different things for Content Editable
    if (this.isContentEditable) {
      if (!positioning) {watchElement.style.position = 'relative';}
      this.element.addEventListener('keydown', boundKeyDown, false); //primarily to prevent <div> tags on Enter
      this.tree = document.createTreeWalker(watchElement, NodeFilter.SHOW_TEXT, null, false);
    }

  };

  _fbPageTaggerConstructor.prototype.hideAll = function () {
    this.popout.hide();
    this.tooltip.hide();
  }

  _fbPageTaggerConstructor.prototype.blockKeyUp = function (bool) {
    if (this.isTextarea) { this.element.setAttribute('disabled', bool); }
    if (this.isContentEditable) { this.element.setAttribute('contenteditable', !bool); }
  }

  _fbPageTaggerConstructor.prototype.injectTaggedPage = function (pageID, anchorID, text) {
    var mention = "@[" + pageID + "]";
    var anchor = this.tempCache[anchorID];
    var node = anchor.node;
    var sibling = node.nextSibling
    var selection = _getSelection();
    var range = document.createRange(); //selection.getRangeAt(0);
    var offset =  _getCurrentCursorOffset();
    var spaceNode = document.createTextNode('\u00A0');
    var cursorNode = sibling

    this.hideAll();

    node.className = taggedClassName;
    node.setAttribute('data', text)
    node.textContent = mention;
    sibling.textContent = '\u00A0';
    this.element.insertBefore(spaceNode, node);

    //set ranges for selection
    selection.removeAllRanges();

    if (sibling.nextSibling) {
      sibling.textContent = '';
      cursorNode = sibling.nextSibling
    }

    range.setStart(cursorNode, 1);
    range.collapse(true);
    selection.addRange(range);
  }


  /* = Utility Stuff -------------------------------------------------------- */
  var _keydown = function (evt) {
      //override <div> being created
      if (evt.keyCode === 13) {
        evt.preventDefault();
        document.execCommand('insertHTML', false, '<br/><br/>'); //won't work in IE.  IE is just weird
      }
      return false;
  };


  var _keyup = function (evt) {
    //clearTimeout(keytimer);
    //console.log(evt.keyCode)
    var text = (!!evt.target.value)? evt.target.value : evt.target.textContent;
    var target = evt.target;
    var anchorMatches = text.match(_searchText);
    var taggedMatches = text.match(_taggedText);

    //split the nodes. or set the ranges. Do this no matter what.
    if (evt.keyIdentifier === "U+0020") {
      if (this.isTextArea) { _setRanges.call(this, this.element); }
      if (this.isContentEditable) { _splitText.call(this, this.tree.root.textContent); }
    }

    if (!anchorMatches && !taggedMatches)  {return}

    this.blockKeyUp(true);
    if (this.isContentEditable) { _setAnchors.call(this); }
    // if the cursor is inside an anchor or tag, the popup/tooltip will show up.
    //if it crossed out of one it will hide the popup/tooltip
    if (this.currentAnchor) {
      var data = _search(this.currentAnchor.search);
      this.popout.update(data, this.currentAnchor);
    } else {
      this.popout.hide();
    }

    if (this.currentTag) {
      this.tooltip.update(this.currentTag);
    } else {
      this.tooltip.hide();
    }
    this.blockKeyUp(false);
    //keytimer = setTimeout(function () {_paused() }, 500);
  }

  var _search = function (str) {
    return fakeData.items.filter(function (item) {
      var pageName = item['name'].toLowerCase();
      var index = pageName.indexOf(str);
      return index >= 0;
    });
  }

  var _splitText = function (text) {
    var currentNode = _getCurrentNode();
    var cursor = _getCurrentCursorOffset() - 1 ;

    currentNode.splitText(cursor);
    this.hideAll();
  }

  //for contentEditable
  var _setAnchors = function () {
      //isAnchorSet: if the previous node is a <span> of a specific type. I may change to <em>
      var cursor = _getCurrentCursorOffset();
      var current_node = _getCurrentNode();
      var prev_node = current_node.previousSibling;
      var current_text = current_node.nodeValue;

      if(_taggedText.test(current_text)) {
        this.currentAnchor = null;
        _setTagAnchor.call(this, current_text);
        return;
      }
      this.currentTag = null;

      var search_text = (current_text)? current_text.replace(/\s@/, '') : '';
      var isAnchor = _searchText.test(current_text);
      var isAnchorSet = (!!prev_node && !!prev_node.tagName && prev_node.tagName.toLowerCase() == 'span' && (prev_node.className.indexOf(anchorClassName) > -1))
      var currentIsFocus = current_node.isEqualNode(window.getSelection().focusNode);
      var currentIsParent =  current_node.isEqualNode(this.element);

      //create an empty span and insert it before the @ symbol
      if (currentIsFocus && isAnchor && !currentIsParent && !isAnchorSet) {
        var span = document.createElement('span');
        var anchorId = "srm-anchor-" + (++this.anchorCount);

        span.className = anchorClassName;
        span.setAttribute('data', anchorId);

        this.element.insertBefore(span, current_node);
        this.tempCache[anchorId] = {
          node: span,
          search: search_text,
          identifier: anchorId
        };

        this.currentAnchor = this.tempCache[anchorId];
      }

      //for editing an existing search
      if (isAnchor && isAnchorSet) {
        var retrievedAnchorId = prev_node.getAttribute('data');
        this.tempCache[retrievedAnchorId].search = search_text;
        this.currentAnchor = this.tempCache[retrievedAnchorId];
      }

      if (!isAnchor) {
        this.currentAnchor = null;
      }
  }

  //for textarea
  var _setRanges = function (element) {
    var selection =_getSelection()
    console.log("setting ranges for element", selection.focusNode, element.selectionStart, element)
  }

  var _setTagAnchor = function (text) {
    var identifier = /\d+/.exec(text)[0];
    this.currentTag = this.taggedCache[identifier]
  }

  var _getSelection = function () {
    return window.getSelection();
  }

  var _getCurrentCursorOffset = function () {
    return window.getSelection().focusOffset;
  }

  var _getCurrentNode = function () {
      return _getSelection().focusNode;
  }

  var _popoutCallback = function (pageID, anchor, text, index) {
    //console.log("Recieved", pageID, anchor, index);
    this.taggedCache[pageID] = {
      identifier: pageID,
      text: text,
      node: anchor.node
    }
    this.injectTaggedPage(pageID, anchor.identifier, text);
    delete this.tempCache[anchor.identifier];
  }

  /* = Exports & Initialize ------------------------------------------------- */
  exports.init = function (context, watchElement, outputElement) {
    var pageTagger = new _fbPageTaggerConstructor(watchElement, outputElement);
    return pageTagger;
  }

  return exports;
})(SRM.widgets.FacebookPageTagger = {}, SRM.widgets.FacebookPageTaggerViews, fakeData);
