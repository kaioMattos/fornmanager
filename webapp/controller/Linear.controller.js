sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/library',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"gfex/petrobras/fornmanager/model/formatter",
	"../model/mockserver",
	"sap/m/plugins/UploadSetwithTable",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"gfex/petrobras/fornmanager/model/models",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/library",
], function (Controller, coreLibrary, Filter, FilterOperator, formatter,
	MockServer, UploadSetwithTable, MessageToast, MessageBox, model, Dialog, Button, 
	mobileLibrary) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	return Controller.extend("gfex.petrobras.fornmanager.controller.Linear", {
		formatter:formatter,
		onAfterRendering:function(){
			this._oNavContainer = this.byId("wizardNavContainer");
			this.onFilter(`active`, `cnpjCollection`,`cnpjTable`);
			this.oMockServer.oModel = this.byId("table-uploadSet").getModel("documents");
		},
		onInit: function () {
			this.documentTypes = this.getFileCategories();
			this.oMockServer = new MockServer();
			
			
		},
		onBeforeUploadStarts: function() {
			// This code block is only for demonstration purpose to simulate XHR requests, hence starting the mockserver.
			this.oMockServer.start();
		},
		onPluginActivated: function(oEvent) {
			this.oUploadPluginInstance = oEvent.getParameter("oPlugin");
		},
		getIconSrc: function(mediaType, thumbnailUrl) {
			return UploadSetwithTable.getIconForFileType(mediaType, thumbnailUrl);
		},
		onUploadCompleted: function(oEvent) {
			const oModel = this.byId("table-uploadSet").getModel("documents");
			const iResponseStatus = oEvent.getParameter("status");

			// check for upload is sucess
			if (iResponseStatus === 201) {
				oModel.refresh(true);
				setTimeout(function() {
					MessageToast.show("Document Added");
				}, 1000);
			}
			// This code block is only for demonstration purpose to simulate XHR requests, hence restoring the server to not fake the xhr requests.
			this.oMockServer.restore();
		},
		onRemoveButtonPress: function(oEvent) {
			var oTable = this.byId("table-uploadSet");
			const aContexts = oTable.getSelectedContexts();
			this.removeItem(aContexts[0]);
		},
		onRemoveHandler: function(oEvent) {
			var oSource = oEvent.getSource();
			const oContext = oSource.getBindingContext("documents");
			this.removeItem(oContext);
		},
		removeItem: function(oContext) {
			const oModel = this.getView().getModel("documents");
			const oTable = this.byId("table-uploadSet");
			const sMessage= this.getView().getModel(`i18n`).getProperty(`messageDeleteDocument`);
			MessageBox.warning(
				`${sMessage} ${oContext.getProperty("fileName")} ?`,
				{
					icon: MessageBox.Icon.WARNING,
					actions: ["Remove", MessageBox.Action.CANCEL],
					emphasizedAction: "Remove",
					styleClass: "sapMUSTRemovePopoverContainer",
					initialFocus: MessageBox.Action.CANCEL,
					onClose: function(sAction) {
						if (sAction !== "Remove") {
							return;
						}
						var spath = oContext.getPath();
						if (spath.split("/")[2]) {
							var index = spath.split("/")[2];
							var data = oModel.getProperty("/items");
							data.splice(index, 1);
							oModel.refresh(true);
							if (oTable && oTable.removeSelections) {
								oTable.removeSelections();
							}
						}
					}
				}
			);
		},
		getFileCategories: function() {
			return [
				{categoryId: "Invoice", categoryText: "Invoice"},
				{categoryId: "Specification", categoryText: "Specification"},
				{categoryId: "Attachment", categoryText: "Attachment"},
				{categoryId: "Legal Document", categoryText: "Legal Document"}
			];
		},
		getFileSizeWithUnits: function(iFileSize) {
			return UploadSetwithTable.getFileSizeWithUnits(iFileSize);
		},
		openPreview: function(oEvent) {
			const oSource = oEvent.getSource();
			const oBindingContext = oSource.getBindingContext("documents");
			if (oBindingContext && this.oUploadPluginInstance) {
				this.oUploadPluginInstance.openFilePreview(oBindingContext);
			}
		},
		_syncSelect: function (sStepId) {
			var oModel = this.getView().getModel();
			oModel.setProperty('/linearWizardSelectedStep', sStepId);
		},

		validateCnpjStep: function () {
			let oCnpjStep = this.byId(`CnpjStep`);
			let manufacturerStep = this.byId(`manufacturerStep`);
			let oClassStep = this.byId(`ClassStep`);
			let oExclusiLetterStep = this.byId(`exclusivityLetterStep`);
			let bIsValid = !!this.getView().getModel().getProperty(`/cnpjCollection`).find((cnpj)=>(cnpj.status));


			this.assembleCnpjManufacturer();
			oCnpjStep.setValidated(bIsValid);
			manufacturerStep.setBlocked(!bIsValid);
			oClassStep.setBlocked(!bIsValid);
			oExclusiLetterStep.setBlocked(!bIsValid);
		},
		validateManufactureStep: function () {
			
			let manufacturerStep = this.byId(`manufacturerStep`);
			let oClassStep = this.byId(`ClassStep`);
			let oExclusiLetterStep = this.byId(`exclusivityLetterStep`);
			let bIsValid = !!this.getView().getModel().getProperty(`/manufacturerCollection`).find((item)=>(item.status));
			let bIsValidClass = !!this.getView().getModel().getProperty(`/classCollection`).find((item)=>(item.status));


			this.assembleManufacturerClass();
			manufacturerStep.setValidated(bIsValid);
			oClassStep.setBlocked(!bIsValid);
			oExclusiLetterStep.setBlocked(!bIsValid);
			
		},
		validateClassStep: function () {
			let oClassStep = this.byId(`ClassStep`);
			let oExclusiLetterStep = this.byId(`exclusivityLetterStep`);
			let bIsValid = !!this.getView().getModel().getProperty(`/classCollection`).find((item)=>(item.status));
			oClassStep.setValidated(bIsValid);
			oExclusiLetterStep.setBlocked(!bIsValid)
		},
		deleteCnpj:function(collection, cnpj){
			return collection.filter((item)=>(item.cnpj !== cnpj));
		},
		switchStatus:function(collection, status, property, sValue){
			return collection.map((item)=>{

				if(item[property] === sValue){
					item.status = status
				}
				return item
			});
		},
		deleteCnpj:function(oEvent){
			const cnpj = oEvent.getSource().getParent().getCells()[0].getText();
			const collection = this.getView().getModel().getProperty(`/cnpjCollection`);
			let cnpjs = [];
			cnpjs = this.switchStatus(collection,false,`cnpj`, cnpj)
			this.getView().getModel().setProperty("/cnpjCollection", cnpjs);
			this.onFilter(`active`, `cnpjCollection`,`cnpjTable`);
			this.validateCnpjStep();
		},
		
		onActivate: function (oEvent) {
			var sCurrentStepId = oEvent.getParameter("id");
			sCurrentStepId = sCurrentStepId.split('-').pop();

			this._syncSelect(sCurrentStepId);

			if (sCurrentStepId === 'CnpjStep') {
				this.validateCnpjStep();
			} else if(sCurrentStepId === `manufacturerStep`){
				this.validateManufactureStep();
			}
		},
		validCnpj:function(oEvent){
			const key = oEvent.getSource().getValue();
			const x = key.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/);
			oEvent.getSource().setValue(!x[2] ? x[1] : x[1] + '.' + x[2] + '.' + x[3] + '/' + x[4] + (x[5] ? '-' + x[5] : ''));
		},
		includeCnpj: async function(oEvent){
			const key = this.byId(`cnpj`).getValue();
			const cnpjs = this.getView().getModel().getProperty(`/cnpjCollection`);
			const findCnpjInCollec = cnpjs.find((item)=>item.cnpj === key && item.status);
			if(findCnpjInCollec)
				return
			
			const oCnpj = await this.getFornecedor(key);
			if(!!oCnpj.length){
				cnpjs.push({
					cnpj:oCnpj[0].SupplierId,
					razaoSocial:oCnpj[0].SupplierName,
					status:true
				})
			}else{
				const message = this.getView().getModel(`i18n`).getProperty(`messageSupNotFound`);
				MessageBox.information(message, {
				styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
			});
			}
			this.getView().getModel().setProperty("/cnpjCollection", cnpjs);
			this.validateCnpjStep();
			this.byId(`cnpj`).setValue(``);
			
		},
		onFilter:function(oEvent=`active`, collection,table){
			let key = typeof oEvent === `object` ? oEvent.getSource().getSelectedKey():oEvent;
			let tabFilters = [];
			let aData = this.getView().getModel().getProperty(`/${collection}`);
			
			if(key === "active"){
			 	aData = aData.filter((cnpj)=>(cnpj.status))
				tabFilters.push(new Filter("status", FilterOperator.EQ, true));
			}else{
				tabFilters.push(new Filter("status", FilterOperator.EQ, false));
			}
			// this.getView().getModel().setProperty('/cnpjCollection', aData);
			const bind = this.byId(`${table}`).getBinding(`items`);
			bind.filter(tabFilters)
		},
		assembleManufacturerClass:function(){
			const panelManufac = this.byId(`StepClassManufac`);
			const oModel = this.getView().getModel().getProperty(`/manufacturerCollection`);
			const collectionClass= this.getView().getModel().getProperty(`/classCollection`);
			const manufactures = oModel.filter((cnpj)=>cnpj.status);
			panelManufac.removeAllItems();
			manufactures.forEach(function(manufacturer) {
				const oText = new sap.m.Text( {text:manufacturer.manufacturer});
				panelManufac.addItem(oText);
			})
			const sClass= this.getView().getModel(`i18n`).getProperty(`classStep`);
			this.setCountingTable(`titleClass`, collectionClass.filter((item)=>(item.status)),sClass);
		},
		assembleCnpjManufacturer:function(){
			const panelCnpj = this.byId(`cnpjsStepManufacturer`);
			const oModel = this.getView().getModel().getProperty(`/cnpjCollection`);
			const collectionManufacturer = this.getView().getModel().getProperty(`/manufacturerCollection`);
			const cnpjs = oModel.filter((cnpj)=>cnpj.status);
			panelCnpj.removeAllItems();
			cnpjs.forEach(function(cnpj) {
				const oText = new sap.m.Text( {text:cnpj.cnpj});
				panelCnpj.addItem(oText);
			})
			const sManufacturer = this.getView().getModel(`i18n`).getProperty(`manufacturerStep`);
			this.setCountingTable(`titleManufacturer`,collectionManufacturer.filter((item)=>(item.status)),sManufacturer);
		},
		setCountingTable:function(bId, oModel, sTitle){
			this.byId(`${bId}`).setText(`(${oModel.length}) ${sTitle}`)
		},
		onFilterManufacture:function(oEvent){
			this.onFilter(oEvent, `manufacturerCollection`,`manufactureTable`);
		},
		onFilterCnpj:function(oEvent){
			this.onFilter(oEvent, `cnpjCollection`,`cnpjTable`);
		},
		onFilterClass:function(oEvent){
			this.onFilter(oEvent, `classCollection`,`classTable`);
		},
		deleteOrBackManufacture:function(oEvent){
			const typeAction = oEvent.getSource().getType();
			let status = typeAction === `Reject`?false:true;

			const manufacturer = oEvent.getSource().getParent().getCells()[0].getText();
			const collection = this.getView().getModel().getProperty(`/manufacturerCollection`);
			let aManufacturer = [];
			aManufacturer = this.switchStatus(collection,status,`manufacturer`, manufacturer)
			this.getView().getModel().setProperty("/manufacturerCollection", aManufacturer);
			this.onFilter(status?`excluded`:`active`, `manufacturerCollection`,`manufactureTable`);
			const sManufacturer = this.getView().getModel(`i18n`).getProperty(`manufacturerStep`);
			this.setCountingTable(`titleManufacturer`,collection.filter((item)=>(item.status)),sManufacturer);
			this.validateManufactureStep();
		},
		deleteOrBackClass:function(oEvent){
			const typeAction = oEvent.getSource().getType();
			let status = typeAction === `Reject`?false:true;

			const sClass = oEvent.getSource().getParent().getCells()[0].getText();
			const collection = this.getView().getModel().getProperty(`/classCollection`);
			let aClass = [];
			aClass = this.switchStatus(collection,status,`class`, sClass)
			this.getView().getModel().setProperty("/classCollection", aClass);
			this.onFilter(status?`excluded`:`active`, `classCollection`,`classTable`);
			const nameClass = this.getView().getModel(`i18n`).getProperty(`classStep`);
			this.setCountingTable(`titleClass`,collection.filter((item)=>(item.status)),nameClass);
			this.validateClassStep();
		},
		getFornecedor: async function(sValue) {
			let aFilters = [
				new Filter({
					path: "SupplierId",
					operator: FilterOperator.EQ,
					value1: sValue
				})
			];

			try{
				const fornecedor = await model.getFornecedores({filters: aFilters});
				return fornecedor
				
			}catch(oError){
				sap.ui.core.BusyIndicator.hide();
				MessageBox.error(this.this.getView().getModel(`i18n`).getProperty("errorFornecedor"));
			}
			
		},
		checkRequired:function(){
			let sError = false
			let aItemsDocuments = this.byId('table-uploadSet').getItems();
			aItemsDocuments.forEach(function(item) {
				const input = item.getCells()[3].getItems()[1];
				const visible = input.getVisible();
				const value = input.getValue();
				if(input && value.length < 1){
					input.setValueState('Error');
					input.focus();
					sError = true
				}else{
					input.setValueState('None');
				}
			})
			return sError
		},
		completedHandler: function () {
			const validateRequireds = this.checkRequired();
		},
	});
});
