/**
 * Sync Management for PhotoCRM
 * Handles data export/import and merge against Firebase-backed cache.
 */
window.SyncManager = {
  prepareExport() {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      customers: window.FirebaseService?.getCachedData('photocrm_customers') || [],
      options: window.FirebaseService?.getCachedData('photocrm_options') || {},
      team: window.FirebaseService?.getCachedData('photocrm_team') || [],
      settings: {
        theme: window.FirebaseService?.getCachedData('photocrm_theme') || 'dark',
        lang: window.FirebaseService?.getCachedData('photocrm_lang') || 'en'
      }
    };
  },

  async mergeData(data) {
    if (!data || !Array.isArray(data.customers)) throw new Error('Invalid data format');

    const stats = { customers: 0, team: 0, updated: 0 };

    const localCustomers = window.FirebaseService?.getCachedData('photocrm_customers') || [];
    const customerMap = new Map(localCustomers.map((c) => [c.id, c]));

    data.customers.forEach((remote) => {
      const local = customerMap.get(remote.id);
      if (!local || new Date(remote.updatedAt || 0) > new Date(local.updatedAt || 0)) {
        customerMap.set(remote.id, remote);
        if (local) stats.updated++; else stats.customers++;
      }
    });

    const mergedCustomers = Array.from(customerMap.values());
    await window.FirebaseService?.saveKey('photocrm_customers', mergedCustomers);

    if (Array.isArray(data.team)) {
      const localTeam = window.FirebaseService?.getCachedData('photocrm_team') || [];
      const teamMap = new Map(localTeam.map((p) => [p.id, p]));
      data.team.forEach((remote) => {
        if (!teamMap.has(remote.id)) {
          teamMap.set(remote.id, remote);
          stats.team++;
        }
      });
      await window.FirebaseService?.saveKey('photocrm_team', Array.from(teamMap.values()));
    }

    if (data.options) {
      const localOptions = window.FirebaseService?.getCachedData('photocrm_options') || {};
      const newOptions = { ...localOptions };
      Object.keys(data.options).forEach((key) => {
        if (Array.isArray(data.options[key])) {
          const incoming = data.options[key];
          const existing = Array.isArray(newOptions[key]) ? newOptions[key] : [];
          const hasNamedObject = incoming.some(item => item && typeof item === 'object' && typeof item.name === 'string');

          if (hasNamedObject) {
            const map = new Map();
            existing.forEach((item) => {
              if (item && typeof item === 'object' && typeof item.name === 'string') {
                map.set(item.name, { name: item.name, price: Number(item.price) || 0 });
              } else if (typeof item === 'string' && item.trim()) {
                map.set(item.trim(), { name: item.trim(), price: 0 });
              }
            });
            incoming.forEach((item) => {
              if (item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim()) {
                map.set(item.name.trim(), { name: item.name.trim(), price: Number(item.price) || 0 });
              } else if (typeof item === 'string' && item.trim()) {
                map.set(item.trim(), { name: item.trim(), price: 0 });
              }
            });
            newOptions[key] = Array.from(map.values());
          } else {
            newOptions[key] = Array.from(new Set([...(newOptions[key] || []), ...incoming]));
          }
        }
      });
      await window.FirebaseService?.saveKey('photocrm_options', newOptions);
    }

    return stats;
  }
};
