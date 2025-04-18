window.getAppName = function() {
  // 1. ������ ���� ����������� ��������
  const scripts = Array.from(document.getElementsByTagName('script'));
  const appScript = scripts.find(s => 
    s.src.includes('/public/js/') && 
    !s.src.includes('erpnext') &&
    !s.src.includes('frappe')
  );

  if (appScript) {
    const appMatch = appScript.src.match(/apps\/([^\/]+)\/public/);
    if (appMatch) {
      return appMatch[1]; // ���������� ��������� ���
    }
  }

  // 2. ������ ��������� Frappe
  if (frappe && frappe.boot) {
    // ���� ��-erpnext ���������� � module_app
    const apps = Object.values(frappe.boot.module_app || {});
    const customApp = apps.find(a => a !== 'erpnext' && a !== 'frappe');
    if (customApp) return customApp;
    
    // ��������� desk_settings
    if (frappe.boot.desk_settings && frappe.boot.desk_settings.app_name) {
      return frappe.boot.desk_settings.app_name;
    }
  }

  // 3. ���� ������ �� ������� - ����������� ������
  throw new Error('�� ������� ���������� ��� ����������. ���������: \n'
    + '1. ���� � JS-������ (/apps/[����_����������]/public/js/)\n'
    + '2. ��������� � System Settings > Desk Settings');
}