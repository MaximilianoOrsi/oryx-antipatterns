// define namespace
if(!Repository) 
	var Repository = {};
if(!Repository.Plugins) 
	Repository.Plugins = {};

Repository.Plugins.ExportAll = {
	
	hidePanel: true,	
	
	construct: function(facade) {
		
		this.mask = new Ext.LoadMask(Ext.getBody(), {msg:"Exporting..."});
		
		this.facade = facade;
		
		this.toolbarButtons = [];
		this.toolbarButtons.push({
			text 		: "Export All",
			region		: 'right',
			tooltipText : "Export All",
			icon 		: "/backend/images/silk/page_white_code.png",
			handler		: this.exportAllModels.bind(this)				
		});
			
		arguments.callee.$.construct.apply(this, arguments); //call Plugin super class
	},
	
	exportAllModels: function(){
		
		this.mask.show();
		
		var modelsUri;
		var selectedModels = this.facade.getSelectedModels(); // obtiene los modelos seleccionados
		if(selectedModels.length>0)
			modelsUri = selectedModels;
		else{
			modelsUri = this.facade.getFilteredModels(); // obtiene los modelos filtrados
			//modelsUri = this.facade.getDisplayedModels(); // obtiene los modelos que se estan mostrando
		}
			
		var models = [];
		for(var i=0;i<modelsUri.length;i++){
			var modelUri = modelsUri[i];
			var modelName = "model " + modelUri.split("/")[2];
			var modelData = this.getModelData(modelUri);
			
			var model = {
				modelName: modelName,
				modelData: modelData
			};
			
			models.push(model);
		}
		var modelsAsString = Ext.encode(models);
		
		// Send the request to the server to export the models.
		new Ajax.Request("/oryx/exportall", {
			method: 'POST',
			asynchronous: false,
			parameters: {
				modelsAsString: modelsAsString,
			},
			onSuccess: function(response){
				
				// se muestra mensaje con resultado de la exportacion
				this.mask.hide();
				Ext.Msg.alert("Result", 'All models were exported successfully.');
				
			}.bind(this),
			onFailure: function(response){
				this.mask.hide();
				Ext.Msg.alert("Result", "Failed: " + response.statusText); 								
			}.bind(this)
		});			
	},
	
	getModelData: function(modelUri){
		
		var modelData;
		
		// Send the request to the server
		var url = "/backend/poem"+modelUri+"/json";
		new Ajax.Request(url, {
			method: 'GET',
			asynchronous: false,
			onSuccess: function(response){	
				modelData = Ext.decode(response.responseText);
			}.bind(this),
			onFailure: function(response){
				modelData = "";
			}.bind(this)
		});
		
		return modelData;
	},
};

Repository.Plugins.ExportAll = Repository.Core.ContextPlugin.extend(Repository.Plugins.ExportAll);
