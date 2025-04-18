/*
 * Desktop version of the attributes dialog
 */

window.createAttributesDialogDesktop = function(frm, template, attributes, rowNo) {
    // 1. Function to format attribute names
    const formatAttributeName = (name) => {
        return name;
    };

    // 2. Create dialog
    let dialog = new frappe.ui.Dialog({
        title: __('Select Attributes'),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'header_row_top',
                options: `
                    <div class="header-row" style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label class="header-label-spacer" style="width: 200px; min-width: 200px; margin-right: 10px;"></label>
                        <label class="header-field item-name-header" style="width: 250px; min-width: 250px; margin-right: 10px; font-size: 80%;">${__('Item Name')}</label>
                        <label class="header-field price-header" style="width: 120px; min-width: 120px; margin-right: 10px; font-size: 80%;">${__('Standard Selling Price')}</label>
                        <label class="header-field percent-header" style="width: 80px; min-width: 80px; font-size: 80%;">${__('%')}</label>
                    </div>
                `
            },
            {
                fieldtype: 'HTML',
                fieldname: 'template_info_row',
                options: `
                    <div class="template-row" style="display: flex; align-items: center; margin-bottom: 10px; position: relative;">
                        <input class="form-control template-label" type="text" 
                               value="${__('Variant Item:')}" readonly 
                               style="width: 200px; min-width: 200px; margin-right: 10px; text-align: right; 
                                      background-color: transparent; border: none; 
                                      box-shadow: none; font-weight: bold;">
                        <input class="form-control" id="template_name_input" type="text" 
                               value="" readonly style="width: 250px; min-width: 250px; margin-right: 10px;">
                        <input class="form-control" id="standard_rate_input" type="number" 
                               value="0" readonly style="width: 120px; min-width: 120px; margin-right: 10px;">
                        <select class="form-control" id="percentage_input" style="width: 80px; min-width: 80px;">
                            <option value="19">19</option>
                            <option value="7">7</option>
                            <option value="0">0</option>
                            <option value="add">${__('Add')}</option>
                        </select>
                        <div class="template-name-tooltip" style="display: none; position: absolute; 
                             top: 100%; left: 210px; z-index: 1000; background: #fff; 
                             border: 1px solid #d1d8dd; padding: 5px; border-radius: 3px; 
                             box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 250px; 
                             word-wrap: break-word;"></div>
                    </div>
                `
            },
            {
                fieldtype: 'HTML',
                fieldname: 'divider_row',
                options: `
                    <div style="border-bottom: 1px solid #d1d8dd; margin-bottom: 10px;"></div>
                `
            },
            {
                fieldtype: 'HTML',
                fieldname: 'header_row',
                options: `
                    <div class="header-row" style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label class="header-label-spacer" style="width: 200px; min-width: 200px; margin-right: 10px;"></label>
                        <label class="header-field attributes-header" style="width: 250px; min-width: 250px; margin-right: 10px; font-size: 80%;">${__('Attributes:')}</label>
                        <label class="header-field add-price-header" style="width: 120px; min-width: 120px; margin-right: 10px; font-size: 80%;">${__('Add Price:')}</label>
                        <label class="header-field brutto-header" style="width: 80px; min-width: 80px; font-size: 80%;">${__('Brutto:')}</label>
                    </div>
                `
            },
            ...attributes.map(attr => ({
                fieldtype: 'HTML',
                fieldname: `attr_row_${attr.attribute}`,
                options: `
                    <div class="attribute-row" style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label class="attribute-label" style="width: 200px; min-width: 200px; margin-right: 10px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" 
                               title="${__(attr.attribute)}">
                            ${formatAttributeName(__(attr.attribute))}:
                        </label>
                        <select class="form-control attribute-value" data-attribute="${attr.attribute}" 
                                style="width: 250px; min-width: 250px; margin-right: 10px;"></select>
                        <input class="form-control attribute-price" data-add-price="${attr.attribute}" 
                               type="number" value="0" readonly style="width: 120px; min-width: 120px; margin-right: 10px;">
                        <input class="form-control attribute-brutto" data-brutto="${attr.attribute}" 
                               type="number" value="0" readonly style="width: 80px; min-width: 80px;">
                    </div>
                `
            })),
            {
                fieldtype: 'HTML',
                fieldname: 'divider_row_bottom',
                options: `
                    <div style="border-bottom: 1px solid #d1d8dd; margin-bottom: 10px;"></div>
                `
            },
            {
                fieldtype: 'HTML',
                fieldname: 'total_row',
                options: `
                    <div class="total-row" style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label class="total-label" style="width: 200px; min-width: 200px; margin-right: 10px; text-align: right">${__('Total:')}</label>
                        <input class="form-control" id="total_sum_input" type="number" value="0" readonly style="width: 250px; min-width: 250px; margin-right: 10px;">
                        <input class="form-control" id="total_final_input" type="number" value="0" readonly style="width: 120px; min-width: 120px; margin-right: 10px;">
                        <input class="form-control" id="total_percentage_input" type="number" value="0" readonly style="width: 80px; min-width: 80px;">
                    </div>
                `
            }
        ],
        primary_action_label: __('Add')
    });

    // Add custom CSS to fix dialog width
    const style = document.createElement('style');
    style.innerHTML = `
        .modal-dialog.select-attributes-dialog {
            width: 800px !important;
            max-width: 90vw !important;
        }
        .modal-dialog.select-attributes-dialog .modal-content {
            overflow-x: auto;
        }
        .select-attributes-dialog .form-control {
            padding: 6px 8px !important;
            height: auto !important;
        }
    `;
    document.head.appendChild(style);

    // Add custom class to dialog
    dialog.$wrapper.find('.modal-dialog').addClass('select-attributes-dialog');

    // Add footer buttons
    dialog.footer = $(
        `<div class="modal-footer">
            <button class="btn btn-default btn-sm pull-left" data-dismiss="modal">${__('Cancel')}</button>
            <button class="btn btn-primary btn-sm">${__('Add')}</button>
        </div>`
    ).appendTo(dialog.$wrapper.find('.modal-content'));

    // Remove style when dialog is closed
    dialog.$wrapper.on('hidden.bs.modal', function() {
        style.remove();
    });

    return dialog;
};