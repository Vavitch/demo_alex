from __future__ import unicode_literals
from frappe.utils import now_datetime
import os
from frappe import _

app_name = "demo_alex"
app_title = "Demo-Alex"
app_publisher = "AleXX"
app_description = "It is a demo app"
app_email = "ezu4ek@gmail.com"
app_license = "mit"
app_requires = ["frappe", "erpnext"]
#-----------------------------------------------------



# upload s file with translation (/demo_alex/controllers/de.json)of phrases and words
# using file (/demo_alex/controllers/add_custom_translations.py)
after_migrate = "demo_alex.controllers.add_custom_translations.after_migrate"

#-----------------------------------------------------



#-----------------------------------------------------
# our server scripts
doc_events = {
    "Item": {
        "before_save": [
            "demo_alex.controllers.update_variant.update_variant_price",
            "demo_alex.controllers.update_variant.naming_item"
        ],
        "after_save": "demo_alex.controllers.update_variant.heritance_from_template",
        "before_insert":"demo_alex.controllers.update_variant.update_variant_description"
         }
}
#-----------------------------------------------------
# our client scripts
app_include_js = [
    
    "assets/demo_alex/js/phone_call.js",
    "assets/demo_alex/js/app_config.js",
    "assets/demo_alex/js/save_single_variant.js?ver="  + now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/item_variant_client.js?ver=" +  now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/change_order.js?ver=" +  now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/create_attributes_dialog_desktop.js?ver="  + now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/create_attributes_dialog_phone.js?ver="  + now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/pick_attributes.js?ver=" + now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/pick_from_template.js?ver=" + now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/anrufsimulation_taste.js?ver=" + now_datetime().strftime("%Y%m%d%H%M%S"),
    "assets/demo_alex/js/call_dialog.js?ver=" + now_datetime().strftime("%Y%m%d%H%M%S")
    
    
]

#-----------------------------------------------------
app_include_css = [
    "assets/demo_alex/css/call_dialog.css"
]

#-------------------------------------------------------

#doctype_js = {
#    "Sales Order": "public/js/change_order.js",
#    "Quotation": "public/js/change_order.js"
#}
#------------------------------------------------------
# Apps
# ------------------
#override_doctype_class = {
#   "Sales Order": "demo_alex.custom.sales_order.CustomSalesOrder",
#   "Quotation": "demo_alex.custom.sales_order.CustomSalesOrder"
#}
