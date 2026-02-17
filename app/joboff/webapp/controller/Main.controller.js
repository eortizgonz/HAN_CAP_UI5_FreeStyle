sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("joboff.controller.Main", {

        onInit: function () {
            // Variable para controlar si estamos creando o editando
            this._bIsEdit = false;
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteHome");
        },

        /**
         * Función auxiliar para obtener el diálogo. 
         * Garantiza que el diálogo se cargue una sola vez y siempre devuelva una Promesa.
         */
        _getDialog: function () {
            var oView = this.getView();
            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "joboff.view.AddTareaDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            return this._pDialog;
        },

        /**
         * Abre el diálogo para crear una nueva tarea.
         */
        onOpenAddDialog: function () {
            this._bIsEdit = false;
            this._getDialog().then(function (oDialog) {
                // Importante: quitamos cualquier vínculo previo (binding)
                oDialog.setBindingContext(null);
                oDialog.setTitle("Crear Nueva Tarea");
                
                // Limpiamos los campos manualmente (basado en los IDs de tu fragmento)
                this.byId("inputTitulo").setValue("");
                this.byId("inputResponsable").setValue("");
                this.byId("selectCriticidad").setSelectedKey("1");
                
                oDialog.open();
            }.bind(this));
        },

        /**
         * Abre el diálogo para editar una tarea existente.
         */
        onOpenEditDialog: function (oEvent) {
            this._bIsEdit = true;
            // Obtenemos el contexto de la fila donde se hizo clic
            var oContext = oEvent.getSource().getBindingContext();

            this._getDialog().then(function (oDialog) {
                // Vinculamos el diálogo al registro de la base de datos
                oDialog.setBindingContext(oContext);
                oDialog.setTitle("Editar Tarea: " + oContext.getProperty("titulo"));
                oDialog.open();
            });
        },

        /**
         * Cierra el diálogo y revierte cambios si es necesario.
         */
      onCloseDialog: function () {
    // 1. Si hay cambios pendientes (en edición) y cerramos, revertimos.
    if (this._bIsEdit) {
        var oModel = this.getView().getModel();
        if (oModel.hasPendingChanges()) {
            oModel.resetChanges();
        }
    }

    // 2. Usamos la promesa para asegurarnos de tener la instancia del diálogo antes de cerrar
    this._getDialog().then(function (oDialog) {
        oDialog.close();
        // 3. Limpieza de seguridad: quitamos el binding para que no interfiera en la siguiente apertura
        oDialog.setBindingContext(null);
    });

    this._bIsEdit = false;
},

        /**
         * Lógica para guardar (Crear o Actualizar).
         */
        onSaveTarea: function () {
            var oModel = this.getView().getModel();

            if (this._bIsEdit) {
                // En OData v4, los cambios se envían automáticamente al modelo.
                MessageToast.show("Tarea actualizada con éxito");
                this.onCloseDialog();
            } else {
                // Lógica de Creación
                var oListBinding = this.byId("idTareasTable").getBinding("items");
                
                oListBinding.create({
                    "titulo": this.byId("inputTitulo").getValue(),
                    "criticidad": parseInt(this.byId("selectCriticidad").getSelectedKey()),
                    "responsable": this.byId("inputResponsable").getValue()
                });

                // Opcional: manejar éxito de la creación
                oListBinding.attachEventOnce("createCompleted", function (oEvent) {
                    if (oEvent.getParameter("success")) {
                        MessageToast.show("Tarea creada en HANA Cloud");
                    }
                });

                this.onCloseDialog();
            }
        },

        /**
         * Lógica para eliminar un registro.
         */
        onDeleteTarea: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();

            MessageBox.confirm("¿Está seguro de que desea eliminar esta tarea?", {
                title: "Confirmar eliminación",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show("Registro eliminado.");
                        }, function (oError) {
                            MessageBox.error("Error al eliminar: " + oError.message);
                        });
                    }
                }
            });
        }
    });
});