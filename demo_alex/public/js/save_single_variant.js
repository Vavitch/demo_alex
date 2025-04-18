frappe.ui.form.on('Item', {
    refresh: function(frm) {
        if (frm.doc.variant_of && frm.doc.__islocal) {
            frm.save();
        }
    }
});