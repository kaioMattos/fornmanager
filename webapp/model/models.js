sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"gfex/petrobras/fornmanager/model/connector"

], function(JSONModel, Device, connector) {
	"use strict";

	return {

        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

		createShipping: function(data) {
			return connector.create("/CriarRemessaSet", data).then(function(oData, oResponse) {
				return oData;
			});
		},

		getDetails: function(options) {
			return connector.readDataSource("/BuscaQuiriusSet", options).then(function(result) {
				var oData = result.oData.results;
				return oData;
			});
		},

		getFornecedores: function(options) {
			return connector.readDataSource("/CentralConsumer", options, '_oDataModel').then(function(result) {
				var oData = result.oData.results;
				return oData;
			});
		},

		getFornecedorHana: function(options) {
			return connector.readDataSource("/Suppliers", options,'_oDataModelHana').then(function(result) {
				var oData = result.oData.results;
				return oData;
			});
		},

		createFornHana: function(data) {
			return connector.create("/Suppliers", data).then(function(oData, oResponse) {
				return oData;
			});
		},

		getHistoric: function(options) {
			return connector.readDataSource("/DetalheDocumentosSet", options).then(function(result) {
				var oData = result.oData.results;
				return oData;
			});
		},
		
		deleteRemmitance: function(sNumOrder) {
			return connector.remove(sNumOrder);
		}
	};
});