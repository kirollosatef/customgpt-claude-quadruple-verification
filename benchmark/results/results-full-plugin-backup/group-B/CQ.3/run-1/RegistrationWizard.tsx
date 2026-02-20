import React, { useState, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Payment {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

type FieldErrors = Record<string, string>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,15}$/;
const ZIP_RE = /^[\dA-Z\s\-]{3,10}$/i;
const CARD_RE = /^\d{13,19}$/;
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVV_RE = /^\d{3,4}$/;

function validatePersonalInfo(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!data.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_RE.test(data.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  return errors;
}

function validateAddressInfo(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.street.trim()) {
    errors.street = "Street address is required.";
  }
  if (!data.city.trim()) {
    errors.city = "City is required.";
  }
  if (!data.state.trim()) {
    errors.state = "State or province is required.";
  }
  if (!data.zip.trim()) {
    errors.zip = "ZIP or postal code is required.";
  } else if (!ZIP_RE.test(data.zip)) {
    errors.zip = "Enter a valid ZIP or postal code.";
  }
  if (!data.country.trim()) {
    errors.country = "Country is required.";
  }
  return errors;
}

function validatePaymentInfo(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const digitsOnly = data.cardNumber.replace(/\s/g, "");
  if (!digitsOnly) {
    errors.cardNumber = "Card number is required.";
  } else if (!CARD_RE.test(digitsOnly)) {
    errors.cardNumber = "Enter a valid card number (13\u201319 digits).";
  }
  if (!data.cardHolder.trim()) {
    errors.cardHolder = "Cardholder name is required.";
  }
  if (!data.expiry.trim()) {
    errors.expiry = "Expiry date is required.";
  } else if (!EXPIRY_RE.test(data.expiry)) {
    errors.expiry = "Use MM/YY format for the expiry date.";
  }
  if (!data.cvv.trim()) {
    errors.cvv = "CVV is required.";
  } else if (!CVV_RE.test(data.cvv)) {
    errors.cvv = "CVV must be 3 or 4 digits.";
  }
  return errors;
}

function validateStep(step: number, data: FormData): FieldErrors {
  switch (step) {
    case 0:
      return validatePersonalInfo(data);
    case 1:
      return validateAddressInfo(data);
    case 2:
      return validatePaymentInfo(data);
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_KEY = "registration_wizard_state";
const STEP_TITLES = ["Personal Info", "Address", "Payment", "Review"];
const TOTAL_STEPS = STEP_TITLES.length;

const INITIAL_DATA: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  cardNumber: "",
  cardHolder: "",
  expiry: "",
  cvv: "",
};

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

function loadFromSession(): { step: number; data: FormData } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      typeof parsed.step === "number" &&
      typeof parsed.data === "object"
    ) {
      return parsed as { step: number; data: FormData };
    }
    return null;
  } catch {
    return null;
  }
}

function persistToSession(step: number, data: FormData): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, data }));
  } catch {
    // Session storage may be full or unavailable; gracefully continue.
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Gracefully ignore.
  }
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const color = {
  primary: "#1976d2",
  success: "#2e7d32",
  error: "#e53935",
  grayLight: "#e0e0e0",
  grayMedium: "#999",
  grayDark: "#666",
  textPrimary: "#1a1a1a",
  white: "#fff",
};

const layout: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: 600,
    margin: "2rem auto",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: color.textPrimary,
  },
  stepperRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  stepCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "2rem",
    background: color.white,
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  },
  fieldWrap: {
    marginBottom: "1.1rem",
  },
  labelStyle: {
    display: "block",
    marginBottom: 4,
    fontWeight: 500,
    fontSize: 14,
  },
  inputBase: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color .2s",
  },
  errorMsg: {
    color: color.error,
    fontSize: 12,
    marginTop: 3,
  },
  flexRow: {
    display: "flex",
    gap: "1rem",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1.5rem",
  },
  btnBase: {
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    transition: "background .2s, opacity .2s",
  },
  reviewBlock: {
    marginBottom: "1.2rem",
  },
  reviewTitle: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 6,
  },
  reviewLine: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 14,
    borderBottom: "1px solid #f0f0f0",
  },
  confirmationWrap: {
    textAlign: "center",
    padding: "3rem 1rem",
  },
};

// ---------------------------------------------------------------------------
// Reusable field component
// ---------------------------------------------------------------------------

interface TextFieldProps {
  label: string;
  fieldName: string;
  value: string;
  error: string | undefined;
  onFieldChange: (name: string, val: string) => void;
  inputType?: string;
  maxLen?: number;
}

function TextField({
  label,
  fieldName,
  value,
  error,
  onFieldChange,
  inputType = "text",
  maxLen,
}: TextFieldProps) {
  const inputStyle: React.CSSProperties = {
    ...layout.inputBase,
    ...(error ? { borderColor: color.error } : {}),
  };

  return (
    <div style={layout.fieldWrap}>
      <label style={layout.labelStyle} htmlFor={fieldName}>
        {label}
      </label>
      <input
        id={fieldName}
        name={fieldName}
        type={inputType}
        value={value}
        maxLength={maxLen}
        onChange={(e) => onFieldChange(fieldName, e.target.value)}
        style={inputStyle}
      />
      {error && <div style={layout.errorMsg}>{error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Personal Info
// ---------------------------------------------------------------------------

interface StepContentProps {
  data: FormData;
  errors: FieldErrors;
  onFieldChange: (name: string, val: string) => void;
}

function PersonalInfoStep({ data, errors, onFieldChange }: StepContentProps) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1.2rem" }}>Personal Information</h2>
      <div style={layout.flexRow}>
        <div style={{ flex: 1 }}>
          <TextField
            label="First Name"
            fieldName="firstName"
            value={data.firstName}
            error={errors.firstName}
            onFieldChange={onFieldChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextField
            label="Last Name"
            fieldName="lastName"
            value={data.lastName}
            error={errors.lastName}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
      <TextField
        label="Email Address"
        fieldName="email"
        inputType="email"
        value={data.email}
        error={errors.email}
        onFieldChange={onFieldChange}
      />
      <TextField
        label="Phone Number"
        fieldName="phone"
        inputType="tel"
        value={data.phone}
        error={errors.phone}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Address
// ---------------------------------------------------------------------------

function AddressStep({ data, errors, onFieldChange }: StepContentProps) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1.2rem" }}>Address</h2>
      <TextField
        label="Street Address"
        fieldName="street"
        value={data.street}
        error={errors.street}
        onFieldChange={onFieldChange}
      />
      <div style={layout.flexRow}>
        <div style={{ flex: 2 }}>
          <TextField
            label="City"
            fieldName="city"
            value={data.city}
            error={errors.city}
            onFieldChange={onFieldChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextField
            label="State / Province"
            fieldName="state"
            value={data.state}
            error={errors.state}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
      <div style={layout.flexRow}>
        <div style={{ flex: 1 }}>
          <TextField
            label="ZIP / Postal Code"
            fieldName="zip"
            value={data.zip}
            error={errors.zip}
            onFieldChange={onFieldChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextField
            label="Country"
            fieldName="country"
            value={data.country}
            error={errors.country}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Payment
// ---------------------------------------------------------------------------

function PaymentStep({ data, errors, onFieldChange }: StepContentProps) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1.2rem" }}>Payment Details</h2>
      <TextField
        label="Card Number"
        fieldName="cardNumber"
        value={data.cardNumber}
        error={errors.cardNumber}
        onFieldChange={onFieldChange}
        maxLen={19}
      />
      <TextField
        label="Cardholder Name"
        fieldName="cardHolder"
        value={data.cardHolder}
        error={errors.cardHolder}
        onFieldChange={onFieldChange}
      />
      <div style={layout.flexRow}>
        <div style={{ flex: 1 }}>
          <TextField
            label="Expiry Date (MM/YY)"
            fieldName="expiry"
            value={data.expiry}
            error={errors.expiry}
            onFieldChange={onFieldChange}
            maxLen={5}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextField
            label="CVV"
            fieldName="cvv"
            inputType="password"
            value={data.cvv}
            error={errors.cvv}
            onFieldChange={onFieldChange}
            maxLen={4}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Review
// ---------------------------------------------------------------------------

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={layout.reviewLine}>
      <span style={{ color: color.grayDark }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ReviewStep({ data }: { data: FormData }) {
  const maskedCard =
    "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 " +
    data.cardNumber.replace(/\s/g, "").slice(-4);

  return (
    <div>
      <h2 style={{ margin: "0 0 1.2rem" }}>Review Your Information</h2>

      <div style={layout.reviewBlock}>
        <div style={layout.reviewTitle}>Personal Info</div>
        <ReviewItem
          label="Full Name"
          value={data.firstName + " " + data.lastName}
        />
        <ReviewItem label="Email" value={data.email} />
        <ReviewItem label="Phone" value={data.phone} />
      </div>

      <div style={layout.reviewBlock}>
        <div style={layout.reviewTitle}>Address</div>
        <ReviewItem label="Street" value={data.street} />
        <ReviewItem label="City" value={data.city} />
        <ReviewItem label="State / Province" value={data.state} />
        <ReviewItem label="ZIP / Postal Code" value={data.zip} />
        <ReviewItem label="Country" value={data.country} />
      </div>

      <div style={layout.reviewBlock}>
        <div style={layout.reviewTitle}>Payment</div>
        <ReviewItem label="Card Number" value={maskedCard} />
        <ReviewItem label="Cardholder" value={data.cardHolder} />
        <ReviewItem label="Expiry" value={data.expiry} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stepper indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div style={layout.stepperRow}>
      {STEP_TITLES.map((title, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const dotBg =
          isCompleted || isActive ? color.primary : color.grayLight;
        const dotFg = isCompleted || isActive ? color.white : color.grayMedium;

        return (
          <div key={title} style={layout.stepCol}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
                background: dotBg,
                color: dotFg,
                transition: "background .25s, color .25s",
              }}
            >
              {isCompleted ? "\u2713" : index + 1}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                textAlign: "center",
                color: isActive ? color.primary : "#888",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Restore persisted form state on initial mount
  useEffect(() => {
    const saved = loadFromSession();
    if (saved) {
      setCurrentStep(saved.step);
      setFormData(saved.data);
    }
  }, []);

  // Persist every time the step or data changes
  useEffect(() => {
    if (!isSubmitted) {
      persistToSession(currentStep, formData);
    }
  }, [currentStep, formData, isSubmitted]);

  const handleFieldChange = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    },
    [],
  );

  function goToNextStep(): void {
    const validationErrors = validateStep(currentStep, formData);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }

  function goToPreviousStep(): void {
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  function handleFormSubmit(): void {
    console.log("Registration submitted with data:", formData);
    clearSession();
    setIsSubmitted(true);
  }

  function handleStartOver(): void {
    setFormData(INITIAL_DATA);
    setCurrentStep(0);
    setFieldErrors({});
    setIsSubmitted(false);
  }

  // ------ Confirmation screen after successful submission ------
  if (isSubmitted) {
    return (
      <div style={layout.wrapper}>
        <div style={{ ...layout.card, ...layout.confirmationWrap }}>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Registration Complete
          </div>
          <p style={{ color: "#555", fontSize: 15 }}>
            Thank you, {formData.firstName}! Your registration has been
            submitted successfully.
          </p>
          <button
            type="button"
            style={{
              ...layout.btnBase,
              background: color.primary,
              color: color.white,
              marginTop: 16,
            }}
            onClick={handleStartOver}
          >
            Start New Registration
          </button>
        </div>
      </div>
    );
  }

  // ------ Active wizard ------
  const stepContentProps: StepContentProps = {
    data: formData,
    errors: fieldErrors,
    onFieldChange: handleFieldChange,
  };

  return (
    <div style={layout.wrapper}>
      <StepIndicator currentStep={currentStep} />

      <div style={layout.card}>
        {currentStep === 0 && <PersonalInfoStep {...stepContentProps} />}
        {currentStep === 1 && <AddressStep {...stepContentProps} />}
        {currentStep === 2 && <PaymentStep {...stepContentProps} />}
        {currentStep === 3 && <ReviewStep data={formData} />}

        <div style={layout.navBar}>
          {currentStep > 0 ? (
            <button
              type="button"
              style={{
                ...layout.btnBase,
                background: color.grayLight,
                color: "#333",
              }}
              onClick={goToPreviousStep}
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {currentStep < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              style={{
                ...layout.btnBase,
                background: color.primary,
                color: color.white,
              }}
              onClick={goToNextStep}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              style={{
                ...layout.btnBase,
                background: color.success,
                color: color.white,
              }}
              onClick={handleFormSubmit}
            >
              Submit Registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
