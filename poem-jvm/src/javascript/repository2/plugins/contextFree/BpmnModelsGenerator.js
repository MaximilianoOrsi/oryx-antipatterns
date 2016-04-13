// define namespace
if(!Repository) 
	var Repository = {};
if(!Repository.Plugins) 
	Repository.Plugins = {};

Repository.Plugins.BpmnModelsGenerator = {
	
	hidePanel: true,
	
	construct: function(facade) {
		
		this.toolbarButtons = [];
		this.facade = facade;
		
		this.toolbarButtons.push({
			text 		: "BPMN 2.0 Processes",
			menu 		: "Generate models",
			menuIcon	: "/backend/images/silk/generate_models.png",
			tooltipText : "Generate models",
			icon 		: "/backend/images/silk/bpmn_models_generator.png",
			handler		: this.showPanel.bind(this)					
		});
		
		this.mask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
		
		arguments.callee.$.construct.apply(this, arguments); //call plugin super class
	},
	
	showPanel: function(){     
		
		// Create a Form
		var formPanel = new Ext.form.FormPanel({
			id: 'oryx_modelsgenerator_form',
			frame: true,
    		autoScroll: true,
			width: 325, 
			height: 285,
			labelWidth: 200,
			defaultType: 'numberfield',
    		defaults:{
                        width: 30,
                        msgTarget: 'under',
                        allowBlank: false,
                        allowDecimals: false,
                        allowExponential: false
   					},
			items: [{
                        fieldLabel: 'Number of models (1-n)',
						name: 'numberOfModels',
                        labelStyle: 'width:200px;font-weight:bold;text-decoration:underline;',
						value: 4,
						minValue: 1,  
					},
                    {
						fieldLabel: 'Min elements of model (2-n)',
						name: 'minElements',
						value: 4,
						minValue: 2,
					},
                    {
						fieldLabel: 'Max elements of model (2-n)',
						name: 'maxElements',
						value: 50,
						minValue: 2,
					},
					{
						fieldLabel: 'Max sequence of elements (0-n)',
						name: 'maxSequence',
						value: 4,
						minValue: 0,
					},
					{
						fieldLabel: 'Max branching of divergence (2-n)',
						name: 'maxBranching',
						value: 4,
						minValue: 2,
					},
					{
						fieldLabel: 'Max nesting of divergences (0-n)',
						name: 'maxNesting',
						value: 4,
						minValue: 0,
					},
					{
						fieldLabel: 'Max nesting of subprocesses (0-n)',
						name: 'maxNestingOfSubprocesses',
						value: 4,
						minValue: 0,
					}],
			buttons:[{
						text: "Generate!",
						handler: function(){
							var form =  formPanel.getForm();
							if (form.isValid()) {
								var values = form.getValues();
								var numberOfModels = parseInt(values['numberOfModels']);
								var minElements = parseInt(values['minElements']);
                                var maxElements = parseInt(values['maxElements']);
								var maxBranching = parseInt(values['maxBranching']);
								var maxNesting = parseInt(values['maxNesting']);
								var maxSequence = parseInt(values['maxSequence']);
								var maxNestingOfSubprocesses = parseInt(values['maxNestingOfSubprocesses']);									
								
								window.close();
								this.generateModels(numberOfModels,minElements,maxElements,maxBranching,maxNesting,maxSequence,maxNestingOfSubprocesses);
							} else { 
								Ext.Msg.alert('Invalid Inputs', 'Please correct form errors.');
							}
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
            id: 'oryx_modelsgenerator_window',
			title: 'Models generator',
            resizable: false,
			modal: true,
            items: [formPanel]
        });
        
		// Show the window
		window.show();
    },
	
	generateModels: function(numberOfModels,minElements,maxElements,maxBranching,maxNesting,maxSequence,maxNestingOfSubprocesses){
		
		this.mask.show();
		
		// Send the request to the server to generate the models.
		new Ajax.Request("/oryx/bpmnmodelsgenerator", {
			method: 'GET',
			asynchronous: false,
			parameters: {
				numberOfModels: numberOfModels,
				minElements: minElements,
				maxElements: maxElements,
				maxBranching: maxBranching,
				maxNesting: maxNesting,
				maxSequence: maxSequence,
				maxNestingOfSubprocesses: maxNestingOfSubprocesses
			},
			onSuccess: function(response){
				
				var result = Ext.decode(response.responseText); 
				
				if(result.result=="Generated models successfully."){
					
					// se guardan los procesos
					var processesAsData = result.models;
					for(var i=0;i<processesAsData.length;i++){
						var processAsData = processesAsData[i];
						this.saveProcessAsData(processAsData);
					}
				
					// se actualiza el editor
					this.facade.applyFilter(); 
					
					// se muestra mensaje con resultado de la generacion
					this.mask.hide();
					Ext.Msg.alert("Result", result.result);
				}
				else{
					this.mask.hide();
					Ext.Msg.alert("Result", "Failed: " + result.result); 								
				}
				
			}.bind(this),
			onFailure: function(response){
				this.mask.hide();
				Ext.Msg.alert("Result", "Failed: " + response.statusText); 								
			}.bind(this)
		});		
	},
	
	saveProcessAsData: function(processAsData){
		
		var processUri = "";
		
		// se llama recursivamente con los subprocesos
		var referencesMapping = {};
		var subprocessesAsData = processAsData.subprocessesAsData;
		for(var i=0; i < subprocessesAsData.length; i++){
			var subprocessAsData = subprocessesAsData[i];
			var superprocessId = subprocessAsData.superprocessId;
			var subprocessUri = this.saveProcessAsData(subprocessAsData);
			referencesMapping[superprocessId] = subprocessUri;
		}
		
		// se actulizan las referencias de los subprocesos
		var processData = processAsData.processData;
		var childShapes = processData.childShapes;
		for(var i=0; i < childShapes.length; i++){
			var childShape = childShapes[i];
			var stencilId = childShape.stencil.id;
			if(stencilId=="CollapsedSubprocess"){
				var resourceId = childShape.resourceId;
				var entry = referencesMapping[resourceId];
				childShape.properties.entry = entry;
			}
		}
		
		// se guarda el proceso
		processUri = this.saveProcessData(processAsData);
		
		return processUri;
	},
	
	saveProcessData: function(processAsData){
		
		var processUri = "";
		
		// Send the request to the server to save the process.
		new Ajax.Request("/backend/poem/new?stencilset=/stencilsets/bpmn2.0/bpmn2.0.json", {
			method: 'POST',
			asynchronous: false,
			parameters: {
				data: Ext.encode(processAsData.processData),
				title: processAsData.title,
				summary: processAsData.summary,
				svg: "",
				type: "http://b3mn.org/stencilset/bpmn2.0#"
			},
			onSuccess: function(response){
				var loc = response.getResponseHeader("location");
				processUri = "editor;bpmn2.0#/model"+loc.split("model")[1].replace(/self\/?$/i,"");
			}.bind(this)
		});	
			
		return processUri;
	},	
	
};

Repository.Plugins.BpmnModelsGenerator = Repository.Core.Plugin.extend(Repository.Plugins.BpmnModelsGenerator);
