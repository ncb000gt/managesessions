/**
 Copyright Nick Campbell
 Based on the ContentTable in Axiom CMS
 */

dojo.provide("axiom.widget.SessionTable");


dojo.require('dojo.json');
dojo.require('dojo.dom');
dojo.require("dojo.io.XhrIframeProxy");
dojo.require("dojo.widget.*");
dojo.require("axiom.widget.IOTable");
dojo.widget.defineWidget(
    "axiom.widget.SessionTable",
    axiom.widget.IOTable,
    function(){},
    {
	activeRow: null,
	selectedRows: {},
	nextSet:false,
	prevSet:false,
	data:{},
	rowInfoIndex: {},
	noContentText: 'No results found.',
	numCols: 4,
        templatePath:new dojo.uri.dojoUri('../axiom/widget/resources/SessionTable.html'),
	templateCssPath:new dojo.uri.dojoUri('../axiom/widget/resources/SessionTable.css'),
	previous:function(){
	    axiom.cfilter.go(this.start-this.length,this.length);
	},
	next:function(){
	    axiom.cfilter.go(this.start+this.length,this.length);
	},
	selectAll:function(evt){
	    var all_checked = evt.currentTarget.checked;
	    var inputs = this.results_body.getElementsByTagName('input');
	    var len = inputs.length;
	    for(var i=0; i<len; i++){
		if(inputs[i].type == "checkbox"){
		    var input = inputs[i];
		    var selected = this.selectedRows[input.parentNode.parentNode.id];
		    if((all_checked && !selected) || (!all_checked && selected)){
			input.checked = !input.checked;
			this.toggleSelect(input.parentNode.parentNode);
		    }
		}
	    }
	},
	runSearch: function() {
	    dojo.io.bind(
		{
		    url: this.searchURL,
		    handle: this.handleResults,
		    preventCache: true,
		    mimetype: "text/javascript",
		    contentType: 'text/json',
		    postContent: '{}',
		    error: function(evt, data, type){
			axiom.openModal({content:"Error connecting to server."});
		    },
		    method: 'post',
		    widget: this
		}
	    );
	},
	postCreate:function(){
	    this.searchURL = this.appPath + 'cms/getSessions';
	    if(this.ajaxLoader) this.ajaxLoader.src = axiom.staticPath+'/axiom/images/ajax-loader.gif';

	    dojo.event.kwConnect(
		{
		    srcObj: this.pagination_input,
		    srcFunc: 'onkeypress',
		    adviceObj: this,
		    adviceFunc: 'goToPage'
		}
	    );

	    dojo.event.kwConnect(
		{
		    srcObj: this.pagination_button,
		    srcFunc: 'onclick',
		    adviceObj: this,
		    adviceFunc: 'goToPage'
		}
	    );

	},
	goToPage:function(evt){
	    if(evt.type == 'click' || evt.keyCode == 13){
		axiom.cfilter.goToPage(this.pagination_input, this.length,this.pages);
	    }
	},
	mouseoutRowHandler:function(evt){
	    if(this.activeRow != evt.currentTarget.id && !this.selectedRows[evt.currentTarget.id]){
		dojo.html.removeClass(evt.currentTarget, 'highlight');
	    }
	},
	stopBubble: function(evt) {
	    evt.cancelBubble = true;
	},
	toggleSelect: function(evt){
	    var row,input;
	    if(dojo.dom.isNode(evt)){
		row = evt;
		input = row.getElementsByTagName('input')[0];
	    } else{
		this.stopBubble(evt);
		input = evt.currentTarget;
		row = input.parentNode.parentNode;
	    }

	    if(input.checked){
		this.highlightRow(row);
		this.onSelect(row);
	    } else{
		this.unhighlightRow(row);
		this.onUnselect(row);
	    }
	},
	endSessions:function(){
	    if(!dojo.html.hasClass(this.endSessionsButton, 'form-button-disabled')){
		dojo.io.bind(
		    {
			url: axiom.cmsPath + 'childCountById',
			method: 'post',
			contentType: 'text/json',
			mimetype: 'text/json',
			postContent: dojo.json.serialize({ids: this.selectedRows}),
			load: function(type, data, evt) {
			    var objects = [];
			    var num_children = data;
			    for (var id in num_children) {
				objects.push(
				    {
					title: dojo.byId(id).getElementsByTagName('td')[2].innerHTML,
					id: id,
					num_children: (num_children[id] || '0')
				    }
				);
			    }
			    //axiom.openModal({ widget: dojo.widget.createWidget("axiom:DeleteObjectsModal", {appPath:axiom.appPath, staticPath: axiom.staticPath, objects:objects}) });
			    return;
			}
		    }
		);
	    }
	},
	insertButtonRow:function(data){
	    var row = this.results_body.insertRow(document.createElement('tr'));
 	    var select_spacer = document.createElement('td');
	    dojo.html.addClass(row, 'invisible');
	    row.appendChild(select_spacer);

	    var buttons = [];
	    var button_holder = document.createElement('td');

	    var colSpan = 3;

	    button_holder.setAttribute('colSpan', colSpan);
	    dojo.html.addClass(button_holder, 'lastRow');
	    for(var i in data){
		var button_obj = data[i];
		var button = document.createElement('a');
		if(!button_obj.classNames){
		    dojo.html.addClass(button, 'button');
		    dojo.html.addClass(button, 'form-button');
		    dojo.html.addClass(button, 'form-button-disabled');
		} else{
		    for(var j in button_obj.classNames){
			dojo.html.addClass(button, button_obj.classNames[j]);
		    }
		}
		button.innerHTML = button_obj.text;

		button_holder.appendChild(button);
		buttons.push(button);

		if(button_obj.callback){
		    dojo.event.kwConnect({srcObj:button,
					  srcFunc: 'onclick',
					  adviceObj: this,
					  adviceFunc: button_obj.callback
					 });
		}
	    }

	    var expand_txt = document.createElement('span');
	    expand_txt.className='table_info_txt';
	    expand_txt.innerHTML = 'Click row to expand/collapse';
	    button_holder.appendChild(expand_txt);

	    row.appendChild(button_holder);
	    this.results_body.appendChild(row);
	    return buttons;
	},
	createRow:function(data, table){
	    var row = this.results_body.insertRow(document.createElement('tr'));
	    row.id = data.id;
	    if(this.selectedRows[row.id]){
		dojo.html.addClass(row, 'highlight');
	    }

	    // create the checkbox selector
	    var selector = document.createElement('td');
	    dojo.html.setClass(selector, 'selector');
	    if(!data.omitSelector){
		var input;
		if(dojo.render.html.ie){
		    input = document.createElement('<input type="'+ (data.input_type || 'checkbox')
						   +'" name="'+data.input_name+'" '
						   +(this.selectedRows[row.id] ? 'checked="true"' : '')+'/>');
		} else{
		    input = document.createElement('input');
		    input.type = (data.input_type || "checkbox");
		    if(data.input_name) { input.name = data.input_name; }
		    if(this.selectedRows[row.id]){
			input.checked = true;
		    }
		}

		dojo.event.kwConnect(
		    {
			srcObj: input,
			srcFunc: 'onclick',
			adviceObj: this,
			adviceFunc: 'toggleSelect'
		    }
		);
		selector.appendChild(input);

	    }

	    dojo.event.kwConnect(
		{
		    srcObj: selector,
		    srcFunc: 'onclick',
		    adviceObj: this,
		    adviceFunc: 'stopBubble'
		}
	    );
	    dojo.event.kwConnect(
		{
		    srcObj: selector,
		    srcFunc: 'onmouseover',
		    adviceObj: this,
		    adviceFunc: 'stopBubble'
		}
	    );
	    row.appendChild(selector);


	    // begin adding content to the visible row
	    for(var i in data.cols){
		var col = document.createElement('td');

		dojo.html.setClass(col, data.cols[i]['class']);
		if(data.cols[i].id){
		    col.id = data.cols[i].id;
		}
		var content = data.cols[i].content;
		if(dojo.dom.isNode(content))
		    col.appendChild(content);
		else
		    col.innerHTML = content;

		row.appendChild(col);
		var colspan = data.cols[i].colspan;
		if(colspan) {
		    col.setAttribute('colSpan', colspan);
		}
	    }


	    // common row event handlers
	    if(!data.noHighlight){
		dojo.event.kwConnect(
		    {
			srcObj:row,
			srcFunc: 'onmouseover',
			adviceFunc: function() {
			    dojo.html.addClass(row, 'highlight');
			}
		    }
		);
		dojo.event.kwConnect(
		    {
			srcObj:row,
			srcFunc: 'onmouseout',
			adviceObj: this,
			adviceFunc: 'mouseoutRowHandler'
		    }
		);
	    }
	    dojo.event.kwConnect({srcObj:row,
				  srcFunc: 'onclick',
				  adviceObj: this,
				  adviceFunc: function(){this.toggleRow(row);}
				 });
	    return row;
	},
	insertRow:function(obj) {
	    var cols = [
		{content: obj.id, 'class': 'col_title'},
		{content: ''},
		{content: obj.username, 'class': 'col_location'},
		{content: obj.timeremaining, 'class': 'col_type'}
	    ];

	    // insert row into table
	    var row = this.createRow({cols: cols, id: obj.id});
	    this.results_body.appendChild(row);

	    var obj_id = obj._id;
	    this.results_body.appendChild(
		this.createInfoRow(
		    {
			id: obj_id+'created',
			omitSelector: true,
			cols: [
			    {content: obj.created}
			]
		    }
		)
	    );

	    this.results_body.appendChild(
		this.createInfoRow(
		    {
			id: obj_id+ 'edited',
			cols: [
			    {content: obj.lastactive},
			    {content: obj.lastmodified}
			]
		    }
		)
	    );
	    this.rowInfoIndex[obj_id] = [obj_id+'created', obj_id+'edited'];
	},
	createInfoRow:function(data){
	    var row = this.results_body.insertRow(document.createElement('tr'));
	    row.id = data.id;
	    row.style.display = 'none';
	    dojo.html.setClass(row, 'info');
	    var row_select_spacer = document.createElement('td');
	    dojo.html.addClass(row_select_spacer, 'selector');
	    row.appendChild(row_select_spacer);
	    var dark_row_select_spacer = document.createElement('td');
	    row.appendChild(dark_row_select_spacer);
	    dojo.html.addClass(dark_row_select_spacer, 'info_spacer');

	    var total_cols = data.cols.length + 2;
	    for(var i in data.cols){
		var col = data.cols[i];
		var row_content = document.createElement('td');
		if (col.id) {
		    var id = col.id;
		    row_content.setAttribute('id', id);
		}
		var content = col.content;
		if(dojo.dom.isNode(content))
		    row_content.appendChild(content);
		else
		    row_content.innerHTML = content;
		var colspan = col.colspan;
		if(colspan){
		    row_content.setAttribute('colSpan', colspan);
		    total_cols += colspan - 1;
		}
		row.appendChild(row_content);
	    }
	    var spacers = (this.numCols || 6) - total_cols + 1;
	    for(i=0; i< spacers; i++){
		row.appendChild(document.createElement('td'));
	    }

	    var cells = row.getElementsByTagName('td');
	    dojo.html.addClass(cells[cells.length-1], 'last-cell');

	    return row;
	},
	collapseRow:function(row){
	    dojo.html.removeClass(row, 'highlight');
	    if (row) {
		var ids = this.rowInfoIndex[row.id];
		for(var i in ids){
		    dojo.byId(ids[i]).style.display = 'none';
		}
	    }
	},
	highlightRow:function(row){
	    this.selectedRows[row.id] = true;
	    dojo.html.addClass(row, 'highlight');
	},
	unhighlightRow:function(row){
	    if(row.id != this.activeRow){
		dojo.html.removeClass(row, 'highlight');
		delete this.selectedRows[row.id];
	    }
	},
	toggleRow:function(internal_row){
	    if(this.activeRow && this.activeRow != internal_row.id){
		this.collapseRow(dojo.byId(this.activeRow));
	    }
	    this.activeRow = internal_row.id;
	    var rows = this.rowInfoIndex[internal_row.id];
	    for(var i in rows){
		var row_id = rows[i];
		var row = dojo.byId(row_id);
		if(row){
		    if(row.style.display == 'table-row' || row.style.display == ''){
			row.style.display = 'none';
			this.activeRow = '';
		    }
		    else {
			if(dojo.render.html.ie)
			    row.style.display = '';
			else
			    row.style.display = 'table-row';
		    }
		}

	    }
	},

	handleResults:function(type, data, req){
	    this.widget.loading.style.display = 'none';
	    this.widget.tablewrap.style.display = 'block';
	    this.widget.data = data;

	    // clear previous selections
	    this.widget.selectedRows = {};
	    this.widget.nonDeletableObjects = {};

	    this.widget.page = data.page;
	    this.widget.pages = data.pages;
	    this.widget.length = data.length;
	    this.widget.start = data.start;

	    this.widget.clearTable();

	    for(var i in data.results){
		this.widget.insertRow(data.results[i]);
	    }
	    if(data.results.length == 0 && typeof this.widget.insertNoObjectsRow == 'function'){
		this.widget.insertNoObjectsRow();
	    } else if(this.widget.columnHeaders) {
		this.widget.columnHeaders.style.display = '';
	    }

	    var logout_data = {text:'Logout Sessions', callback: 'logoutSessionsObjects'};

	    var buttons;
	    if(data.results.length != 0){
		buttons = this.widget.insertButtonRow([logout_data]);
		this.widget.logoutSessionsButton = buttons[0];
		this.widget.setupPagination(data);
	    }
	},
	insertNoObjectsRow:function(content){
	    if(this.columnHeaders){
		this.columnHeaders.style.display = 'none';
	    }
       	    this.results_body.appendChild(this.createRow({	id: 'empty-row',
								noHighlight: true,
								omitSelector: true,
								cols: [{content: content || this.noContentText ||"There are no sessions at this time...wait what? <:\\",
									colspan: this.numCols,
									'class': 'noObjects'}]
							 }));
	},
	setupPagination:function(data){
	    if(data.pagination){
		this.pagination_block.style.display = 'block';
		this.page_num.innerHTML = data.page;
		this.page_total.innerHTML = data.pages;
	    } else{
		this.pagination_block.style.display = 'none';
	    }

	    if(data.backenabled){
		this.previous_page_img.src = axiom.staticPath+ '/axiom/images/icon_page_back_enabled.gif';
		if (!this.prevSet) {
		    dojo.event.kwConnect({srcObj: this.previous_page_img,
					  srcFunc: 'onclick',
					  adviceObj: this,
					  adviceFunc: 'previous'});
		    this.prevSet = true;
		}
	    } else{
		this.previous_page_img.src = axiom.staticPath+ '/axiom/images/icon_page_back_disabled.gif';
		this.previous_page_img.style.cursor = 'default';
		if (this.prevSet) {
		    dojo.event.kwDisconnect({srcObj: this.previous_page_img,
					     srcFunc: 'onclick',
					     adviceObj: this,
					     adviceFunc: 'previous'});
		    this.prevSet = false;
		}
	    }

	    if(data.nextenabled){
		this.next_page_img.src = axiom.staticPath+ '/axiom/images/icon_page_next_enabled.gif';
		if (!this.nextSet) {
		    dojo.event.kwConnect({srcObj: this.next_page_img,
					  srcFunc: 'onclick',
					  adviceObj: this,
					  adviceFunc: 'next'});
		    this.nextSet = true;
		}
	    } else{
		this.next_page_img.src = axiom.staticPath+ '/axiom/images/icon_page_next_disabled.gif';
		this.next_page_img.style.cursor = 'default';
		if (this.nextSet) {
		    dojo.event.kwDisconnect({srcObj: this.next_page_img,
					     srcFunc: 'onclick',
					     adviceObj: this,
					     adviceFunc: 'next'});
		    this.nextSet = false;
		}
	    }
	},
	clearTable:function(){
	    dojo.dom.removeChildren(this.results_body);
	}

    }
);
