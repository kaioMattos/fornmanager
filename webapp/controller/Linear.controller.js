sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/library'
], function (Controller, coreLibrary) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	return Controller.extend("gfex.petrobras.fornmanager.controller.Linear", {
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
		}
	});
});
