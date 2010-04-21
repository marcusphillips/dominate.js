////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//// Dominate - Marcus Phillips 2009
//// A templating system for JavaScript
////
//// Version ~0.2
//// Please report any bugs to dominate@closureka.com
////
//// Requires:
////   - Qombat
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

(function(){

  // the basic workhorse of this library
  // accetps
  //   a node type
  //   (optional) any number of objects are turned into attribute mappings for the dom node
  //     properties in the objects may be functions, if their keys are valid events.  they will be bound automatically.
  //   (optional) any number of arrays, which are agregated and made the contents of the node.
  //     arrays may include
  //       DOM nodes,
  //       text,
  //       functions (which will be executed),
  //       jQuery objects, or
  //       more arrays including the above (which will be flattened)
  // returns:
  //   a node
  D = function(node_type){
    var attributes = {};
    var contents = [];
    Q.each(arguments, function(which, argument){
      if( which !== 0 ){ // the first argument was the node_type
        D._collate(attributes, contents, argument);
      }
    });
    var node = document.createElement(node_type);
    Q.each(attributes, function(which, attribute){
      if( which === 'class' ){
        $(node).addClass(attribute);
      }else if( typeof(attribute) === 'function' ){
        $(node).bind(which.substr(2), attribute);
      }else if( 0 <= $.inArray(which, D._bindable_attributes) ){ // todo - move this inArray over to qombat
        node[which] = function(){
          return (new Function(attribute)).call(node); // todo: baaad - we want better stuff passed into our event handlers.  more standard way to do this? (http://www.javascriptkit.com/domref/windowmethods.shtml)
        };
      }else{
        $(node).attr(which, attribute);
      }
    });
    Q.each(contents, function(which, content){
      node.appendChild(content);
    });
    return node;
  };

  D._bindable_attributes = ['onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onkeypress', 'onkeydown', 'onkeyup', 'onchange'];

  D._collate = function(attributes, contents, item){
    if( item === null || item === undefined || item === false || item === true ){
      return;
    }else if( item.nodeType ){ // add all DOM elements to the contents array
      contents.push(item);
    }else if( Q.type_of(item, ['string', 'number'])  ){ // render strings and numbers into nodes and place them in the content array
      contents.push(document.createTextNode(Q.unescape_html(item)));
    }else if( item.jquery ){ // place all memebers of jquery objects into the contents array
      Q.ascend(item, function(which, node){
        contents.push(node);
      });
    }else if( Q.is_plural(item) ){ // iterate over arrays and operate on the contents
      Q.each(item, function(which, subitem){
        D._collate(attributes, contents, subitem);
      });
    }else if( Q.type_of(item, 'function') ){ // run any function and operate normally on its results
      D._collate(attributes, contents, item());
    }else if( Q.type_of(item, 'object') ){ // item is a dictionary - consider it a mapping of attribute keys to values
      Q.each(item, function(which, property){
        attributes[which.toLowerCase()] = Q.defaulted(attributes[which.toLowerCase()], property);
      });
      Q.defaults(attributes, item, {});
    }else{ // something went wrong
      Q.error('Unexpected input to D._collate()');
    }
  };

  // make shortcuts for each of the basic dom types - D.div, D.span, etc
  D._node_shortcuts = ['a', 'big', 'blockquote', 'br', 'button', 'center', 'dd', 'div', 'dl', 'dt', 'em', 'embed', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'iframe', 'img', 'input', 'label', 'label', 'li', 'object', 'ol', 'p', 'param', 'q', 'small', 'span', 'strong', 'table', 'tbody', 'td', 'textarea', 'tr', 'ul'];
  Q.each(D._node_shortcuts, function(which, shortcut){
    D[shortcut] = function(){ return D.call({}, shortcut, arguments); };
  });
  D.clearfix = function(){ return D.div({'class':'clearfix'}); };



  // the live_* functions are more dynamic (and less generic) nodes, which should/will be moved to another library

  D.live_input = function(updater,field){//todo: expand to other element types
    var submit = function(){updater(field.value); };
    $(field).keyup(submit).keypress(submit).change(submit);
    return field;
  };

  D.live_container = function(callback_accepter, container, template){
    var callback = function(){
      $(container).html(template());
    };
    callback_accepter(callback);
    callback();
    return container;
  };

  D.live_element = function(callback_accepter, element, callback){
  };

  D.live_output = function(callback_accepter, element){
    var callback = function(new_value){ $(element).html(new_value); };
    callback_accepter(callback);
    return element;
  };


  // put D into the global namespace
  this.D = this.D || D;

}());
