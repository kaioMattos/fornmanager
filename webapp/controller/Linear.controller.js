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
			this.onFilter(`active`, `cnpjCollection`,`cnpjTable`);
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
		deleteOrBackCnpj:function(oEvent){
			const typeAction = oEvent.getSource().getType();
			let status = typeAction === `Reject`?false:true;
			const abaStatusCnpj = this.byId(`swichStatusCnpj`).getSelectedKey()

			const cnpj = oEvent.getSource().getParent().getCells()[0].getText();
			const collection = this.getView().getModel().getProperty(`/cnpjCollection`);
			let cnpjs = [];
			cnpjs = this.switchStatus(collection,status,`cnpj`, cnpj)
			this.getView().getModel().setProperty("/cnpjCollection", cnpjs);
			this.onFilter(status?`excluded`:`active`, `cnpjCollection`,`cnpjTable`);
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
		},

		includeCnpj:function(oEvent){
			const key = this.byId(`cnpj`).getValue();
			const regex = new RegExp(`[0-9]{2}.[0-9]{3}.[0-9]{3}/[0-9]{4}-[0-9]{2}`);
			if(!regex.test(key))
				return

			const cnpjs = this.getView().getModel().getProperty(`/cnpjCollection`);
			cnpjs.push({cnpj:key,status:true});
			this.getView().getModel().setProperty("/cnpjCollection", cnpjs);
			this.validateCnpjStep();
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
	});
});
