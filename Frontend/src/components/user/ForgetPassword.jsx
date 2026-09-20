import React from "react";
import "../../css/ForgetPassword.css";
import { useForm } from "@tanstack/react-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../../store/User/user-action";

const ForgetPassword = () => {
  const dispatch = useDispatch();
  const { loading = false } = useSelector((state) => state.user);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.email || !value.email.trim()) {
        toast.error("Please enter your email address");
        return;
      }

      try {
        await dispatch(forgotPassword(value.email.trim()));
        toast.success("If that email is registered, a reset link has been sent!");
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to send reset email. Please try again."
        );
      }
    },
  });

  return (
    <>
      <div className="row wrapper">
        <div className="col-10 col-lg-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <h1 className="password_title">Forgot Password</h1>
            <form.Field name="email">
              {(field) => (
                <div className="form-group">
                  <label htmlFor="email_field">Enter Email</label>
                  <input
                    type="email"
                    id="email_field"
                    className="form-control"
                    placeholder="Enter your registered email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                </div>
              )}
            </form.Field>
            <button
              id="forgot_password_button"
              type="submit"
              className="btn-block py-3 password-btn"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgetPassword;
