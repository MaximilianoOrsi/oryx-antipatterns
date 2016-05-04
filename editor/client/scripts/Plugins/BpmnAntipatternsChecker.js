// define namespace
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.BpmnAntipatternsChecker = {

    construct: function(){
		
		arguments.callee.$.construct.apply(this, arguments); //call plugin super class
        
		this.gIds = [];	
		this.overlayIds = [];
		this.tooltipIds = [];
		
		this.styleNode = document.createElement('style');
		this.styleNode.setAttributeNS(null, 'type', 'text/css');
		document.getElementsByTagName('head')[0].appendChild(this.styleNode);
		
		this.handlers = [];
				
		this.mask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
		
        this.facade.offer({
            'name': "Anti-patterns checker",
            'functionality': this.perform.bind(this),
            'group': "Verification",
            'icon': ORYX.PATH + "images/bpmn_antipatterns_checker.png",
            'description': "Anti-patterns checker",
            'index': 1,
            'toggle': true,
            'minShape': 0,
            'maxShape': 0
        });	
    },
	
	perform: function(button, pressed){
        if (!pressed) {
            this.resetCanvas();
			button.toggle(false);
        } else {
            this.showPanel(button);
        }
    },
	
	showPanel: function(button){
		// Data
		var data = [];
		data.push(["AP1_1 (Lack Of Synchronization)","AP1_1"]);
		data.push(["AP1_2 (Lack Of Synchronization)","AP1_2"]);
		data.push(["AP1_3 (Lack Of Synchronization)","AP1_3"]);
		data.push(["AP1_4 (Lack Of Synchronization)","AP1_4"]);
		data.push(["AP1_5 (Lack Of Synchronization)","AP1_5"]);
		data.push(["AP1_6 (Lack Of Synchronization)","AP1_6"]);
		data.push(["AP1_7 (Lack Of Synchronization)","AP1_7"]);
		data.push(["AP1_8 (Lack Of Synchronization)","AP1_8"]);
		data.push(["AP1_9 (Lack Of Synchronization)","AP1_9"]);
		data.push(["AP1_10 (Deadlock)","AP1_10"]);
		data.push(["AP1_11 (Deadlock)","AP1_11"]);
		data.push(["AP1_12 (Lack Of Synchronization)","AP1_12"]);
		data.push(["AP1_13 (Lack Of Synchronization)","AP1_13"]);
		data.push(["AP1_14 (Lack Of Synchronization)","AP1_14"]);
		data.push(["AP1_15 (Deadlock)","AP1_15"]);
		data.push(["AP1_16 (Deadlock)","AP1_16"]);
		data.push(["AP2_1 (Improper completion)","AP2_1"]);
		data.push(["AP2_2 (Improper completion)","AP2_2"]);
		data.push(["AP2_3 (Improper completion)","AP2_3"]);
		data.push(["AP2_4 (Improper completion)","AP2_4"]);
		data.push(["AP3_1 (Deadlock)","AP3_1"]);
		data.push(["AP3_2 (Deadlock)","AP3_2"]);
		data.push(["AP3_3 (Deadlock)","AP3_3"]);
		data.push(["AP3_4 (Deadlock)","AP3_4"]);
		data.push(["AP4_1 (Improper completion)","AP4_1"]);
		data.push(["AP4_2 (Improper completion)","AP4_2"]);
		data.push(["AP4_3 (Improper completion)","AP4_3"]);
		data.push(["AP4_4 (Improper completion)","AP4_4"]);
		
		// Create a ArrayReader
		var reader = new Ext.data.ArrayReader({},[{name: 'title'},{name: 'value'}]);
		
        // Create a Selection Model
        var sm = new Ext.grid.CheckboxSelectionModel();
        
        // Create a Grid		
        var gridPanel = new Ext.grid.GridPanel({
            id: 'oryx_antipatternschecker_grid',
			title: 'Note: empty selection checks all.',
			frame: true,
			autoScroll: true,
			width: 260,
			height:	275,
			autoExpandColumn: 'oryx_antipatternschecker_column1',
			store: new Ext.data.Store({
        		reader: reader,
       			data: data
    			}),
            cm: new Ext.grid.ColumnModel([sm, {
				id: 'oryx_antipatternschecker_column1',
                header: "Anti-patterns",
                sortable: true,
				resizable: false,
                dataIndex: 'title'
				}]),
            sm: sm,
			buttons: [{
						text: "Check!",
						handler: function(){
							var selectionModel = gridPanel.getSelectionModel();
							var items = selectionModel.selections.items.collect(function(item){
								return item.data.value;
							});
							var antipatternsString = Ext.encode(items);
							
							window.myExtraParams.toggle = "true";
                            window.close(); 
							this.mask.show();
							this.checkAntipatterns(button,antipatternsString); 
						}.bind(this)
					}, 
					{
						text: "Cancel",
						handler: function(){
							window.close();
						}.bind(this)
					}]
        }); 	
        
        // Create a Window
        var window = new Ext.Window({
            id: 'oryx_antipatternschecker_window',
			title: 'Anti-patterns checker',
            resizable: false,
			modal: true,
			items: [gridPanel],
			listeners:{
						'close':function(win){
							if(win.myExtraParams.toggle=="false")
								button.toggle(false);
						}
			}
        });
		
		// Parametro extra que permite indicar si desactivar o no el boton del plugin
		window.myExtraParams = {toggle: "false"};
		
        // Show the window
        window.show();
    },
	
	checkAntipatterns: function(button,antipatternsString){

		// se arma el processAsData
		var processData = Ext.decode(this.facade.getSerializedJSON());
		var processAsDataString = Ext.encode(this.buildProcessAsData("",processData));
		
		// Send the request to the server to check the antipatterns.
		new Ajax.Request("/oryx/bpmnantipatternschecker", {	
			method: 'POST',
			asynchronous: false,
			parameters: {
				processAsDataString: processAsDataString,
				antipatternsString: antipatternsString
			},
			onSuccess: function(response){

				var result = Ext.decode(response.responseText);	
				
				if(result.result=="The model is unsound according to the anti-patterns that were selected."){

					var processWithResult = result.processWithResult;								
					
					// se muestran los nodos con antipatrones
					var nodesWithAntipatterns = processWithResult.nodesWithAntipatterns;
					for (var i=0; i < nodesWithAntipatterns.length; i++){
						var node = nodesWithAntipatterns[i];
						var nodeName = "node " + i;
						this.highlightNodeWithAntipatterns(nodeName, node.divergentId, node.convergentId, node.antipatterns, this.tooltipIds);
					}
					
					// se muestran los subprocesos con antipatrones
					var subprocessesWithAntipatterns = this.subprocessesWithAntipatterns(processWithResult.subprocessesWithResult);	
					for (var i=0; i < subprocessesWithAntipatterns.length; i++){	
						var subprocess = subprocessesWithAntipatterns[i];					
						this.highlightSubprocessWithAntipatterns(subprocess, this.tooltipIds);	
					}
					
					// se muestra mensaje con resultado de la verificacion
					this.mask.hide();
					Ext.Msg.alert("Result", result.result + "<br/>" + nodesWithAntipatterns.length + " nodes with anti-patterns were found.<br/>" + subprocessesWithAntipatterns.length + " subprocesses with anti-patterns were found.<br/><br/>Note: move the mouse over crosses for more information.");
				}else{ 
					button.toggle(false);
					this.mask.hide();
					Ext.Msg.alert("Result", result.result);
				}
				
			}.bind(this),
			onFailure: function(response){
				button.toggle(false);
				this.mask.hide();
				Ext.Msg.alert("Result", "Failed: " + response.statusText);
			}.bind(this)
		});	
	},
	
	buildProcessAsData: function(superprocessId, processData){
	
		// se llama recursivamente con los subprocesos
		var subprocessesAsData = [];
		var childShapes = processData.childShapes;
		for(var i=0; i < childShapes.length; i++){
			var childShape = childShapes[i];
			var stencilId = childShape.stencil.id;
			if(stencilId=="CollapsedSubprocess"){
				var resourceId = childShape.resourceId;
				var entry = childShape.properties.entry;
				if(entry!=""){
					var subprocessUri = entry.split("#")[1];
					var subprocessData = this.getProcessData(subprocessUri);
					if(subprocessData!=""){
						var subprocessAsData = this.buildProcessAsData(resourceId, subprocessData);
						subprocessesAsData.push(subprocessAsData);
					}
				}
			}
		}
		
		// se arma la estructura
		var processAsData = {
			superprocessId: superprocessId,
			processData: processData,
			subprocessesAsData: subprocessesAsData
		};
	
		return processAsData;
	},

	getProcessData: function(processUri){
		
		var processData;
		
		// Send the request to the server
		var url = "/backend/poem"+processUri+"/json";
		new Ajax.Request(url, {
			method: 'GET',
			asynchronous: false,
			onSuccess: function(response){	
				processData = Ext.decode(response.responseText);
			}.bind(this),
			onFailure: function(response){
				processData = "";
			}.bind(this)
		});
		
		return processData;
	},
	
	subprocessesWithAntipatterns: function(subprocessesWithResult){
		
		var subprocessesWithAntipatterns = [];
		for(var i=0; i < subprocessesWithResult.length; i++){
			var subprocessWithResult = subprocessesWithResult[i];
			var subprocessWithAntipatterns = this.processWithAntipatterns(subprocessWithResult);
			if(subprocessWithAntipatterns)
				subprocessesWithAntipatterns.push(subprocessWithResult.superprocessId);
		}
		
		return subprocessesWithAntipatterns;
	},
	
	processWithAntipatterns: function(processWithResult){
		
		if(processWithResult.nodesWithAntipatterns.length>0)
			return true;
		
		var subprocessesWithResult = processWithResult.subprocessesWithResult;
		for(var i=0; i < subprocessesWithResult.length; i++){
			var subprocessWithResult = subprocessesWithResult[i];
			var subprocessWithAntipatterns = this.processWithAntipatterns(subprocessWithResult);
			if(subprocessWithAntipatterns)
				return true;
		}
		
		return false;
	},
	
	highlightNodeWithAntipatterns: function(nodeName, divergentId, convergentId, antipatterns, tooltipIds){
		
		var divergentShape = this.facade.getCanvas().getChildShapeByResourceId(divergentId);
		var convergentShape = this.facade.getCanvas().getChildShapeByResourceId(convergentId);
	
		// rectangulo sobre nodo
		var containerNode = this.facade.getCanvas().getSvgContainer();
		var gId = ORYX.Editor.provideId();
		var node = ORYX.Editor.graft("http://www.w3.org/2000/svg", $(containerNode),['g',{'id':gId,'display':''}]);  		
		var rectId = ORYX.Editor.provideId();  
		var dashedArea = ORYX.Editor.graft("http://www.w3.org/2000/svg", node,
			['rect', 
			{'id': rectId,
			'stroke-width': 1, 
			'stroke': 'red', 
			'fill': 'none',
			'stroke-dasharray': '4',
			'pointer-events': 'none'}]);
		this.gIds.push(gId);
			
		var setRectPosition = function(){
				
			var ulX1 = divergentShape.absoluteBounds().upperLeft().x;
			var ulY1 = divergentShape.absoluteBounds().upperLeft().y;
			var lrX1 = divergentShape.absoluteBounds().lowerRight().x;
			var lrY1 = divergentShape.absoluteBounds().lowerRight().y;
			var ulX2 = convergentShape.absoluteBounds().upperLeft().x;
			var ulY2 = convergentShape.absoluteBounds().upperLeft().y;
			var lrX2 = convergentShape.absoluteBounds().lowerRight().x;
			var lrY2 = convergentShape.absoluteBounds().lowerRight().y;			
			
			var xMax = Math.max(ulX1,lrX1,ulX2,lrX2);
			var xMin = Math.min(ulX1,lrX1,ulX2,lrX2);
			var yMax = Math.max(ulY1,lrY1,ulY2,lrY2);
			var yMin = Math.min(ulY1,lrY1,ulY2,lrY2);
			
			var x = xMin - 4;
			var y = yMin - 4;
			var width = xMax - xMin + 8;
			var height = yMax - yMin + 8;		
			
			var currentX = dashedArea.getAttributeNS(null,'x');
			var currentY = dashedArea.getAttributeNS(null,'y');
			var currentWidth = dashedArea.getAttributeNS(null,'width');
			var currentHeight = dashedArea.getAttributeNS(null,'height');
			
			if(currentX==null || currentY==null || currentWidth==null || currentHeight==null){
				dashedArea.setAttributeNS(null, 'x', x);
				dashedArea.setAttributeNS(null, 'y', y);
				dashedArea.setAttributeNS(null, 'width', width);
				dashedArea.setAttributeNS(null, 'height', height);
			}
			else if(x!=currentX || y!=currentY || width!=currentWidth || height!=currentHeight){				
				dashedArea.setAttributeNS(null, 'x', x);
				dashedArea.setAttributeNS(null, 'y', y);
				dashedArea.setAttributeNS(null, 'width', width);
				dashedArea.setAttributeNS(null, 'height', height);
			}
				
        }.bind(this);

		setRectPosition();
	
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END, setRectPosition);
		this.facade.registerOnEvent("key.event.up.37", setRectPosition);	
		this.facade.registerOnEvent("key.event.up.38", setRectPosition);
		this.facade.registerOnEvent("key.event.up.39", setRectPosition);
		this.facade.registerOnEvent("key.event.up.40", setRectPosition);
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_UNDO_EXECUTE, setRectPosition);	
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_UNDO_ROLLBACK, setRectPosition);	
		this.handlers.push(setRectPosition);
		
		
		// cruz sobre divergente
		var overlayId = ORYX.Editor.provideId();    
        var crossId = ORYX.Editor.provideId();    
        var cross = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
        	"id": crossId,
        	"title": "",
            "stroke-width": 5.0,
            "stroke": "red",
            "d": "M15,-5 L0,-20 M0,-5 L15,-20",
            "line-captions": "round"
        }]); 
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
            id: overlayId,
            shapes: [divergentShape],
            node: cross,
            nodePosition: divergentShape instanceof ORYX.Core.Edge ? "START" : "NW"
        }); 
        this.overlayIds.push(overlayId);

		
		// tooltip sobre cruz divergente
		var tooltipId = ORYX.Editor.provideId();
		
		var html = "<div style='width:290px;max-height:290px;overflow:auto;'>";
		for (var i=0; i < antipatterns.length; i++){
			var antipattern = antipatterns[i];
			html = html + "<br/>" + antipattern.name + ": " + antipattern.description + "<br/>";
			html = html + "<ul>";
			for(var j=0; j < antipattern.combinationsOfElements.length; j++){
				var tagName = antipattern.name + " " + j;
				var numberOfCombination = j+1;
				html = html + "<li><label style='float:left; width:160px; padding:4px;'>Combination of elements "+ numberOfCombination +"</label><button name='"+tagName+"' class='"+nodeName+"' type='button' style='width:22px; height:22px; background-color:lightgray; background-image:url(/oryx/images/view_elements.png); background-repeat:no-repeat; cursor:pointer' title='Show the combination of elements that produce the anti-pattern'></button></li>";
			}
			html = html + "</ul>";
		}
		html = html + "<br/><b>Descriptions of errors</b><br/>";
		html = html + "<ul>";
		html = html + "<li><u>Lack of synchronization:</u> there are situations where an element is activated from multiple incoming branches.</li>";
		html = html + "<li><u>Deadlock:</u> there are situations where not all incoming branches are activated.</li>";
		html = html + "<li><u>Improper completion:</u> there are situations where parallel activities cannot be executed properly.</li>";
		html = html + "</ul>";
		html = html + "</div>";
		
		var tooltip = new Ext.ToolTip({
			id: tooltipId,
			showDelay: 0,
			autoHide : false,
			closable : true,
			draggable: true,
			floating: true,
			shadow: false,
			title: "Node with anti-patterns", 
			html: html,
			target: crossId,
			listeners: {
				'render': function(){			
					tooltipIds.push(tooltipId);
                },
                'show': function(){			
					addEventToShowButtons();
                }
            }
		});		

		var addEventToShowButtons = function(){
			
			var showButtons = document.getElementsByClassName(nodeName);
			for(var i=0;i<showButtons.length;i++){
		
				showButtons[i].className = "";
						
				showButtons[i].addEventListener("click", function(){

					var tagName = (this.name).split(" ");
					var antipatternName = tagName[0];
					var numberOfCombination = tagName[1];
					
					var shapes = [];
					for(var j=0; j < antipatterns.length; j++){
						var antipattern = antipatterns[j];
						if(antipattern.name==antipatternName){
							var combinationOfElements = antipattern.combinationsOfElements[numberOfCombination];
							for (var k=0; k < combinationOfElements.length; k++){
								var elementShape = getElement(combinationOfElements[k]);
								shapes.push(elementShape);
							}
						}
					}
	
					if(this.style.backgroundColor == "lightgray"){
						this.style.backgroundColor = "gray";
						showElements(shapes);
					}
					else{
						this.style.backgroundColor = "lightgray";
						hideElements(shapes);
					}
				});
			}	
			
		}.bind(this);
		
		var getElement = function(id){
			
			var elementShape = this.facade.getCanvas().getChildShapeByResourceId(id);
			return elementShape;
			
		}.bind(this);
		
		var showElements = function(shapes){
			
			for(var i=0;i<shapes.length;i++){
				setAttributes(shapes[i].id);
			}
					
		}.bind(this);
		
		var setAttributes = function(id){
		
			var s = "#"+id+" .me * {fill: yellow} #"+id+" .me text * {fill: black} #"+id+"background) whit * {fill: yellow} #"+id+"background) whit text * {fill: black}\n";
			this.styleNode.appendChild(document.createTextNode(s));
		
		}.bind(this);
	
		var hideElements = function(shapes){

			for(var i=0;i<shapes.length;i++){
				deleteAttributes(shapes[i].id);
			}
				
		}.bind(this);
		
		var deleteAttributes = function(id){
					
			var delEl = $A(this.styleNode.childNodes).find(function(e){ 
				return e.textContent.include( '#' + id );
			});
		
			delEl.parentNode.removeChild(delEl);
			
		}.bind(this);
	},
	
	highlightSubprocessWithAntipatterns: function(subprocessId,tooltipIds){
		
		var subprocessShape = this.facade.getCanvas().getChildShapeByResourceId(subprocessId);
		
		// cruz sobre subproceso
		var overlayId = ORYX.Editor.provideId();    
		var crossId = ORYX.Editor.provideId();    
		var cross = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
			"id": crossId,
			"title": "",
			"stroke-width": 5.0,
			"stroke": "red",
			"d": "M57.5,47.5 L42.5,32.5 M42.5,47.5 L57.5,32.5",
			"line-captions": "round"
		}]); 
		this.facade.raiseEvent({
			type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
			id: overlayId,
			shapes: [subprocessShape],
			node: cross,
			nodePosition: subprocessShape instanceof ORYX.Core.Edge ? "START" : "NW"
		}); 
		this.overlayIds.push(overlayId);
		
		
		// tooltip sobre cruz subproceso
		var tooltipId = ORYX.Editor.provideId();
		
		var tooltip = new Ext.ToolTip({
			id: tooltipId,
			showDelay: 0,
			floating: true,
			shadow:false,
			title: "Subprocess with anti-patterns",
			html: "<br/>This subprocess contains anti-patterns. Please open it and run the check again to viewing the anti-patterns.",
			target: crossId,
			listeners: {
                'render': function(){			
					tooltipIds.push(tooltipId);
                }
            }
		});
	},

	resetCanvas: function(){
			
		this.gIds.each(function(id){
			document.getElementById(id).remove();
		}.bind(this)); 
		this.gIds.length=0; 

		this.overlayIds.each(function(id){
			this.facade.raiseEvent({
				type: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
				id: id
			});
		}.bind(this));	
		this.overlayIds.length=0;
	
		this.tooltipIds.each(function(id){
			document.getElementById(id).remove();
		}.bind(this));
		this.tooltipIds.length=0;	
		
		var delEl = $A(this.styleNode.childNodes);
		delEl.each(function(el){
			el.parentNode.removeChild(el);
		});	

		this.handlers.each(function(ev){			
			this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END, ev);
			this.facade.unregisterOnEvent("key.event.up.37", ev);
			this.facade.unregisterOnEvent("key.event.up.38", ev);
			this.facade.unregisterOnEvent("key.event.up.39", ev);
			this.facade.unregisterOnEvent("key.event.up.40", ev);
			this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_UNDO_EXECUTE, ev);
			this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_UNDO_ROLLBACK, ev);
		}.bind(this));
		this.handlers.length=0;				
    },
};

ORYX.Plugins.BpmnAntipatternsChecker = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.BpmnAntipatternsChecker);