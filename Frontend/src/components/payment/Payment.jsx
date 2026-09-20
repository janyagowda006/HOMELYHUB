import React, { useEffect, useState } from "react";
import "../../css/Payment.css";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  createOrder,
  confirmPayment,
} from "../../store/Booking/booking-action";
import { STATIC_PAYMENT_DETAILS } from "../../data/staticData";

const POPULAR_BANKS = [
  { id: "HDFC", name: "HDFC Bank", icon: "account_balance" },
  { id: "SBI", name: "State Bank of India", icon: "account_balance" },
  { id: "ICICI", name: "ICICI Bank", icon: "account_balance" },
  { id: "AXIS", name: "Axis Bank", icon: "account_balance" },
  { id: "KOTAK", name: "Kotak Mahindra", icon: "account_balance" },
  { id: "PNB", name: "Punjab National Bank", icon: "account_balance" },
];

const ALL_BANKS = [
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "IDBI Bank",
  "Federal Bank",
  "Yes Bank",
  "RBL Bank",
];

const UPI_APPS = [
  { id: "gpay", name: "Google Pay", handle: "@okaxis", color: "#4285F4" },
  { id: "phonepe", name: "PhonePe", handle: "@ybl", color: "#5f259f" },
  { id: "paytm", name: "Paytm UPI", handle: "@paytm", color: "#00baf2" },
  { id: "cred", name: "CRED UPI", handle: "@cred", color: "#000000" },
];

const WALLETS = [
  { id: "amazonpay", name: "Amazon Pay", desc: "Fast 1-click payment", icon: "payments" },
  { id: "paytm_wallet", name: "Paytm Wallet", desc: "Instant wallet checkout", icon: "account_balance_wallet" },
  { id: "phonepe_wallet", name: "PhonePe Wallet", desc: "Direct wallet deduction", icon: "wallet" },
  { id: "mobikwik", name: "MobiKwik", desc: "SuperCash & PayLater", icon: "credit_card" },
];

// Real dynamic QR Code Component with SVG pattern fallback
const QrCodeDisplay = ({ value, size = 220 }) => {
  const [imgError, setImgError] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    value
  )}`;

  if (imgError) {
    return (
      <svg
        className="fallback-qr-svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
      >
        {/* Finder Pattern Top-Left */}
        <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
        <rect x="9" y="9" width="20" height="20" rx="2" fill="#ffffff" />
        <rect x="13" y="13" width="12" height="12" rx="1" fill="#0e8b53" />

        {/* Finder Pattern Top-Right */}
        <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
        <rect x="71" y="9" width="20" height="20" rx="2" fill="#ffffff" />
        <rect x="75" y="13" width="12" height="12" rx="1" fill="#0e8b53" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
        <rect x="9" y="71" width="20" height="20" rx="2" fill="#ffffff" />
        <rect x="13" y="75" width="12" height="12" rx="1" fill="#0e8b53" />

        {/* QR Matrix Pattern Dots */}
        <rect x="38" y="8" width="6" height="6" fill="#0f172a" />
        <rect x="48" y="8" width="6" height="6" fill="#0f172a" />
        <rect x="38" y="18" width="6" height="6" fill="#0f172a" />
        <rect x="58" y="18" width="6" height="6" fill="#0f172a" />
        <rect x="48" y="28" width="6" height="6" fill="#0f172a" />
        <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
        <rect x="18" y="48" width="6" height="6" fill="#0f172a" />
        <rect x="28" y="38" width="6" height="6" fill="#0f172a" />
        <rect x="38" y="38" width="8" height="8" rx="2" fill="#0e8b53" />
        <rect x="50" y="38" width="6" height="6" fill="#0f172a" />
        <rect x="60" y="48" width="6" height="6" fill="#0f172a" />
        <rect x="70" y="38" width="6" height="6" fill="#0f172a" />
        <rect x="80" y="48" width="6" height="6" fill="#0f172a" />
        <rect x="48" y="58" width="8" height="8" fill="#0f172a" />
        <rect x="38" y="68" width="6" height="6" fill="#0f172a" />
        <rect x="58" y="68" width="6" height="6" fill="#0f172a" />
        <rect x="68" y="78" width="6" height="6" fill="#0f172a" />
        <rect x="78" y="68" width="6" height="6" fill="#0f172a" />
        <rect x="48" y="78" width="6" height="6" fill="#0f172a" />
        <rect x="38" y="88" width="6" height="6" fill="#0f172a" />
        <rect x="58" y="88" width="6" height="6" fill="#0f172a" />
        <rect x="78" y="88" width="6" height="6" fill="#0f172a" />
        <rect x="88" y="78" width="6" height="6" fill="#0f172a" />
      </svg>
    );
  }

  return (
    <img
      src={qrUrl}
      alt="UPI QR Code"
      className="dynamic-qr-image"
      onError={() => setImgError(true)}
    />
  );
};

const Payment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { propertyId } = useParams();

  const bookingState = useSelector(
    (state) => state.booking || state.bookings || {}
  );
  const { user } = useSelector((state) => state.user || {});

  // Restore payment details from Redux state or sessionStorage
  const cachedDetails = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("homelyhub_payment_details") || "null"
      );
    } catch {
      return null;
    }
  })();

  const paymentDetails =
    bookingState.paymentDetails || cachedDetails || STATIC_PAYMENT_DETAILS;

  const {
    checkinDate,
    checkoutDate,
    totalPrice: initialTotalPrice,
    propertyName,
    guests,
    nights,
    address,
  } = paymentDetails;

  const { loading = false, error = null, orderData = null } = bookingState;

  // Payment method selection & form state
  const [paymentMethod, setPaymentMethod] = useState("card"); // card, upi, qr, netbanking, wallet, pay_at_hotel

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState(
    user?.name || paymentDetails.name || ""
  );
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);

  // UPI details
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiMode, setUpiMode] = useState("app"); // app, id, qr

  // QR Code details
  const [qrExpirySeconds, setQrExpirySeconds] = useState(300); // 5 mins
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);

  // Net Banking details
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // Wallet details
  const [selectedWallet, setSelectedWallet] = useState("amazonpay");

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Bank Gateway / OTP Simulation Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("123456");
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [isProcessingOtp, setIsProcessingOtp] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedTxnId, setCompletedTxnId] = useState("");

  // Calculate prices with optional promo discount
  const basePrice = initialTotalPrice || 0;
  const discountAmount = appliedPromo ? Math.round(basePrice * 0.1) : 0;
  const taxesAndFees = Math.round((basePrice - discountAmount) * 0.12);
  const finalPrice = Math.max(basePrice - discountAmount + taxesAndFees, 0);

  // Auto format card number: 4532 8901 2345 6789
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  };

  // Auto format card expiry: MM/YY
  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Card brand detection
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(clean)) return "MASTERCARD";
    if (/^6(011|5)/.test(clean)) return "RUPAY";
    if (/^3[47]/.test(clean)) return "AMEX";
    return "CARD";
  };

  // Handle promo code
  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) return;
    if (promoCodeInput.trim().toUpperCase() === "HOMELY10") {
      setAppliedPromo({ code: "HOMELY10", discountPercent: 10 });
      toast.success("🎉 Promo Code HOMELY10 applied! 10% discount added.");
    } else {
      toast.error("Invalid coupon code. Try HOMELY10 for 10% off!");
    }
  };

  // QR Countdown timer
  useEffect(() => {
    let timer;
    if (
      (paymentMethod === "qr" || (paymentMethod === "upi" && upiMode === "qr")) &&
      qrExpirySeconds > 0 &&
      !paymentSuccess
    ) {
      timer = setInterval(() => setQrExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [paymentMethod, upiMode, qrExpirySeconds, paymentSuccess]);

  const formatQrTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRefreshQr = () => {
    setQrExpirySeconds(300);
    toast.success("QR Code refreshed with new secure session token.");
  };

  const handleCopyUpiId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("homelyhub@icici");
    }
    toast.success("Copied UPI ID: homelyhub@icici");
  };

  const handleSimulateQrPayment = async () => {
    if (qrExpirySeconds <= 0) {
      toast.error("QR Code expired. Please click 'Refresh QR' to generate a new code.");
      return;
    }

    setIsVerifyingQr(true);

    try {
      let activeOrder = orderData;
      if (!activeOrder) {
        const orderPayload = {
          propertyId,
          checkInDate: checkinDate,
          checkOutDate: checkoutDate,
          guests: Number(guests) || 1,
          guestContact: {
            name: cardholderName || paymentDetails.name || user?.name || "Guest",
            phone: paymentDetails.phoneNumber || user?.phoneNumber || "9876543210",
          },
        };
        const res = await dispatch(createOrder(orderPayload));
        activeOrder = res?.data || res;
      }

      const targetOrderId = activeOrder?.orderId || activeOrder?.booking?.orderId;
      const targetBookingId =
        activeOrder?.bookingId || activeOrder?.booking?._id || activeOrder?._id;
      const txnId = `UPIQR_${Date.now()}_${Math.floor(Math.random() * 90000 + 10000)}`;

      await dispatch(
        confirmPayment({
          orderId: targetOrderId,
          bookingId: targetBookingId,
          transactionId: txnId,
          paymentMethod: "upi_qr",
        })
      );

      setCompletedTxnId(txnId);
      setIsVerifyingQr(false);
      setPaymentSuccess(true);
      setShowOtpModal(true);
      toast.success("🎉 QR Payment Verified! Booking Confirmed!");

      setTimeout(() => {
        navigate("/user/mybookings");
      }, 2500);
    } catch (err) {
      setIsVerifyingQr(false);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "QR Payment verification failed. Please try again."
      );
    }
  };

  // Trigger booking & payment checkout
  const handleInitiatePayment = async () => {
    if (paymentMethod === "qr") {
      return handleSimulateQrPayment();
    }

    // Basic validations
    if (paymentMethod === "card") {
      const cleanNum = cardNumber.replace(/\s/g, "");
      if (cleanNum.length < 15) {
        toast.error("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        toast.error("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        toast.error("Please enter a valid 3-digit CVV.");
        return;
      }
    } else if (paymentMethod === "upi" && upiMode === "id") {
      if (!upiId || !upiId.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g. yourname@okhdfcbank).");
        return;
      }
    } else if (paymentMethod === "upi" && upiMode === "qr") {
      return handleSimulateQrPayment();
    }

    try {
      let activeOrder = orderData;

      // Create order if not created yet
      if (!activeOrder) {
        const orderPayload = {
          propertyId,
          checkInDate: checkinDate,
          checkOutDate: checkoutDate,
          guests: Number(guests) || 1,
          guestContact: {
            name: cardholderName || paymentDetails.name || user?.name || "Guest",
            phone: paymentDetails.phoneNumber || user?.phoneNumber || "9876543210",
          },
        };

        const res = await dispatch(createOrder(orderPayload));
        activeOrder = res?.data || res;
      }

      // If Pay at Hotel, confirm immediately without bank OTP
      if (paymentMethod === "pay_at_hotel") {
        const targetOrderId = activeOrder?.orderId || activeOrder?.booking?.orderId;
        const targetBookingId =
          activeOrder?.bookingId || activeOrder?.booking?._id || activeOrder?._id;

        await dispatch(
          confirmPayment({
            orderId: targetOrderId,
            bookingId: targetBookingId,
            paymentMethod: "pay_at_hotel",
          })
        );
        toast.success("🎉 Booking Confirmed! Pay in cash or card at hotel check-in.");
        setTimeout(() => navigate("/user/mybookings"), 1200);
        return;
      }

      // Open Bank 3D Secure / OTP Simulation screen
      setShowOtpModal(true);
      setOtpCountdown(30);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to initiate payment. Please try again."
      );
    }
  };

  // Submit OTP & confirm transaction
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast.error("Please enter the 6-digit OTP sent to your registered mobile.");
      return;
    }

    setIsProcessingOtp(true);

    try {
      const targetOrderId = orderData?.orderId || orderData?.booking?.orderId;
      const targetBookingId =
        orderData?.bookingId || orderData?.booking?._id || orderData?._id;

      const txnId = `TXN_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

      await dispatch(
        confirmPayment({
          orderId: targetOrderId,
          bookingId: targetBookingId,
          transactionId: txnId,
          paymentMethod: paymentMethod,
        })
      );

      setCompletedTxnId(txnId);
      setIsProcessingOtp(false);
      setPaymentSuccess(true);
      toast.success("🎉 Payment Successful! Booking Confirmed!");

      setTimeout(() => {
        navigate("/user/mybookings");
      }, 2500);
    } catch (err) {
      setIsProcessingOtp(false);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Payment verification failed. Please try again."
      );
    }
  };

  // Countdown timer for OTP modal
  useEffect(() => {
    let timer;
    if (showOtpModal && otpCountdown > 0 && !paymentSuccess) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpCountdown, paymentSuccess]);

  // Render rich QR Card
  const renderQrCard = () => (
    <div className="qr-container-card">
      <div className="qr-header-info">
        <div className="merchant-info">
          <div className="merchant-logo-badge">
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </div>
          <div>
            <h3>HomelyHub Stays Pvt Ltd</h3>
            <span className="merchant-verified">
              <span className="material-symbols-outlined check-icon">verified</span>
              Verified Merchant • ICICI Bank UPI
            </span>
          </div>
        </div>
        <div className="qr-amount-pill">
          <span>Amount to Pay</span>
          <strong>₹{finalPrice.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <div className="qr-code-frame-wrapper">
        <div className="qr-code-frame">
          <div className="qr-corner top-left"></div>
          <div className="qr-corner top-right"></div>
          <div className="qr-corner bottom-left"></div>
          <div className="qr-corner bottom-right"></div>

          <QrCodeDisplay
            value={`upi://pay?pa=homelyhub@icici&pn=HomelyHub%20Stays&am=${finalPrice}&cu=INR&tn=Booking-${propertyId || "stay"}`}
            size={220}
          />

          <div className="qr-center-badge" title="HomelyHub Secure Gateway">
            <span className="material-symbols-outlined">lock</span>
          </div>
        </div>

        <div className="qr-timer-bar">
          {qrExpirySeconds > 0 ? (
            <div className="timer-badge">
              <span className="material-symbols-outlined">schedule</span>
              <span>
                QR valid for <strong>{formatQrTimer(qrExpirySeconds)}</strong>
              </span>
            </div>
          ) : (
            <div className="timer-badge expired">
              <span className="material-symbols-outlined">warning</span>
              <span>QR Expired</span>
            </div>
          )}
          <button
            type="button"
            className="refresh-qr-btn"
            onClick={handleRefreshQr}
            title="Generate fresh QR code"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh QR
          </button>
        </div>
      </div>

      <div className="upi-id-copy-row">
        <div className="upi-id-chip">
          <span>UPI ID:</span>
          <strong>homelyhub@icici</strong>
        </div>
        <button
          type="button"
          className="copy-chip-btn"
          onClick={handleCopyUpiId}
        >
          <span className="material-symbols-outlined">content_copy</span>
          Copy
        </button>
      </div>

      <div className="supported-upi-apps">
        <span>Scan with any UPI App:</span>
        <div className="apps-icon-row">
          <div className="app-pill gpay"><span className="app-dot gpay"></span> Google Pay</div>
          <div className="app-pill phonepe"><span className="app-dot phonepe"></span> PhonePe</div>
          <div className="app-pill paytm"><span className="app-dot paytm"></span> Paytm</div>
          <div className="app-pill bhim"><span className="app-dot bhim"></span> BHIM UPI</div>
          <div className="app-pill cred"><span className="app-dot cred"></span> CRED</div>
        </div>
      </div>

      <div className="qr-live-listening">
        <span className="pulse-dot"></span>
        <span>Awaiting payment confirmation from your UPI app...</span>
      </div>

      <div className="qr-actions-row">
        <button
          type="button"
          className="simulate-scan-btn"
          onClick={handleSimulateQrPayment}
          disabled={isVerifyingQr}
        >
          {isVerifyingQr ? (
            <>
              <span className="spinner"></span>
              Verifying Payment with NPCI...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              I Have Paid via QR / Simulate Scan
            </>
          )}
        </button>

        <a
          href={`upi://pay?pa=homelyhub@icici&pn=HomelyHub%20Stays&am=${finalPrice}&cu=INR&tn=Booking-${propertyId || "stay"}`}
          className="mobile-intent-btn"
        >
          <span className="material-symbols-outlined">smartphone</span>
          Open in UPI App
        </a>
      </div>
    </div>
  );

  return (
    <div className="real-payment-page">
      {/* Top Breadcrumb & Title */}
      <div className="payment-top-bar">
        <Link to={`/propertylist/${propertyId}`} className="back-link">
          <span className="material-symbols-outlined">arrow_back</span> Back to property
        </Link>
        <div className="security-pill">
          <span className="material-symbols-outlined">lock</span> 256-Bit Bank Grade Security
        </div>
      </div>

      <div className="payment-main-grid">
        {/* LEFT COLUMN: PAYMENT METHODS */}
        <div className="payment-methods-card">
          <div className="methods-card-header">
            <h2>Select Payment Method</h2>
            <p>All transactions are 100% encrypted & RBI compliant</p>
          </div>

          {/* Payment Navigation Tabs */}
          <div className="payment-nav-tabs">
            <button
              type="button"
              className={`nav-tab ${paymentMethod === "card" ? "active" : ""}`}
              onClick={() => setPaymentMethod("card")}
            >
              <span className="material-symbols-outlined">credit_card</span>
              <span>Credit / Debit Card</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${paymentMethod === "upi" ? "active" : ""}`}
              onClick={() => setPaymentMethod("upi")}
            >
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span>UPI Apps & ID</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${paymentMethod === "qr" ? "active" : ""}`}
              onClick={() => setPaymentMethod("qr")}
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              <span>Scan & Pay QR</span>
              <span className="tab-badge">Instant</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${paymentMethod === "netbanking" ? "active" : ""}`}
              onClick={() => setPaymentMethod("netbanking")}
            >
              <span className="material-symbols-outlined">account_balance</span>
              <span>Net Banking</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${paymentMethod === "wallet" ? "active" : ""}`}
              onClick={() => setPaymentMethod("wallet")}
            >
              <span className="material-symbols-outlined">payments</span>
              <span>Wallets</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${paymentMethod === "pay_at_hotel" ? "active" : ""}`}
              onClick={() => setPaymentMethod("pay_at_hotel")}
            >
              <span className="material-symbols-outlined">hotel</span>
              <span>Pay at Property</span>
            </button>
          </div>

          {/* TAB 1: CREDIT / DEBIT CARD */}
          {paymentMethod === "card" && (
            <div className="tab-content card-tab">
              {/* Virtual Card Preview */}
              <div className="virtual-card">
                <div className="vcard-top">
                  <span className="chip-icon"></span>
                  <span className="vcard-brand">{getCardBrand()}</span>
                </div>
                <div className="vcard-number">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
                <div className="vcard-bottom">
                  <div>
                    <span className="vcard-label">CARD HOLDER</span>
                    <p className="vcard-val">{cardholderName || "YOUR NAME"}</p>
                  </div>
                  <div>
                    <span className="vcard-label">EXPIRES</span>
                    <p className="vcard-val">{cardExpiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>

              {/* Card Form Inputs */}
              <div className="card-inputs-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">credit_card</span>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                    />
                    <div className="card-brand-tag">{getCardBrand()}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Cardholder Name</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">person</span>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Valid Thru (MM/YY)</label>
                    <div className="input-with-icon">
                      <span className="material-symbols-outlined">calendar_today</span>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      CVV / CVC
                      <span className="cvv-tooltip" title="3 digits on back of card">
                        ⓘ
                      </span>
                    </label>
                    <div className="input-with-icon">
                      <span className="material-symbols-outlined">lock</span>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <label className="save-card-checkbox">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  <span>Save this card securely per RBI tokenization guidelines</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: UPI */}
          {paymentMethod === "upi" && (
            <div className="tab-content upi-tab">
              <div className="upi-sub-nav">
                <button
                  type="button"
                  className={upiMode === "app" ? "active" : ""}
                  onClick={() => setUpiMode("app")}
                >
                  Popular UPI Apps
                </button>
                <button
                  type="button"
                  className={upiMode === "id" ? "active" : ""}
                  onClick={() => setUpiMode("id")}
                >
                  Enter UPI ID
                </button>
                <button
                  type="button"
                  className={upiMode === "qr" ? "active" : ""}
                  onClick={() => setUpiMode("qr")}
                >
                  Scan QR Code
                </button>
              </div>

              {upiMode === "app" && (
                <div className="upi-apps-grid">
                  {UPI_APPS.map((app) => (
                    <div
                      key={app.id}
                      className={`upi-app-card ${selectedUpiApp === app.id ? "selected" : ""}`}
                      onClick={() => setSelectedUpiApp(app.id)}
                    >
                      <div className="upi-app-badge" style={{ backgroundColor: app.color }}>
                        {app.name.charAt(0)}
                      </div>
                      <div className="upi-app-info">
                        <h4>{app.name}</h4>
                        <span>Instant verification</span>
                      </div>
                      <input
                        type="radio"
                        name="upiApp"
                        checked={selectedUpiApp === app.id}
                        onChange={() => setSelectedUpiApp(app.id)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {upiMode === "id" && (
                <div className="upi-id-box">
                  <label>Virtual Payment Address (VPA / UPI ID)</label>
                  <div className="upi-input-group">
                    <input
                      type="text"
                      placeholder="username@bank"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        setUpiVerified(false);
                      }}
                    />
                    <button
                      type="button"
                      className="verify-upi-btn"
                      onClick={() => {
                        if (upiId.includes("@")) {
                          setUpiVerified(true);
                          toast.success("UPI ID verified successfully!");
                        } else {
                          toast.error("Please enter a valid UPI ID (e.g. name@okaxis)");
                        }
                      }}
                    >
                      {upiVerified ? "✓ Verified" : "Verify"}
                    </button>
                  </div>
                  <div className="upi-handles-hint">
                    Popular handles: @okhdfcbank, @okaxis, @ybl, @paytm
                  </div>
                </div>
              )}

              {upiMode === "qr" && (
                <div className="tab-content qr-tab-inner">
                  {renderQrCard()}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEDICATED SCAN & PAY QR CODE */}
          {paymentMethod === "qr" && (
            <div className="tab-content qr-tab">
              {renderQrCard()}
            </div>
          )}

          {/* TAB 3: NET BANKING */}
          {paymentMethod === "netbanking" && (
            <div className="tab-content netbanking-tab">
              <label className="section-label">Popular Indian Banks</label>
              <div className="banks-grid">
                {POPULAR_BANKS.map((bank) => (
                  <div
                    key={bank.id}
                    className={`bank-card ${selectedBank === bank.id ? "selected" : ""}`}
                    onClick={() => setSelectedBank(bank.id)}
                  >
                    <span className="material-symbols-outlined">{bank.icon}</span>
                    <span>{bank.name}</span>
                    <input
                      type="radio"
                      name="selectedBank"
                      checked={selectedBank === bank.id}
                      onChange={() => setSelectedBank(bank.id)}
                    />
                  </div>
                ))}
              </div>

              <div className="all-banks-dropdown">
                <label>Or select from All Other Banks</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="" disabled>
                    Choose another bank
                  </option>
                  {ALL_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: WALLETS */}
          {paymentMethod === "wallet" && (
            <div className="tab-content wallet-tab">
              <div className="wallets-list">
                {WALLETS.map((w) => (
                  <div
                    key={w.id}
                    className={`wallet-row ${selectedWallet === w.id ? "selected" : ""}`}
                    onClick={() => setSelectedWallet(w.id)}
                  >
                    <span className="material-symbols-outlined wallet-icon">{w.icon}</span>
                    <div className="wallet-details">
                      <h4>{w.name}</h4>
                      <p>{w.desc}</p>
                    </div>
                    <input
                      type="radio"
                      name="selectedWallet"
                      checked={selectedWallet === w.id}
                      onChange={() => setSelectedWallet(w.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAY AT HOTEL */}
          {paymentMethod === "pay_at_hotel" && (
            <div className="tab-content pay-hotel-tab">
              <div className="hotel-pay-notice">
                <span className="material-symbols-outlined notice-icon">hotel</span>
                <div>
                  <h4>Zero Advance Payment Needed</h4>
                  <p>
                    Book your stay right now and pay ₹{finalPrice.toLocaleString("en-IN")} directly in cash, UPI, or card when you check in at <strong>{propertyName}</strong>.
                  </p>
                </div>
              </div>
              <ul className="hotel-pay-points">
                <li>✓ Free cancellation up to 24 hours prior to check-in</li>
                <li>✓ Government ID required at physical check-in</li>
                <li>✓ Instant confirmed booking voucher delivered to your account</li>
              </ul>
            </div>
          )}

          {/* Bottom Trust Icons */}
          <div className="payment-trust-bar">
            <span>🛡️ PCI-DSS Level 1 Compliant</span>
            <span>🔒 256-Bit SSL</span>
            <span>🇮🇳 RBI Approved Gateway</span>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKING & PRICE SUMMARY */}
        <div className="payment-summary-card">
          <div className="summary-card-header">
            <h3>Booking Summary</h3>
            <span className="badge-confirmed">Ready to Confirm</span>
          </div>

          <div className="summary-property-info">
            <h4>{propertyName}</h4>
            <p className="property-addr">
              {address?.city ? `${address.city}, ${address.state || ""}` : "Prime Location"}
            </p>
          </div>

          <div className="summary-stay-grid">
            <div className="stay-item">
              <span className="material-symbols-outlined">calendar_today</span>
              <div>
                <small>CHECK-IN</small>
                <p>{checkinDate || "Not set"}</p>
              </div>
            </div>
            <div className="stay-item">
              <span className="material-symbols-outlined">event</span>
              <div>
                <small>CHECK-OUT</small>
                <p>{checkoutDate || "Not set"}</p>
              </div>
            </div>
            <div className="stay-item">
              <span className="material-symbols-outlined">group</span>
              <div>
                <small>GUESTS</small>
                <p>{guests} Guest(s)</p>
              </div>
            </div>
            <div className="stay-item">
              <span className="material-symbols-outlined">nights_stay</span>
              <div>
                <small>DURATION</small>
                <p>{nights} Night(s)</p>
              </div>
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="promo-section">
            <div className="promo-input-box">
              <input
                type="text"
                placeholder="Enter Promo (e.g. HOMELY10)"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
              />
              <button type="button" onClick={handleApplyPromo}>
                Apply
              </button>
            </div>
            {appliedPromo && (
              <div className="applied-tag">
                <span>✓ {appliedPromo.code} Applied (10% OFF)</span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoCodeInput("");
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Detailed Price Breakdown */}
          <div className="price-breakdown-list">
            <div className="price-line">
              <span>Base Accommodation ({nights} nights)</span>
              <span>₹{basePrice.toLocaleString("en-IN")}</span>
            </div>

            {appliedPromo && (
              <div className="price-line discount-line">
                <span>Promo Discount ({appliedPromo.code})</span>
                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="price-line">
              <span>GST & Service Taxes (12%)</span>
              <span>₹{taxesAndFees.toLocaleString("en-IN")}</span>
            </div>

            <div className="price-divider"></div>

            <div className="price-line grand-total">
              <span>Total Payable</span>
              <span className="amount">₹{finalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            className="real-pay-button"
            onClick={handleInitiatePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing Order...
              </>
            ) : paymentMethod === "qr" || (paymentMethod === "upi" && upiMode === "qr") ? (
              <>
                <span className="material-symbols-outlined">qr_code_scanner</span>
                Verify QR Payment (₹{finalPrice.toLocaleString("en-IN")})
              </>
            ) : paymentMethod === "pay_at_hotel" ? (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                Confirm Booking (Pay ₹{finalPrice.toLocaleString("en-IN")} at Hotel)
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">lock</span>
                Pay ₹{finalPrice.toLocaleString("en-IN")} Securely
              </>
            )}
          </button>

          <p className="terms-notice">
            By confirming, you agree to HomelyHub’s Guest Terms, Cancellation Policy, and Privacy Standards.
          </p>
        </div>
      </div>

      {/* BANK 3D SECURE / OTP SIMULATION MODAL */}
      {showOtpModal && (
        <div className="bank-gateway-overlay">
          <div className="bank-gateway-modal">
            {!paymentSuccess ? (
              <>
                <div className="bank-modal-header">
                  <div className="bank-badge">
                    <span className="material-symbols-outlined">account_balance</span>
                    <div>
                      <h3>{selectedBank || "Reserve Bank Verified Gateway"}</h3>
                      <small>3D Secure™ Payment Authentication</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="close-gateway"
                    onClick={() => setShowOtpModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="bank-modal-body">
                  <div className="txn-summary-row">
                    <div>
                      <small>Merchant</small>
                      <p>HomelyHub Stays Pvt Ltd</p>
                    </div>
                    <div className="text-right">
                      <small>Amount</small>
                      <p className="txn-amount">₹{finalPrice.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="otp-card">
                    <p className="otp-instructions">
                      A One-Time Password (OTP) has been sent to your registered mobile number ending in <strong>•••• ••210</strong>.
                    </p>

                    <div className="otp-input-wrap">
                      <label>Enter 6-Digit OTP</label>
                      <input
                        type="text"
                        className="otp-field"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        placeholder="123456"
                      />
                      <small className="otp-hint">
                        💡 Test OTP: <strong>123456</strong> (or enter your own)
                      </small>
                    </div>

                    <div className="otp-timer-row">
                      {otpCountdown > 0 ? (
                        <span>Resend OTP in {otpCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          className="resend-btn"
                          onClick={() => {
                            setOtpCountdown(30);
                            toast.success("New OTP sent to your registered phone.");
                          }}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bank-actions">
                    <button
                      type="button"
                      className="bank-cancel-btn"
                      onClick={() => {
                        setShowOtpModal(false);
                        toast.error("Payment authorization cancelled.");
                      }}
                      disabled={isProcessingOtp}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="bank-submit-btn"
                      onClick={handleVerifyOtp}
                      disabled={isProcessingOtp}
                    >
                      {isProcessingOtp ? (
                        <>
                          <span className="spinner"></span>
                          Authorizing with Bank...
                        </>
                      ) : (
                        `Confirm & Pay ₹${finalPrice.toLocaleString("en-IN")}`
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* SUCCESS CELEBRATION STATE */
              <div className="payment-success-screen">
                <div className="success-anim-circle">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <h2>Payment Successful!</h2>
                <p>Your booking with HomelyHub has been confirmed.</p>

                <div className="success-receipt-box">
                  <div className="receipt-row">
                    <span>Transaction ID</span>
                    <strong>{completedTxnId}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Amount Paid</span>
                    <strong>₹{finalPrice.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Payment Method</span>
                    <strong style={{ textTransform: "uppercase" }}>
                      {paymentMethod === "qr" || paymentMethod === "upi_qr"
                        ? "UPI QR CODE"
                        : paymentMethod === "pay_at_hotel"
                        ? "PAY AT PROPERTY"
                        : paymentMethod}
                    </strong>
                  </div>
                  <div className="receipt-row">
                    <span>Property</span>
                    <strong>{propertyName}</strong>
                  </div>
                </div>

                <div className="redirecting-pill">
                  <span className="spinner"></span>
                  <span>Redirecting to your bookings...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
