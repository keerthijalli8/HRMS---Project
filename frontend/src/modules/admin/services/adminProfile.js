const ADMIN_PROFILE_KEY = "hrms-admin-profile";

export const defaultAdminProfile = {
  name: "Admin User",
  id: "",
  email: "admin@hrmsindia.com",
  designation: "System Administrator",
  department: "Other",
  photo: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContact: ""
};

export function readAdminProfile() {
  try {
    const savedProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
    if (!savedProfile) return { ...defaultAdminProfile };

    return {
      ...defaultAdminProfile,
      ...JSON.parse(savedProfile)
    };
  } catch (error) {
    console.error("Unable to load the saved admin profile.", error);
    return { ...defaultAdminProfile };
  }
}

export function saveAdminProfile(profile) {
  const profileToSave = {
    name: profile.name,
    id: profile.id,
    email: profile.email,
    designation: profile.designation,
    department: profile.department,
    photo: profile.photo,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    address: profile.address,
    emergencyContact: profile.emergencyContact
  };

  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profileToSave));
  window.dispatchEvent(new Event("admin-profile-updated"));
}
