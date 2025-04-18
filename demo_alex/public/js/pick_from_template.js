

window.openTemplateDialog = function(frm, rowNo) {
    
    let dialog = new frappe.ui.Dialog({
        title: __('Select Template'),
        fields: [
            {
                fieldtype: 'Data',
                label: __('We are looking for...'),
                fieldname: 'template',
                reqd: 0,
                onchange: function() {
                    updateTemplateList(dialog);
                }
            },
            {
                fieldtype: 'HTML',
                fieldname: 'template_list',
                label: __('Templates'),
                options: ''
            }
        ],
        primary_action: function() {
            let values = dialog.get_values();
            if (values && values.template) {
                let template = values.template;

                if (typeof window.openAttributesDialog === 'function') {
                    frappe.call({
                        method: `${APP_NAME}.api.get_item_details`,
                        args: {
                            item_code: template,
                            fields: ['attributes']
                        },
                        callback: function(r) {
                            if (r.message) {
                                let attributes = r.message.attributes;
                                if (attributes && attributes.length > 0) {
                                    window.openAttributesDialog(frm, template, attributes, rowNo);
                                } else {
                                    window.openVariantDialog(frm, template, rowNo);
                                }
                            }
                        }
                    });
                }
            }
        },
        primary_action_label: __('Next')
    });

    function updateTemplateList(dialog) {
        let searchText = dialog.get_value('template') || '';

        frappe.call({
            method: `${APP_NAME}.api.search_templates`,
            args: {
                search_text: searchText
            },
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    let templateListHTML = '<div style="margin-top: 10px;">';
                    r.message.forEach(template => {
                        templateListHTML += `<div style="padding: 5px; cursor: pointer; border-bottom: 1px solid #eee;" 
                            onclick="handleTemplateSelection('${template.name}', ${rowNo})">
                            <strong>${template.name}</strong> - ${template.item_name}
                        </div>`;
                    });
                    templateListHTML += '</div>';

                    dialog.fields_dict.template_list.$wrapper.html(templateListHTML);
                } else {
                    dialog.fields_dict.template_list.$wrapper.html('<div style="margin-top: 10px; color: #888;">No templates found.</div>');
                }
            }
        });
    }

    window.handleTemplateSelection = function(templateName, rowNo) {
        dialog.hide();

        if (typeof window.openAttributesDialog === 'function') {
            frappe.call({
                method: `${APP_NAME}.api.get_item_details`,
                args: {
                    item_code: templateName,
                    fields: ['attributes']
                },
                callback: function(r) {
                    if (r.message) {
                        let attributes = r.message.attributes;
                        if (attributes && attributes.length > 0) {
                            window.openAttributesDialog(frm, templateName, attributes, rowNo);
                        } else {
                            window.openVariantDialog(frm, templateName, rowNo);
                        }
                    }
                }
            });
        }
    };

    updateTemplateList(dialog);
    dialog.show();
};