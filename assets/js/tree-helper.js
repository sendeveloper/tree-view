/* 
 * Tree helper module
 * ©SWD
 */

var 
	nw = 250,
	nwh = 125,
	nh = 80,
	nhs = 40,
	ns = 60,
	nsh = 30,
	nl = 90,
	nlh = 75,
	ph = 5,
	animationSpeed = 250,
	slider = null;
	styles = {
		nameCard: {
			bg: {
				'class': 'nc-bg',
				'width': 250,
				'height': 80,
				'fill': '#ffffff',
				'stroke-width': 2,
				'stroke-linecap': 'butt',
				'stroke-linejoin': 'round',
				'stroke-dasharray': '0 250 0 80 250 80',
				'rx': '0',
				'ry': '0'
			},
			photo: {
				'class': 'nc-photo',
				'width': 60,
				'height': 60
			},
			edit: {
				'class': 'nc-edit',
				'width': 40,
				'height': 40
			},
			add: {
				'class': 'nc-add',
				'width': 40,
				'height': 40
			},
			invite: {
				'class': 'nc-invite',
				'width': 40,
				'height': 40
			},
			text: {
				'class': 'nc-text',
				'fill': '#919191',
				'font-weight': 500,
				'font-size': '18px',
				'text-anchor': 'start'
			},
			dob: {
				'class': 'nc-dob',
				'fill': '#a0a0a0',
				'font-weight': 400,
				'font-size': '12px',
				'text-anchor': 'start'
			}
		},
		path: '#e0e0e0',
		path1: '#e0e0e0',
		path2: '#d0d0d0',
		path3: '#c0c0c0',
		path4: '#c0c0c0'
	};

/*
 * UI helper
 */

function relationshipCheck(){
	var 
		m = '',
		r = $('.tree-add select[name="relationship"]').val(),
		g = $('.tree-add select[name="gender"]').val();

	if ((r === 'mother') && (g === 'm')) m = 'Mother cannot be male gender';
	if ((r === 'father') && (g === 'f')) m = 'Father cannot be female gender';
	if ((r === 'brother') && (g === 'f')) m = 'Brother cannot be female gender';
	if ((r === 'sister') && (g === 'm')) m = 'Sister cannot be male gender';
	if ((r === 'daughter') && (g === 'm')) m = 'Daughter cannot be male gender';
	if ((r === 'son') && (g === 'f')) m = 'Son cannot be female gender';
	if ((r === 'husband') && (g === 'f')) m = 'Husband cannot be female gender';
	if ((r === 'ex-husband') && (g === 'f')) m = 'Ex-husband cannot be female gender';
	if ((r === 'wife') && (g === 'm')) m = 'Wife cannot be male gender';
	if ((r === 'ex-wife') && (g === 'm')) m = 'Ex-wife cannot be male gender';
	
	if (m !== '') pp('Relationship error', m);
	return (m === '');
}

function showOptions(personId, obj){
	var 
		person = tree.findPersonById(personId),
		hideRelation = [],
		noParents = true, partners;

  if (person.gender == 'm')
  {
    $('.modal-person .btn[data-relation="husband"]').hide();
    $('.modal-person .btn[data-relation="ex-husband"]').hide();
    $('.modal-person .btn[data-relation="wife"]').prop('disabled', false);
    $('.modal-person .btn[data-relation="wife"]').show();
    $('.modal-person .btn[data-relation="ex-wife"]').show();
  }
  else
  {
    $('.modal-person .btn[data-relation="wife"]').hide();
    $('.modal-person .btn[data-relation="ex-wife"]').hide();
    $('.modal-person .btn[data-relation="husband"]').prop('disabled', false);
    $('.modal-person .btn[data-relation="husband"]').show();
    $('.modal-person .btn[data-relation="ex-husband"]').show();
  }
	$('body').append('<div class="modal-backdrop"></div>');

	$('.modal-person .btn-add').prop('disabled', false);
	$('.tree-add').attr('data-hide-relation', hideRelation.join(','));
	
	if (tree.hasFather(person.id))
	{
		$('.modal-person .btn-add[data-relation="father"]').prop('disabled', true);
		hideRelation.push('father');
		noParents = false;
	}

	if (tree.hasMother(person.id))
	{
		$('.modal-person .btn-add[data-relation="mother"]').prop('disabled', true);
		hideRelation.push('mother');
		noParents = false;
	}

	if (noParents)
	{
		$('.modal-person .btn-add[data-relation="brother"]').prop('disabled', true);
		$('.modal-person .btn-add[data-relation="sister"]').prop('disabled', true);
		hideRelation.push('brother');
		hideRelation.push('sister');
	}

  partners = tree.getPartners(person.id);
	if (tree.hasPartner(person.id) === false)
	{
		hideRelation.push('son');
		hideRelation.push('daughter');
	}else{
    if (partners.length > 0 && partners[0]['name'] != ""){
      $('.modal-person .btn[data-relation="wife"]').prop('disabled', true);
      $('.modal-person .btn[data-relation="husband"]').prop('disabled', true);
    }
  }
	
	$('.tree-add').attr('data-hide-relation', hideRelation.join(','));
	
	obj = obj[0].parentNode.getElementsByClassName('nc-photo')[0].getAttribute('xlink:href');
	$('.modal-person img').attr('src', obj);
	$('.modal-person').show();
}

function closeOptions(){
	$('.modal-person').hide();
	$('.modal-backdrop').remove();
}

/*
 * Graph helper
 */

function fitText(textNode, width){
	var 
		words = textNode.text().split(' '),
		text_element = textNode.get(0),
		x = textNode.attr('x'),
		tspan_element = document.createElementNS('http://www.w3.org/2000/svg', "tspan");   // Create first tspan element
		text_node = document.createTextNode(words[0]);           // Create text in tspan element

	textNode.html('');
	tspan_element.appendChild(text_node);                           // Add tspan element to DOM
	text_element.appendChild(tspan_element);                        // Add text to tspan element

	for(var i=1; i<words.length; i++)
	{
		var len = tspan_element.firstChild.data.length;             // Find number of letters in string
		tspan_element.firstChild.data += " " + words[i];            // Add next word

		if (tspan_element.getComputedTextLength() > width)
		{
			tspan_element.firstChild.data = tspan_element.firstChild.data.slice(0, len);    // Remove added word

			var tspan_element = document.createElementNS('http://www.w3.org/2000/svg', "tspan");       // Create new tspan element
			tspan_element.setAttributeNS(null, "x", x);
			tspan_element.setAttributeNS(null, "dy", 18);
			text_node = document.createTextNode(words[i]);
			tspan_element.appendChild(text_node);
			text_element.appendChild(tspan_element);
		}
	}
}
	
function compileAttributes(prop){
	var html = '';
	for (var i in prop)
	{
		if (html !== '') html += ' ';
		html += i + '="' + prop[i] + '"';
	}
	return html;
}
	
function mergeProperties(o1, o2){
	var obj = {};
	for (var attrname in o1) { obj[attrname] = o1[attrname]; }
	for (var attrname in o2) { obj[attrname] = o2[attrname]; }
	return obj;
}

function sleep(ms){
    return(new Promise(function(resolve, reject) {        
        setTimeout(function() { resolve(); }, ms);        
    }));    
}

/*
 * Graph processing
 */
function pt(tree, options) {
  
  var tempCor = {
    // x dimensions of current available space
    x: 0,
    // y dimension of current level
    y: 0
  };
  
  processChild(tree, options, tempCor);
  
  // global exposed for browser testing
  parserTree = tree;
  return tree;
  
}

function callbackPT(partner, i, arr)
{
    if (partner.children.length <= 1) {
      if (i === arr.length-1 && appendToLastMale) {
        tempCor.extraPostSpace = true;
      }
      tempCor.extraPreSpace = true;
    }
    
    lastMaleCoord = processPartner(partner, options, tempCor);
    tempCor.extraPostSpace = tempCor.extraPreSpace = false;
}

function callbackPT2(partner, i, arr)
{
    if (partner.children.length <= 1) {
      if (i === 0 && prependToFirstFemale) {
        tempCor.extraPreSpace = true;
      }
      tempCor.extraPostSpace = true;
    }
    
    _coord = processPartner(partner, options, tempCor);
    if (first) {
      firstFemaleCoord = _coord;
      first = false;
    }
    tempCor.extraPostSpace = tempCor.extraPreSpace = false;
}

function processChild(child, options, tempCor) {
  
  var coord = {};
  //clear extra space request if partners > 1
  if (child.partners.total > 1) {
      tempCor.extraPostSpace = tempCor.extraPreSpace = false;
  }
  // edge case condition
  if (child.partners.total === 0) {
    
    if (tempCor.extraPreSpace) {
      tempCor.x += 1/2 * (options.width + options.spacing);
    }
    tempCor.extraPreSpace = false;
    
    coord.x = child.person.x = tempCor.x;
    coord.y = child.person.y = tempCor.y;
    tempCor.x += options.width + options.spacing;
    
    if (tempCor.extraPostSpace) {
      tempCor.x += 1/2 * (options.width + options.spacing);
    }
    tempCor.extraPostSpace = false;
    
    return coord;
  }
  
  var lastMaleCoord;
  
  // find out where this child will be positionated
  if (child.partners.male.length)
    var appendToLastMale = true;
  else
    var prependToFirstFemale = true;
  
  child.partners.male.forEach(function(partner, i, arr){
    if (partner.children.length <= 1) {
      if (i === arr.length-1 && appendToLastMale) {
        tempCor.extraPostSpace = true;
      }
      tempCor.extraPreSpace = true;
    }
    
    lastMaleCoord = processPartner(partner, options, tempCor);
    tempCor.extraPostSpace = tempCor.extraPreSpace = false;
  });
  /*
  child.partners.male.forEach((partner, i, arr) => {
    
    if (partner.children.length <= 1) {
      if (i == arr.length-1 && appendToLastMale) {
        tempCor.extraPostSpace = true;
      }
      tempCor.extraPreSpace = true;
    }
    
    lastMaleCoord = processPartner(partner, options, tempCor);
    tempCor.extraPostSpace = tempCor.extraPreSpace = false;
    
  });
  */
  
  // female partner needs to know when is she first female and there is no male partners
  var first = true;
  
  // FEMALE
  var firstFemaleCoord, _coord;
  
  child.partners.female.forEach(function(partner, i, arr){
    if (partner.children.length <= 1) {
      if (i === 0 && prependToFirstFemale) {
        tempCor.extraPreSpace = true;
      }
      tempCor.extraPostSpace = true;
    }
    
    _coord = processPartner(partner, options, tempCor);
    if (first) {
      firstFemaleCoord = _coord;
      first = false;
    }
    tempCor.extraPostSpace = tempCor.extraPreSpace = false;
  });
  /*
  child.partners.female.forEach((partner, i, arr) => {
    
    if (partner.children.length <= 1) {
      if (i == 0 && prependToFirstFemale) {
        tempCor.extraPreSpace = true;
      }
      tempCor.extraPostSpace = true;
    }
    
    _coord = processPartner(partner, options, tempCor);
    if (first) {
      firstFemaleCoord = _coord;
      first = false;
    }
    tempCor.extraPostSpace = tempCor.extraPreSpace = false;
    
  });
  */
  
  // ME
  // set coord of me
  if (child.partners.male.length) {
    // set me next to last male
    child.person.x = lastMaleCoord.x + options.width + options.spacing;
  }
  
  else if (child.partners.female.length) {
    // set me in fron of first female
    child.person.x = firstFemaleCoord.x - options.width - options.spacing;
  }
  else {
    // there are no partners from root
    child.person.x = tempCor.x;
  }
  
  // set max x
  
  if ((child.person.x + options.width + options.spacing) > tempCor.x)
    tempCor.x = (child.person.x + options.width + options.spacing);
  
  child.person.y = tempCor.y;
  
  coord.x = child.person.x;
  coord.y = child.person.y;
  
  return coord;
  
}

function processPartner(partnerTree, options, tempCor){
  
  var coord = {}, first_child, last_child, minX = tempCor.x;
  
  if (partnerTree.children.length > 1) {
      //clear extra space request if children > 1
      tempCor.extraPostSpace = tempCor.extraPreSpace = false;
  }
  // edge case condition
  if (partnerTree.children.length === 0) {
    
    if (partnerTree.partner.person.gender === "f" && tempCor.extraPreSpace) {
      tempCor.x += options.width + options.spacing;
      tempCor.extraPreSpace = false;
    }
    // dummy child
    last_child = {
      x: tempCor.x
    };
    partnerTree.partner.person.x = last_child.x;
    tempCor.x += (options.width + options.spacing);
    
    if (partnerTree.partner.person.gender === "m" && tempCor.extraPostSpace) {
      tempCor.x += (options.width + options.spacing);
      tempCor.extraPostSpace = false;
    }
    
  }
  
  else {
    
    tempCor.y += options.height + options.spacing;
  
    partnerTree.children.forEach(function(child){
      last_child = processChild(child, options, tempCor);
      if (!first_child) {
        first_child = JSON.parse(JSON.stringify(last_child));
      }
	});

    tempCor.y -= options.height + options.spacing;
    
  }
  
  if (partnerTree.children.length === 1) {
    if (partnerTree.partner.person.gender === "f") {
      partnerTree.partner.person.x = last_child.x + 1/2 * (options.width + options.spacing);
    }
    else {
      partnerTree.partner.person.x = last_child.x - 1/2 * (options.width + options.spacing);
      // correcting tree on slim-fat case
      if (minX > partnerTree.partner.person.x) {
        var diffX = minX - partnerTree.partner.person.x;
        padLeftPartnerTree(partnerTree, diffX);
        tempCor.x += diffX;
      }
    }
  }
  else if (partnerTree.children.length > 1) {
    var averageX = (first_child.x + (last_child.x - first_child.x) / 2);
    if (partnerTree.partner.person.gender === "f") {
      partnerTree.partner.person.x = averageX + 1/2 * (options.width + options.spacing);
    }
    else {
      partnerTree.partner.person.x = averageX - 1/2 * (options.width + options.spacing);
      if (minX > partnerTree.partner.person.x) {
        var diffX = minX - partnerTree.partner.person.x;
        padLeftPartnerTree(partnerTree, diffX);
        tempCor.x += diffX;
      }
    }
  }
  
  if ((partnerTree.partner.person.x + options.width + options.spacing) > tempCor.x)
    tempCor.x = (partnerTree.partner.person.x + options.width + options.spacing);
  
  partnerTree.partner.person.y = tempCor.y;
  
  coord.x = partnerTree.partner.person.x;
  coord.y = partnerTree.partner.person.y;
  
  return coord;
}

function callbackPT3(child)
{
      last_child = processChild(child, options, tempCor);
      if (!first_child) {
        first_child = JSON.parse(JSON.stringify(last_child));
      }
}

function padLeftPartnerTree(partnerTree, x) {
  
  partnerTree.partner.person.x += x;
  //partnerTree.children.forEach((child) => {
    //padLeftChildreTree(child, x);
  //});
  partnerTree.children.forEach(function(child){
    padLeftChildreTree(child, x);
  });
  
}

function padLeftChildreTree(child, x) {
  
  child.person.x += x;
  child.partners.male.forEach(function(partner){
    padLeftPartnerTree(partner, x);
  });
  child.partners.female.forEach(function(partner){
    padLeftPartnerTree(partner, x);
  });
  
}