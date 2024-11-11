/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"gfexpetrobras/fornmanager/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
