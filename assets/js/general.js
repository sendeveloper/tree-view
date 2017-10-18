/*
 * @Author: Slash Web Design
 * General JS 
*/

$(document).ready(function(){
	$('.has-popover').popover();
	$('.has-tooltip').tooltip();
	
	if ($('.datepicker').length > 0){
		$('.datepicker').datepicker({
			startView: 2
		});
		$('.datepicker').datepicker().on("input hide", function (e) {
			var name = $(this).attr('name');
			if (name != 'birthday')
			{
				var oldValue = $(this).attr('oldValue') || "";
	        	$(this).val(oldValue);
			}
		});
		$('.datepicker').datepicker().on("input change", function (e) {
		    $(this).attr('oldValue',e.target.value);
		});
	}
	
	if (typeof global.glob.m !== 'undefined')
	{
		pp(global.glob.m.title, global.glob.m.message);
	}
	
	$(window).scroll();
	modalReposition();
	
	validateForm('.contact', {
		name: {required: true},
		email: {required: true, email: true},
		message: {required: true}
	}, 'right');
});

$(document).on('keyup', 'input[name="search-home"]', function(e){
	if ((e.keyCode === 13) && ($(this).val() !== ''))
	{
		$('<span class="spinner s40"></span><span style="color: #ffffff">searching, please wait...</span>').insertBefore($(this));
		$(this).remove();
		$('.hero .input-append .btn').remove();
		window.location.href = global.siteURL + 'search/?name=' + $(this).val();
	}
});

$(document).on('click', '.hero .input-append .btn', function(){
	var input = $('.hero input[name="search-home"]');
	
	if (input.val() !== '')
	{
		$('<span class="spinner s40"></span><span style="color: #ffffff">searching, please wait...</span>').insertBefore(input);
		input.remove();
		$(this).remove();
		window.location.href = global.siteURL + 'search/?name=' + input.val();
	}
});
function modalReposition(){
	if ($(window).height() > $('.signin.modal').height())
 		$('.signin.modal').css('position', 'fixed');
 	else
 		$('.signin.modal').css('position', 'absolute');
 	if ($(window).height() > $('.signup.modal').height())
 		$('.signup.modal').css('position', 'fixed');
 	else
 		$('.signup.modal').css('position', 'absolute');
}
$(window).resize(function(){
 	modalReposition();
});
$(document).on('click', '.debug-holder .controller', function(){
	if ($('.debug-holder').height() === 600)
	{
		//close
		$('.debug-holder').animate({height: 10}, 250);
	}
	else
	{
		//open
		$('.debug-holder').animate({height: 600}, 250);
	}
});

jQuery.extend(jQuery.validator.messages, {
    required: "Please fill in this field",
    remote: "Please fix this field.",
    email: "Please enter a valid email address.",
    url: "Please enter a valid URL.",
    date: "Please enter a valid date.",
    dateISO: "Please enter a valid date (ISO).",
    number: "Please enter a valid number.",
    digits: "Please enter only digits.",
    creditcard: "Please enter a valid credit card number.",
    equalTo: "Please enter the same value again.",
    accept: "Please enter a value with a valid extension.",
    maxlength: jQuery.validator.format("Please enter no more than {0} characters."),
    minlength: jQuery.validator.format("Please enter at least {0} characters."),
    rangelength: jQuery.validator.format("Please enter a value between {0} and {1} characters long."),
    range: jQuery.validator.format("Please enter a value between {0} and {1}."),
    max: jQuery.validator.format("Please enter a value less than or equal to {0}."),
    min: jQuery.validator.format("Please enter a value greater than or equal to {0}.")
});

function validateForm($selector, $rules, $placement)
{
	if (typeof $placement === undefined) $placement = 'right';
	$($selector).validate({
		rules: $rules,
		errorPlacement: function(error, element){
			$(element).tooltip({ title: $(error).text(), placement: $placement, trigger: 'manual' });
			$(element).tooltip('show');
		},
		success: function (label, element) { $(element).tooltip('hide'); }
	});
}

function toastr(cls, text)
{
	var ico = '', index = $('.toastr').length + 1;
	
	switch (cls)
	{
		case 0: ico = 'ico-check'; break;
		case 1: ico = 'ico-close'; break;
		case 2: ico = 'ico-info-outline'; break;
	}
	
	$('body').append('<div class="toastr" data-index="' + index + '" data-type="' + cls + '"><span class="ico ' + ico + '"></span><div>' + text + '</div></div>');
	toastrHandler($('.toastr[data-index="' + index + '"]'));
}

function toastrHandler(obj)
{
	obj.animate(
		{ opacity: 1 },
		350,
		function(){
			setTimeout(function(){
				obj.animate(
					{ opacity: 0 },
					250,
					function(){
						obj.remove();
						$('.toastr').each(function(){
							var index = parseInt($(this).attr('data-index'), 10);
							$(this).attr('data-index', index - 1);
						});
					}
				);
			}, 3000);
		}
	);	
}

function pp(title, message, buttons)
{
	var
		static = (typeof buttons === 'undefined') ? '' : ' data-backdrop="static"',
		close  = (typeof buttons === 'undefined') ? '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button>' : '';

	//check for previous modal and adjust z-index;
	if ($('.modal-backdrop').length > 1)
	{
		var index = 0;
		$('#notify-modal').remove();
		$.each( $('.modal-backdrop'), function() {
			index++;
			if (index>1){
				// console.log(this);
		    	this.remove();
			}
		});
	}
	else if ($('.modal-backdrop').length > 0)
	{
		$('.modal-backdrop').css('z-index', $('.modal-backdrop').css('z-index') - 10);
	}
	if ($('.modal').length > 0)
	{
		// $('.modal').css('z-index', $('.modal').css('z-index') - 10);
		$('.modal').css('z-index', 1040);
	}

	$('body').append(
		'<div id="notify-modal" class="modal hide"' + static + '>' +
			'<div class="modal-header">' + close + '<h3></h3></div>' +
			'<div class="modal-body"></div>' +
			'<div class="modal-divider"></div>' +
			'<div class="modal-footer"></div>' +
		'</div>'
	);


	if (typeof buttons !== 'undefined')
	{
		for (var i = 0; i < buttons.length; i++)
		{
			var btn = buttons[i];
			$('#notify-modal > .modal-footer').append('<button class="btn btn-' + i + btn.cls + '">' + btn.label + '</button>');

			$('#notify-modal > .modal-footer .btn-' + i).click(btn.callback);
			$('#notify-modal > .modal-footer .btn').click(function(){ $('#notify-modal').modal('toggle'); });
		}
	}
	else
	{
		$('#notify-modal .modal-divider, #notify-modal .modal-footer').remove();
	}

    $('#notify-modal').on('hidden', function(){
		$(this).remove();

		//check for previous modal and reset z-index;
		if ($('.modal-backdrop').length > 0)
		{
			$('.modal-backdrop').css('z-index', parseInt($('.modal-backdrop').css('z-index'), 10) + 10);
		}
		if ($('.modal').length > 0)
		{
			$('.modal').css('z-index', parseInt($('.modal').css('z-index'), 10) + 10);
		}
	});
	$('#notify-modal > .modal-header > h3').html(title);
	$('#notify-modal > .modal-body').html(message);
	$('#notify-modal').modal('toggle');
}

function request(o)
{
	$.ajax({
		url: 'callback.php',
		data: o.data,
		type: 'post',
		dataType: (typeof o.dataType === 'undefined') ? 'json' : o.dataType,
		success: (typeof o.success === 'undefined') ? function(){} : o.success,
		error: function(a, b, c){
			lg(a); lg(b); lg(c);
		}
	});
}

function lg(o)
{
	if (console) console.log(o);
}

function sanitizeURL($str)
{
	$out = '';

	$allowedChars = [
		"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
		"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z" 
	];

	for (var $i = 0; $i < $str.length; $i++)
	{
		if ($allowedChars.hasValue($str[$i].toLowerCase()))
		{
			$out += $str[$i].toLowerCase();
		}
		else
		{
			switch ($str[$i])
			{
				case " ": $out += '-'; break;
				case "-": $out += '-'; break;
				case "&": $out += '-'; break;
				case "!": $out += '-'; break;
				case "?": $out += '-'; break;
				case "@": $out += '-'; break;
				case "$": $out += '-'; break;
				case "*": $out += '-'; break;
				case "/": $out += '-'; break;
				case "|": $out += '-'; break;
			}
		}
	}

	return stripMultipleDashes($out);
}

function escapeRegExp(str)
{
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

function stripMultipleDashes($str)
{
	$str = $str.replaceAll('-----', '-');
	$str = $str.replaceAll('----', '-');
	$str = $str.replaceAll('---', '-');
	return $str.replaceAll('--', '-');
}

Array.prototype.hasValue = function($v){
	for (var $i = 0; $i < this.length; $i++)
	{
		if (this[$i] === $v) return true;
	}
	return false;
};

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length !== array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] !== array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
};

Object.size = function(obj){
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

String.prototype.parseNewLines = function(){
	return this.replaceAll('\n', '<br />');
};

String.prototype.getFileExtension = function(){
	return this.substr((~-this.lastIndexOf(".") >>> 0) + 2);
};

String.prototype.getFileName = function(){
	var 
		name = this.replace('uploads/event/', ''),
		id = name.substr(0, name.indexOf('_') + 1);
	return name.replace(id, '').substr(0, this.lastIndexOf("."));
};

String.prototype.replaceAll = function(find, replace)
{
	return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

String.prototype.toTimeOrDate = function(){
	var
		d = new Date(parseInt(this) * 1000),
		t = new Date();

	if (d.toDateString() === t.toDateString())
	{
		var h = d.getHours();
		var m = d.getMinutes();
		if (h < 10) h = '0' + h;
		if (m < 10) m = '0' + m;
		return h + ':' + m;
	}

	return d.nice();
};

Date.prototype.nice = function(short) {
	var dd = this.getDate();
	var mm = this.getMonth() + 1;
	var yyyy = this.getFullYear();
	
	if (typeof short !== 'undefined')
	{
		if (dd < 10) { dd = '0' + dd; };
		if (mm < 10) { mm = '0' + mm; };
		return mm + '/' + dd + '/' + yyyy;
	}
	
	var month = '';
	switch (mm)
	{
		case 1: month = 'January'; break;
		case 2: month = 'February'; break;
		case 3: month = 'March'; break;
		case 4: month = 'April'; break;
		case 5: month = 'May'; break;
		case 6: month = 'June'; break;
		case 7: month = 'July'; break;
		case 8: month = 'August'; break;
		case 9: month = 'September'; break;
		case 10: month = 'October'; break;
		case 11: month = 'November'; break;
		case 12: month = 'December'; break;
	}
	
	return month + ' ' + dd + ' ' + yyyy;
};

String.prototype.initials = function(){
	var a = this.toUpperCase().split(" "), o = '';
	for (var i = 0; i < a.length; i++) { o += a[i].substr(0, 1); }
	return o;
};

String.prototype.toDate = function(time){
	var	d = new Date(parseInt(this) * 1000);
	if (typeof time === 'undefined') return d.nice(true);

	var h = d.getHours();
	var m = d.getMinutes();
	if (h < 10) h = '0' + h;
	if (m < 10) m = '0' + m;
	return h + ':' + m + ' ' + d.nice();
};

Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator) {
    var n = this,
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
    decSeparator = decSeparator === undefined ? "." : decSeparator,
    thouSeparator = thouSeparator === undefined ? "," : thouSeparator,
    sign = n < 0 ? "-" : "",
    i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + '<span class="decimal">' + Math.abs(n - i).toFixed(decPlaces).slice(2) + '</span>' : "");
};

String.prototype.pricify = function(){
	return parseInt(this, 10).formatMoney(0, ",");
};

Number.prototype.pricify = function(){
	return this.toFixed(2).pricify();
};

String.prototype.toURL = function(){
	$out = '';
	
	$allowedChars = [
		"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
		"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z" 
	];

	for ($i = 0; $i < this.length; $i++)
	{
		if ($allowedChars.hasValue(this[$i].toLowerCase()))
		{
			$out += this[$i].toLowerCase();
		}
		else
		{
			switch (this[$i])
			{
				case " ": $out += '-'; break;
				case "-": $out += '-'; break;
				case "&": $out += '-'; break;
				case "!": $out += '-'; break;
				case "?": $out += '-'; break;
				case "@": $out += '-'; break;
				case "$": $out += '-'; break;
				case "*": $out += '-'; break;
				case "/": $out += '-'; break;
				case "|": $out += '-'; break;
			}
		}
	}
	
	return $out;
};

var Base64 = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode : function (input) {
		if (input === "") return "";
		if (input === null) return "";

		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}
	    return output;
	},
	decode : function (input) {
		if (input === "") return "";
		if (input === null) return "";

		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 !== 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 !== 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}
		return utftext;
	},
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}
		return string;
	}
};