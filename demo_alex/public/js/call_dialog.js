frappe.provide("frappe.CallDialog");

frappe.CallDialog = class {
    constructor() {
        this.timer = null;
        this.seconds = 0;
        this.wrapper = null;
        this.startTime = null;
        this.callData = {};
        
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.startTimer = this.startTimer.bind(this);
        this.updateTimerDisplay = this.updateTimerDisplay.bind(this);
        this.saveCallRecord = this.saveCallRecord.bind(this);
    }

    show(callType, customerName) {
        console.log("[CallDialog] Initializing for customer:", customerName);
        
        this.hide();
        this.seconds = 0;
        this.startTime = new Date();
        
        this.callData = {
            customer: customerName,
            status: callType === 'incoming' ? 'Incoming' : 'Outgoing',
            call_date: frappe.datetime.get_today(),
            user: frappe.session.user,
            start_time: frappe.datetime.now_datetime(),
            call_id: ''
        };

        this.wrapper = document.createElement('div');
        this.wrapper.id = 'call-dialog-container';
        document.body.appendChild(this.wrapper);
        
        Object.assign(this.wrapper.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '462px',
            height: '346px',
            zIndex: '10000'
        });

        this.renderLoadingState(customerName, callType);

        this.loadContactData(customerName)
            .then(contactData => {
                const phone = this.getBestPhoneNumber(contactData);
                this.callData.contact = phone;
                this.callData.call_id = phone;
                this.callData.contact_full_name = contactData.full_name || customerName;
                this.callData.contact_email = contactData.email_id || '';
                this.callData.company_name = contactData.company_name || customerName;
                
                this.renderDialogContent(contactData, callType, customerName);
                this.startTimer();
            })
            .catch(error => {
                console.error("[CallDialog] Error:", error);
                this.renderErrorState(error);
            });
    }

    async hide() {
        this.stopTimer();
        
        try {
            if (this.wrapper && this.seconds > 0 && this.callData.contact) {
                this.callData.end_time = frappe.datetime.now_datetime();
                this.callData.duration = this.seconds;
                await this.saveCallRecord();
            }
        } catch (error) {
            console.error("[CallDialog] Hide error:", error);
            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Failed to save call record') + '<br>' + error.message
            });
            
            const newDocModal = document.querySelector('.modal-new-Phone-Call');
            if (newDocModal) {
                newDocModal.remove();
                $('.modal-backdrop').remove();
            }
        } finally {
            if (this.wrapper) {
                this.wrapper.remove();
                this.wrapper = null;
            }
        }
    }

    async saveCallRecord() {
        try {
            if (this.callData.customer === __('Unbekannter Customer')) {
                this.callData.contact = __('Unbekannter Customer');
                this.callData.call_id = '00000000000';
            }

            if (!this.callData.contact) {
                throw new Error(__('Phone number is required'));
            }

            const docData = {
                doctype: 'Phone Call',
                customer: this.callData.customer === __('Unbekannter Customer') ? '' : this.callData.customer,
                contact: this.callData.contact_full_name || this.callData.customer,
                status: this.callData.status,
                call_date: this.callData.call_date,
                user: this.callData.user,
                call_id: this.callData.call_id,
                start_time: this.callData.start_time,
                end_time: this.callData.end_time,
                duration: this.callData.duration
            };

            if (this.callData.contact_email) {
                docData.email_id = this.callData.contact_email;
            }

            console.log("[CallDialog] Saving call:", docData);

            const result = await frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: docData
                }
            });

            if (!result.message) {
                throw new Error(__('Failed to save call record'));
            }

            console.log("[CallDialog] Call saved:", result.message.name);
            frappe.show_alert(__('Call saved successfully'), 3);
            
            return result.message.name;
        } catch (error) {
            console.error("[CallDialog] Save error:", error);
            
            const modals = document.querySelectorAll('.modal-new-Phone-Call, .modal-dialog');
            modals.forEach(modal => modal.remove());
            $('.modal-backdrop').remove();
            
            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Failed to save call record') + (error.message ? '<br>' + error.message : '')
            });
            
            throw error;
        }
    }

    renderLoadingState(customerName, callType) {
        const title = this.getDialogTitle(callType, customerName);
        this.wrapper.innerHTML = `
            <div class="call-dialog">
                <div class="dialog-header">
                    <h5>${title}</h5>
                    <button class="btn-close">×</button>
                </div>
                <div class="dialog-body">
                    <div class="loading-state">
                        <i class="fa fa-spinner fa-spin"></i>
                        ${__('Loading...')}
                    </div>
                </div>
            </div>
        `;
        this.bindCloseEvents();
    }

    loadContactData(customerName) {
        return new Promise((resolve, reject) => {
            if (customerName === __('Unbekannter Customer')) {
                resolve({
                    phone: __('Nicht angegeben'),
                    mobile_no: __('Nicht angegeben'),
                    full_name: __('Unbekannter Customer'),
                    email_id: '',
                    company_name: __('Unbekannter Customer')
                });
                return;
            }

            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Contact',
                    filters: [
                        ['Dynamic Link', 'link_doctype', '=', 'Customer'],
                        ['Dynamic Link', 'link_name', '=', customerName]
                    ],
                    fields: ['name', 'phone', 'mobile_no', 'full_name', 'email_id'],
                    limit: 1
                },
                callback: (response) => {
                    if (response.message && response.message.length > 0) {
                        frappe.call({
                            method: 'frappe.client.get_value',
                            args: {
                                doctype: 'Customer',
                                fieldname: 'customer_name',
                                filters: { name: customerName }
                            },
                            callback: (companyResponse) => {
                                const contactData = response.message[0];
                                contactData.company_name = companyResponse.message.customer_name || customerName;
                                resolve(contactData);
                            },
                            error: reject
                        });
                    } else {
                        frappe.call({
                            method: 'frappe.client.get_value',
                            args: {
                                doctype: 'Customer',
                                fieldname: 'customer_name',
                                filters: { name: customerName }
                            },
                            callback: (companyResponse) => {
                                resolve({
                                    phone: __('Nicht angegeben'),
                                    mobile_no: __('Nicht angegeben'),
                                    full_name: customerName,
                                    email_id: '',
                                    company_name: companyResponse.message.customer_name || customerName
                                });
                            },
                            error: reject
                        });
                    }
                },
                error: reject
            });
        });
    }

    renderDialogContent(contactData, callType, customerName) {
    const title = this.getDialogTitle(callType, customerName, contactData);
    const phone = this.getBestPhoneNumber(contactData);
    const displayName = contactData.full_name 
        ? `${contactData.full_name} aus ${contactData.company_name || customerName}`
        : customerName;

    this.wrapper.innerHTML = `
        <div class="call-dialog" style="
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.15);
            border: 1px solid #d1d8dd;
            overflow: hidden;
        ">
            <div class="dialog-header" style="
                padding: 12px 15px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #dcedc8;
                background-image: none;
            ">
                <h5 style="
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #2e7d32;
                    white-space: normal;
                    overflow: visible;
                    line-height: 1.4;
                    max-width: 350px;
                ">${title}</h5>
                <button class="btn-close" style="
                    border: none;
                    background: none;
                    font-size: 24px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0 5px;
                    color: #8d99a6;
                ">×</button>
            </div>
            <div class="dialog-body" style="
                padding: 15px;
                flex-grow: 1;
                overflow: auto;
                background: #fff;
                color: #36414c;
            ">
                <div class="contact-info" style="padding: 20px;">
                    <div class="info-row" style="
                        display: flex;
                        margin-bottom: 15px;
                        align-items: center;
                    ">
                        <span class="info-label" style="
                            font-weight: 600;
                            width: 120px;
                            color: #2e7d32;
                        ">${__('Telnummer:')}</span>
                        <span class="info-value" style="
                            flex: 1;
                            color: #2e2e2e;
                            word-break: break-all;
                        ">${phone}</span>
                    </div>
                    <div class="info-row" style="
                        display: flex;
                        margin-bottom: 15px;
                        align-items: center;
                    ">
                        <span class="info-label" style="
                            font-weight: 600;
                            width: 120px;
                            color: #2e7d32;
                        ">${__('Dauer:')}</span>
                        <span class="info-value call-duration" style="
                            font-family: monospace;
                            font-size: 14px;
                            color: #2e2e2e;
                            background: #f5f5f5;
                            padding: 2px 6px;
                            border-radius: 3px;
                            border: 1px solid #e5e5e5;
                        ">00:00</span>
                    </div>
                </div>
            </div>
            <div class="dialog-footer" style="
                padding: 12px 15px;
                border-top: 1px solid #e0e0e0;
                text-align: right;
                background-color: #dcedc8;
                background-image: none;
            ">
                <button class="btn btn-secondary btn-close-dialog" style="
                    padding: 6px 12px;
                    font-size: 12px;
                    border-radius: 3px;
                    background-color: #7cb342;
                    color: white;
                    border: none;
                    transition: background-color 0.3s;
                ">
                    ${__('Close')}
                </button>
            </div>
        </div>
    `;
    
    // Добавляем обработчики событий
    this.bindCloseEvents();
}

    startTimer() {
        this.stopTimer();
        this.updateTimerDisplay();
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        const timerElement = this.wrapper?.querySelector('.call-duration');
        if (timerElement) {
            const minutes = Math.floor(this.seconds / 60);
            const seconds = this.seconds % 60;
            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    bindCloseEvents() {
        this.wrapper.querySelector('.btn-close')?.addEventListener('click', this.hide);
        this.wrapper.querySelector('.btn-close-dialog')?.addEventListener('click', this.hide);
    }

    getDialogTitle(callType, customerName, contactData) {
    let displayName;
    if (contactData && contactData.full_name) {
        displayName = `${contactData.full_name}<br><small>aus ${contactData.company_name || customerName}</small>`;
    } else {
        displayName = customerName;
    }
    
    return callType === 'incoming' 
        ? `${displayName} ${__('ruft für Sie an...')}`
        : `${__('Sie rufen')} ${displayName} ${__('an...')}`;
}

    getBestPhoneNumber(contactData) {
        if (!contactData) return __('Nicht angegeben');
        return contactData.phone || contactData.mobile_no || __('Nicht angegeben');
    }

    renderErrorState(error) {
        const body = this.wrapper?.querySelector('.dialog-body');
        if (body) {
            body.innerHTML = `
                <div class="error-state">
                    <i class="fa fa-exclamation-triangle"></i>
                    ${__('Error loading data')}
                    ${error.message ? `<br><small>${error.message}</small>` : ''}
                </div>
            `;
        }
    }
};

frappe.call_dialog = new frappe.CallDialog();