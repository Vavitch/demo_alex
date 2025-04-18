import frappe
import os
import json

def after_migrate():
    add_de_translations()

def add_de_translations():
    # Path to JSON-file with translations
    translations_file_path = os.path.join(frappe.get_app_path("demo_alex"), "controllers", "de.json")

    # Check if the file exists
    if not os.path.exists(translations_file_path):
        frappe.throw(f"File with translations not found: {translations_file_path}")

    # Upload JSON file
    with open(translations_file_path, "r", encoding="utf-8") as f:
        translations = json.load(f)

    # Add translations to the database
    for source, target in translations.items():
        # Check if the translation already exists
        if not frappe.db.exists("Translation", {
            "source_text": source,
            "language": "de"
        }):
            # Creating a translation record
            translation = frappe.get_doc({
                "doctype": "Translation",
                "source_text": source,
                "translated_text": target,
                "language": "de",
                "contributed": 1
            })
            translation.insert(ignore_permissions=True)
            frappe.db.commit()  # Commits the changes in the database
        