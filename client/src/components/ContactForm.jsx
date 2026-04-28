import { useState } from 'react';

const emptyContact = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'Lead',
  notes: '',
};

export default function ContactForm({ onSave, selectedContact }) {
  const [formData, setFormData] = useState(selectedContact || emptyContact);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(formData);
    setFormData(emptyContact);
  }

  return (
    <form className="card shadow-sm p-3" onSubmit={handleSubmit}>
      <h5 className="mb-3">{selectedContact ? 'Edit Contact' : 'Add Contact'}</h5>
      <div className="row g-2">
        <div className="col-md-6">
          <input className="form-control" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <input className="form-control" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <input className="form-control" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <input className="form-control" name="company" placeholder="Company" value={formData.company} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
            <option value="Lead">Lead</option>
            <option value="Customer">Customer</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="col-12">
          <textarea className="form-control" name="notes" placeholder="Notes" rows="2" value={formData.notes} onChange={handleChange} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary mt-3">Save Contact</button>
    </form>
  );
}
