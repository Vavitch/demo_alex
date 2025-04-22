// phone_call.js - Client-side scripting for Phone Call doctype
// Handles auto-population of user and call duration calculation

frappe.ui.form.on('Phone Call', {
    // Setup form when initializing
    setup: function(frm) {
        // Auto-set current user for new records
        if (frm.is_new()) {
            // Set logged-in user
            frm.set_value('user', frappe.session.user);
            
            // Fetch and display user's full name
            frappe.db.get_value('User', frappe.session.user, 'full_name', (r) => {
                if (r.full_name) {
                    frm.set_df_property('user', 'description', `User: ${r.full_name}`);
                }
            });
        }
    },

    
});

