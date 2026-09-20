import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { updatePassword } from "../../store/User/user-action";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading = false } = useSelector((state) => state.user);

  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!passwordCurrent || !password || !passwordConfirm) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (password.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await dispatch(
        updatePassword({ passwordCurrent, password, passwordConfirm })
      );
      toast.success("Password updated successfully!");
      navigate("/profile");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update password. Please verify your current password."
      );
    }
  };

  return (
    <>
      <div className="row wrapper">
        <div className="col-10 col-lg-5 updateprofile">
          <form onSubmit={submitHandler}>
            <h1 className="password_title">Update Password</h1>

            <div className="form-group">
              <label htmlFor="old_password_field">Current Password</label>
              <input
                type="password"
                id="old_password_field"
                className="form-control"
                placeholder="Enter your current password"
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password_field">New Password</label>
              <input
                type="password"
                id="new_password_field"
                className="form-control"
                placeholder="Enter new password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password_confirm_field">
                Confirm New Password
              </label>
              <input
                type="password"
                id="new_password_confirm_field"
                className="form-control"
                placeholder="Re-enter new password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn-block py-3 password-btn"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;
