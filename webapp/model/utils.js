sap.ui.define([
	"./utils"

], function() {
	"use strict";

	return {
        getText: function(sKey, aArgs, bIgnoreKeyFallback) {
            return this.getView().getModel(`i18n`).getText(sKey, aArgs, bIgnoreKeyFallback);
        },
      
	};
});