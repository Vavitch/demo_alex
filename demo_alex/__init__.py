
from __future__ import unicode_literals
import frappe
__version__ = "0.0.1"




def after_migrate():
    try: 
        from . import api                
        api.setup()
    except ImportError as e:
        frappe.login_error(f"Failed to inizialize API: {str(e)}")    
