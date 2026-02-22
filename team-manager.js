/**
 * Team Management for PhotoCRM
 * Manages photographers and customer assignments.
 */
window.TeamManager = {
    // Roles definition
    ROLES: {
        ADMIN: 'admin',
        PHOTOGRAPHER: 'photographer',
        ASSISTANT: 'assistant'
    },

    /**
     * Initialize photographers from LocalStorage
     * @returns {Array} List of photographers
     */
    loadPhotographers() {
        try {
            const data = localStorage.getItem('photocrm_team');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load team data', e);
            return [];
        }
    },

    /**
     * Save photographers to LocalStorage
     * @param {Array} photographers 
     */
    savePhotographers(photographers) {
        localStorage.setItem('photocrm_team', JSON.stringify(photographers));
    },

    /**
     * Add a new photographer
     * @param {Object} photographer { name, role }
     */
    addPhotographer(photographer) {
        const photographers = this.loadPhotographers();
        const newMember = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            name: photographer.name,
            role: photographer.role || this.ROLES.PHOTOGRAPHER,
            createdAt: new Date().toISOString()
        };
        photographers.push(newMember);
        this.savePhotographers(photographers);
        return newMember;
    },

    /**
     * Remove a photographer
     * @param {string} id 
     */
    removePhotographer(id) {
        const photographers = this.loadPhotographers();
        const filtered = photographers.filter(p => p.id !== id);
        this.savePhotographers(filtered);
    },

    /**
     * Assign a customer to a photographer
     * @param {Object} customer 
     * @param {string} photographerId 
     */
    assignCustomer(customer, photographerId) {
        customer.assignedTo = photographerId;
        customer.updatedAt = new Date().toISOString();
        return customer;
    }
};
