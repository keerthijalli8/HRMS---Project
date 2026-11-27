import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Building2 } from "lucide-react";
import "./SubscriptionRequest.css";
import { readLicenseRecords, validateLicenseKey } from "../../utils/licenseKeys";
import { PLAN_PRICING } from "../../utils/planPricing";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function SubscriptionRequest() {
  const [searchParams] = useSearchParams();

  const requestedPlan = searchParams.get("plan");
  const initialPlan = PLAN_PRICING[requestedPlan]
    ? requestedPlan
    : "Starter";

  const [form, setForm] = useState({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    employees: "",
    plan: initialPlan,
    billing: "Annual",
  });

  const [submitted, setSubmitted] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [validatedLicense, setValidatedLicense] = useState(null);
  const [licenseError, setLicenseError] = useState("");

  const rate =
    PLAN_PRICING[form.plan][
      form.billing === "Annual" ? "annual" : "monthly"
    ];

  const employeeCount = Math.max(0, Number(form.employees) || 0);
  const selectedPrice = rate * employeeCount;

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validatedLicense) return;

    const request = {
      ...form,
      company: validatedLicense.license.company,
      licenseTenantId: validatedLicense.license.tenantId,
      employees: employeeCount,
      perEmployeeRate: rate,
      amount: selectedPrice,
      requestId: `REQ-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "Pending",
    };

    const existingRequests = JSON.parse(
      localStorage.getItem("subscriptionRequests") || "[]"
    );

    localStorage.setItem(
      "subscriptionRequests",
      JSON.stringify([...existingRequests, request])
    );

    setSubmitted(true);
  };

  const validateAccess = (event) => {
    event.preventDefault();
    const result = validateLicenseKey(licenseInput, readLicenseRecords());

    if (!result.valid) {
      setValidatedLicense(null);
      setLicenseError(result.message);
      return;
    }

    setValidatedLicense(result);
    setForm((previous) => ({
      ...previous,
      company: result.license.company,
    }));
    setLicenseError("");
  };

  if (!validatedLicense && !submitted) {
    return (
      <main className="subscription-request-page">
        <section className="subscription-request-card license-gate-card">
          <button
            type="button"
            className="request-back-btn"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="request-heading">
            <div className="request-icon">
              <Building2 size={25} />
            </div>
            <span>COMPANY REGISTRATION</span>
            <h1>Enter your company license</h1>
            <p>A valid company license is required to continue registration.</p>
          </div>

          <form onSubmit={validateAccess}>
            <label className="license-key-field">
              Company license key
              <input
                autoComplete="off"
                value={licenseInput}
                onChange={(event) => {
                  setLicenseInput(event.target.value);
                  setLicenseError("");
                }}
                placeholder="HRMS-XXXX-XXXX-XXXX"
                required
              />
            </label>

            {licenseError && (
              <p className="license-key-error" role="alert">{licenseError}</p>
            )}

            <button type="submit" className="request-submit-btn">
              Validate license
            </button>
          </form>

          <p className="request-disclaimer">
            This demo validates licenses in browser storage only. Production
            access must be validated by a secure backend.
          </p>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="subscription-request-page">
        <section className="subscription-request-card success-card">
          <CheckCircle2 size={58} />

          <h1>Request Submitted!</h1>

          <p>
            Your subscription request for the {form.plan} plan
            has been recorded.
          </p>

          <div className="request-summary">
            <span>Company</span>
            <strong>{form.company}</strong>

            <span>Selected Plan</span>
            <strong>{form.plan}</strong>

            <span>Number of Employees</span>
            <strong>{employeeCount.toLocaleString("en-IN")}</strong>

            <span>Per Employee Rate</span>
            <strong>{formatCurrency(rate)}</strong>

            <span>Billing Cycle</span>
            <strong>{form.billing}</strong>

            <span>Subscription Amount</span>
            <strong>{formatCurrency(selectedPrice)}</strong>
          </div>

          <p className="request-note">
            Your request is pending review. The administrator
            will need to review and approve it.
          </p>

          <button
            type="button"
            className="request-submit-btn"
            onClick={() => window.close()}
          >
            Close Tab
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="subscription-request-page">
      <div className="subscription-request-card">
        <button
          type="button"
          className="request-back-btn"
          onClick={() => window.close()}
        >
          <ArrowLeft size={16} />
          Close Registration
        </button>

        <div className="request-heading">
          <div className="request-icon">
            <Building2 size={25} />
          </div>

          <span>HRMS SUBSCRIPTION REGISTRATION</span>

          <h1>Get Started With HRMS</h1>

          <p>
            Enter your organization details to request a subscription.
          </p>
        </div>

        <div className="license-validated-message" role="status">
          <CheckCircle2 size={16} />
          License validated for <strong>{validatedLicense.license.company}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="request-selected-plan">
            <div>
              <span>Selected Subscription Plan</span>
              <strong>{form.plan}</strong>
              <small>
                {formatCurrency(rate)} per employee /{" "}
                {form.billing.toLowerCase()}
              </small>
            </div>

            <strong>
              {formatCurrency(selectedPrice)}
              <small> / {form.billing.toLowerCase()}</small>
            </strong>
          </div>

          <div className="request-form-grid">
            <label>
              Company / Organization Name *
              <input
                name="company"
                value={form.company}
                onChange={updateField}
                placeholder="Enter company name"
                readOnly
                required
              />
            </label>

            <label>
              Contact Person Name *
              <input
                name="contactPerson"
                value={form.contactPerson}
                onChange={updateField}
                placeholder="Enter contact person"
                required
              />
            </label>

            <label>
              Business Email *
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="name@company.com"
                required
              />
            </label>

            <label>
              Mobile Number *
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="Enter mobile number"
                pattern="[0-9+() -]{10,15}"
                required
              />
            </label>

            <label className="request-full-width">
              Company Address *
              <textarea
                name="address"
                value={form.address}
                onChange={updateField}
                placeholder="Enter company address"
                rows="3"
                required
              />
            </label>

            <label>
              Number of Employees *
              <input
                type="number"
                name="employees"
                value={form.employees}
                onChange={updateField}
                min="1"
                step="1"
                placeholder="Enter actual employee count"
                required
              />
            </label>

            <label>
              Subscription Plan *
              <select
                name="plan"
                value={form.plan}
                onChange={updateField}
              >
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </label>

            <label className="request-full-width">
              Billing Cycle *
              <select
                name="billing"
                value={form.billing}
                onChange={updateField}
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </label>
          </div>

          <div className="request-total">
            <span>
              Subscription Amount
              <small className="request-calculation">
                {employeeCount > 0
                  ? `${employeeCount.toLocaleString("en-IN")} employees × ${formatCurrency(rate)} per employee`
                  : "Enter employee count to calculate"}
              </small>
            </span>

            <strong>{formatCurrency(selectedPrice)}</strong>
          </div>

          <button
            type="submit"
            className="request-submit-btn"
            disabled={employeeCount < 1}
          >
            Submit Subscription Request
          </button>

          <p className="request-disclaimer">
            Submitting this form records a request. It does not
            activate a paid subscription or process a payment.
          </p>
        </form>
      </div>
    </main>
  );
}