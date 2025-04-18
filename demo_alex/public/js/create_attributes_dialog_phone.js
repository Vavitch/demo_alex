/*
 * Mobile version of the attributes dialog
 */

window.createAttributesDialogMobile = function(frm, template, attributes, rowNo) {
    // 1. Function to format attribute names
    const formatAttributeName = (name) => {
        const maxLength = 15;
        if (name.length > maxLength && !name.includes(' ')) {
            return name.replace(new RegExp(`(.{${maxLength-3}})`, 'g'), '$1-\u200B');
        }
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
                        <label class="header-label-spacer" style="margin-right: 10px;"></label>
                        <label class="header-field item-name-header" style="margin-right: 10px; font-size: 80%;">${__('Item Name')}</label>
                        <label class="header-field price-header" style="margin-right: 10px; font-size: 80%;">${__('Standard Selling Price')}</label>
                        <label class="header-field percent-header" style="font-size: 80%;">${__('%')}</label>
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
                   style="margin-right: 10px; text-align: right; 
                          background-color: transparent; border: none; 
                          box-shadow: none; font-weight: bold;">
            <input class="form-control" id="template_name_input" type="text" 
                   value="" readonly style="flex: 1; margin-right: 10px;">
            <input class="form-control" id="standard_rate_input" type="number" 
                   value="0" readonly style="margin-right: 10px;">
            <select class="form-control" id="percentage_input">
                <option value="19">19</option>
                <option value="7">7</option>
                <option value="0">0</option>
                <option value="add">${__('Add')}</option>
            </select>
            <div class="template-name-tooltip" style="display: none; position: absolute; 
                 top: 100%; left: 50%; transform: translateX(-50%); z-index: 1000; 
                 background: #fff; border: 1px solid #d1d8dd; padding: 5px; 
                 border-radius: 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
                 width: 80%; max-width: 300px; word-wrap: break-word;"></div>
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
                        <label class="header-label-spacer" style="margin-right: 10px;"></label>
                        <label class="header-field attributes-header" style="margin-right: 10px; font-size: 80%;">${__('Attributes:')}</label>
                        <label class="header-field add-price-header" style="margin-right: 10px; font-size: 80%;">${__('Add Price:')}</label>
                        <label class="header-field brutto-header" style="font-size: 80%;">${__('Brutto:')}</label>
                    </div>
                `
            },
            ...attributes.map(attr => ({
                fieldtype: 'HTML',
                fieldname: `attr_row_${attr.attribute}`,
                options: `
                    <div class="attribute-row" style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label class="attribute-label" style="margin-right: 10px; text-align: right; 
                                  word-break: break-word; hyphens: auto;"
                               title="${__(attr.attribute)}">
                            ${formatAttributeName(__(attr.attribute))}:
                        </label>
                        <select class="form-control attribute-value" data-attribute="${attr.attribute}" 
                                style="margin-right: 10px;"></select>
                        <input class="form-control attribute-price" data-add-price="${attr.attribute}" 
                               type="number" value="0" readonly style="margin-right: 10px;">
                        <input class="form-control attribute-brutto" data-brutto="${attr.attribute}" 
                               type="number" value="0" readonly style="">
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
                        <label class="total-label" style="margin-right: 10px; text-align: right">${__('Total:')}</label>
                        <input class="form-control" id="total_sum_input" type="number" value="0" readonly style="margin-right: 10px;">
                        <input class="form-control" id="total_final_input" type="number" value="0" readonly style="margin-right: 10px;">
                        <input class="form-control" id="total_percentage_input" type="number" value="0" readonly style="">
                    </div>
                `
            }
        ],
        primary_action_label: __('Add')
    });

    // 3. Add responsive styles
    const style = document.createElement('style');
    style.innerHTML = `
        .modal-dialog {
            width: 98vw !important;
            max-width: 98vw !important;
            margin: 10px auto !important;
        }
        
        .modal-content {
            width: 100% !important;
            max-width: 100% !important;
        }
        
        .modal-body {
            overflow-x: auto;
            max-height: 80vh;
            padding: 10px;
            width: 100% !important;
        }
        
        /* Portrait orientation - general */
        .template-row,
        .attribute-row,
        .total-row,
        .header-row {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            width: 100% !important;
            max-width: 100% !important;
        }
        
        .template-label,
        .attribute-label,
        .total-label,
        .header-label-spacer {
            width: 30% !important;
            min-width: 30% !important;
            max-width: 30% !important;
            white-space: normal;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }
        
        .attribute-value,
        #template_name_input,
        #total_sum_input,
        .item-name-header,
        .attributes-header {
            width: 25% !important;
            min-width: 25% !important;
            max-width: 25% !important;
        }
        
        .attribute-price,
        .attribute-brutto,
        #standard_rate_input,
        #total_final_input,
        #total_percentage_input,
        #percentage_input,
        .price-header,
        .add-price-header,
        .brutto-header,
        .percent-header {
            width: 15% !important;
            min-width: 15% !important;
            max-width: 15% !important;
        }
        
        /* Landscape orientation */
        @media (orientation: landscape) {
            .template-label,
            .attribute-label,
            .total-label,
            .header-label-spacer {
                width: 180px !important;
                min-width: 180px !important;
                max-width: 180px !important;
            }
            
            .attribute-value,
            #template_name_input,
            #total_sum_input,
            .item-name-header,
            .attributes-header {
                width: 220px !important;
                min-width: 220px !important;
                max-width: 220px !important;
            }
            
            .attribute-price,
            .attribute-brutto,
            #standard_rate_input,
            #total_final_input,
            #total_percentage_input,
            #percentage_input,
            .price-header,
            .add-price-header,
            .brutto-header,
            .percent-header {
                width: 120px !important;
                min-width: 120px !important;
                max-width: 120px !important;
            }
        }
        
        .form-control {
            padding: 5px 7px !important;
            font-size: 13px !important;
            height: auto !important;
        }
        
        [style*="margin-right: 10px"] {
            margin-right: 5px !important;
        }
    `;
    document.head.appendChild(style);

    // 4. Function to sync element widths
    const syncElementsWidth = () => {
        const body = dialog.body;
        if (!body) return;

        // For iOS portrait orientation
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && window.innerHeight > window.innerWidth) {
            body.querySelectorAll('.template-label, .attribute-label, .total-label, .header-label-spacer').forEach(el => {
                el.style.width = '30%';
                el.style.minWidth = '30%';
                el.style.maxWidth = '30%';
            });
            
            body.querySelectorAll('.attribute-value, #template_name_input, #total_sum_input, .item-name-header, .attributes-header').forEach(el => {
                el.style.width = '25%';
                el.style.minWidth = '25%';
                el.style.maxWidth = '25%';
            });
            
            body.querySelectorAll('.attribute-price, .attribute-brutto, #standard_rate_input, #total_final_input, #total_percentage_input, #percentage_input, .price-header, .add-price-header, .brutto-header, .percent-header').forEach(el => {
                el.style.width = '15%';
                el.style.minWidth = '15%';
                el.style.maxWidth = '15%';
            });
            
            return;
        }

        // For other cases
        const isLandscape = window.innerWidth > window.innerHeight && window.innerWidth <= 1024;
        const targetLabelWidth = isLandscape ? '180px' : '30%';
        const targetValueWidth = isLandscape ? '220px' : '25%';
        const targetPriceWidth = isLandscape ? '120px' : '15%';
        
        body.querySelectorAll('.template-label, .attribute-label, .total-label, .header-label-spacer').forEach(el => {
            el.style.width = targetLabelWidth;
            el.style.minWidth = targetLabelWidth;
            el.style.maxWidth = targetLabelWidth;
        });
        
        body.querySelectorAll('.attribute-value, #template_name_input, #total_sum_input, .item-name-header, .attributes-header').forEach(el => {
            el.style.width = targetValueWidth;
            el.style.minWidth = targetValueWidth;
            el.style.maxWidth = targetValueWidth;
        });
        
        body.querySelectorAll('.attribute-price, .attribute-brutto, #standard_rate_input, #total_final_input, #total_percentage_input, #percentage_input, .price-header, .add-price-header, .brutto-header, .percent-header').forEach(el => {
            el.style.width = targetPriceWidth;
            el.style.minWidth = targetPriceWidth;
            el.style.maxWidth = targetPriceWidth;
        });
    };

    // 5. Initialize event handlers
    dialog.$wrapper.on('shown.bs.modal', function() {
        // Force resize after small delay
        setTimeout(() => {
            syncElementsWidth();
            
            // Additional iOS adjustments
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                dialog.$wrapper.find('.modal-dialog').css({
                    'width': '98vw',
                    'max-width': '98vw',
                    'margin': '10px auto'
                });
                
                dialog.$wrapper.find('.modal-content').css({
                    'width': '100%',
                    'max-width': '100%'
                });
            }
        }, 100);
        
        window.addEventListener('resize', syncElementsWidth);
        window.addEventListener('orientationchange', syncElementsWidth);
    });

    dialog.$wrapper.on('hidden.bs.modal', function() {
        window.removeEventListener('resize', syncElementsWidth);
        window.removeEventListener('orientationchange', syncElementsWidth);
        style.remove();
    });

    // Add footer buttons
    dialog.footer = $(
        `<div class="modal-footer">
            <button class="btn btn-default btn-sm pull-left" data-dismiss="modal">${__('Cancel')}</button>
            <button class="btn btn-primary btn-sm">${__('Add')}</button>
        </div>`
    ).appendTo(dialog.$wrapper.find('.modal-content'));

    return dialog;
};