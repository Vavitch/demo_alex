const APP_NAME = window.getAppName();

// Main initialization for both doctypes
function initializeDocument(frm) {
    initializeButtons(frm);
    setupGridObserver(frm);
    
    // Common event handlers for both documents
    $(document).on('blur', '[data-fieldname="item_code"]', function() {
        updateButtonStyleFromInput($(this));
    });

    $(document).on('awesomplete-selectcomplete', '[data-fieldname="item_code"]', function() {
        updateButtonStyleFromInput($(this));
    });
}

// Sales Order handlers
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        initializeDocument(frm);
    },
    items_add: function(frm, cdt, cdn) {
        handleNewRow(frm, cdt, cdn);
    }
});

// Quotation handlers
frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        initializeDocument(frm);
    },
    items_add: function(frm, cdt, cdn) {
        handleNewRow(frm, cdt, cdn);
    }
});

function handleNewRow(frm, cdt, cdn) {
    setTimeout(() => {
        const row = frappe.get_doc(cdt, cdn);
        const grid_row = frm.fields_dict.items.grid.grid_rows_by_docname[cdn];
        if (grid_row) {
            addButtonToRow(grid_row, frm);
        }
    }, 300);
}

function initializeButtons(frm) {
    if (frm.fields_dict.items && frm.fields_dict.items.grid) {
        frm.fields_dict.items.grid.grid_rows.forEach((row) => {
            addButtonToRow(row, frm);
        });
    }
}

function setupGridObserver(frm) {
    const gridBody = frm.fields_dict.items.grid.wrapper.find('.grid-body')[0];
    if (!gridBody) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('grid-row')) {
                    const rows = frm.fields_dict.items.grid.grid_rows;
                    const lastRow = rows[rows.length - 1];
                    if (lastRow) {
                        addButtonToRow(lastRow, frm);
                    }
                }
            });
            
           
            mutation.removedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('grid-row')) {
                   
                    setTimeout(() => {
                        frm.fields_dict.items.grid.grid_rows.forEach((row) => {
                            const button = row.wrapper.find('.custom-row-button');
                            if (button.length) {
                                updateButtonStyle(row, button);
                            }
                        });
                    }, 100);
                }
            });
        });
    });

    observer.observe(gridBody, { childList: true, subtree: true });
}

function addButtonToRow(row, frm) {
    const rowNoCell = row.wrapper.find('.row-index');
    if (rowNoCell.length === 0 || rowNoCell.find('.custom-row-button').length > 0) return;

    const originalWidth = rowNoCell.width();
    const cellContent = $(`
        <div class="cell-content-wrapper" style="position: relative; width: 100%; height: 100%;">
            ${rowNoCell.html()}
        </div>
    `);
    
    const button = $(`
        <button class="btn btn-default btn-xs custom-row-button" 
            style="width: 10px; 
                   height: 20px;
                   background-color: transparent; 
                   border: 1px solid #ccc; 
                   padding: 0; 
                   position: absolute; 
                   right: -5px;
                   top: 50%; 
                   margin-top: -10px;
                   z-index: 1;
                   touch-action: manipulation;
                   -webkit-tap-highlight-color: transparent;
                   user-select: none;
                   pointer-events: auto;">
        </button>
    `);
    
    rowNoCell.empty().append(cellContent.append(button)).width(originalWidth);
    
    updateButtonStyle(row, button);
    setupButtonEventHandlers(row, button, frm);
}

function updateButtonStyleFromInput($input) {
    const $button = $input.closest('.grid-row').find('.row-index .custom-row-button');
    const row = $input.closest('.grid-row').data('grid_row');
    if ($button.length && row) {
        updateButtonStyle(row, $button);
    }
}

function updateButtonStyle(row, button) {
    const itemCode = row.doc.item_code;
    
    if (!itemCode) {
        button.css({
            'background-color': '#FF8C42',
            'border-color': '#FF8C42'
        });
        return;
    }

    frappe.call({
        method: `${APP_NAME}.api.get_item_details`,
        args: {
            item_code: itemCode,
            fields: ['variant_of']
        },
        callback: function(r) {
            const isVariant = r.message && r.message.variant_of;
            button.css({
                'background-color': isVariant ? '#FF8C42' : 'transparent',
                'border-color': isVariant ? '#FF8C42' : '#ccc'
            });
        }
    });
}

function setupButtonEventHandlers(row, button, frm) {
    const handleInteraction = function(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const itemCode = row.doc.item_code;

        if (!itemCode) {
            if (typeof window.openTemplateDialog === 'function') {
                window.openTemplateDialog(frm, row.doc.idx);
            }
            return;
        }

        const bgColor = button.css('background-color');
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            return;
        }

        frappe.call({
            method: `${APP_NAME}.api.get_item_details`,
            args: {
                item_code: itemCode,
                fields: ['item_name', 'standard_rate', 'attributes', 'custom_add_price', 'variant_of']
            },
            callback: function(r) {
                if (r.message) {
                    const item = r.message;
                    const attributes = item.attributes || [];
                    if (typeof window.openAttributesDialog === 'function') {
                        window.openAttributesDialog(frm, itemCode, attributes, row.doc.idx);
                        fillAttributesInDialog(itemCode, attributes);
                    }
                }
            }
        });
    };

    button.on('click touchstart', handleInteraction);
    
    const itemField = row.wrapper.find('input[data-fieldname="item_code"]');
    itemField.on('change blur input', () => {
        setTimeout(() => updateButtonStyle(row, button), 100);
    });
    
    const originalSetValue = row.set_value;
    row.set_value = function(fieldname, value) {
        originalSetValue.apply(this, arguments);
        if (fieldname === 'item_code') {
            setTimeout(() => updateButtonStyle(row, button), 200);
        }
    };
}

function fillAttributesInDialog(itemCode, attributes) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delay = isIOS ? 500 : 100;
    
    setTimeout(() => {
        frappe.call({
            method: `${APP_NAME}.api.get_item_details`,
            args: {
                item_code: itemCode,
                fields: ['attributes']
            },
            callback: function(r) {
                if (r.message && r.message.attributes) {
                    const itemAttributes = r.message.attributes;
                    
                    setTimeout(() => {
                        itemAttributes.forEach(attr => {
                            const attributeField = document.querySelector(`select[data-attribute="${attr.attribute}"]`);
                            if (attributeField) {
                                if (isIOS) {
                                    $(attributeField).val(attr.attribute_value).trigger('change');
                                } else {
                                    attributeField.value = attr.attribute_value;
                                    const event = new Event('change', { bubbles: true });
                                    attributeField.dispatchEvent(event);
                                }
                            }
                        });
                        
                        if (typeof updateTemplateNameInput === 'function') {
                            setTimeout(updateTemplateNameInput, 200);
                        }
                    }, delay);
                }
            }
        });
    }, delay);
}

// Initialize debug log
console.log('Custom Order/Quotation script loaded');