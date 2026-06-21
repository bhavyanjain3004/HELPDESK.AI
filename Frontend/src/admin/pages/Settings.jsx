import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import {
  DEFAULT_ADMIN_SETTINGS,
  resolveCompanyId,
  settingsFromSystemSettingsRow,
  settingsToSystemSettingsRow
} from '../../utils/adminSettingsPersistence';

const Settings = () => {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const companyId = resolveCompanyId(profile, user);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!companyId) return;
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('company_id', companyId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching settings:", error);
        } else if (data) {
          setSettings(settingsFromSystemSettingsRow(data));
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [companyId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!companyId) return;
    
    setIsSaving(true);
    setSaveMessage('');

    try {
      const row = settingsToSystemSettingsRow(settings, companyId);
      const { error } = await supabase
        .from('system_settings')
        .upsert(row, { onConflict: 'company_id' });

      if (error) throw error;
      setSaveMessage('Settings saved successfully!');
    } catch (err) {
      console.error("Error saving settings", err);
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <div className="p-8 text-white">Loading settings...</div>;
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        
        {/* Email Templates Section */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Email Templates (Ticket Creation)</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Customize the automatic HTML email template sent to new ticket creators. 
            Leave blank to use the system default template.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                name="ticketCreationEmailSubject"
                value={settings.ticketCreationEmailSubject || ''}
                onChange={handleTemplateChange}
                placeholder="[HELPDESK.AI] Support ticket received: #{{ticket_id}}"
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                HTML Email Body
              </label>
              <textarea
                name="ticketCreationEmailBodyHtml"
                value={settings.ticketCreationEmailBodyHtml || ''}
                onChange={handleTemplateChange}
                rows="8"
                placeholder="<html><body><h1>Hi {{recipient_name}},</h1><p>Your ticket {{ticket_title}} was received.</p></body></html>"
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-gray-900 p-4 rounded text-sm text-gray-400">
              <h3 className="font-semibold text-gray-300 mb-2">Available Placeholders:</h3>
              <ul className="list-disc list-inside grid grid-cols-2 gap-2">
                <li><code>{`{{ticket_id}}`}</code></li>
                <li><code>{`{{ticket_title}}`}</code></li>
                <li><code>{`{{recipient_name}}`}</code></li>
                <li><code>{`{{company_name}}`}</code></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveMessage && (
            <span className={saveMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}>
              {saveMessage}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings;
