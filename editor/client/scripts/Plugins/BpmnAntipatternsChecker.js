// define namespace
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.BpmnAntipatternsChecker = {

    construct: function(){
		
		arguments.callee.$.construct.apply(this, arguments); //call plugin super class
        
		this.raisedEventIds = [];	
		
		this.gIds = [];
		
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
            this.resetErrors();
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

		this.mask.show();
		
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
				
				if(result.result=="The model is unsound."){

					var processWithResult = result.processWithResult;
				
					// se cargan los nodos con antipatrones
					var nodesWithAntipatterns = processWithResult.nodesWithAntipatterns;
					
					// se cargan los subprocesos con antipatrones
					var subprocessesWithAntipatterns = this.subprocessesWithAntipatterns(processWithResult.subprocessesWithResult);				
					
					// se muestran los nodos con antipatrones
					for (var i=0; i < nodesWithAntipatterns.length; i++){
						var node = nodesWithAntipatterns[i];
						this.highlightNodeWithAntipatterns(node.nodeId, node.divergentId, node.convergentId, node.antipatterns);
					}
					
					// se muestran los elementos con warnings
					var elementsWithWarnings = this.elementsWithWarnings(nodesWithAntipatterns);		
					for (var i=0; i < elementsWithWarnings.length; i++){	
						var element = elementsWithWarnings[i];					
						this.highlightElementWithWarnings(element.elementId, element.warnings);	
					}
					
					// se muestran los subprocesos con antipatrones
					for (var i=0; i < subprocessesWithAntipatterns.length; i++){	
						var subprocess = subprocessesWithAntipatterns[i];					
						this.highlightSubprocessWithAntipatterns(subprocess);	
					}
					
					// se muestra la ayuda
					this.showHelp();
					
					// se muestra mensaje con resultado de la verificacion
					this.mask.hide();
					Ext.Msg.alert("Result", result.result + "<br/>" + nodesWithAntipatterns.length + " nodes with anti-patterns were found.<br/>" + subprocessesWithAntipatterns.length + " subprocesses with anti-patterns were found.");
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
	
	elementsWithWarnings: function(nodesWithAntipatterns){

		var elementsWithWarning = [];		
		for (var i=0; i < nodesWithAntipatterns.length; i++){
			for (var j=0; j < nodesWithAntipatterns[i].antipatterns.length; j++){
				for (var k=0; k < nodesWithAntipatterns[i].antipatterns[j].warningElementsIds.length; k++){					
					
					var warning = {
						nodeId: nodesWithAntipatterns[i].nodeId,
						divergentId: nodesWithAntipatterns[i].divergentId,
						convergentId: nodesWithAntipatterns[i].convergentId,
						antipatternType: nodesWithAntipatterns[i].antipatterns[j].type,
						antipatternDescription: nodesWithAntipatterns[i].antipatterns[j].description
					};
					
					var elementWithWarning = {
						elementId: nodesWithAntipatterns[i].antipatterns[j].warningElementsIds[k],
						warning: warning
					};
				
					elementsWithWarning.push(elementWithWarning);
				}
			}
		}
		
		// se fusionan los elementsWithWarning
		var elementsWithWarnings = [];
		for (var i=0; i < elementsWithWarning.length; i++){
			
			var exist = false;
			for (var j=0; j < elementsWithWarnings.length; j++){
				if(elementsWithWarning[i].elementId == elementsWithWarnings[j].elementId){ // si existe, se le agrega el warning
					elementsWithWarnings[j].warnings.push(elementsWithWarning[i].warning);
					exist = true;
					break;
				}
			}
			
			if(exist==false){ // si no existe, se lo agrega
				
				var elementWithWarnings = {
					elementId: elementsWithWarning[i].elementId,
					warnings: [elementsWithWarning[i].warning],
				};
				
				elementsWithWarnings.push(elementWithWarnings);
			}
		}

		return elementsWithWarnings;
	},
	
	highlightNodeWithAntipatterns: function(nodeId, divergentId, convergentId, antipatterns){
		
		var divergentShape = this.facade.getCanvas().getChildShapeByResourceId(divergentId);
		var convergentShape = this.facade.getCanvas().getChildShapeByResourceId(convergentId);
	
		// rectangulo sobre nodo
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
			
			dashedArea.setAttributeNS(null, 'x', x);
			dashedArea.setAttributeNS(null, 'y', y);
			dashedArea.setAttributeNS(null, 'width', width);
			dashedArea.setAttributeNS(null, 'height', height);
			
        }.bind(this);
	
		var containerNode = this.facade.getCanvas().getSvgContainer();
		var gId = ORYX.Editor.provideId();  
		this.gIds.push(gId);
		var node = ORYX.Editor.graft("http://www.w3.org/2000/svg", $(containerNode),['g',{'id':gId}]);  		
		var rectId = ORYX.Editor.provideId();  
		var dashedArea = ORYX.Editor.graft("http://www.w3.org/2000/svg", node,
			['rect', 
			{'x': 0, 
			'y': 0,
			'id': rectId,
			'stroke-width': 1, 
			'stroke': 'red', 
			'fill': 'none',
			'stroke-dasharray': '4',
			'pointer-events': 'none'}]);

		setRectPosition();
		node.setAttributeNS(null, 'display', '');
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEUP, setRectPosition.bind(this));	
		document.documentElement.addEventListener(ORYX.CONFIG.EVENT_KEYUP, setRectPosition.bind(this), true);	

		// cruz sobre divergente
		var id = "antipatternschecker." + this.raisedEventIds.length;    
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
            id: id,
            shapes: [divergentShape],
            node: cross,
            nodePosition: divergentShape instanceof ORYX.Core.Edge ? "START" : "NW"
        }); 
        this.raisedEventIds.push(id);

		// tooltip sobre cruz divergente
		var html = "";
		var antipattern;
		for (var i=0; i < antipatterns.length; i++){
			antipattern = antipatterns[i];
			html = html + antipattern.type + " (" + antipattern.description + "): " + antipattern.warningElementsIds.length + " elements that are causing the anti-pattern.<br/>";
		}
		html = html + "<br/>For more information, refer to help (move the mouse to the upper left of this canvas)";
        
		var tooltip = new Ext.ToolTip({
        	showDelay: 100,
			dismissDelay: 0,
        	title: "Anti-patterns of the node " + nodeId,
        	html: html,
        	target: crossId
        });
    },

	highlightElementWithWarnings: function(elementId, warnings){

		var elementShape = this.facade.getCanvas().getChildShapeByResourceId(elementId);

		// cruz sobre warning	
		var height = elementShape.absoluteBounds().lowerRight().y - elementShape.absoluteBounds().upperLeft().y;	
		var id = "antipatternschecker." + this.raisedEventIds.length;    
		var crossId = ORYX.Editor.provideId();    
		var cross = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
			"id": crossId,
			"title": "",
			"stroke-width": 5.0,
			"stroke": "yellow",
			"d": "M15,"+(height+20)+" L0,"+(height+5)+" M0,"+(height+20)+" L15,"+(height+5)+"",
			"line-captions": "round"
		}]); 
		this.facade.raiseEvent({
			type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
			id: id,
			shapes: [elementShape],
			node: cross,
			nodePosition: elementShape instanceof ORYX.Core.Edge ? "START" : "NW"
		}); 
		this.raisedEventIds.push(id);
		
		// tooltip sobre cruz warning
		var html = "";
		var warning;
		for (var i=0; i < warnings.length; i++){
			warning = warnings[i];
			html = html + warning.antipatternType + " (" + warning.antipatternDescription + ") of the Node " + warning.nodeId + ".<br/>";
		}
		html = html + "<br/>For more information, refer to help (move the mouse to the upper left of this canvas)";
		
		var tooltip = new Ext.ToolTip({
			showDelay: 100,
			dismissDelay: 0,
			title: "Anti-patterns that is causing the element",
			html: html,
			target: crossId
		});
       
		// resaltar divergente y convergente	
		var overlayId = ORYX.Editor.provideId(); 
		var shapes = [];
		
		var show = function(){	
			this.facade.raiseEvent({
				type        : ORYX.CONFIG.EVENT_OVERLAY_SHOW,
				id          : overlayId,
				shapes      : shapes,
				attributes  : {fill: "yellow"},
			});
		}.bind(this);		
		var hide = function(){			
			this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
                id: overlayId
            });
		}.bind(this);
		
		for (var i=0; i < warnings.length; i++){
			warning = warnings[i];
			var divergentShape = this.facade.getCanvas().getChildShapeByResourceId(warning.divergentId);
			shapes.push(divergentShape);
			var convergentShape = this.facade.getCanvas().getChildShapeByResourceId(warning.convergentId);
			shapes.push(convergentShape);
		}

		document.getElementById(crossId).addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER, show.bind(this), true);
		document.getElementById(crossId).addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT, hide.bind(this), true);
	},
	
	highlightSubprocessWithAntipatterns: function(subprocessId){
		
		var subprocessShape = this.facade.getCanvas().getChildShapeByResourceId(subprocessId);
		
		// cruz sobre subproceso
		var id = "antipatternschecker." + this.raisedEventIds.length;    
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
			id: id,
			shapes: [subprocessShape],
			node: cross,
			nodePosition: subprocessShape instanceof ORYX.Core.Edge ? "START" : "NW"
		}); 
		this.raisedEventIds.push(id);
		
		// tooltip sobre cruz subproceso
		var html = "This subprocess contains anti-patterns. Please open it and run the check again to viewing the anti-patterns.";
		
		var tooltip = new Ext.ToolTip({
			showDelay: 100,
			dismissDelay: 0,
			title: "Subprocess with anti-patterns",
			html: html,
			target: crossId
		});
	},
	
	showHelp: function(){
		
		var containerNode = this.facade.getCanvas().getSvgContainer();
		var gId = ORYX.Editor.provideId(); 
		this.gIds.push(gId);
		var node = ORYX.Editor.graft("http://www.w3.org/2000/svg", $(containerNode),['g',{'id':gId}]); 
		var textId = ORYX.Editor.provideId();
		var dashedArea = ORYX.Editor.graft("http://www.w3.org/2000/svg", node, 
			['text', 
			{'x': 5, 
			'y': 15, 
			'id': textId, 
			'style': 'font-size: 10px;'}, 
			'Move the mouse to this position for help.']);
		node.setAttributeNS(null, 'display', '');
		
		var html = "";
		html = html + "<br/><b>Instructions</b><br/>";
		html = html + "- Move the mouse over crosses to see the errors messages.<br/>";
		html = html + "- The red crosses show nodes or sub-processes that have anti-patterns.<br/>";
		html = html + "- The yellow crosses show possible elements that produces the anti-patterns of the nodes.<br/>";
		html = html + "<br/><b>Descriptions of errors</b><br/>";
		html = html + "<u>Lack of synchronization:</u> there are situations where an element is activated from multiple incoming branches.<br/>";
		html = html + "<u>Deadlock:</u> there are situations where not all incoming branches are activated.<br/>";
		html = html + "<u>Improper completion:</u> there are situations where parallel activities cannot be executed properly.";
		
		var tooltip = new Ext.ToolTip({
        	showDelay: 100,
			autoHide: false,
			closable: true,
			width: 500,
			height: 400,
			autoScroll: true,
        	title: "Help",
        	html: html,
        	target: textId
        });
	},

	resetErrors: function(){
		this.raisedEventIds.each(function(id){
			this.facade.raiseEvent({
				type: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
				id: id
			});
		}.bind(this))	
		this.raisedEventIds = [];

		this.gIds.each(function(id){
			var child = document.getElementById(id);
			this.facade.getCanvas().getSvgContainer().removeChild(child);		
		}.bind(this)) 
		this.gIds = []; 
    },

};

ORYX.Plugins.BpmnAntipatternsChecker = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.BpmnAntipatternsChecker);