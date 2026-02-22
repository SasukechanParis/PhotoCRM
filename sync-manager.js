/**
 * Sync Management for PhotoCRM
 * Handles data export/import and basic conflict resolution.
 */
window.SyncManager = {
    /**
     * Prepare data for export
     * @returns {Object} Full application state
     */
    prepareExport() {
        return {
            version: '1.1',
            exportedAt: new Date().toISOString(),
            customers: JSON.parse(localStorage.getItem('photocrm_customers') || '[]'),
            options: JSON.parse(localStorage.getItem('photocrm_options') || '{}'),
            team: JSON.parse(localStorage.getItem('photocrm_team') || '[]'),
            settings: {
                theme: localStorage.getItem('photocrm_theme') || 'dark',
                lang: localStorage.getItem('photocrm_lang') || 'en'
            }
        };
    },

    /**
     * Merge imported data into LocalStorage
     * @param {Object} data Imported JSON object
     * @returns {Object} Stats about merged items
     */
    mergeData(data) {
        if (!data || !data.customers) throw new Error('Invalid data format');

        const stats = { customers: 0, team: 0, updated: 0 };

        // Customers Merge (Last Write Wins)
        const localCustomers = JSON.parse(localStorage.getItem('photocrm_customers') || '[]');
        const customerMap = new Map(localCustomers.map(c => [c.id, c]));

        data.customers.forEach(remote => {
            const local = customerMap.get(remote.id);
            if (!local || new Date(remote.updatedAt) > new Date(local.updatedAt)) {
                customerMap.set(remote.id, remote);
                if (local) stats.updated++; else stats.customers++;
            }
        });
        localStorage.setItem('photocrm_customers', JSON.stringify(Array.from(customerMap.values())));

        // Team Merge
        if (data.team) {
            const localTeam = JSON.parse(localStorage.getItem('photocrm_team') || '[]');
            const teamMap = new Map(localTeam.map(p => [p.id, p]));
            data.team.forEach(remote => {
                if (!teamMap.has(remote.id)) {
                    teamMap.set(remote.id, remote);
                    stats.team++;
                }
            });
            localStorage.setItem('photocrm_team', JSON.stringify(Array.from(teamMap.values())));
        }

        // Options Merge
        if (data.options) {
            const localOptions = JSON.parse(localStorage.getItem('photocrm_options') || '{}');
            const newOptions = { ...localOptions };
            Object.keys(data.options).forEach(key => {
                if (Array.isArray(data.options[key])) {
                    newOptions[key] = Array.from(new Set([...(newOptions[key] || []), ...data.options[key]]));
                }
            });
            localStorage.setItem('photocrm_options', JSON.stringify(newOptions));
        }

        return stats;
    }
};
