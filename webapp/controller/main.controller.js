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
	"sap/ui/core/util/File",
	'sap/base/util/uid',
	'sap/ui/model/json/JSONModel',
], function (Controller, coreLibrary, Filter, FilterOperator, formatter,
	MockServer, UploadSetwithTable, MessageToast, MessageBox, model, Dialog, Button, 
	mobileLibrary,File, uid, JSONModel) {
	"use strict";
       
        return Controller.extend("gfex.petrobras.fornmanager.controller.main", {
            onInit: function () {
                
                this.selectedShowCase = '';
                this.linearWizard = this.byId("wizardViewLinear");
                this.branchingWizard = this.byId("wizardViewBranching");
                this.model = new JSONModel({
                    selectedBackgroundDesign: "Standard",
                    linearWizardSelectedStep: "BasicDataStep",
                    editMode:false,
                    cnpjCollection:[],
                    manufacturerCollection:[],
                    classCollection:[],
                    documentCollection:[]
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
            assembleModels:function(hanaModel){
                 const oModels = {                    
                    cnpjCollection:[],
                    manufacturerCollection:[],
                    classCollection:[],
                    documentCollection:[],
                 };
                 if(hanaModel.length > 0){
                    oModels.cnpjCollection = JSON.parse(hanaModel[0].cnpj);
                    oModels.manufacturerCollection = JSON.parse(hanaModel[0].manufacturer);
                    oModels.classCollection = JSON.parse(hanaModel[0].class);
                    oModels.documentCollection = hanaModel[0].exclusiveCard.results
                 }
                 return oModels
                
            },
            loadModels:function(s4Model,hanaModel){
                const {
                    cnpjCollection, 
                    manufacturerCollection,
                    classCollection,
                    documentCollection
                } = this.assembleModels(hanaModel);
                const oModel = new JSONModel({
                    supplierHana:hanaModel,
                    supplierS4:s4Model,
                    cnpjCollection,
                    manufacturerCollection,
                    classCollection,
                    documentCollection,
                    selectedBackgroundDesign: "Standard",
                    selectedShowCase:this.selectedShowCase,
                    linearWizardSelectedStep: "BasicDataStep",
                    visibleLinear:false
                });
                this.getView().setModel(oModel);
            },
            openInitialModal:function(oSupplier){
                switch(oSupplier){
                    case 'em andamento':
                        this.onOpenPopoverDialog('PetroValidation');
                        this.selectedShowCase = 'review';
                        break
                    case 'concluido':
                        this.onOpenPopoverDialog('PetroValidated');
                        this.selectedShowCase = 'review';
                        break
                    default: 
                        this.onOpenPopoverDialog('Welcome');
                        this.selectedShowCase = 'linear';
                }
                this.getView().getModel().updateBindings();
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
                    const fornecedorHana = await model.getFornecedorHana({
                        filters: aFiltersHana,
                        urlParameters: {
                            "$expand": "exclusiveCard"
                      }});
                    const fornecedorS4 = await model.getFornecedores({filters: aFiltersS4});
                    const supplier = !fornecedorHana.length?'':fornecedorHana[0].validatedPetro
                    this.openInitialModal(supplier);
                    
                    this.loadModels(fornecedorS4[0],fornecedorHana);
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
                var oProductWizard = this.linearWizard.byId("WizardSupGFEX");
    
                oProductWizard.setCurrentStep(this.byId("wizardViewLinear").byId(event.getParameter("selectedItem").getKey()));
            },
    
            onBackgroundDesignChange: function (event) {
                var oProductWizard = this.linearWizard.byId("WizardSupGFEX"),
                    oBranchingWizard = this.branchingWizard.byId("BranchingWizard");
    
                oProductWizard.setBackgroundDesign(event.getParameter("selectedItem").getKey());
                oBranchingWizard.setBackgroundDesign(event.getParameter("selectedItem").getKey());
            },
            completedHandler: function () {
                this._oNavContainer.to(this.byId("reviewContentPage"));
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
                const oModel = this.getView().getModel();
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
                                var data = oModel.getProperty("/documentCollection");
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
                let oDocument = oEvent.getSource().getBindingContext().getObject();
                const type = oDocument.mediaType;
    
                if(type==="text/plain" || type==="application/pdf" || type==="application/msword"){
                    const fContent =atob(oDocument.file);
                    File.save(fContent, oDocument.fileName, oDocument.extension, type);
                }						 
            },
            _syncSelect: function (sStepId) {
                var oModel = this.getView().getModel();
                oModel.setProperty('/linearWizardSelectedStep', sStepId);
            },
    
            validateCnpjStep: function () {
                let oCnpjStep = this.byId(`CnpjStep`);
                let manufacturerStep = this.byId(`manufacturerStep`);
                let oClassStep = this.byId(`classStep`);
                let oExclusiLetterStep = this.byId(`exclusivityLetterStep`);
                let bIsValid = !!this.getView().getModel().getProperty(`/cnpjCollection`).find((cnpj)=>(cnpj.status));
    
    
                
                oCnpjStep.setValidated(bIsValid);
                if(bIsValid){
                    this.assembleManufacturer();
                }
                manufacturerStep.setBlocked(!bIsValid);
                // oClassStep.setBlocked(!bIsValid);
               // oExclusiLetterStep.setBlocked(!bIsValid);
            },
            validateManufactureStep: function () {
                
                let manufacturerStep = this.byId(`manufacturerStep`);
                let oClassStep = this.byId(`classStep`);
                let oExclusiLetterStep = this.byId(`exclusivityLetterStep`);
                let bIsValid = !!this.getView().getModel().getProperty(`/manufacturerCollection`).find((item)=>(item.status));
                let bIsValidClass = !!this.getView().getModel().getProperty(`/classCollection`).find((item)=>(item.status));
    
    
                
                if(bIsValid){
                    this.assembleManufacturerClass();
                }
                manufacturerStep.setValidated(bIsValid);
                //oClassStep.setBlocked(!bIsValid);
                //oExclusiLetterStep.setBlocked(!bIsValid);
                
            },
            validateClassStep: function () {
                let oClassStep = this.byId(`classStep`);
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
            
            onActivate: async function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                sCurrentStepId = sCurrentStepId.split('-').pop();
                if (sCurrentStepId === 'CnpjStep') {
                    this.validateCnpjStep();
                } else if(sCurrentStepId === `manufacturerStep`){
                    await this.assembleManufacturer();
                    this.validateManufactureStep();
                } else if(sCurrentStepId === `classStep`){
                    await this.assembleClass();
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
                        cnpj:oCnpj[0].DocumentId,
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
                this.setCountingTable(`titleItemsCnpj`, cnpjs.filter((item)=>(item.status)).length,'Items');
                this.validateCnpjStep();
                this.byId(`cnpj`).setValue(``);
                
            },
            onFilter:function(oEvent=`active`, collection,table){
                let key = typeof oEvent === `object` ? oEvent.getSource().getSelectedKey():oEvent;
                let tabFilters = [];
                let aData = this.getView().getModel().getProperty(`/${collection}`);
                if(!aData)
                    return
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
                //const panelManufac = this.byId(`StepClassManufac`);
                const oModel = this.getView().getModel().getProperty(`/manufacturerCollection`);
                const collectionClass= this.getView().getModel().getProperty(`/classCollection`);
                const manufactures = oModel.filter((cnpj)=>cnpj.status);
                //panelManufac.removeAllItems();
                //manufactures.forEach(function(manufacturer) {
                //    const oText = new sap.m.Text( {text:manufacturer.manufacturer});
                //    panelManufac.addItem(oText);
                //})
                const sClass= this.getView().getModel(`i18n`).getProperty(`classStep`);
                //this.setCountingTable(`titleClass`, collectionClass.filter((item)=>(item.status)).length,sClass);
            },
            fillInfoListInPanel: function(obj){
                const panelCnpj = this.byId(obj.panel);						
                panelCnpj.removeAllItems();
                obj.collection.forEach(function(item) {
                    const oText = new sap.m.Text({text:item[obj.attribute]});
                    panelCnpj.addItem(oText);
                })				
                this.setCountingTable(obj.titleCountTable, obj.countLinesTable, obj.i18nManufacturer);
            },
            getDataManufacturer: async function(aFilter){
            
                try{
                    const oData = await model.getManufacture({filters:aFilter});
                    const manufacturerCollection = oData.map((item)=>({
                        manufacturer:item.ManufacturerNumber,
                        status:true
                    }))
                    return manufacturerCollection
                }catch(err){
                    return []
                }
                
            },
            getDataClass: async function(aCnpj, aManufacturer){
                const aFilterCnpj  = new sap.ui.model.Filter({
                    filters: aCnpj,
                    and : false
                });
                const aFilterManufacturer  = new sap.ui.model.Filter({
                    filters: aManufacturer,
                    and : false
                });
                try{
                    const oData = await model.getClass({filters:[aFilterCnpj,aFilterManufacturer], and:true});
                    const classCollection = oData.map((item)=>({
                        class:item.ClassDescription,
                        status:true
                    }))
                    return classCollection
                }catch(err){
                    return []
                }
                
            },
            assembleManufacturer: async function(){
    
                const cnpjCollection = this.getView().getModel().getProperty(`/cnpjCollection`).filter((cnpj)=>(cnpj.status));
                const aFilter = cnpjCollection.map((item)=>(new Filter("DocumentId", FilterOperator.EQ, item.cnpj)));			
                
                const oDataManufacture = await this.getDataManufacturer(aFilter);
                this.getView().getModel().setProperty("/manufacturerCollection", oDataManufacture);
                
                const sManufacturer = this.getView().getModel(`i18n`).getProperty(`manufacturerStep`);
                this.setCountingTable(`titleManufacturer`, oDataManufacture.filter((item)=>(item.status)).length,'Items');
               	
            },
            assembleClass: async function(){
    
                const cnpjCollection = this.getView().getModel().getProperty(`/cnpjCollection`);
                const manufacturerCollection = this.getView().getModel().getProperty(`/manufacturerCollection`).filter((item)=>(item.status));
                const aFilterCnpj = cnpjCollection.map((item)=>(new Filter("DocumentId", FilterOperator.EQ, item.cnpj)));			
                const aFilterManufacturer = manufacturerCollection.map((item)=>(new Filter("ManufacturerNumber", FilterOperator.EQ, item.manufacturer)));			
                
                const oDataClass = await this.getDataClass(aFilterCnpj,aFilterManufacturer);
                this.getView().getModel().setProperty("/classCollection", oDataClass);
                
                const sClass = this.getView().getModel(`i18n`).getProperty(`classStep`);
                const oParams = {
                    panel:'StepClassManufac',
                    collection:manufacturerCollection,
                    attribute:'manufacturer',
                    countLinesTable:oDataClass.length,
                    titleCountTable:'titleClass',
                    i18nManufacturer:sClass
                }	
                this.fillInfoListInPanel(oParams);
                        
            },
            setCountingTable:function(bId, count, sTitle){
                this.byId(`${bId}`).setText(`${sTitle} (${count}) `)
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
                this.setCountingTable(`titleManufacturer`,collection.filter((item)=>(item.status)).length,sManufacturer);
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
                this.setCountingTable(`titleClass`,collection.filter((item)=>(item.status)).length,nameClass);
                this.validateClassStep();
            },
            getFornecedor: async function(sValue) {
                let aFilters = [
                    new Filter({
                        path: "DocumentId",
                        operator: FilterOperator.EQ,
                        value1: sValue
                    })
                ];
    
                try{
                    const fornecedor = await model.getFornecedores({filters: aFilters});
                    return fornecedor
                    
                }catch(oError){
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this.getView().getModel(`i18n`).getProperty("errorFornecedor"));
                }
                
            },
            checkDocuments:function(){
                let sError = false
                let aItemsDocuments = this.byId('table-uploadSet').getItems();
                aItemsDocuments.forEach(function(item) {
                    const input = item.getCells()[2].getItems()[1];
                    const visible = input.getVisible();
                    const value = input.getValue();
                    if(value.length < 1 && visible){
                        input.setValueState('Error');
                        input.focus();
                        sError = true
                    }else{
                        input.setValueState('None');
                    }
                })
                return sError
            },
            checkModels:function(model){
                let bValid = !!this.getView().getModel().getProperty(`/${model}`).find((cnpj)=>(cnpj.status));
                return bValid
            },
    
            checkRequired:function(){
                let bDocuments = !this.checkDocuments();
                let bCNPJ = this.checkModels('cnpjCollection');
                let bManufacture = this.checkModels('manufacturerCollection');
                let bClass = this.checkModels('classCollection');
                return (bDocuments && bCNPJ && bManufacture && bClass)
            },
            assembleExclusiveCards:function(documentId){
                const aDocuments = this.getView().getModel().getProperty('/documentCollection');
                const aDocumentsToCreate = aDocuments.filter((item)=>(item.newDocument));
                return aDocumentsToCreate.map((item)=>(
                    {
                        file:item.file,
                        fileName:item.fileName,
                        extension:item.extension,
                        mediaType: item.mediaType,
                        expiredDate:item.expiredDate,
                        createdAt:new Date(),
                        updatedAt:item.updatedAt,
                        documentId:documentId
                    }
                ))
                 
                 
            },
            assembleEntrySupHana:function(){
                const documentId = this.getView().getModel().getProperty(`/supplierS4`).DocumentId
                const cnpj= JSON.stringify(this.getView().getModel().getProperty(`/cnpjCollection`));
                const manufacturer= JSON.stringify(this.getView().getModel().getProperty(`/manufacturerCollection`));
                const sClass = JSON.stringify(this.getView().getModel().getProperty(`/classCollection`));
                const oEntryDocuments = this.assembleExclusiveCards(documentId);
                const oEntrySupplier = {
                    documentId,
                    cnpj,
                    manufacturer,
                    class:sClass,
                    validatedPetro:'em andamento',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
    
                return {oEntrySupplier, oEntryDocuments}
            },
            completedHandler: async function () {
                const validateRequireds = this.checkRequired();
                if(!validateRequireds)
                    return
                const {oEntrySupplier, oEntryDocuments} = this.assembleEntrySupHana();
            
                try {
                    const createdForn = await model.createFornHana(oEntrySupplier);
                    const aPromises = oEntryDocuments.map((oEntry)=>(model.createDocumentHana(oEntry)));
                    const resolvedPromises = await Promise.all(aPromises);
                    MessageBox.success(this.getView().getModel(`i18n`).getProperty("supplierSendedToPetro"));			
                    this.getView().getModel().setProperty('/selectedShowCase','review');
                }catch(err){
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this.getView().getModel(`i18n`).getProperty("errorFornecedor"));
                }
    
            },
            convertBinaryToHex: function(buffer) {
                return Array.prototype.map.call(new Uint8Array(buffer), function(x) {
                    return ("00" + x.toString(16)).slice(-2);
                }).join("");
            },
        
            assembleItemDocument: function(oFile, b64){
                return {
                    id: uid(), // generate random id if no id sent from response.
                    fileName: oFile.name.split('.')[0],
                    extension: oFile.name.split('.')[1],
                    mediaType: oFile.type,
                    uploadState: "Complete",
                    revision: "00",
                    fileSize: oFile.size,
                    updatedAt: new Date(),
                    documentType: "Invoice",
                    newDocument: true,
                    expiredDate: "",
                    file: b64.replace('data:application/pdf;base64,',''),
                    url: "",
                    status: "",
                    lastModifiedBy: ""
                }
            },
            readFile: function (file){
                return new Promise((resolve, reject) => {
                  var fr = new FileReader();  
                  fr.onload = () => {
                    resolve(fr.result)
                  };
                  fr.onerror = reject;
                  fr.readAsDataURL(file);
                });
              },
            onChange: async function(oEvent){
                const oModel = this.getView().getModel();
                try{
                    var oFile = oEvent.getParameter("files")[0];
                    const sFileBase64 = await this.readFile(oFile);
                    const oDocument =this.assembleItemDocument(oFile,sFileBase64);  
                    oModel.getProperty("/documentCollection").unshift(oDocument);
                    oModel.refresh(true);
                    setTimeout(function() {
                        MessageToast.show("Documento Adicionado");
                    }, 1000);
                }catch(err){
                    MessageBox.error(this.getView().getModel(`i18n`).getProperty("errorLoadDocument"));
                }
            },
            editCnpj:function(){
                this.getView().getModel().setProperty('/selectedShowCase','linear');
                this.getView().getModel().setProperty('/editMode',true);
                //this._syncSelect('CnpjStep')
                this.sCurrentStepId='CnpjStep';
            },
            _handleNavigationToStep: function (iStepNumber) {
                var fnAfterNavigate = function () {
                    this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);
    
                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this.backToWizardContent();
            },
        
        });
    });
