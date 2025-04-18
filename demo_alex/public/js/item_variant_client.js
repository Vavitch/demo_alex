/*Client script for correctly forming a dialogue window when creating Single Variant.
Supplements:
- Create Variant dialogue box search;
- Pre-check the field for non-empty;
- If there are such fields - message with a list of empty fields;
last update: 28.02.2025 by AleX
*/

frappe.ui.form.on('Item', {
    refresh: function(frm) {
        
        const observer = new MutationObserver(function(mutations) {    // Observe changes in the DOM
            mutations.forEach(function(mutation) {
                
                let dialog = $('.modal-dialog:visible');    // Check if the "Create Variant" dialogue box appears
                if (dialog.length > 0) {
                    let dialog_title = $('.modal-title:visible').text();
                    
                    // Проверяем, содержит ли заголовок ключевые слова, связанные с созданием варианта
                    if (dialog_title.includes(__("Create Variant"))) {
                        
                        const style = document.createElement('style');     //Create a style for the message window
                        style.innerHTML = `
                            .msgprint-dialog .modal-content {
                                background-color: #ffebee;                /* rose */
                            }
                            .msgprint-dialog .modal-header {
                                background-color: #ffcdd2;                /* rose+ */
                                color: #c62828;                           /* Color for title */
                            }
                        `;
                        document.head.appendChild(style);

                        $('.modal').on('hidden.bs.modal', function () {    // Remove a style when closing a modal window
                            style.remove();
                        });

                        let originalCreateButton = dialog.find('.btn-primary').filter(function() {    // Find the original "Create" button by its text
                            return $(this).text().trim() === __("Create");
                        });

                        originalCreateButton.hide();    // Hiding the original button "Create"

                        let customCreateButton = dialog.find('.custom-create-btn');    // Check if the custom button already exists
                        if (customCreateButton.length === 0) {
                            // Add a custom button with translated text
                            dialog.find('.modal-footer').prepend(`<button class="btn btn-primary custom-create-btn">${__("Create Single Variant")}</button>`);
                            customCreateButton = dialog.find('.custom-create-btn');
                        }

                        function checkIfAllAttributesSelected() {    // Function to check if all attributes are filled in
                            let allAttributesSelected = true;
                            let emptyAttributes = [];    // This is an Array for storing names of empty attributes

                            // Check all text fields with attributes
                            dialog.find('.frappe-control[data-fieldtype="Data"]').each(function() {
                                let input = $(this).find('input');
                                let attributeName = $(this).find('label').text().trim(); // Get the name of the attribute

                                if (!input.val().trim()) {
                                    allAttributesSelected = false;
                                    emptyAttributes.push(attributeName); // Add the attribute name to the array
                                }
                            });

                            return { allAttributesSelected, emptyAttributes };
                        }

                        function getSelectedAttributes() {    // Function to get the selected attributes and their values
                            let attributes = [];
                            dialog.find('.frappe-control[data-fieldtype="Data"]').each(function() {
                                let input = $(this).find('input');
                                let attributeName = $(this).find('label').text().trim();
                                let attributeValue = input.val().trim();
                                attributes.push(`${attributeName} - ${attributeValue}`);
                            });
                            return attributes;
                        }

                        customCreateButton.off('click').on('click', function() {     // Handler for custom button "Create"
                            
                            let { allAttributesSelected, emptyAttributes } = checkIfAllAttributesSelected();    // Check if all attributes are filled in
                            
                            if (allAttributesSelected) {
                                let itemName = frm.doc.item_name;    // Get the item name from the template
                                let selectedAttributes = getSelectedAttributes();    // Get the selected attributes and their values
                                originalCreateButton.show().trigger('click');    // Show the original "Create" button and trigger its click event
                            } else {
                                let part1 = __("There are {0} empty values.", [emptyAttributes.length]);
                                let part2 = __("Please fill in the following fields:");
                                let errorMessage = `${part1} ${part2} <br><br>${emptyAttributes.join("<br>")}`;
                               

                                frappe.msgprint({
                                    title: __('Validation Error'),
                                    indicator: 'red',
                                    message: errorMessage
                                });
                            }
                        });
                    }
                } else {
                    window.variantDialogShown = false;    // Reset the flag when the dialogue is closed
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });    // Let's start observing changes in the body
    }
});