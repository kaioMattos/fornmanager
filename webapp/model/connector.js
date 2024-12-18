sap.ui.define([
    "sap/ui/model/odata/v2/ODataModel"
], function (ODataModel) {
    "use strict";

    return {

        _pDataServicesInit: null,
        _oDataModel: null,
        _oDataModelHana: null,
        _oComponent: null,

        init: function (oComponent) {
            this._oComponent = oComponent;
            this._oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/YESB_GFEX", {
                defaultUpdateMethod: sap.ui.model.odata.UpdateMethod.Put
            });
            
            this._oDataModelHana = new sap.ui.model.odata.v2.ODataModel("/odata/v2/catalog");
            

            var aModels = [this._oDataModel, this._oDataModelHana];
            var aPromises = aModels.map(oModel => {
                return new Promise((resolve, reject) => {
                    oModel.attachEventOnce("metadataLoaded", resolve);
                    oModel.attachEventOnce("metadataFailed", reject);
                });
            });

            this._pDataServicesInit = Promise.all(aPromises);
        },

        getOwnerComponent: function () {
            return this._oComponent;
        },

        readDataSource: function (sPath, options, odataModel) {
            return new Promise((resolve, reject) => {
                return this._pDataServicesInit.then(() => {
                    if (!options) {
                        options = {};
                    }

                    options = {
                        ...options,
                        success: (oData, response) => resolve({
                            oData,
                            response
                        }),
                        error: oError => reject(oError)
                    };
					
                    this[odataModel].read(sPath, options);
                });
            });
        },

        readXsjs: function (sPath) {
            return new Promise((resolve, reject) => {
                fetch(`/hana/rule${sPath}`)
                    .then(response => response.json())
                    .then(data => {
                        resolve(data);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        },

        update: function (sPath, data) {
            return new Promise((resolve, reject) => {
                this._oDataModel.update(sPath, data, {
                    async: true,
                    success: function (oData, oResponse) {
                        resolve(oData, oResponse);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        },

        create: function (sPath, data) {
            return new Promise((resolve, reject) => {
                this._oDataModelHana.create(sPath, data, {
                    async: true,
                    success: function (oData, oResponse) {
                        resolve(oData, oResponse);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        },

        createXsjs: function (sPath, oData) {
            var requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(oData)
            };

            return new Promise((resolve, reject) => {
                fetch(`/hana/rule${sPath}`, requestOptions)
                    .then(response => response.json())
                    .then(data => {
                        resolve(data);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        },

        remove: function (sPath) {
            return new Promise((resolve, reject) => {
                this._oDataModel.remove(sPath, {
                    async: true,
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        },

    };
});