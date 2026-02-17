sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("joboff.controller.Home", {
        onNavToTareas: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        }
    });
});