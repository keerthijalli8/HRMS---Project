
import { useEffect, useState } from "react";
import { Save, UserRound, Trash2, Camera } from "lucide-react";
import "./Profile.css";
import { notifySaveSuccess } from "../../../utils/saveNavigation";

const defaultProfile = {
  firstName: "Super",
  lastName: "Admin",
  email: "admin@example.com",
  phone: "",
  designation: "Super Administrator",
  photo: ""
};

export default function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("superAdminProfile");
      if (stored) {
        setProfile({ ...defaultProfile, ...JSON.parse(stored) });
      }
    } catch {
      setProfile(defaultProfile);
    }
  }, []);

  const update = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value
    }));
    setSaved(false);
    setError("");
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be below 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("photo", reader.result);
      }
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removePhoto = () => {
    update("photo", "");
  };

  const saveProfile = (event) => {
    event.preventDefault();

    const cleaned = {
      ...profile,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      designation: profile.designation.trim()
    };

    if (!cleaned.firstName || !cleaned.lastName || !cleaned.email) {
      setError("First name, last name and email are required.");
      return;
    }

    try {
      localStorage.setItem("superAdminProfile", JSON.stringify(cleaned));
      localStorage.setItem("superAdminFirstName", cleaned.firstName);
      window.dispatchEvent(new Event("superAdminProfileUpdated"));
      setProfile(cleaned);
      setSaved(true);
      setError("");
      notifySaveSuccess("Profile updated successfully.");
    } catch {
      setError(
        "Unable to save profile. Browser storage may be full. Try a smaller photo."
      );
      setSaved(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <h1>Profile Settings</h1>
        <p>Manage your Super Admin account information and profile picture.</p>
      </div>

      <form className="profile-panel" onSubmit={saveProfile}>
        <div className="profile-photo-area">
          <div className="profile-avatar">
            {profile.photo ? (
              <img src={profile.photo} alt="Super Admin profile" />
            ) : (
              <UserRound size={38} />
            )}
          </div>

          <div className="profile-photo-details">
            <strong>Profile Picture</strong>
            <p>Upload a JPG, PNG or WebP image (maximum 2 MB).</p>

            <div className="profile-photo-actions">
              <label className="profile-upload">
                <Camera size={15} />
                {profile.photo ? "Change Picture" : "Upload Picture"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhoto}
                />
              </label>

              {profile.photo && (
                <button
                  type="button"
                  className="profile-remove"
                  onClick={removePhoto}
                >
                  <Trash2 size={15} />
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="profile-fields">
          <label>
            First Name
            <input
              required
              value={profile.firstName}
              onChange={(event) =>
                update("firstName", event.target.value)
              }
            />
          </label>

          <label>
            Last Name
            <input
              required
              value={profile.lastName}
              onChange={(event) =>
                update("lastName", event.target.value)
              }
            />
          </label>

          <label>
            Email Address
            <input
              required
              type="email"
              value={profile.email}
              onChange={(event) =>
                update("email", event.target.value)
              }
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              value={profile.phone}
              onChange={(event) =>
                update("phone", event.target.value)
              }
              placeholder="Enter phone number"
            />
          </label>

          <label className="profile-full">
            Designation
            <input
              value={profile.designation}
              onChange={(event) =>
                update("designation", event.target.value)
              }
            />
          </label>
        </div>

        <div className="profile-footer">
          <div>
            {saved && (
              <span>Profile updated successfully.</span>
            )}
            {error && (
              <span className="profile-error">{error}</span>
            )}
          </div>

          <button className="profile-save" type="submit">
            <Save size={16} />
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
