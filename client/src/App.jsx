import { useEffect, useMemo, useState } from 'react';
import $ from 'jquery';
import { Modal } from 'bootstrap';

const MEMBERS_API = 'http://localhost:5000/api/memberships';

const plans = [
  { id: 'free', title: 'Free', price: '$0', period: '/month', validityDays: 30, description: 'Perfect for very small teams getting started.', features: ['Up to 5 employees', 'Basic attendance logs', 'Community support'], cta: 'Get Started' },
  { id: 'silver', title: 'Silver', price: '$29', period: '/month', validityDays: 30, description: 'Built for growing teams that need automation.', features: ['Up to 100 employees', 'Payroll exports', 'Shift scheduling', 'Priority support'], cta: 'Choose Silver', popular: true },
  { id: 'gold', title: 'Gold', price: '$79', period: '/month', validityDays: 365, description: 'Advanced controls and insights for larger organizations.', features: ['Unlimited employees', 'Smart analytics dashboard', 'Multi-branch management', '24/7 premium support'], cta: 'Choose Gold' },
];

const defaultForm = { fullName: '', email: '', company: '', phone: '', paymentMethod: 'Credit Card', cardName: '', cardNumber: '', expiryDate: '', cvv: '' };

export default function App() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [membership, setMembership] = useState(null);
  const [memberList, setMemberList] = useState([]);

  const plan = useMemo(() => plans.find((p) => p.id === selectedPlan) || null, [selectedPlan]);
  const requiresPayment = selectedPlan && selectedPlan !== 'free';

  const loadMembers = async () => {
    const response = await fetch(MEMBERS_API);
    const users = await response.json();
    setMemberList(users);

    if (users.length > 0) {
      const lastActive = users[0];
      setMembership(lastActive);
      setFormData((prev) => ({ ...prev, ...lastActive }));
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openProfileModal = () => new Modal(document.getElementById('profileModal')).show();
  const openAdminModal = () => new Modal(document.getElementById('adminModal')).show();
  const handleChange = (event) => setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const saveMemberToDb = async (record) => {
    const response = await fetch(MEMBERS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });

    const savedUser = await response.json();
    setMembership(savedUser);
    await loadMembers();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPlan || !plan) return;

    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt);
    expiresAt.setDate(expiresAt.getDate() + plan.validityDays);

    const record = {
      ...formData,
      plan: selectedPlan,
      status: 'active',
      activatedAt: activatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentMethod: requiresPayment ? formData.paymentMethod : 'No Payment Required',
    };

    await saveMemberToDb(record);

    $('.success-toast').stop(true, true).text(`🎉 ${plan.title} membership activated and saved to local query file for ${formData.email}.`).fadeIn(250).delay(2200).fadeOut(350);
  };

  return (
    <div className="app-shell">
      <div className="top-glow" />
      <div className="container py-4 py-md-5 position-relative">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p className="eyebrow mb-2">Employee Management System</p>
            <h1 className="hero-title mb-1">Choose Your Membership</h1>
            <p className="text-muted mb-0">Modern plans designed for every company stage.</p>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="profile-icon-btn" onClick={openAdminModal} title="Admin members list">
              <i className="bi bi-shield-lock fs-4" />
            </button>
            <button type="button" className="profile-icon-btn" onClick={openProfileModal} disabled={!membership && memberList.length === 0} title={membership || memberList.length > 0 ? 'Edit your membership details' : 'Activate a membership first'}>
              <i className="bi bi-person-circle fs-3" />
            </button>
          </div>
        </div>

        <div className="alert alert-success success-toast" role="alert" style={{ display: 'none' }} />

        {!selectedPlan ? (
          <div className="row g-4">
            {plans.map((item) => (
              <div className="col-12 col-md-6 col-xl-4" key={item.id}>
                <div className={`plan-card h-100 ${item.popular ? 'popular' : ''}`}>
                  {item.popular && <span className="badge rounded-pill popular-badge">Most Popular</span>}
                  <h3>{item.title}</h3>
                  <div className="d-flex align-items-end gap-1 mb-3"><span className="price-value">{item.price}</span><span className="price-period">{item.period}</span></div>
                  <p className="text-muted mb-3">{item.description}</p>
                  <ul className="feature-list list-unstyled mb-4">{item.features.map((f) => <li key={f}><i className="bi bi-check-circle-fill me-2" />{f}</li>)}</ul>
                  <button className="btn w-100 plan-btn" type="button" onClick={() => setSelectedPlan(item.id)}>{item.cta}</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="form-page-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">{plan?.title} Membership Form</h4>
              <button type="button" className="btn btn-light" onClick={() => setSelectedPlan(null)}><i className="bi bi-arrow-left me-2" />Back to plans</button>
            </div>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6"><label className="form-label">Full Name</label><input required className="form-control" name="fullName" value={formData.fullName} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Email</label><input required type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Company</label><input required className="form-control" name="company" value={formData.company} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Phone</label><input required className="form-control" name="phone" value={formData.phone} onChange={handleChange} /></div>

              {requiresPayment ? (
                <>
                  <div className="col-12"><hr /></div>
                  <div className="col-12"><h6 className="mb-1">Payment Details</h6><p className="text-muted small mb-0">Complete payment to activate your {plan?.title} membership.</p></div>
                  <div className="col-md-6"><label className="form-label">Payment Method</label><select className="form-select" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}><option>Credit Card</option><option>Debit Card</option><option>PayPal</option><option>Bank Transfer</option></select></div>
                  <div className="col-md-6"><label className="form-label">Name on Card</label><input required className="form-control" name="cardName" value={formData.cardName} onChange={handleChange} /></div>
                  <div className="col-md-6"><label className="form-label">Card Number</label><input required className="form-control" name="cardNumber" value={formData.cardNumber} onChange={handleChange} /></div>
                  <div className="col-md-3"><label className="form-label">Expiry</label><input required className="form-control" placeholder="MM/YY" name="expiryDate" value={formData.expiryDate} onChange={handleChange} /></div>
                  <div className="col-md-3"><label className="form-label">CVV</label><input required className="form-control" name="cvv" value={formData.cvv} onChange={handleChange} /></div>
                </>
              ) : (
                <div className="col-12"><div className="free-pill"><i className="bi bi-stars me-2" />Free plan selected — no payment is required.</div></div>
              )}

              <div className="col-12 d-flex justify-content-end"><button type="submit" className="btn plan-btn px-4">Activate Membership</button></div>
            </form>
          </div>
        )}
      </div>

      <div className="modal fade" id="profileModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header"><h5 className="modal-title">Edit Profile Details</h5><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" /></div>
            <div className="modal-body">
              {!membership ? <p className="text-muted mb-0">No active membership yet.</p> : <div className="row g-3">
                <p className="text-muted">Current plan: <strong className="text-dark text-capitalize">{membership.plan}</strong></p>
                <div className="col-md-6"><label className="form-label">Full Name</label><input className="form-control" name="fullName" value={formData.fullName} onChange={handleChange} /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} /></div>
                <div className="col-md-6"><label className="form-label">Company</label><input className="form-control" name="company" value={formData.company} onChange={handleChange} /></div>
                <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" name="phone" value={formData.phone} onChange={handleChange} /></div>
              </div>}
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-light" data-bs-dismiss="modal">Close</button></div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="adminModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header"><h5 className="modal-title">Admin Panel — Activated Members</h5><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" /></div>
            <div className="modal-body">
              {memberList.length === 0 ? <p className="text-muted mb-0">No members activated yet.</p> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Phone</th><th>Plan</th><th>Activated Date</th><th>Expiry Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {memberList.map((user) => (
                        <tr key={user.email}>
                          <td>{user.fullName}</td><td>{user.email}</td><td>{user.company}</td><td>{user.phone}</td>
                          <td className="text-capitalize">{user.plan}</td>
                          <td>{new Date(user.activatedAt).toLocaleDateString()}</td>
                          <td>{new Date(user.expiresAt).toLocaleDateString()}</td>
                          <td><span className="badge rounded-pill text-bg-success">{user.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-light" data-bs-dismiss="modal">Close</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
