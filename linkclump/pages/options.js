var config = {
		"triggers": [
		             {"name": "Left"},
		             {"name": "Middle"},
		             {"name": "Right"}
		             ],
		             "actions": {
		            	 "win": {"name": "Opened in a New Window", "options": ["smart", "ignore", "delay", "block", "reverse", "unfocus"]},
		            	 "tabs": {"name": "Opened as New Tabs", "options": ["smart", "ignore", "delay", "close", "block", "reverse", "end"]},
		            	 "bm": {"name": "Bookmarked", "options": ["smart", "ignore", "block", "reverse"]},
		            	 "copy": {"name": "Copied to clipboard", "options": ["smart", "ignore", "copy", "block", "reverse"]}
		             },
		             "options": {
		            	 "smart": {"name": "smart select", "type": "selection", "data": ["on", "off"], "extra": "with smart select turned on linkclump tries to select only the important links"},
		            	 "ignore": {"name": "ignore links with words", "type": "textbox", "extra": "links containing these words will be ignored; separate words with a comma ,"},
		            	 "copy": {"name": "copy format", "type": "selection", "data": ["URLS with titles", "URLS only", "titles only", "as link HTML", "as list link HTML"], "extra": "format of the links saved to the clipboard"},
		            	 "delay": {"name": "delay in opening", "type": "textbox", "extra":"number of seconds between the opening of each link"},
		            	 "close": {"name": "close tab time", "type": "textbox", "extra":"number of seconds before closing opened tab (0 means the tab wouldn't close)"},
		            	 "block": {"name": "block repeat links in selection", "type": "checkbox", "extra":"select to block repeat links from opening"},
		            	 "reverse": {"name": "reverse order", "type": "checkbox", "extra":"select to have links opened in reverse order"},
		            	 "end": {"name": "open tabs at the end", "type": "checkbox", "extra": "select to have links opened at the end of all other tabs"},
		            	 "unfocus": {"name": "do not focus on new window", "type": "checkbox", "extra": "select to stop the new window from coming to the front"}
		             }
};
var colors = ["458B74", "838B8B", "CCCCCC", "0000FF", "8A2BE2", "D2691E", "6495ED", "DC143C", "006400", "9400D3", "1E90FF", "228B22", "00FF00", "ADFF2F", "FF69B4", "4B0082", "F0E68C", "8B814C", "87CEFA", "32CD32", "000080", "FFA500", "FF4500", "DA70D6", "8B475D", "8B668B", "FF0000", "2E8B57", "8E388E", "FFFF00"];
var params = null
var div_history = new Array();
var config_history = new Array();
var keys = display_keys(0);
var warning = null;

$(function() {
	document.getElementById('guide2').addEventListener('click', tour2);
	document.getElementById('guide1').addEventListener('click', tour1);
	document.getElementById('add').addEventListener('click', load_new_action);
	document.getElementById('form_block').addEventListener('keyup', save_block);
	document.getElementById('form_key').addEventListener('change', check_selection);
	document.getElementById('cancel').addEventListener('click', close_form);
	document.getElementById('save').addEventListener('click', save_action);
	
	
	var isUbuntu = (navigator.appVersion.indexOf("Ubuntu")!=-1);
	
	if(isUbuntu) {
		$("#test").hide();
	}
	
	setup_form();
	$('#form_block').val(localStorage['sites']);

	chrome.extension.sendMessage({
		message: 'init'
	}, function(response){
		params = response.settings;

		for(var i in params) {
			$('#settings').append(setup_action(params[i], i));
		}
		setup_text(keys);

		if(localStorage['version'] == undefined) {
			localStorage['version'] = '3';
			tour1();

			//if(window.location.href.match(/init/)) {
			// inject Linkclump into windows that don't contain the code
			chrome.windows.getAll({ populate: true }, function(windows) {
				for (var i = 0; i < windows.length; ++i) {
					for (var j = 0; j < windows[i].tabs.length; ++j) {
						if (!/^https?:\/\//.test(windows[i].tabs[j].url)) continue;
						chrome.tabs.executeScript(windows[i].tabs[j].id, { file: 'linkclump.js' });
					}
				}
			});
		} else {
			tour2();
		}
	});
});

function close_form() {
	$('#form-background').fadeOut();
	$('#page2').fadeIn();
}

function tour1() {
	setup_text(keys);
	$("#page2").fadeOut(0)
	$("#page1").fadeIn();
	$('#test_area').focus();
}

function tour2() {
	$("#page1").fadeOut(0)
	$("#page2").fadeIn();
}

function setup_action(param, id) {
	var setting = $("<div class='setting' id='action_"+id+"'>");

	setting.append("<h3>"+config.actions[param.action].name+"</h3>");
	setting.append("Activate by "+config.triggers[param.mouse].name + " mouse button");
	if(param.key > 0) {
		setting.append(" and \""+keys[param.key]+"\" key ");
	}

	var list = $("<ul>")
	for(var j in param.options) {
		var op = config.options[j];
		var text = op.name+": ";
		switch(op.type) {
		case "selection":
			text += op.data[param.options[j]];
			break;
		case "textbox":
			if(param.options[j] == '' || param.options[j] == '0') {
				continue;
			}
			text += param.options[j];
			break;
		case "checkbox":
			if(!param.options[j]) {
				continue;
			}
			text += param.options[j];
			break;
		}

		list.append("<li>"+text+"</li>");
	}
	list.append("<li>selection box color: <div style='background-color: "+param.color+"' class='color'></div></li>")

	setting.append(list);

	var edit = $("<a href='#' class='button edit'>Edit</a>").click({'i':id},
			function(event) {
		load_action(event.data.i, $(this).parent().parent());
	}
	);

	var del = $("<a href='#' class='button delete'>Delete</a>").click({'i':id},
			function(event) {
		delete_action(event.data.i, $(this).parent());
	}
	);

	setting.append(del);
	setting.append(edit);

	return setting;
}

function setup_form() {
	var mouse = $("#form_mouse");
	for(var i = 0; i < config.triggers.length; i++) {
		mouse.append('<option value="'+i+'">'+config.triggers[i].name+'</option>');
	}

	mouse.change(function(event) {
		display_keys($(this)[0][$(this)[0].selectedIndex].value);
		check_selection();
	});

	var color = $("#form_color");
	for(var i in colors) {
		color.append("<option value='"+colors[i]+"'>"+colors[i]+"</option>");
	}

	color.colorpicker({
		size: 30,
		hide: false
	});


	var action = $("#form_action")
	for(var i in config.actions) {
		var act = $('<input type="radio" name="action" value="'+i+'" id="form_'+i+'"/>'+config.actions[i].name+'<br/>')


		act.click(function(event) {
			display_options(event.currentTarget.value)
		}
		);

		action.append(act);
	}

	$("input[value='tabs']").attr("checked", "checked");
}

function setup_text(keys) {
	var param;
	for(var i in params) {
		param = params[i];
		break;
	}
	if(param == undefined) {
		return;
	}
	$('#mouse_name').text(config.triggers[param.mouse].name);
	$('#action_name').text(config.actions[param.action].name);
	if(param.key > 0) {
		$('#key_name').html("the <b>"+keys[param.key]+"</b> key and");
	} else {
		$('#key_name').html('');
	}
}

function check_selection() {
	var m = $('#form_mouse').val();
	var k = $('#form_key').val();
	var id = $('#form_id').val();

	for(var i in params) {
		if(i != id && params[i].mouse == m && params[i].key == k) {
			if($('.warning').is(':hidden')) {
				$('.warning').fadeIn();
			}

			return;
		}
	}

	if(!$('.warning').is(':hidden')) {
		$('.warning').fadeOut();
	}
}

function display_options(action) {
	var options = $('#form_options');
	options.empty();

	for(var i in config.actions[action].options) {
		var op = config.options[config.actions[action].options[i]];
		var title = $('<label>'+op.name+'</label>');
		var p = $('<p />');
		p.append(title);

		switch(op.type) {
		case "selection":
			var selector = $("<select id='form_option_"+config.actions[action].options[i]+"'>");
			for(var j in op.data) {
				selector.append('<option value="'+j+'">'+op.data[j]+'</option>');
			}
			p.append(selector);
			break;

		case "textbox":
			p.append('<input type="text" name="'+op.name+'" id="form_option_'+config.actions[action].options[i]+'"/>');
			break;

		case "checkbox":
			p.append('<input type="checkbox" name="'+op.name+'" id="form_option_'+config.actions[action].options[i]+'"/>');
			break;
		}

		p.mouseover({'extra':op.extra}, function(event) {
			var extra = $('#form_extra');
			extra.html(event.data.extra);
			extra.css('top', $(this).position().top);
			extra.css('left', $(this).position().left+500);
			extra.show();
		}).mouseout(function() {
			$('#form_extra').hide();
		});

		options.append(p);

	}
}

function display_keys(mouse_button) {
	var key = $("#form_key");
	key.empty();
	var keys = new Array();

	keys[16] = 'shift';
	keys[17] = 'ctrl';

	// OS is not linux
	if (navigator.appVersion.indexOf("Linux") == -1) {
		keys[18] = 'alt';
	}

	// if not left or windows then allow no key
	var optional = $('#form_optional');
	optional.empty();
	if(mouse_button != 2 || navigator.appVersion.indexOf("Win") > -1) {
		keys[0] = '';
		optional.append("Optional");
	} else {
		optional.append("Mandatory");
	}

	// add on alpha characters
	for (i = 0; i < 26; i++) {
		keys[65+i] = String.fromCharCode(97 + i);
	}

	for(var i in keys) {
		key.append('<option value="'+i+'">'+keys[i]+'</option>');
	}
	return keys;
}

function load_new_action() {
	load_action(null);
}

function load_action(id) {  // into form

	if(id == null) {
		display_keys(0);
		display_options("tabs");
		$("#form_id").val("");
		$("#form_mouse").val(0);
		$("#form_key").val(16);
		$(".colorpicker-trigger").css('background-color', '#'+colors[Math.floor(Math.random()*colors.length)]);
	} else {
		var param = params[id];
		$("#form_id").val(id);

		$("#form_mouse").val(param.mouse);
		display_keys(param.mouse);
		$("#form_key").val(param.key);

		$(".colorpicker-trigger").css('background-color', param.color)

		$("#form_"+param.action).attr("checked","checked");

		display_options(param.action);

		for(var i in param.options) {
			switch(config.options[i].type) {
			case "selection":
				$("#form_option_"+i).val(param.options[i]);
				break;

			case "textbox":
				$("#form_option_"+i).val(param.options[i]);
				break;

			case "checkbox":
				if(param.options[i]) {
					$("#form_option_"+i).attr("checked", true);
				} else {
					$("#form_option_"+i).attr("checked", false);
				}
				break;
			}

		}
	}

	check_selection();

	$('.form').css('margin-top', $(window).scrollTop()+10);
	$('#page2').fadeOut();
	$('#form-background').fadeIn();
	$('#form-background').css('height', $(document).height());
}

function save_action() {
	var id = $("#form_id").val();

	var param = {};

	param.mouse = $("#form_mouse").val();
	param.key = $("#form_key").val();
	param.color = $(".colorpicker-trigger").css('background-color');
	param.action = $('input[name=action]:radio:checked').val();
	param.options = {};

	for(var opt in config.actions[param.action].options) {
		var name = config.actions[param.action].options[opt];
		var type = config.options[name].type;
		if(type == "checkbox") {
			param.options[name] = $("#form_option_"+name).is(':checked');
		} else {
			if(name == 'ignore') {
				var ignore = $("#form_option_"+name).val().replace(/^ */, '').replace(/, */g, ',').toLowerCase().split(",")
				if (ignore[0] == "") {
					ignore.shift()
				}

				param.options[name] = ignore;
			} else if(name == 'delay' || name == 'close') {
				var delay;
				try {
					delay = parseFloat($("#form_option_"+name).val());
				} catch(err) {
					delay = 0;
				}
				if(isNaN(delay)) {
					delay = 0;
				}


				param.options[name] = delay;
			} else {
				param.options[name] = $("#form_option_"+name).val();
			}
		}
	}

	if(id == "" || params[id] == null) {
		var newDate = new Date;
		id = newDate.getTime();

		params[id] = param;
		$('#settings').append(setup_action(param, id));
	} else {
		params[id] = param;
		var update = setup_action(param, id);
		$('#action_'+id).replaceWith(update);
	}

	save_params()
	close_form();
}

function delete_action(id, div) {


	div.fadeOut("swing", function(){
		var del = $("<div class='undo'>Action has been deleted </div>");
		var undo = $("<a>undo</a>").click({'i':id, 'param':params[id]},
				function(event) {
			div_history[event.data.i].replaceWith(setup_action(event.data.param, event.data.i));
			params[event.data.i] = event.data.param;

			delete(div_history[event.data.i]);

			save_params();
		}
		);
		del.append(undo);

		$(this).replaceWith(del).fadeIn("swing");

		div_history[id] = del;
		delete(params[id]);

		save_params();

	});


}

function save_params() {
	localStorage['settings'] = JSON.stringify(params);

	chrome.windows.getAll({
		populate: true
	}, function(windowList){
		windowList.forEach(function(window){
			window.tabs.forEach(function(tab){
				chrome.tabs.sendMessage(tab.id, {
					message: 'update',
					settings: params
				}, null);
			})
		})
	});
}

function save_block() {
	// replace any whitespace at end to stop empty site listings
	localStorage['sites'] = $('#form_block').val().replace(/^\s+|\s+$/g, '');
}
