sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("gfex.petrobras.fornmanager.controller.App", {
        onInit() {
        },
        getText: function(sKey, aArgs, bIgnoreKeyFallback) {
          return this.getResourceBundle().getText(sKey, aArgs, bIgnoreKeyFallback);
        },
      });
    }
  );
  