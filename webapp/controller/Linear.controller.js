sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/library',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"gfex/petrobras/fornmanager/model/formatter",
], function (Controller, coreLibrary,Filter,FilterOperator,formatter) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	return Controller.extend("gfex.petrobras.fornmanager.controller.Linear", {
		formatter:formatter,
		onAfterRendering:function(){
			this.onFilter()
		},

		_syncSelect: function (sStepId) {
			var oModel = this.getView().getModel();
			oModel.setProperty('/linearWizardSelectedStep', sStepId);
		},

		validateProdInfoStep: function () {
			var oModel = this.getView().getModel(),
				oProdInfoStep = this.getView().byId("CnpjStep"),
				oData = oModel.getData(),
				bIsValidProdName = !!(oData['productName'] && oData['productName'].length >= 6),
				bIsValidProductWeight = !isNaN(oData['productWeight']);

			oModel.setProperty("/productNameState", bIsValidProdName ? ValueState.None : ValueState.Error);
			oModel.setProperty("/productWeightState", bIsValidProductWeight ? ValueState.None : ValueState.Error);

			oProdInfoStep.setValidated(bIsValidProdName && bIsValidProductWeight);
		},

		onActivate: function (oEvent) {
			var sCurrentStepId = oEvent.getParameter("id");
			sCurrentStepId = sCurrentStepId.split('-').pop();

			this._syncSelect(sCurrentStepId);

			if (sCurrentStepId === 'CnpjStep') {
				this.validateProdInfoStep();
			}
		},
		validCnpj:function(oEvent){
			const key = oEvent.getSource().getValue();
		},

		includeCnpj:function(oEvent){
			const key = oEvent.getSource().getValue();
			const regex = new RegExp(`[0-9]{2}.[0-9]{3}.[0-9]{3}/[0-9]{4}-[0-9]{2}`);
			if(!regex.test(key))
				return

			const cnpjs = this.getView().getModel().getProperty(`/cnpjCollection`);
			cnpjs.push({cnpj:key,status:true})
			model.setProperty("/cnpjCollection", cnpjs);
		},
		onFilter:function(oEvent=`active`){
			let key = typeof oEvent === `object` ? oEvent.getSource().getSelectedKey():oEvent;
			let tabFilters = [];
			let aData = this.getView().getModel().getProperty(`/cnpjCollection`);
			
			if(key === "active"){
			 	aData = aData.filter((cnpj)=>(cnpj.status))
				tabFilters.push(new Filter("status", FilterOperator.EQ, true));
			}
			// this.getView().getModel().setProperty('/cnpjCollection', aData);
			const bind = this.byId("cnpjTable").getBinding(`items`);
			bind.filter(tabFilters)
		},
	});
});
