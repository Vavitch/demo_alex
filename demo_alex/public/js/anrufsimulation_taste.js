function initAnrufsimulation() {
    // Проверяем, не добавлена ли уже кнопка
    if (document.querySelector('#anrufsimulation-btn')) return;

    // 1. Находим поисковое поле
    const searchInput = document.querySelector('input#navbar-search.form-control');
    if (!searchInput) return;

    // 2. Находим родительский контейнер поиска
    const searchContainer = searchInput.closest('.navbar-search, .search-container, .input-group') || searchInput.parentNode;

    // 3. Создаем кнопку
    const btn = document.createElement('button');
    btn.id = 'anrufsimulation-btn';
    btn.className = 'btn btn-default btn-sm';
    btn.innerHTML = '<i class="fa fa-phone"></i> ' + __('Anrufsimulation');
    
    // 4. Стили для правильного позиционирования
    btn.style.marginRight = '10px';
    btn.style.height = searchInput.offsetHeight + 'px'; // Такая же высота как у поиска
    btn.style.alignSelf = 'center'; // Выравнивание по вертикали

    // 5. Вставляем кнопку перед контейнером поиска
    searchContainer.parentNode.insertBefore(btn, searchContainer);

    // 6. Добавляем обработчик
    btn.addEventListener('click', showCallDialog);
}
//========================================================================================

function showCallDialog() {
    // Сначала получим список клиентов для подсказки
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Customer',
            filters: { disabled: 0 },
            fields: ['name'],
            limit: 20
        },
        callback: function(r) {
            initDialog(r.message || []);
        }
    });
}

function initDialog(customers) {
    // Получаем клиентов с их основными контактами (если доступно)
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Customer',
            fields: ['name', 'customer_name', 'customer_primary_contact'],
            filters: { disabled: 0 },
            limit: 20
        },
        callback: function(customerResponse) {
            const customerList = customerResponse.message || [];
            
            // Получаем имена основных контактов (если они указаны)
            const contactNames = customerList
                .filter(c => c.customer_primary_contact)
                .map(c => c.customer_primary_contact);
                
            if (contactNames.length > 0) {
                // Пытаемся получить имена контактов
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Contact',
                        fields: ['name', 'full_name'],
                        filters: [['name', 'in', contactNames]],
                        limit_page_length: 100
                    },
                    callback: function(contactResponse) {
                        const contacts = contactResponse.message || [];
                        buildDialog(customerList, contacts);
                    },
                    error: function() {
                        // Если не получилось - строим диалог без имен контактов
                        buildDialog(customerList, []);
                    }
                });
            } else {
                buildDialog(customerList, []);
            }
        }
    });
}

function buildDialog(customerList, contacts) {
    // Создаем карту контактов для быстрого доступа
    const contactMap = {};
    contacts.forEach(contact => {
        contactMap[contact.name] = contact.full_name;
    });
    
    // Формируем опции для select
    const customerOptions = customerList.map(customer => {
        const contactName = customer.customer_primary_contact 
            ? contactMap[customer.customer_primary_contact] 
            : null;
            
        return {
            value: customer.name,
            label: contactName 
                ? `${contactName} aus ${customer.customer_name || customer.name}`
                : (customer.customer_name || customer.name)
        };
    });
    
    // Добавляем вариант "Неизвестный клиент"
    customerOptions.unshift({
        value: '',
        label: __('Unbekannter Customer')
    });

    // Создаем диалог
    const dialog = new frappe.ui.Dialog({
        title: __('Anrufsimulation'),
        fields: [
            {
                label: __('Wählen Sie aus, was wir simulieren möchten:'),
                fieldname: 'call_type',
                fieldtype: 'Select',
                options: [
                    {value: 'incoming', label: __('Eingehender Anruf')},
                    {value: 'outgoing', label: __('Ausgehender Anruf')}
                ],
                reqd: 1,
                default: 'incoming'
            },
            {
                label: __('Kunde auswählen'),
                fieldname: 'customer',
                fieldtype: 'Select',
                options: customerOptions,
                reqd: 0,
                default: ''
            }
        ],
        primary_action: function(values) {
            const customer = values.customer || __('Unbekannter Customer');
            frappe.call_dialog.show(values.call_type, customer);
            dialog.hide();
        },
        primary_action_label: __('Simulieren')
    });
    
    dialog.show();
}


function showSimpleCustomerDialog(customerList) {
    const customerOptions = customerList.map(customer => ({
        value: customer.name,
        label: customer.customer_name || customer.name
    }));

    customerOptions.unshift({
        value: '',
        label: __('Unbekannter Customer')
    });

    const dialog = new frappe.ui.Dialog({
        title: __('Anrufsimulation'),
        fields: [
            {
                label: __('Wählen Sie aus, was wir simulieren möchten:'),
                fieldname: 'call_type',
                fieldtype: 'Select',
                options: [
                    {value: 'incoming', label: __('Eingehender Anruf')},
                    {value: 'outgoing', label: __('Ausgehender Anruf')}
                ],
                reqd: 1,
                default: 'incoming'
            },
            {
                label: __('Kunde auswählen'),
                fieldname: 'customer',
                fieldtype: 'Select',
                options: customerOptions,
                reqd: 0,
                default: ''
            }
        ],
        primary_action: function(values) {
            const customer = values.customer || __('Unbekannter Customer');
            frappe.call_dialog.show(values.call_type, customer);
            dialog.hide();
        },
        primary_action_label: __('Simulieren')
    });
    
    dialog.show();
}
function updateDialogFields(dialog) {
    const values = dialog.get_values();
    const customer_field = dialog.fields_dict.customer;
    
    if (values && values.call_type === 'incoming') {
        customer_field.df.hidden = 0;
        customer_field.df.reqd = 1; // Динамически делаем обязательным
        customer_field.refresh();
    } else {
        customer_field.df.hidden = 1;
        customer_field.df.reqd = 0; // Динамически делаем необязательным
        customer_field.refresh();
    }
}
//========================================================================================

// Заглушки для следующих шагов (реализуем позже)
function showIncomingCallDialog() {
    frappe.msgprint(__('In Entwicklung: Eingehender Anruf Dialog'));
}

function showOutgoingCallDialog() {
    frappe.msgprint(__('In Entwicklung: Ausgehender Anruf Dialog'));
}

// Инициализация при загрузке
function checkFrappeReady() {
    if (typeof frappe !== 'undefined' && frappe.ui && frappe.require) {
        initAnrufsimulation();
    } else {
        setTimeout(checkFrappeReady, 100);
    }
}

// Запускаем проверку готовности
checkFrappeReady();

// Обновляем при навигации
if (typeof frappe !== 'undefined' && frappe.router) {
    frappe.router.on('change', function() {
        setTimeout(initAnrufsimulation, 300);
    });
}