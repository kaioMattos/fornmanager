sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
	"sap/m/MessageToast",
	"sap/base/Log",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "gfex/petrobras/fornmanager/model/models",
    "sap/m/MessageBox",
], function (Controller, JSONModel, MessageToast, Log, Filter, FilterOperator, model, MessageBox) {
        "use strict";
       
        return Controller.extend("gfex.petrobras.fornmanager.controller.main", {
            onInit: function () {
                this.linearWizard = this.byId("wizardViewLinear");
                this.branchingWizard = this.byId("wizardViewBranching");
                this.model = new JSONModel({
                    selectedBackgroundDesign: "Standard",
                    selectedShowCase: "linear",
                    linearWizardSelectedStep: "BasicDataStep"
                });
                this.getView().setModel(this.model);
                this.loadApp();
            },
            onOpenPopoverDialog: function (sDialog) {
                // create dialog lazily
                if (!this[sDialog]) {
                    this[sDialog] = this.loadFragment({
                        name: `gfex.petrobras.fornmanager.view.fragment.${sDialog}`
                    });
                }
                this[sDialog].then(function (oDialog) {
                    this.oDialog = oDialog;
                    this.oDialog.open();
               
                }.bind(this));
            },
            setColumnS4:function(column){
                return column.charAt(0).toUpperCase() + column.slice(1)
            },
            assembleFilter:function(aFilter,db){
                return aFilter.map((item)=>(new Filter({
                    path: db === 'S4' ? this.setColumnS4(item.path):item.path,
                    operator: FilterOperator[item.operator],
                    value1: item.value
                })))
            },
            loadModels:function(s4Model){
                this.model = new JSONModel({
                    supplierS4:s4Model,
                    cnpjCollection:[{
                        cnpj:"43.904.982/0001-59",status:true,razaoSocial:"BOMBAS GAS DISTRIBUIDORA LTDA"
                    }],
                    manufacturerCollection:[{
                        manufacturer:"Logística Aérea: CHC DO BRASIL TÁXI AEREO S.A.",status:true
                    }],
                    classCollection:[{
                        class:"Classes Bombas",status:true
                    }],
                    selectedBackgroundDesign: "Standard",
                    selectedShowCase: "linear",
                    linearWizardSelectedStep: "BasicDataStep"
                });
                this.getView().setModel(this.model);
            },
            loadApp: async function(){
                let aFilters = [{
                    path: "documentId",
                    operator: "EQ",
                    value: '00245360000153'
                }];
                let aFiltersS4 = this.assembleFilter(aFilters,'S4');
                let aFiltersHana = this.assembleFilter(aFilters,'HANA');
                
                try{
                    this.getView().setBusy(true);
                    const fornecedorHana = await model.getFornecedorHana({filters: aFiltersHana});
                    const fornecedorS4 = await model.getFornecedores({filters: aFiltersS4});
                    this.loadModels(fornecedorS4[0]);
                    if (!fornecedorHana.length)
                        this.onOpenPopoverDialog('Welcome')
                    
                }catch(oError){
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this.getView().getModel(`i18n`).getProperty("errorFornecedor"));
                }
            },
            _closeDialog: function (event, sDialog) {
                this.oDialog.close();
                this.getView().setBusy(false);
            },
            onCurrentStepChangeLinear: function (event) {
                var oProductWizard = this.linearWizard.byId("FornGfexWizard");
    
                oProductWizard.setCurrentStep(this.byId("wizardViewLinear").byId(event.getParameter("selectedItem").getKey()));
            },
    
            onBackgroundDesignChange: function (event) {
                var oProductWizard = this.linearWizard.byId("FornGfexWizard"),
                    oBranchingWizard = this.branchingWizard.byId("BranchingWizard");
    
                oProductWizard.setBackgroundDesign(event.getParameter("selectedItem").getKey());
                oBranchingWizard.setBackgroundDesign(event.getParameter("selectedItem").getKey());
            },
            completedHandler: function () {
                this._oNavContainer.to(this.byId("reviewContentPage"));
            },
            onCurrentStepChangeBranching: function (event) {
                var oBranchingWizard = this.branchingWizard.byId("BranchingWizard");
    
                try {
                    oBranchingWizard.setCurrentStep(this.byId("wizardViewBranching").byId(event.getParameter("selectedItem").getKey()));
                } catch (ex) {
                    MessageToast.show(ex);
                    Log.error(ex);
                    this.byId("selectBranchingCurrentStep").setSelectedKey(this.branchingWizard.getCurrentStep());
                    this.byId("wizardViewBranching").byId("BranchingWizard").getSteps()[0].$().firstFocusableDomRef().focus();
                    this.byId("wizardViewBranching").getController().reapplyLastPath();
                }
            }
        });
    });
