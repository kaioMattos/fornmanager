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
			return connector.readDataSource("/CentralConsumer", options).then(function(result) {
				var oData = result.oData.results;
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