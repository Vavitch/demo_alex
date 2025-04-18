window.openAttributesDialog = function(frm, template, attributes, rowNo) {
    const isMobile = window.innerWidth <= 1024;
    
    let dialog = isMobile ? 
        window.createAttributesDialogMobile(frm, template, attributes, rowNo) : 
        window.createAttributesDialogDesktop(frm, template, attributes, rowNo);

    dialog.$wrapper.find('.btn-primary').on('click', function() {
        frappe.call({
            method: `${APP_NAME}.api.get_item_details`,
            args: {
                item_code: template,
                fields: ['variant_of', 'has_variants']
            },
            callback: function(r) {
                if (r.message) {
                    const isVariant = r.message.variant_of;
                    const isTemplate = r.message.has_variants;

                    if (!isVariant && !isTemplate) {
                        frappe.msgprint({
                            title: __('Info'),
                            indicator: 'blue',
                            message: __('This is a standard item, it has no attributes.')
                        });
                        return;
                    }

                    let values = {};
                    let emptyAttributes = [];

                    attributes.forEach(attr => {
                        let attributeField = dialog.body.querySelector(`select[data-attribute="${attr.attribute}"]`);
                        let addPriceField = dialog.body.querySelector(`input[data-add-price="${attr.attribute}"]`);
                        let bruttoField = dialog.body.querySelector(`input[data-brutto="${attr.attribute}"]`);

                        if (attributeField && addPriceField && bruttoField) {
                            if (!attributeField.value) {
                                emptyAttributes.push(attr.attribute);
                            }

                            values[attr.attribute] = attributeField.value;
                            values[`add_price_${attr.attribute}`] = parseFloat(addPriceField.value) || 0;
                            values[`brutto_${attr.attribute}`] = parseFloat(bruttoField.value) || 0;
                        }
                    });

                    if (emptyAttributes.length > 0) {
                        let part1 = __("There are {0} empty values.", [emptyAttributes.length]);
                        let part2 = __("Please fill in the following fields:");
                        let errorMessage = `${part1} ${part2} <br><br>${emptyAttributes.join("<br>")}`;
                        
                        const style = document.createElement('style');
                        style.innerHTML = `
                            .msgprint-dialog .modal-content {
                                background-color: #ffebee;
                            }
                            .msgprint-dialog .modal-header {
                                background-color: #ffcdd2;
                                color: #c62828;
                            }
                        `;
                        document.head.appendChild(style);

                        $('.modal').on('hidden.bs.modal', function() {
                            style.remove();
                        });

                        frappe.msgprint({
                            title: __('Validation Error'),
                            indicator: 'red',
                            message: errorMessage
                        });
                        return;
                    }

                    if (Object.keys(values).length > 0) {
                        let templateNameInput = dialog.body.querySelector('#template_name_input');
                        if (!templateNameInput) {
                            frappe.msgprint(__('Template name input not found.'));
                            return;
                        }

                        let templateName = templateNameInput.value;

                        frappe.call({
                            method: 'frappe.client.get_list',
                            args: {
                                doctype: 'Item',
                                filters: {
                                    item_name: templateName
                                },
                                fields: ['name', 'item_name', 'standard_rate', 'stock_uom','item_group']
                            },
                            callback: function(r) {
                                if (r.message && r.message.length > 0) {
                                    let itemCode = r.message[0].name;
                                    frappe.show_alert(__('Variant Item {0} added successfully', [itemCode]), 5);
                                    frm.doc.items[rowNo - 1].item_code = itemCode;
                                    frm.doc.items[rowNo - 1].rate = frm.doc.items[rowNo - 1].amount = r.message[0].standard_rate;
                                    //frm.doc.items[rowNo - 1].qty = 5;
                                    frm.doc.items[rowNo - 1].item_name = r.message[0].item_name;
                                    frm.doc.items[rowNo - 1].uom = r.message[0].stock_uom;
                                    frm.doc.items[rowNo - 1].item_group = r.message[0].item_group;
                                    //let _qty = frm.doc.items[rowNo - 1].qty;
                                    
                                    if (!frm.doc.items[rowNo - 1].qty) {
                                        frm.doc.items[rowNo - 1].qty = 1;
                                    }else{ 
                                        const parent_doctype = frm.doctype;
                                    frappe.model.set_value(`${parent_doctype}`, frm.doc.items[rowNo - 1].name, 'qty', frm.doc.items[rowNo - 1].qty)
                                    .then(() => {
                                        let item = frm.doc.items[rowNo - 1];
                                        frm.script_manager.trigger('qty', item.doctype, item.name);
    
    
                                        if (frm.fields_dict['items'].grid) {
                                        frm.fields_dict['items'].grid.grid_rows[rowNo - 1].refresh();
                                         }
                                     
                                    })}
                                    
                                    
                                    frm.refresh_field('items');
                                    frm.dirty();
                                    dialog.hide();
                                } else {
                                    let notFoundDialog = new frappe.ui.Dialog({
                                        title: __('Variant Item Not Found'),
                                        fields: [
                                            {
                                                fieldtype: 'HTML',
                                                fieldname: 'message',
                                                options: `
                                                    <div style="background-color: pink; padding: 10px; border-radius: 5px;">
                                                        <p>${__('Variant Item {0} not found', [templateName])}</p>
                                                    </div>
                                                `
                                            }
                                        ],
                                        primary_action: function() {
                                            createNewItem(frm, template, templateName, values, rowNo);
                                            notFoundDialog.hide();
                                            dialog.hide();
                                        },
                                        primary_action_label: __('Create'),
                                        secondary_action: function() {
                                            notFoundDialog.hide();
                                        },
                                        secondary_action_label: __('Cancel')
                                    });

                                    notFoundDialog.show();
                                }
                            }
                        });
                    }
                }
            }
        });
    });

    function createNewItem(frm, template, templateName, values, rowNo) {
        frappe.call({
            method: `${APP_NAME}.api.get_item_details`,
            args: {
                item_code: template,
                fields: ['variant_of','stock_uom','item_group']
            },
            callback: function(r) {
                if (r.message) {
                    let parentTemplate = template;
                    if (r.message.variant_of) {
                        parentTemplate = r.message.variant_of;
                    }

                    let itemData = {
                        item_name: templateName,
                        item_code: templateName,
                        variant_of: parentTemplate,
                        item_group: r.message.item_group || 'Products',
                        stock_uom: r.message.stock_uom || 'Nos',
                        standard_rate: parseFloat(dialog.body.querySelector('#standard_rate_input').value) || 0,
                        attributes: attributes.map(attr => ({
                            attribute: attr.attribute,
                            attribute_value: values[attr.attribute]
                        }))
                    };

                    frappe.call({
                        method: `${APP_NAME}.api.create_item_variant`,
                        args: {
                            item_data: itemData
                        },
                        callback: function(r) {
                            if (r.message) {
                                frappe.show_alert(__('Variant Item {0} created successfully', [templateName]), 5);
                                Object.assign(frm.doc.items[rowNo-1], {
                                    item_code: r.message.name,
                                    rate: r.message.standard_rate,
                                    amount: r.message.standard_rate,
                                    item_name: r.message.item_name,
                                    uom: r.message.stock_uom,
                                    item_group: r.message.item_group
                                    
                                });
                                
                                if (!frm.doc.items[rowNo - 1].qty) {
                                    frm.doc.items[rowNo - 1].qty = 1;
                                }else{ 
                                    const parent_doctype = frm.doctype; 
                                frappe.model.set_value(`${parent_doctype}`, frm.doc.items[rowNo - 1].name, frm.doc.items[rowNo - 1].qty)
                                .then(() => {
                                    let item = frm.doc.items[rowNo - 1];
                                    frm.script_manager.trigger('qty', item.doctype, item.name);
    
    
                                    if (frm.fields_dict['items'].grid) {
                                    frm.fields_dict['items'].grid.grid_rows[rowNo - 1].refresh();
                                    }
                                
                                })}
                                frm.refresh_field('items');
                                frm.dirty();
                            }
                        },
                        error: function(r) {
                            frappe.msgprint({
                                title: __('Error'),
                                indicator: 'red',
                                message: __('Failed to create variant: {0}', [r.message])
                            });
                        }
                    });
                }
            }
        });
    }

    let baseTemplateName = '';
    let attrDataMap = {};
    let selectedAbbrs = {};

    const updateTemplateNameInput = () => {
        let templateNameInput = dialog.body.querySelector('#template_name_input');
        if (templateNameInput) {
            let abbrValues = attributes
                .map(attr => selectedAbbrs[attr.attribute] || '')
                .filter(abbr => abbr && abbr.toLowerCase() !== 'n/a')
                .join('-');
            templateNameInput.value = baseTemplateName + (abbrValues ? `-${abbrValues}` : '');
        }
    };

    attributes.forEach(attr => {
        frappe.call({
            method: `${APP_NAME}.api.get_item_attribute_values`,
            args: { attribute: attr.attribute },
            callback: function(r) {
                if (r.message) {
                    let selectField = dialog.body.querySelector(`select[data-attribute="${attr.attribute}"]`);
                    if (selectField) {
                        selectField.innerHTML = '';
                        let defaultOption = new Option('', '');
                        selectField.add(defaultOption);

                        r.message.values.forEach(item => {
                            let option = new Option(
                                item.attribute_value,
                                item.attribute_value
                            );
                            selectField.add(option);
                        });

                        attrDataMap[attr.attribute] = r.message.values;

                        selectField.addEventListener('change', function(event) {
                            let selectedValue = this.value;
                            let addPriceField = dialog.body.querySelector(`input[data-add-price="${attr.attribute}"]`);
                            let bruttoField = dialog.body.querySelector(`input[data-brutto="${attr.attribute}"]`);
                            
                            if (addPriceField && bruttoField) {
                                let selectedOption = attrDataMap[attr.attribute].find(item => 
                                    item.attribute_value === selectedValue
                                );
                                
                                if (selectedOption) {
                                    addPriceField.value = selectedOption.custom_add_price || 0;
                                    let percentage = parseFloat(percentageInput.value) || 0;
                                    bruttoField.value = (selectedOption.custom_add_price * (1 + percentage / 100)).toFixed(2);

                                    if (selectedOption.abbr && selectedOption.abbr.toLowerCase() !== 'n/a') {
                                        selectedAbbrs[attr.attribute] = selectedOption.abbr;
                                    } else {
                                        delete selectedAbbrs[attr.attribute];
                                    }
                                    updateTemplateNameInput();
                                } else {
                                    addPriceField.value = 0;
                                    bruttoField.value = (0).toFixed(2);
                                    delete selectedAbbrs[attr.attribute];
                                    updateTemplateNameInput();
                                }
                            }
                            updateTotal(dialog, attributes);
                        });
                    }
                }
            }
        });
    });

    frappe.call({
        method: `${APP_NAME}.api.get_item_details`,
        args: {
            item_code: template,
            fields: ['item_name', 'standard_rate', 'variant_of']
        },
        callback: function(r) {
            if (r.message) {
                let templateNameInput = dialog.body.querySelector('#template_name_input');
                let standardRateInput = dialog.body.querySelector('#standard_rate_input');
                if (templateNameInput && standardRateInput) {
                    if (r.message.variant_of) {
                        frappe.call({
                            method: `${APP_NAME}.api.get_item_details`,
                            args: {
                                item_code: r.message.variant_of,
                                fields: ['item_name', 'standard_rate']
                            },
                            callback: function(parentResponse) {
                                if (parentResponse.message) {
                                    baseTemplateName = parentResponse.message.item_name;
                                    templateNameInput.value = baseTemplateName;
                                    standardRateInput.value = parentResponse.message.standard_rate || 0;
                                    updateTotal(dialog, attributes);
                                }
                            }
                        });
                    } else {
                        baseTemplateName = r.message.item_name;
                        templateNameInput.value = baseTemplateName;
                        standardRateInput.value = r.message.standard_rate || 0;
                        updateTotal(dialog, attributes);
                    }
                }
            }
        }
    });

    let percentageInput = dialog.body.querySelector('#percentage_input');
    if (percentageInput) {
        percentageInput.addEventListener('input', function() {
            updateTotal(dialog, attributes);
        });
    }

    function updateTotal(dialog, attributes) {
        let totalSum = parseFloat(dialog.body.querySelector('#standard_rate_input').value) || 0;

        attributes.forEach(attr => {
            let addPriceField = dialog.body.querySelector(`input[data-add-price="${attr.attribute}"]`);
            if (addPriceField) {
                totalSum += parseFloat(addPriceField.value) || 0;
            }
        });

        let percentage = parseFloat(percentageInput.value) || 0;

        let totalSumInput = dialog.body.querySelector('#total_final_input');
        if (totalSumInput) {
            totalSumInput.value = totalSum.toFixed(2);
        }

        let totalFinalInput = dialog.body.querySelector('#total_percentage_input');
        if (totalFinalInput) {
            totalFinalInput.value = (totalSum * (1 + percentage / 100)).toFixed(2);
        }

        attributes.forEach(attr => {
            let addPriceField = dialog.body.querySelector(`input[data-add-price="${attr.attribute}"]`);
            let bruttoField = dialog.body.querySelector(`input[data-brutto="${attr.attribute}"]`);
            if (addPriceField && bruttoField) {
                let addPrice = parseFloat(addPriceField.value) || 0;
                bruttoField.value = (addPrice * (1 + percentage / 100)).toFixed(2);
            }
        });
    }

    const setupTooltip = () => {
        const templateNameInput = dialog.body.querySelector('#template_name_input');
        const tooltip = dialog.body.querySelector('.template-name-tooltip');
        
        if (!templateNameInput || !tooltip) return;

        const showTooltip = () => {
            tooltip.textContent = templateNameInput.value;
            tooltip.style.display = 'block';
            
            if (window.innerWidth <= 1024) {
                setTimeout(() => {
                    tooltip.style.display = 'none';
                }, 3000);
            }
        };

        const hideTooltip = () => {
            tooltip.style.display = 'none';
        };

        templateNameInput.addEventListener('mouseenter', showTooltip);
        templateNameInput.addEventListener('mouseleave', hideTooltip);
        
        templateNameInput.addEventListener('click', function(e) {
            e.stopPropagation();
            if (tooltip.style.display === 'block') {
                hideTooltip();
            } else {
                showTooltip();
            }
        });

        document.addEventListener('click', function(e) {
            if (e.target !== templateNameInput) {
                hideTooltip();
            }
        });
    };

    setupTooltip();

    dialog.$wrapper.on('hidden.bs.modal', function() {
        dialog.$wrapper.remove();
        attrDataMap = {};
        selectedAbbrs = {};
        $(document).off('change', '[data-attribute]');
    });

    dialog.show();
};