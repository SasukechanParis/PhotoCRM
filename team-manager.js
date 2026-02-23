/**
 * Team Management for PhotoCRM
 * Uses Firebase-backed app state cache.
 */
window.TeamManager = {
  ROLES: {
    ADMIN: 'admin',
    PHOTOGRAPHER: 'photographer',
    ASSISTANT: 'assistant'
  },

  loadPhotographers() {
    const data = window.FirebaseService?.getCachedData('photocrm_team');
    return Array.isArray(data) ? data : [];
  },

  savePhotographers(photographers) {
    window.FirebaseService?.saveKey('photocrm_team', photographers);
  },

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

  removePhotographer(id) {
    const photographers = this.loadPhotographers();
    this.savePhotographers(photographers.filter((p) => p.id !== id));
  },

  assignCustomer(customer, photographerId) {
    customer.assignedTo = photographerId;
    customer.updatedAt = new Date().toISOString();
    return customer;
  }
};
