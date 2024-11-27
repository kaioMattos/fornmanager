sap.ui.define([
	"sap/ui/core/library"
] , function (coreLibrary) {
	"use strict";

	return {
		iconBtnSwichDecision : function (sValue) {
			if(sValue){
				return `sap-icon://decline`
			}else{
				return `sap-icon://undo`
			}
		},
		typeBtnSwichDecision: function(sValue) {
			if(sValue){
				return `Reject`
			}else{
				return `Default`
			}
		}

	};

});