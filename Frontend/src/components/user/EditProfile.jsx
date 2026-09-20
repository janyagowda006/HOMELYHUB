import React, { Fragment, useEffect, useState } from "react";
import "../../css/Profile.css";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../store/User/user-action";

const EditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading = false } = useSelector((state) => state.user);

  const defaultAvatar =
    user?.avatar?.url ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user?.name || "User") +
      "&background=0e8b53&color=fff&size=256&bold=true";

  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);

  const originalUserData = {
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    avatar: user?.avatar?.url || "",
  };

  const onChange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
        form.setFieldValue("avatar", reader.result);
      }
    };
    if (e.target.files && e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const form = useForm({
    defaultValues: {
      name: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
      avatar: user?.avatar?.url || "",
    },
    onSubmit: async ({ value }) => {
      const updatedFields = {};

      if (value.name !== originalUserData.name) {
        updatedFields.name = value.name;
      }
      if (value.phoneNumber !== originalUserData.phoneNumber) {
        updatedFields.phoneNumber = value.phoneNumber;
      }
      if (value.avatar && value.avatar !== originalUserData.avatar) {
        updatedFields.avatar = value.avatar;
      }

      if (Object.keys(updatedFields).length === 0) {
        toast("No changes made");
        return;
      }

      try {
        await dispatch(updateProfile(updatedFields));
        toast.success("Profile Updated Successfully!");
        navigate("/profile");
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to update profile."
        );
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.setFieldValue("name", user.name || "");
      form.setFieldValue("phoneNumber", user.phoneNumber || "");
      const currentAvatar =
        user.avatar?.url ||
        "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(user.name || "User") +
          "&background=0e8b53&color=fff&size=256&bold=true";
      form.setFieldValue("avatar", currentAvatar);
      setAvatarPreview(currentAvatar);
    }
  }, [user]);

  return (
    <Fragment>
      <div className="row wrapper ">
        <div className="col-10 col-lg-5 updateprofile">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            encType="multipart/form-data"
          >
            <h1 className="mt-2 mb-5">Update Profile</h1>

            <form.Field name="name">
              {(field) => (
                <div className="form-group">
                  <label htmlFor="email_field">Name</label>
                  <input
                    type="text"
                    id="name_field"
                    className="form-control"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="phoneNumber">
              {(field) => (
                <div className="form-group">
                  <label htmlFor="email_field">Phone Number</label>
                  <input
                    type="number"
                    id="email_field"
                    className="form-control"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="avatar">
              {(field) => (
                <div className="form-group">
                  <label htmlFor="avatar_upload">Avatar</label>
                  <div className="d-flex align-items-center">
                    <div>
                      <figure className="avatar mr-3 item-rtl">
                        <img
                          src={avatarPreview}
                          className="rounded-circle"
                          alt="Avatar Preview"
                        />
                      </figure>
                    </div>
                    <div className="custom-file">
                      <input
                        type="file"
                        name={field.name}
                        className="custom-file-input"
                        id="avatarupdate"
                        accept="image/*"
                        onChange={onChange}
                      />
                      <label className="custom-file-label" htmlFor="customFile">
                        Choose Avatar
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </form.Field>
            <button
              type="submit"
              className=" update-btn btn-block "

            >
              {loading ? "Updating" : "Update"}
            </button>
          </form>
        </div>
      </div>
    </Fragment>
  );
};

export default EditProfile;
